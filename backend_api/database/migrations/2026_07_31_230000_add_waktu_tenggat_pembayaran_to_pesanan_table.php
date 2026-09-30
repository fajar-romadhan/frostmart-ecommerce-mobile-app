<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->timestamp('waktu_tenggat_pembayaran')->nullable()->after('status_pembayaran');
            $table->text('catatan_pembatalan')->nullable()->after('waktu_tenggat_pembayaran');
        });
    }

    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn(['waktu_tenggat_pembayaran', 'catatan_pembatalan']);
        });
    }
};
