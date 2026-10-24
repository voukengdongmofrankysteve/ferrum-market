<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function () {
    Route::get('extensions', [ApiController::class, 'index']);
    Route::get('extensions/{publisher}.{name}', [ApiController::class, 'show'])->where(['publisher' => '[a-z0-9-]+', 'name' => '[a-z0-9-]+']);
    Route::get('extensions/{publisher}.{name}/icon', [ApiController::class, 'icon'])->where(['publisher' => '[a-z0-9-]+', 'name' => '[a-z0-9-]+']);
    Route::get('extensions/{publisher}.{name}/download', [ApiController::class, 'download'])->where(['publisher' => '[a-z0-9-]+', 'name' => '[a-z0-9-]+']);
    Route::get('categories', [ApiController::class, 'categories']);

    Route::post('auth/register', [ApiController::class, 'register'])->middleware(['throttle:auth', 'throttle:signup']);
    Route::post('auth/login', [ApiController::class, 'login'])->middleware('throttle:auth');
    Route::get('me', [ApiController::class, 'me']);
    Route::post('publishers', [ApiController::class, 'createPublisher']);
    Route::post('publish', [ApiController::class, 'publish'])->middleware('throttle:publish');
    Route::post('extensions/{publisher}.{name}/reviews', [ApiController::class, 'review'])->middleware('throttle:publish')->where(['publisher' => '[a-z0-9-]+', 'name' => '[a-z0-9-]+']);
});

// The built-in AI plan: OpenAI compatible, signed in with the same token as the rest of the API.
Route::prefix('v1/ai')->group(function () {
    Route::get('models', [AiController::class, 'models'])->middleware('throttle:api');
    Route::post('chat/completions', [AiController::class, 'chat'])->middleware('throttle:ai');
});
