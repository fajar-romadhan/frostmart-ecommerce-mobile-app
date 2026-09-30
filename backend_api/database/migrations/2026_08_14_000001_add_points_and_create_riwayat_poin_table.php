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
        // 1. Tambah total_poin di tabel pengguna
        if (!Schema::hasColumn('pengguna', 'total_poin')) {
            Schema::table('pengguna', function (Blueprint $table) {
                $table->unsignedInteger('total_poin')->default(0)->after('telepon');
            });
        }

        // 2. Tambah kolom poin di tabel pesanan
        Schema::table('pesanan', function (Blueprint $table) {
            if (!Schema::hasColumn('pesanan', 'poin_digunakan')) {
                $table->unsignedInteger('poin_digunakan')->default(0)->after('total_harga');
            }
            if (!Schema::hasColumn('pesanan', 'poin_diperoleh')) {
                $table->unsignedInteger('poin_diperoleh')->default(0)->after('poin_digunakan');
            }
            if (!Schema::hasColumn('pesanan', 'produk_hadiah_id')) {
                $table->unsignedBigInteger('produk_hadiah_id')->nullable()->after('poin_diperoleh');
                $table->foreign('produk_hadiah_id')->references('id')->on('produk')->onDelete('set null');
            }
        });

        // 3. Tambah flag is_reward di detail_pesanan jika belum ada
        if (!Schema::hasColumn('detail_pesanan', 'is_reward')) {
            Schema::table('detail_pesanan', function (Blueprint $table) {
                $table->boolean('is_reward')->default(false)->after('subtotal');
            });
        }

        // 4. Buat tabel riwayat_poin
        if (!Schema::hasTable('riwayat_poin')) {
            Schema::create('riwayat_poin', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pengguna_id');
                $table->unsignedBigInteger('pesanan_id')->nullable();
                $table->enum('jenis', ['masuk', 'keluar']);
                $table->unsignedInteger('jumlah_poin');
                $table->unsignedInteger('saldo_akhir');
                $table->string('keterangan');
                $table->timestamps();

                $table->foreign('pengguna_id')->references('id')->on('pengguna')->onDelete('cascade');
                $table->foreign('pesanan_id')->references('id')->on('pesanan')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_poin');

        Schema::table('detail_pesanan', function (Blueprint $table) {
            if (Schema::hasColumn('detail_pesanan', 'is_reward')) {
                $table->dropColumn('is_reward');
            }
        });

        Schema::table('pesanan', function (Blueprint $table) {
            if (Schema::hasColumn('pesanan', 'produk_hadiah_id')) {
                $table->dropForeign(['produk_hadiah_id']);
                $table->dropColumn('produk_hadiah_id');
            }
            if (Schema::hasColumn('pesanan', 'poin_diperoleh')) {
                $table->dropColumn('poin_diperoleh');
            }
            if (Schema::hasColumn('pesanan', 'poin_digunakan')) {
                $table->dropColumn('poin_digunakan');
            }
        });

        if (Schema::hasColumn('pengguna', 'total_poin')) {
            Schema::table('pengguna', function (Blueprint $table) {
                $table->dropColumn('total_poin');
            });
        }
    }
};
