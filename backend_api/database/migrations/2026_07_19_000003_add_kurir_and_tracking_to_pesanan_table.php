<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->foreignId('kurir_id')->nullable()->after('pengguna_id')->constrained('pengguna')->onDelete('set null');
            $table->timestamp('waktu_dikirim')->nullable()->after('status_pembayaran');
            $table->timestamp('waktu_selesai')->nullable()->after('waktu_dikirim');
        });
    }

    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropForeign(['kurir_id']);
            $table->dropColumn(['kurir_id', 'waktu_dikirim', 'waktu_selesai']);
        });
    }
};
