<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ArchiveController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BookSearchController;
use App\Http\Controllers\Api\FeedbackController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);

Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware('throttle:6,1');

Route::post('/feedback', [FeedbackController::class, 'store'])
    ->middleware('throttle:20,1');

Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword'])
        ->middleware('throttle:6,1');
    Route::post('/email/resend', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');
});

Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::put('/locations/reorder', [LocationController::class, 'reorder']);
    Route::put('/locations/{location}/archives/reorder', [ArchiveController::class, 'reorder'])->whereNumber('location');
    Route::put('/archives/{archive}/books/reorder', [BookController::class, 'reorder'])->whereNumber('archive');

    Route::apiResource('locations', LocationController::class);
    Route::get('/locations/{location}/archives', [ArchiveController::class, 'index']);
    Route::post('/locations/{location}/archives', [ArchiveController::class, 'store']);
    Route::put('/archives/{archive}', [ArchiveController::class, 'update']);
    Route::delete('/archives/{archive}', [ArchiveController::class, 'destroy']);

    Route::get('/archives/{archive}/books', [BookController::class, 'index']);
    Route::post('/archives/{archive}/books', [BookController::class, 'store']);
    Route::get('/books/search', [BookSearchController::class, 'search']);

    // Чтобы URL `/books/search` не матчился как `/books/{book}`:
    Route::get('/books/{book}', [BookController::class, 'show'])->whereNumber('book');
    Route::put('/books/{book}', [BookController::class, 'update'])->whereNumber('book');
    Route::delete('/books/{book}', [BookController::class, 'destroy'])->whereNumber('book');
    Route::post('/books/{book}/photo', [BookController::class, 'uploadPhoto'])->whereNumber('book');
});
