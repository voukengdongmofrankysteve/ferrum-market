<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminAiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/extensions', [PageController::class, 'browse'])->name('browse');
Route::get('/extensions/{publisher}.{name}', [PageController::class, 'show'])
    ->where(['publisher' => '[a-z0-9-]+', 'name' => '[a-z0-9-]+'])->name('extension');
Route::get('/publishers/{slug}', [PageController::class, 'publisher'])->where('slug', '[a-z0-9-]+')->name('publisher');
Route::get('/docs/{slug?}', [PageController::class, 'docs'])->where('slug', '[a-z0-9-]+')->name('docs');
Route::get('/sitemap.xml', [PageController::class, 'sitemap']);
Route::get('/robots.txt', [PageController::class, 'robots']);

Route::middleware('guest')->group(function () {
    Route::get('/register', [AuthController::class, 'registerForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware(['throttle:auth', 'throttle:signup']);
    Route::get('/login', [AuthController::class, 'loginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/account', [AccountController::class, 'show'])->name('account');
    Route::post('/account/publishers', [AccountController::class, 'createPublisher'])->name('publishers.store');
    Route::post('/account/tokens', [AccountController::class, 'createToken'])->name('tokens.store');
    Route::delete('/account/tokens/{token}', [AccountController::class, 'revokeToken'])->name('tokens.destroy');
    Route::post('/account/password', [AccountController::class, 'password'])->name('password');
    Route::get('/publish', [AccountController::class, 'publishForm'])->name('publish');
    Route::post('/publish', [AccountController::class, 'publish'])->middleware('throttle:publish');
    Route::get('/manage', [AccountController::class, 'manage'])->name('manage');
    Route::post('/manage/{extension}/toggle', [AccountController::class, 'toggleHidden'])->name('manage.toggle');
    Route::post('/extensions/{extension}/review', [PageController::class, 'review'])->middleware('throttle:publish')->name('review');
    Route::get('/admin', [AccountController::class, 'admin'])->name('admin');
    Route::post('/admin/publishers/{publisher}/verify', [AccountController::class, 'adminVerify'])->name('admin.verify');
    Route::get('/admin/ai', [AdminAiController::class, 'show'])->name('admin.ai');
    Route::post('/admin/ai', [AdminAiController::class, 'save'])->name('admin.ai.save');
    Route::post('/admin/ai/people/{user}', [AdminAiController::class, 'person'])->name('admin.ai.person');
});
