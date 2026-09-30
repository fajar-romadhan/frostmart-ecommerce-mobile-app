<?php

use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\ProductController;
use App\Http\Controllers\Web\CategoryController;
use App\Http\Controllers\Web\StockInController;
use App\Http\Controllers\Web\OrderController;
use App\Http\Controllers\Web\ReportController;
use App\Http\Controllers\Web\CustomerController;
use App\Http\Controllers\Web\OwnerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Root URL Redirect
Route::get('/', function () {
    if (auth()->check()) {
        $role = auth()->user()->role;
        if ($role === 'admin') {
            return redirect()->route('admin.dashboard');
        } elseif ($role === 'owner') {
            return redirect()->route('owner.dashboard');
        }
    }
    return redirect()->route('login');
});

// Direct storage file server (Bypasses Windows php artisan serve symlink 403 issue)
Route::get('/media/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) {
        abort(404);
    }
    $mimeType = mime_content_type($filePath) ?: 'image/jpeg';
    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*');

Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) {
        abort(404);
    }
    $mimeType = mime_content_type($filePath) ?: 'image/jpeg';
    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Access-Control-Allow-Origin' => '*',
    ]);
})->where('path', '.*');

// Authentication
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// ==========================================
// ADMIN GROUP (Role: admin)
// ==========================================
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Products CRUD
    Route::resource('products', ProductController::class)->except(['show']);
    
    // Categories CRUD
    Route::resource('categories', CategoryController::class)->except(['show']);
    
    // Stock In
    Route::get('/stock-ins', [StockInController::class, 'index'])->name('stock-ins.index');
    Route::get('/stock-ins/create', [StockInController::class, 'create'])->name('stock-ins.create');
    Route::post('/stock-ins', [StockInController::class, 'store'])->name('stock-ins.store');
    
    // Orders
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/kanban', [OrderController::class, 'kanban'])->name('orders.kanban');
    Route::post('/orders/{id}/update-status-ajax', [OrderController::class, 'updateStatusAjax'])->name('orders.updateStatusAjax');
    Route::get('/orders/{id}', [OrderController::class, 'show'])->name('orders.show');
    Route::put('/orders/{id}/confirm', [OrderController::class, 'confirm'])->name('orders.confirm');
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
    Route::get('/orders/{id}/invoice', [OrderController::class, 'printInvoice'])->name('orders.invoice');
    
    // Reports
    Route::get('/reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
    Route::get('/reports/stocks', [ReportController::class, 'stocks'])->name('reports.stocks');
    
    // Customers
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
});

// ==========================================
// OWNER GROUP (Role: owner)
// ==========================================
Route::middleware(['auth', 'role:owner'])->prefix('owner')->name('owner.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [OwnerController::class, 'dashboard'])->name('dashboard');
    
    // Orders (Read-only)
    Route::get('/orders', [OwnerController::class, 'orders'])->name('orders.index');
    Route::get('/orders/{id}', [OwnerController::class, 'orderShow'])->name('orders.show');
    
    // Reports
    Route::get('/reports/sales', [OwnerController::class, 'salesReport'])->name('reports.sales');
    Route::get('/reports/stocks', [OwnerController::class, 'stockReport'])->name('reports.stocks');
});
