<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengguna', function (Blueprint $table) {
            $table->string('foto_ktp')->nullable()->after('nik');
            $table->boolean('is_ktp_verified')->default(false)->after('foto_ktp');
        });
    }

    public function down(): void
    {
        Schema::table('pengguna', function (Blueprint $table) {
            $table->dropColumn(['foto_ktp', 'is_ktp_verified']);
        });
    }
};
