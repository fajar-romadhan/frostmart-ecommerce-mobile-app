<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel cache geocoding lokal untuk wilayah Tanjung Enim.
     * Berisi POI (Point of Interest), nama jalan, dan area yang di-scrape dari Google Places
     * serta data statis yang ditanam secara manual.
     *
     * Digunakan sebagai "Engine 0" pada pipeline reverse geocoding:
     * dicek pertama kali sebelum memanggil API eksternal mana pun.
     */
    public function up(): void
    {
        Schema::create('geocode_cache', function (Blueprint $table) {
            $table->id();

            // Nama tempat / jalan (misal: "Jl. Kiemas", "Pasar Tanjung Enim", "SD Negeri 1 Tanjung Enim")
            $table->string('nama', 255);

            // Alamat lengkap yang akan dikembalikan ke user
            $table->string('alamat_lengkap', 500);

            // Koordinat pusat titik lokasi
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 11, 7);

            // Tipe lokasi: 'jalan', 'poi', 'kelurahan', 'sekolah', 'pasar', 'masjid', 'rs', dsb.
            $table->string('tipe', 50)->default('poi');

            // Sumber data: 'manual' (ditanam manual) | 'google_places' (scraping) | 'osm'
            $table->string('sumber', 30)->default('manual');

            // Google Place ID (jika dari Google Places API)
            $table->string('place_id', 100)->nullable();

            // Radius relevansi dalam meter — untuk POI titik: 50m, untuk kelurahan/jalan: 500m
            $table->unsignedSmallInteger('radius_meter')->default(100);

            // Spatial index cepat — disimpan sebagai integer degree * 1e6 untuk lookup cepat
            // (lat_int = round(lat * 1_000_000), lng_int = round(lng * 1_000_000))
            $table->integer('lat_int')->storedAs('ROUND(latitude * 1000000)');
            $table->integer('lng_int')->storedAs('ROUND(longitude * 1000000)');

            $table->boolean('aktif')->default(true);
            $table->timestamp('last_scraped_at')->nullable();
            $table->timestamps();

            // Index untuk pencarian nearest-neighbor yang cepat
            $table->index(['latitude', 'longitude'], 'idx_latlng');
            $table->index(['lat_int', 'lng_int'], 'idx_latlng_int');
            $table->index('tipe');
            $table->index('aktif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geocode_cache');
    }
};
