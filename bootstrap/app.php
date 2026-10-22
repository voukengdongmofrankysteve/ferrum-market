<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

// First run on a host with no shell: build the real .env from the committed template (deploy.env),
// with a new random key that stays on the server. Later deploys never touch it.
(function (string $base): void {
    if (! is_file($base.'/.env') && is_file($base.'/deploy.env')) {
        $env = (string) file_get_contents($base.'/deploy.env');
        $env = preg_replace('/^APP_KEY=.*$/m', 'APP_KEY=base64:'.base64_encode(random_bytes(32)), $env);
        @file_put_contents($base.'/.env', $env);
    }
})(dirname(__DIR__));

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The site is served behind Hostinger's proxy: trust it for the real client address and https.
        $middleware->trustProxies(at: '*');
        $middleware->redirectGuestsTo(fn () => route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
