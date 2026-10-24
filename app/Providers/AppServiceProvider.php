<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use App\Support\AiGateway;
use App\Support\Official;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->createDatabaseOnFirstRun();
        $this->publishOfficialExtensions();

        // Sign-in, sign-up: slow down guessing from one address.
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
        // Uploads and reviews: per account, falling back to the address.
        RateLimiter::for('publish', fn (Request $r) => Limit::perHour(40)->by($r->user()?->id ?: $r->ip()));
        // The built-in AI: per signed-in token, so one account cannot flood the provider.
        RateLimiter::for('ai', fn (Request $r) => Limit::perMinute(AiGateway::perMinute())->by(sha1((string) ($r->bearerToken() ?: $r->ip()))));
        // New accounts per address: the free AI allowance is the reason to make many, so slow that down.
        RateLimiter::for('signup', fn (Request $r) => Limit::perDay(6)->by($r->ip()));
        // Reading the catalogue.
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by($r->ip()));
    }

    /** On a host with no shell, a missing SQLite file is created and migrated by the first request. */
    private function createDatabaseOnFirstRun(): void
    {
        if (config('database.default') !== 'sqlite') {
            return;
        }
        $file = config('database.connections.sqlite.database');
        if (is_string($file) && $file !== '' && $file !== ':memory:' && is_file($file)) {
            $this->migrateNewTables();

            return;
        }
        if (! is_string($file) || $file === '' || $file === ':memory:') {
            return;
        }
        @mkdir(dirname($file), 0775, true);
        @touch($file);
        Artisan::call('migrate', ['--force' => true]);
    }

    /** An existing database on a host with no shell gets the tables added by a later release on the first web request. */
    private function migrateNewTables(): void
    {
        if (in_array(PHP_SAPI, ['cli', 'phpdbg'], true)) {
            return;
        }
        try {
            if (! Schema::hasTable('ai_usages')) {
                Artisan::call('migrate', ['--force' => true]);
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** The first web request after a deploy publishes the extensions in resources/official (see App\Support\Official). */
    private function publishOfficialExtensions(): void
    {
        if (in_array(PHP_SAPI, ['cli', 'phpdbg'], true) || ! config('market.seed_official', true)) {
            return;
        }
        try {
            if (Schema::hasTable('extensions')) {
                Official::sync();
            }
        } catch (Throwable $e) {
            report($e);
        }
    }
}
