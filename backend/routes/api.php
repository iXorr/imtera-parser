<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login']);

// Route::middleware('auth:sanctum')->group(function () {
Route::get('organizations', [OrganizationController::class, 'index']);
Route::post('organizations', [OrganizationController::class, 'store']);
Route::get('organizations/{organization}/reviews', [ReviewController::class, 'index']);
// });
