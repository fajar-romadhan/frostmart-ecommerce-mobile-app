<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pesanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengguna_id')->constrained('pengguna')->onDelete('cascade');
            $table->string('kode_pesanan')->unique();
            $table->date('tanggal_pesanan');
            $table->decimal('total_harga', 10, 2);
            $table->string('metode_pembayaran')->default('transfer');
            $table->string('metode_pengiriman')->default('ambil_toko');
            $table->text('alamat_pengiriman')->nullable();
            $table->string('status_pesanan')->default('Menunggu Pembayaran');
            $table->string('status_pembayaran')->default('belum_bayar');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pesanan');
    }
};
