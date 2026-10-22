<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        // Sign-in, sign-up: slow down guessing from one address.
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
        // Uploads and reviews: per account, falling back to the address.
        RateLimiter::for('publish', fn (Request $r) => Limit::perHour(40)->by($r->user()?->id ?: $r->ip()));
        // Reading the catalogue.
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by($r->ip()));
    }
}
