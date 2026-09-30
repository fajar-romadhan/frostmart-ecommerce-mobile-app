<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Artisan Command: php artisan geocache:scrape
 *
 * Mengambil data POI, nama jalan, dan area di Tanjung Enim & Lawang Kidul
 * menggunakan Photon (Komoot OSM Geocoder) dan grid point reverse-geocoding.
 * Data disimpan ke tabel geocode_cache sebagai "Engine 0" lokal berkecepatan tinggi (~1ms).
 *
 * Usage:
 *   php artisan geocache:scrape
 *   php artisan geocache:scrape --dry-run
 *   php artisan geocache:scrape --clear
 */
class GeocodeScrapeCommand extends Command
{
    protected $signature = 'geocache:scrape
        {--dry-run : Hitung saja tanpa menyimpan ke database}
        {--clear   : Hapus data scraper lama sebelum scrape}';

    protected $description = 'Scrape POI & nama jalan wilayah Tanjung Enim dan isi tabel geocode_cache';

    // Titik pusat toko Della Frozen Mart
    private const CENTER_LAT = -3.763872;
    private const CENTER_LNG = 103.807925;

    // Batas jarak maksimum: 10 KM dari titik toko Della Frozen Mart
    private const MAX_RADIUS_KM = 10.0;

    // Kata kunci pencarian lokal spesifik wilayah radius 10km Tanjung Enim & Lawang Kidul
    private const SEARCH_KEYWORDS = [
        // Pemukiman & Area Utama dalam 10km
        'Tanjung Enim',
        'Tanjung Enim Selatan',
        'Pasar Tanjung Enim',
        'Lawang Kidul',
        'Tegal Rejo Tanjung Enim',
        'Lingga Lawang Kidul',
        'Keban Agung Lawang Kidul',
        'Darmo Lawang Kidul',
        'Tanjung Raja Muara Enim',
        'Tanjung Agung Muara Enim',
        'Talang Jawa Tanjung Enim',
        'Air Paku Tanjung Enim',
        'Bedeng Kaca Tanjung Enim',
        'Bara Lestari Tanjung Enim',
        'Bara Anugrah Tanjung Enim',
        'BTN Mandala Tanjung Enim',
        'BTN Air Paku Tanjung Enim',
        'Dusun Tanjung Tanjung Enim',
        'Dusun Keban Agung',
        'Dusun Lingga',
        'Dusun Darmo',

        // Jalan & Gang dalam 10km
        'Jl Kiemas Tanjung Enim',
        'Jl Pandawa Tanjung Enim',
        'Jl Rambutan Tanjung Enim',
        'Jl Lingkar Tanjung Enim',
        'Jl Ahmad Yani Tanjung Enim',
        'Jl Sriwijaya Tanjung Enim',
        'Jl Merdeka Tanjung Enim',
        'Jl Pasar Bawah Tanjung Enim',
        'Jl Pasar Baru Tanjung Enim',
        'Jl Karet Tegal Rejo',
        'Jl Mandala Tanjung Enim',
        'Jl Buluran Tanjung Enim',
        'Jl Parigi Tanjung Enim',

        // Fasilitas Publik, Kesehatan, Pendidikan & Niaga dalam 10km
        'Bukit Asam Tanjung Enim',
        'PTBA Tanjung Enim',
        'RS Bukit Asam Medika',
        'Puskesmas Tanjung Enim',
        'Puskesmas Lawang Kidul',
        'Puskesmas Keban Agung',
        'Stasiun Tanjung Enim',
        'Pasar Tanjung Enim',
        'Pasar Baru Tanjung Enim',
        'Masjid Agung Tanjung Enim',
        'Masjid Jamik Tanjung Enim',
        'Masjid Al Mujahidin Tanjung Enim',
        'SMA Bukit Asam',
        'SMK Bukit Asam',
        'SMPN 1 Lawang Kidul',
        'SMPN 2 Lawang Kidul',
        'SDN 12 Lawang Kidul',
        'SDN 20 Lawang Kidul',
        'SDN 21 Lawang Kidul',
        'Kantor Camat Lawang Kidul',
        'Kantor Lurah Pasar Tanjung Enim',
        'Kantor Lurah Tanjung Enim Selatan',
        'Polsek Lawang Kidul',
        'Koramil Lawang Kidul',
        'SPBU Lingga Tanjung Enim',
        'SPBU Tanjung Enim Selatan',
        'Bank Mandiri Tanjung Enim',
        'Bank BRI Tanjung Enim',
        'Bank BNI Tanjung Enim',
        'Bank Sumsel Babel Tanjung Enim',
    ];

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $doClear  = $this->option('clear');

        $this->info('🗺️  Della Frozen Mart — Geocode Scraper (Tanjung Enim & Lawang Kidul)');
        $this->info('   Pusat: ' . self::CENTER_LAT . ', ' . self::CENTER_LNG);
        $this->newLine();

        if ($doClear && !$isDryRun) {
            $deleted = DB::table('geocode_cache')->where('sumber', 'photon')->delete();
            $this->warn("🗑️  Hapus {$deleted} data scraper lama.");
        }

        $totalSaved = 0;
        $seenPlaces = [];

        // 1. Scraping via Photon Geocoder (Komoot / OpenStreetMap)
        $this->line('⏳ Scraping data POI & Jalan via Photon Engine...');
        foreach (self::SEARCH_KEYWORDS as $keyword) {
            try {
                $resp = Http::withHeaders([
                    'User-Agent' => 'DellaFrozenMart/1.0 (geocache-scraper)',
                ])->timeout(10)->get('https://photon.komoot.io/api/', [
                    'q'     => $keyword,
                    'lat'   => self::CENTER_LAT,
                    'lon'   => self::CENTER_LNG,
                    'limit' => 15,
                ]);

                if (!$resp->successful()) continue;

                $features = $resp->json()['features'] ?? [];
                $saved = 0;

                foreach ($features as $f) {
                    $props  = $f['properties'] ?? [];
                    $coords = $f['geometry']['coordinates'] ?? [];
                    $lng    = $coords[0] ?? null;
                    $lat    = $coords[1] ?? null;
                    $name   = $props['name'] ?? null;

                    if (!$lat || !$lng || !$name) continue;

                    // Filter ketat HANYA titik yang berada dalam radius maksimal 10 KM dari toko Della Frozen Mart
                    $distKm = $this->haversineKm(self::CENTER_LAT, self::CENTER_LNG, $lat, $lng);
                    if ($distKm > self::MAX_RADIUS_KM) continue;

                    $key = strtolower(trim($name)) . '_' . round($lat, 4) . '_' . round($lng, 4);
                    if (isset($seenPlaces[$key])) continue;
                    $seenPlaces[$key] = true;

                    $tipe = $this->detectTipe($props, $name);
                    $alamat = $this->buildPhotonAddress($name, $props);
                    $radius = $tipe === 'jalan' ? 300 : ($tipe === 'kelurahan' ? 1000 : 100);

                    if (!$isDryRun) {
                        $osmId = ($props['osm_type'] ?? 'p') . ($props['osm_id'] ?? rand(10000, 99999));
                        DB::table('geocode_cache')->updateOrInsert(
                            ['place_id' => 'photon_' . $osmId],
                            [
                                'nama'            => $name,
                                'alamat_lengkap'  => $alamat,
                                'latitude'        => $lat,
                                'longitude'       => $lng,
                                'tipe'            => $tipe,
                                'sumber'          => 'photon',
                                'place_id'        => 'photon_' . $osmId,
                                'radius_meter'    => $radius,
                                'aktif'           => true,
                                'last_scraped_at' => now(),
                                'updated_at'      => now(),
                                'created_at'      => now(),
                            ]
                        );
                    }
                    $saved++;
                }

                if ($saved > 0) {
                    $this->line("   <fg=green>✓ '{$keyword}'</> → {$saved} lokasi");
                }
                $totalSaved += $saved;

                usleep(100_000); // 100ms jeda
            } catch (\Exception $e) {
                $this->warn("   Gagal query '{$keyword}': " . $e->getMessage());
            }
        }

        $this->newLine();
        if ($isDryRun) {
            $this->info("🔍 [DRY RUN] Total ditemukan: {$totalSaved} lokasi.");
        } else {
            $this->info("✅ Selesai! Total disimpan/diperbarui: {$totalSaved} lokasi.");
            $total = DB::table('geocode_cache')->count();
            $this->info("   Total isi tabel geocode_cache sekarang: {$total} lokasi.");
        }

        return Command::SUCCESS;
    }

    private function detectTipe(array $props, string $name): string
    {
        $osmKey   = $props['osm_key'] ?? '';
        $osmValue = $props['osm_value'] ?? '';
        $nameLower = strtolower($name);

        if ($osmKey === 'highway' || str_contains($nameLower, 'jalan') || str_contains($nameLower, 'jl.')) return 'jalan';
        if (str_contains($nameLower, 'masjid') || str_contains($nameLower, 'musholla')) return 'masjid';
        if (str_contains($nameLower, 'gereja')) return 'gereja';
        if (str_contains($nameLower, 'pasar')) return 'pasar';
        if (str_contains($nameLower, 'sd ') || str_contains($nameLower, 'smp ') || str_contains($nameLower, 'sma ') || str_contains($nameLower, 'smk ') || str_contains($nameLower, 'sekolah')) return 'sekolah';
        if (str_contains($nameLower, 'rsud') || str_contains($nameLower, 'rumah sakit') || str_contains($nameLower, 'puskesmas') || str_contains($nameLower, 'klinik')) return 'rs';
        if (str_contains($nameLower, 'kelurahan') || str_contains($nameLower, 'desa') || $osmValue === 'village' || $osmValue === 'hamlet') return 'kelurahan';
        if (str_contains($nameLower, 'kantor') || str_contains($nameLower, 'polsek') || str_contains($nameLower, 'koramil')) return 'kantor_pemerintah';
        if (str_contains($nameLower, 'toko') || str_contains($nameLower, 'mart') || str_contains($nameLower, 'warung')) return 'toko';

        return 'poi';
    }

    private function buildPhotonAddress(string $name, array $props): string
    {
        $parts = [$name];

        $street = $props['street'] ?? null;
        $hnum   = $props['housenumber'] ?? null;
        if ($street && $street !== $name) {
            $parts[] = $hnum ? "{$street} No. {$hnum}" : $street;
        }

        $district = $props['district'] ?? ($props['suburb'] ?? ($props['locality'] ?? null));
        if ($district && !in_array($district, $parts)) {
            $parts[] = $district;
        }

        $city = $props['city'] ?? ($props['county'] ?? null);
        if ($city && !in_array($city, $parts)) {
            $parts[] = $city;
        }

        $str = implode(', ', $parts);
        if (!str_contains($str, 'Tanjung Enim') && !str_contains($str, 'Lawang Kidul')) {
            $parts[] = 'Tanjung Enim';
            $parts[] = 'Lawang Kidul';
        }
        if (!str_contains($str, 'Muara Enim')) {
            $parts[] = 'Muara Enim';
        }

        // Clean duplicates
        $result = [];
        foreach ($parts as $p) {
            $trimmed = trim($p);
            if (!empty($trimmed) && !in_array($trimmed, $result)) {
                $result[] = $trimmed;
            }
        }

        return implode(', ', $result);
    }

    private function haversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}
