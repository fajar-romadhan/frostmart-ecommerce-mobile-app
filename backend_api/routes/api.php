<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\PointController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// PUBLIC ROUTES
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products/category/{id}', [ProductController::class, 'category']);

// Public address endpoints (no auth) — used in registration form & map pickers
Route::get('/addresses/suggestions', [AddressController::class, 'searchSuggestions']);
Route::get('/addresses/reverse-geocode', [AddressController::class, 'reverseGeocode']);
Route::get('/addresses/reverse-geocode-public', [AddressController::class, 'reverseGeocode']);

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile', [AuthController::class, 'updateProfile']); // multipart fallback
    Route::delete('/profile/photo', [AuthController::class, 'deleteProfilePhoto']);

    // Addresses Management
    Route::get('addresses/reverse-geocode', [AddressController::class, 'reverseGeocode']);
    Route::get('addresses/calculate-shipping', [AddressController::class, 'calculateShipping']);
    Route::apiResource('addresses', AddressController::class);
    Route::put('addresses/{address}/set-default', [AddressController::class, 'setDefault']);
    Route::get('branches', [AddressController::class, 'listBranches']);

    // Loyalty Points (Pelanggan & Shared)
    Route::get('/points/history', [PointController::class, 'history']);
    Route::get('/points/reward-products', [PointController::class, 'rewardProducts']);
    Route::post('/points/redeem-direct', [PointController::class, 'redeemDirect']);

    // In-App Order Chat Routes (Customer & Admin)
    Route::get('/orders/{id}/chats', [ChatController::class, 'index']);
    Route::post('/orders/{id}/chats', [ChatController::class, 'store']);

    // In-App Real-time Notifications & Unread Chat Alerts
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markRead']);

    // ==========================================
    // CUSTOMER ONLY ROUTES
    // ==========================================
    Route::middleware('role:pelanggan')->group(function () {
        // Cart
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart', [CartController::class, 'store']);
        Route::put('/cart/{id}', [CartController::class, 'update']);
        Route::delete('/cart/{id}', [CartController::class, 'destroy']);

        // Checkout & Orders
        Route::post('/checkout', [OrderController::class, 'checkout']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::get('/orders/{id}/tracking', [OrderController::class, 'tracking']);
        Route::post('/orders/{id}/upload-payment', [OrderController::class, 'uploadPayment']);
        Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);
        Route::put('/orders/{id}/received', [OrderController::class, 'received']);
    });

    // ==========================================
    // ADMIN & OWNER SHARED ROUTES
    // ==========================================
    Route::middleware('role:admin,owner')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/orders', [AdminController::class, 'orders']);
        Route::get('/admin/orders/{id}', [AdminController::class, 'showOrder']);
        Route::get('/admin/kurirs', [AdminController::class, 'kurirs']);
        Route::get('/admin/reports/sales', [AdminController::class, 'salesReport']);
        Route::get('/admin/reports/stocks', [AdminController::class, 'stockReport']);
        Route::get('/admin/reports/top-products', [AdminController::class, 'topProducts']);
        Route::get('/admin/notifications', [AdminController::class, 'notifications']);
        Route::post('/admin/notifications/mark-read', [AdminController::class, 'markNotificationsRead']);
        Route::get('/admin/activity-logs', [AdminController::class, 'activityLogs']);
        Route::post('/admin/activity-logs', [AdminController::class, 'logActivity']);
    });

    // ==========================================
    // ADMIN ONLY ROUTES (WRITE ACTIONS)
    // ==========================================
    Route::middleware('role:admin')->group(function () {
        Route::put('/admin/orders/{id}/confirm', [AdminController::class, 'confirm']);
        Route::put('/admin/orders/{id}/status', [AdminController::class, 'status']);
        Route::post('/admin/orders/{id}/assign-kurir', [AdminController::class, 'assignKurir']);
        
        Route::get('/admin/products', [AdminController::class, 'products']);
        Route::post('/admin/products', [AdminController::class, 'storeProduct']);
        Route::post('/admin/products/{id}', [AdminController::class, 'updateProduct']); // POST to handle multipart file upload in PHP
        Route::delete('/admin/products/{id}', [AdminController::class, 'destroyProduct']);
        
        Route::get('/admin/stock-ins', [AdminController::class, 'stockIns']);
        Route::post('/admin/stock-in', [AdminController::class, 'stockIn']);

        Route::post('/admin/categories', [CategoryController::class, 'store']);
        Route::put('/admin/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/admin/categories/{id}', [CategoryController::class, 'destroy']);
    });
});
