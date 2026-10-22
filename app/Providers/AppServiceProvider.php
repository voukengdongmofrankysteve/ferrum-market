<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->createDatabaseOnFirstRun();

        // Sign-in, sign-up: slow down guessing from one address.
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
        // Uploads and reviews: per account, falling back to the address.
        RateLimiter::for('publish', fn (Request $r) => Limit::perHour(40)->by($r->user()?->id ?: $r->ip()));
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
        if (! is_string($file) || $file === '' || $file === ':memory:' || is_file($file)) {
            return;
        }
        @mkdir(dirname($file), 0775, true);
        @touch($file);
        Artisan::call('migrate', ['--force' => true]);
    }
}
