<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pesanan MODIFY COLUMN metode_pembayaran VARCHAR(50) NOT NULL DEFAULT 'transfer'");
            DB::statement("ALTER TABLE pesanan MODIFY COLUMN metode_pengiriman VARCHAR(50) NOT NULL DEFAULT 'ambil_toko'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pesanan MODIFY COLUMN metode_pembayaran ENUM('transfer', 'qris', 'cod') NOT NULL DEFAULT 'transfer'");
            DB::statement("ALTER TABLE pesanan MODIFY COLUMN metode_pengiriman ENUM('ambil_toko', 'antar_alamat') NOT NULL DEFAULT 'ambil_toko'");
        }
    }
};
