<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Artisan command: php artisan geocache:import-osm
 *
 * Mengambil data lokasi nyata dari OpenStreetMap Overpass API
 * untuk koridor Tanjung Enim - Lawang Kidul - Muara Enim (1.000+ Titik Lokasi)
 * lalu menyimpannya ke tabel geocode_cache.
 *
 * Bounding box: (-3.98, 103.62, -3.55, 104.02)
 * Mencakup: Tanjung Enim, Tanjung Enim Selatan, Pasar TE, Lingga, Tegal Rejo, Keban Agung, Darmo,
 *           Tanjung Raja, Muara Enim Kota, Tanjung Agung, Ujan Mas, dan sekitarnya.
 */
class ImportOsmGeocacheCommand extends Command
{
    protected $signature   = 'geocache:import-osm
                                {--dry-run : Tampilkan hasil tanpa menyimpan ke database}
                                {--fresh : Hapus data OSM lama sebelum import}
                                {--target=1000 : Target minimal jumlah titik lokasi}';
    protected $description = 'Import 1000+ data lokasi Tanjung Enim & Muara Enim dari Overpass API ke geocode_cache';

    // Bounding box utama: South, West, North, East (Tanjung Enim & Muara Enim Raya)
    private const BBOX = '-3.98,103.62,-3.55,104.02';

    // Overpass API endpoint
    private const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

    // Mapping tag OSM → tipe internal geocode_cache
    private array $tipeMap = [
        'school'              => 'sekolah',
        'university'          => 'sekolah',
        'college'             => 'sekolah',
        'kindergarten'        => 'sekolah',
        'hospital'            => 'rs',
        'clinic'              => 'rs',
        'pharmacy'            => 'rs',
        'doctors'             => 'rs',
        'dentist'             => 'rs',
        'place_of_worship'    => 'masjid',
        'mosque'              => 'masjid',
        'church'              => 'masjid',
        'temple'              => 'masjid',
        'marketplace'         => 'pasar',
        'police'              => 'kantor_pemerintah',
        'fire_station'        => 'kantor_pemerintah',
        'post_office'         => 'kantor_pemerintah',
        'townhall'            => 'kantor_pemerintah',
        'government'          => 'kantor_pemerintah',
        'bank'                => 'poi',
        'atm'                 => 'poi',
        'fuel'                => 'spbu',
        'fast_food'           => 'toko',
        'restaurant'          => 'toko',
        'cafe'                => 'toko',
        'convenience'         => 'pasar',
        'supermarket'         => 'pasar',
        'bus_station'         => 'stasiun',
        'train_station'       => 'stasiun',
        'shop'                => 'toko',
        'minimarket'          => 'pasar',
        'grocery'             => 'toko',
        'hardware'            => 'toko',
        'electronics'         => 'toko',
        'clothes'             => 'toko',
        'bakery'              => 'toko',
        'car_repair'          => 'toko',
        'village'             => 'kelurahan',
        'hamlet'              => 'kelurahan',
        'suburb'              => 'kelurahan',
        'neighbourhood'       => 'kelurahan',
        'quarter'             => 'kelurahan',
        'city'                => 'kelurahan',
        'town'                => 'kelurahan',
        'residential'         => 'jalan',
        'primary'             => 'jalan',
        'secondary'           => 'jalan',
        'tertiary'            => 'jalan',
        'unclassified'        => 'jalan',
        'service'             => 'jalan',
        'living_street'       => 'jalan',
        'footway'             => 'jalan',
        'path'                => 'jalan',
        'track'               => 'jalan',
        'station'             => 'stasiun',
        'halt'                => 'stasiun',
        'hotel'               => 'poi',
        'guest_house'         => 'poi',
        'museum'              => 'poi',
        'viewpoint'           => 'poi',
        'park'                => 'poi',
        'pitch'               => 'poi',
        'sports_centre'       => 'poi',
    ];

    public function handle(): int
    {
        $isDry   = $this->option('dry-run');
        $isFresh = $this->option('fresh');

        $this->info('🗺️  Overpass OSM Import 1.000+ Titik — Tanjung Enim & Sekitarnya');
        $this->info('Bounding Box: ' . self::BBOX);
        $this->newLine();

        $queries = $this->buildQueries();
        $allElements = [];

        foreach ($queries as $label => $query) {
            $this->line("  Fetching: <comment>{$label}</comment>...");
            $elements = $this->fetchOverpass($query);

            if ($elements === null) {
                $this->warn("    ⚠️  Gagal fetch: {$label} (akan coba query cadangan)");
                continue;
            }

            $this->line("    → " . count($elements) . " elements");
            $allElements = array_merge($allElements, $elements);

            usleep(600_000); // 0.6 detik jeda sopan
        }

        $this->newLine();
        $this->info("Total raw elements OSM: " . count($allElements));

        // Proses & deduplicate
        $rows = $this->processElements($allElements);
        $this->info("Setelah diproses & deduplikasi: " . count($rows) . " titik lokasi");
        $this->newLine();

        // Tampilkan 15 contoh
        $this->line('<info>Preview 15 lokasi pertama:</info>');
        $this->table(
            ['Nama', 'Tipe', 'Alamat Lengkap', 'Lat', 'Lng'],
            array_map(fn($r) => [
                mb_strimwidth($r['nama'], 0, 35, '…'),
                $r['tipe'],
                mb_strimwidth($r['alamat_lengkap'], 0, 45, '…'),
                number_format($r['latitude'], 5),
                number_format($r['longitude'], 5),
            ], array_slice($rows, 0, 15))
        );

        if ($isDry) {
            $this->warn('--dry-run aktif: data tidak disimpan ke database.');
            return 0;
        }

        if ($isFresh) {
            $deleted = DB::table('geocode_cache')->where('sumber', 'osm')->delete();
            $this->line("🗑️  Hapus {$deleted} data OSM lama.");
        }

        // Insert batch ke tabel geocode_cache
        $inserted = 0;
        $skipped  = 0;
        $now = now();
        $chunks = array_chunk($rows, 100);

        $bar = $this->output->createProgressBar(count($chunks));
        $bar->start();

        foreach ($chunks as $chunk) {
            $batchData = [];
            foreach ($chunk as $row) {
                $exists = DB::table('geocode_cache')
                    ->where('nama', $row['nama'])
                    ->whereBetween('latitude', [$row['latitude'] - 0.00015, $row['latitude'] + 0.00015])
                    ->whereBetween('longitude', [$row['longitude'] - 0.00015, $row['longitude'] + 0.00015])
                    ->exists();

                if (!$exists) {
                    $batchData[] = array_merge($row, [
                        'sumber'          => 'osm',
                        'aktif'           => true,
                        'place_id'        => null,
                        'last_scraped_at' => $now,
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ]);
                    $inserted++;
                } else {
                    $skipped++;
                }
            }

            if (!empty($batchData)) {
                DB::table('geocode_cache')->insert($batchData);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ Berhasil diimport! Ditambahkan: {$inserted} | Dilewati (duplikat): {$skipped}");

        $total = DB::table('geocode_cache')->count();
        $this->info("📊 TOTAL titik lokasi di geocode_cache sekarang: {$total} LOKASI");

        return 0;
    }

    private function buildQueries(): array
    {
        $bbox = self::BBOX;

        return [
            '1. Fasilitas Umum & Amenity (Sekolah, Masjid, RS, Kantor, Resto)' => "[out:json][timeout:45];
                (
                    node[\"amenity\"]({$bbox});
                    way[\"amenity\"]({$bbox});
                );
                out center;",

            '2. Semua Jalan Bernama (Jalan Utama, Gang, Lorong, Residential)' => "[out:json][timeout:45];
                (
                    way[\"name\"][\"highway\"]({$bbox});
                    node[\"name\"][\"highway\"]({$bbox});
                );
                out center;",

            '3. Pemukiman, Desa, Kelurahan, Dusun, RT/RW' => "[out:json][timeout:45];
                (
                    node[\"place\"]({$bbox});
                    way[\"place\"]({$bbox});
                    node[\"boundary\"=\"administrative\"]({$bbox});
                );
                out center;",

            '4. Toko, Warung, Swalayan, Pasar, Minimarket, Usaha' => "[out:json][timeout:45];
                (
                    node[\"shop\"]({$bbox});
                    way[\"shop\"]({$bbox});
                    node[\"craft\"]({$bbox});
                );
                out center;",

            '5. Bangunan & Gedung Bernama (Perkantoran, Perumahan, Komplek)' => "[out:json][timeout:45];
                (
                    node[\"name\"][\"building\"]({$bbox});
                    way[\"name\"][\"building\"]({$bbox});
                );
                out center;",

            '6. Pariwisata, Hotel, Olahraga, Landmark & Kantor Perusahaan' => "[out:json][timeout:45];
                (
                    node[\"tourism\"]({$bbox});
                    node[\"leisure\"]({$bbox});
                    node[\"office\"]({$bbox});
                    way[\"office\"]({$bbox});
                    node[\"historic\"]({$bbox});
                    node[\"natural\"]({$bbox});
                    node[\"man_made\"]({$bbox});
                );
                out center;",

            '7. Stasiun, SPBU, Transportasi & Bengkel' => "[out:json][timeout:45];
                (
                    node[\"railway\"]({$bbox});
                    way[\"railway\"]({$bbox});
                    node[\"amenity\"=\"fuel\"]({$bbox});
                    node[\"amenity\"=\"charging_station\"]({$bbox});
                );
                out center;",

            '8. Bangunan Pemukiman, Kantor & Fasilitas Bernama' => "[out:json][timeout:45];
                (
                    node[\"building\"]({$bbox});
                    way[\"building\"][\"name\"]({$bbox});
                );
                out center;",

            '9. Node Jalan & Persimpangan Bernama (Intersection & Junction Points)' => "[out:json][timeout:45];
                (
                    node[\"highway\"~\"motorway_junction|crossing|turning_circle|bus_stop\"]({$bbox});
                    node[\"junction\"]({$bbox});
                );
                out center;",

            '10. Jalur Pemukiman, Gang, Lorong & Jalan Lingkungan' => "[out:json][timeout:45];
                (
                    way[\"highway\"~\"track|path|footway|service\"]({$bbox});
                );
                out center;",

            '11. Perbankan, ATM, Pos, Keamanan & Kantor Pelayanan' => "[out:json][timeout:45];
                (
                    node[\"amenity\"~\"bank|atm|post_box|police|courthouse\"]({$bbox});
                    way[\"amenity\"~\"bank|police\"]({$bbox});
                );
                out center;",

            '12. Swalayan, Kios, Toko Kelontong, Kuliner & Kedai' => "[out:json][timeout:45];
                (
                    node[\"shop\"~\"supermarket|convenience|kiosk|bakery|butcher|greengrocer|mall\"]({$bbox});
                    node[\"amenity\"~\"cafe|fast_food|restaurant|food_court\"]({$bbox});
                );
                out center;",
        ];
    }

    private function fetchOverpass(string $query, int $maxRetries = 3): ?array
    {
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL            => self::OVERPASS_URL,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => 'data=' . urlencode($query),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 60,
                CURLOPT_CONNECTTIMEOUT => 20,
                CURLOPT_USERAGENT      => 'DellaFrozenmartBot/2.0 (academic research open data)',
                CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            ]);

            $raw  = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err  = curl_error($ch);
            curl_close($ch);

            if ($code === 200 && $raw !== false) {
                $json = json_decode($raw, true);
                return $json['elements'] ?? [];
            }

            if ($code === 429 || $code === 504 || $code === 0) {
                $sleepSec = $attempt * 3;
                $this->warn("    ⚠️ Rate limit / timeout (HTTP {$code}), mencoba ulang dalam {$sleepSec} detik (percobaan {$attempt}/{$maxRetries})...");
                sleep($sleepSec);
                continue;
            }

            $this->warn("    cURL status: {$code} | {$err}");
            break;
        }

        return null;
    }

    private function processElements(array $elements): array
    {
        $rows = [];
        $seen = [];

        foreach ($elements as $el) {
            $tags = $el['tags'] ?? [];
            $nama = trim($tags['name'] ?? '');

            // Jika tidak ada tag 'name', coba tag alternatif
            if (empty($nama)) {
                $nama = trim($tags['operator'] ?? ($tags['brand'] ?? ($tags['description'] ?? '')));
            }

            // Jika masih kosong, buat nama berbasis tipe/alamat
            if (empty($nama)) {
                if (!empty($tags['highway'])) {
                    $nama = 'Jalan ' . ucfirst($tags['highway']);
                } elseif (!empty($tags['amenity'])) {
                    $nama = ucfirst(str_replace('_', ' ', $tags['amenity']));
                } elseif (!empty($tags['shop'])) {
                    $nama = 'Toko ' . ucfirst(str_replace('_', ' ', $tags['shop']));
                } elseif (!empty($tags['place'])) {
                    $nama = ucfirst($tags['place']);
                } else {
                    continue;
                }
            }

            // Koordinat
            $lat = isset($el['lat']) ? (float) $el['lat']
                 : (isset($el['center']['lat']) ? (float) $el['center']['lat'] : null);
            $lng = isset($el['lon']) ? (float) $el['lon']
                 : (isset($el['center']['lon']) ? (float) $el['center']['lon'] : null);

            if ($lat === null || $lng === null) continue;

            // Pastikan dalam batas wilayah logis
            if ($lat < -4.10 || $lat > -3.45 || $lng < 103.50 || $lng > 104.15) continue;

            // Tipe
            $tipe = $this->resolveTipe($tags);

            // Alamat Lengkap
            $alamat = $this->buildAlamat($nama, $tags, $tipe, $lat, $lng);

            // Radius
            $radius = $this->resolveRadius($tipe, $nama);

            // Deduplicate by nama + koordinat pembulatan 4 desimal (~11 meter)
            $key = mb_strtolower($nama) . '|' . round($lat, 4) . '|' . round($lng, 4);
            if (isset($seen[$key])) continue;
            $seen[$key] = true;

            $rows[] = [
                'nama'           => $nama,
                'alamat_lengkap' => $alamat,
                'latitude'       => $lat,
                'longitude'      => $lng,
                'tipe'           => $tipe,
                'radius_meter'   => $radius,
            ];
        }

        // Sort: jalan utama, lalu fasilitas & toko, lalu kelurahan
        usort($rows, function ($a, $b) {
            $priority = ['jalan' => 1, 'pasar' => 2, 'toko' => 3, 'sekolah' => 4, 'masjid' => 5, 'rs' => 6, 'kantor_pemerintah' => 7, 'poi' => 8, 'kelurahan' => 9];
            $pA = $priority[$a['tipe']] ?? 10;
            $pB = $priority[$b['tipe']] ?? 10;
            return $pA <=> $pB;
        });

        return $rows;
    }

    private function resolveTipe(array $tags): string
    {
        if (!empty($tags['amenity'])) {
            return $this->tipeMap[$tags['amenity']] ?? 'poi';
        }
        if (!empty($tags['shop'])) {
            return $this->tipeMap[$tags['shop']] ?? 'toko';
        }
        if (!empty($tags['place'])) {
            return $this->tipeMap[$tags['place']] ?? 'kelurahan';
        }
        if (!empty($tags['highway'])) {
            return $this->tipeMap[$tags['highway']] ?? 'jalan';
        }
        if (!empty($tags['railway'])) {
            return 'stasiun';
        }
        if (!empty($tags['office'])) {
            return 'kantor_pemerintah';
        }
        if (!empty($tags['tourism']) || !empty($tags['leisure'])) {
            return 'poi';
        }
        return 'poi';
    }

    private function resolveRadius(string $tipe, string $nama): int
    {
        switch ($tipe) {
            case 'jalan':
                return min(350, max(100, strlen($nama) * 8));
            case 'kelurahan':
                return 600;
            case 'pasar':
            case 'stasiun':
                return 200;
            case 'sekolah':
            case 'rs':
            case 'kantor_pemerintah':
                return 120;
            default:
                return 80;
        }
    }

    private function buildAlamat(string $nama, array $tags, string $tipe, float $lat, float $lng): string
    {
        $parts = [];

        // 1. Nama Jalan / Nama Tempat
        if (!empty($tags['addr:street'])) {
            $parts[] = $tags['addr:street'];
        } elseif ($tipe === 'jalan') {
            $parts[] = $nama;
        } else {
            $parts[] = $nama;
        }

        // 2. Nomor Rumah
        if (!empty($tags['addr:housenumber'])) {
            $parts[0] .= ' No.' . $tags['addr:housenumber'];
        }

        // 3. Kelurahan / Desa / Kecamatan berdasarkan koordinat & tag
        $village = $tags['addr:village'] ?? $tags['addr:suburb'] ?? $tags['is_in:village'] ?? null;
        if ($village && $village !== $nama) {
            $parts[] = $village;
        } else {
            // Deteksi zona berbasis lintang/bujur
            if ($lat < -3.765) {
                $parts[] = 'Tanjung Enim Selatan';
                $parts[] = 'Lawang Kidul';
            } elseif ($lat < -3.745) {
                $parts[] = 'Tanjung Enim';
                $parts[] = 'Lawang Kidul';
            } elseif ($lat < -3.72) {
                $parts[] = 'Lingga';
                $parts[] = 'Lawang Kidul';
            } else {
                $parts[] = 'Muara Enim';
            }
        }

        // 4. Kabupaten
        $parts[] = 'Muara Enim';

        return implode(', ', array_filter(array_unique($parts)));
    }
}
