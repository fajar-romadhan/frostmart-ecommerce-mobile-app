<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        date_default_timezone_set('Asia/Jakarta');

        if (!class_exists('App\Models\Category')) {
            class_alias(\App\Models\Kategori::class, 'App\Models\Category');
        }
        if (!class_exists('App\Models\Product')) {
            class_alias(\App\Models\Produk::class, 'App\Models\Product');
        }
        if (!class_exists('App\Models\Cart')) {
            class_alias(\App\Models\Keranjang::class, 'App\Models\Cart');
        }
        if (!class_exists('App\Models\Order')) {
            class_alias(\App\Models\Pesanan::class, 'App\Models\Order');
        }
        if (!class_exists('App\Models\OrderDetail')) {
            class_alias(\App\Models\DetailPesanan::class, 'App\Models\OrderDetail');
        }
        if (!class_exists('App\Models\Payment')) {
            class_alias(\App\Models\Pembayaran::class, 'App\Models\Payment');
        }
        if (!class_exists('App\Models\StockIn')) {
            class_alias(\App\Models\StokMasuk::class, 'App\Models\StockIn');
        }
        if (!class_exists('App\Models\StockOut')) {
            class_alias(\App\Models\StokKeluar::class, 'App\Models\StockOut');
        }
        if (!class_exists('App\Models\Notification')) {
            class_alias(\App\Models\Notifikasi::class, 'App\Models\Notification');
        }
        if (!class_exists('App\Models\Branch')) {
            class_alias(\App\Models\CabangToko::class, 'App\Models\Branch');
        }
    }
}
