<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Цель redirectTo() у auth:sanctum для запросов, не ожидающих JSON (нет
// Accept: application/json) — без этого роута Laravel падает с
// "Route [login] not defined" вместо чистого 401. У нас нет Laravel-вьюхи
// логина (она во Vue SPA), так что просто отдаём 401 и здесь.
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
