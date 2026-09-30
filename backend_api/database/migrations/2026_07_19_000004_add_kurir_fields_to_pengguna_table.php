<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengguna', function (Blueprint $table) {
            $table->string('plat_kendaraan')->nullable()->after('foto_profil');
            $table->string('jenis_kendaraan')->nullable()->after('plat_kendaraan');
        });
    }

    public function down(): void
    {
        Schema::table('pengguna', function (Blueprint $table) {
            $table->dropColumn(['plat_kendaraan', 'jenis_kendaraan']);
        });
    }
};
