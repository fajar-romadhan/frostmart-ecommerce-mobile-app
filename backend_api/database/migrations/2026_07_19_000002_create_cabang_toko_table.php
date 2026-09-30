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
        Schema::create('cabang_toko', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('alamat');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('telepon')->nullable();
            $table->timestamps();
        });

        Schema::table('pesanan', function (Blueprint $table) {
            $table->foreignId('cabang_toko_id')->nullable()->after('pengguna_id')->constrained('cabang_toko')->onDelete('set null');
            $table->integer('ongkos_kirim')->default(0)->after('total_harga');
            $table->decimal('jarak_pengiriman', 5, 2)->default(0)->after('ongkos_kirim');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropForeign(['cabang_toko_id']);
            $table->dropColumn(['cabang_toko_id', 'ongkos_kirim', 'jarak_pengiriman']);
        });

        Schema::dropIfExists('cabang_toko');
    }
};
