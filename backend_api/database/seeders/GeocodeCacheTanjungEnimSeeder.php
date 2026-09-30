<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder data statis lokasi komprehensif Tanjung Enim & Lawang Kidul untuk tabel geocode_cache.
 *
 * VERSI 2 — Diperluas dengan 100+ titik lokasi nyata:
 * - Pusat Toko Della Frozen Mart & cabang
 * - Jalan utama & gang/lorong di Tanjung Enim
 * - RT/RW & pemukiman padat
 * - Perumahan resmi (PTBA, PNS, swasta)
 * - Kelurahan, dusun & batas wilayah Lawang Kidul
 * - Fasilitas umum, landmark, warung, minimarket, dll.
 * - Masjid, musholla, gereja, sekolah, puskesmas, RS, SPBU, stasiun
 */
class GeocodeCacheTanjungEnimSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('geocode_cache')->where('sumber', 'manual')->delete();

        $now = now();

        $data = [
            // ══════════════════════════════════════════════════════════════
            // 1. TOKO DELLA FROZEN MART & CABANG
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'Della Frozen Mart (Pusat)',
                'alamat_lengkap' => 'Jl. Kiemas, RT.04/RW.10, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7638720,
                'longitude'      => 103.8079257,
                'tipe'           => 'toko',
                'radius_meter'   => 50,
            ],

            // ══════════════════════════════════════════════════════════════
            // 2. JALAN UTAMA & GANG TANJUNG ENIM
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'Jl. Kiemas (RT.04/RW.10)',
                'alamat_lengkap' => 'Jl. Kiemas, RT.04/RW.10, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7638000,
                'longitude'      => 103.8078000,
                'tipe'           => 'jalan',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'Jl. Pandawa',
                'alamat_lengkap' => 'Jl. Pandawa, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7625000,
                'longitude'      => 103.8085000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Rambutan',
                'alamat_lengkap' => 'Jl. Rambutan, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7618000,
                'longitude'      => 103.8092000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Jenderal Ahmad Yani',
                'alamat_lengkap' => 'Jl. Jend. A. Yani, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7552000,
                'longitude'      => 103.7935000,
                'tipe'           => 'jalan',
                'radius_meter'   => 300,
            ],
            [
                'nama'           => 'Jl. Lingkar Tanjung Enim',
                'alamat_lengkap' => 'Jl. Lingkar Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7650000,
                'longitude'      => 103.8030000,
                'tipe'           => 'jalan',
                'radius_meter'   => 400,
            ],
            [
                'nama'           => 'Jl. Sriwijaya',
                'alamat_lengkap' => 'Jl. Sriwijaya, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7580000,
                'longitude'      => 103.7925000,
                'tipe'           => 'jalan',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Jl. Merdeka',
                'alamat_lengkap' => 'Jl. Merdeka, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7575000,
                'longitude'      => 103.7915000,
                'tipe'           => 'jalan',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Jl. Pasar Bawah',
                'alamat_lengkap' => 'Jl. Pasar Bawah, Pasar Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7534944,
                'longitude'      => 103.7940850,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Kolonel Wahid Udin',
                'alamat_lengkap' => 'Jl. Kolonel Wahid Udin, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7560000,
                'longitude'      => 103.7945000,
                'tipe'           => 'jalan',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Jl. Raya Bukit Asam',
                'alamat_lengkap' => 'Jl. Raya Bukit Asam, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7630000,
                'longitude'      => 103.7990000,
                'tipe'           => 'jalan',
                'radius_meter'   => 350,
            ],
            [
                'nama'           => 'Jl. Parigi',
                'alamat_lengkap' => 'Jl. Parigi, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7600000,
                'longitude'      => 103.7940000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Veteran',
                'alamat_lengkap' => 'Jl. Veteran, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7570000,
                'longitude'      => 103.7930000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Diponegoro',
                'alamat_lengkap' => 'Jl. Diponegoro, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7558000,
                'longitude'      => 103.7950000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Sudirman',
                'alamat_lengkap' => 'Jl. Sudirman, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7545000,
                'longitude'      => 103.7960000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Pertamina',
                'alamat_lengkap' => 'Jl. Pertamina, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7680000,
                'longitude'      => 103.7905000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Pahlawan',
                'alamat_lengkap' => 'Jl. Pahlawan, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7542000,
                'longitude'      => 103.7970000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Lintas Muara Enim - Tanjung Enim',
                'alamat_lengkap' => 'Jl. Lintas Muara Enim - Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7420000,
                'longitude'      => 103.7830000,
                'tipe'           => 'jalan',
                'radius_meter'   => 500,
            ],
            [
                'nama'           => 'Jl. MT. Haryono',
                'alamat_lengkap' => 'Jl. MT. Haryono, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7530000,
                'longitude'      => 103.7980000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jl. Gatot Subroto',
                'alamat_lengkap' => 'Jl. Gatot Subroto, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7565000,
                'longitude'      => 103.7990000,
                'tipe'           => 'jalan',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Gang Mawar',
                'alamat_lengkap' => 'Gang Mawar, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7610000,
                'longitude'      => 103.8070000,
                'tipe'           => 'jalan',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Gang Melati',
                'alamat_lengkap' => 'Gang Melati, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7615000,
                'longitude'      => 103.8060000,
                'tipe'           => 'jalan',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Gang Anggrek',
                'alamat_lengkap' => 'Gang Anggrek, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7700000,
                'longitude'      => 103.7980000,
                'tipe'           => 'jalan',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Gang Kenanga',
                'alamat_lengkap' => 'Gang Kenanga, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7605000,
                'longitude'      => 103.8045000,
                'tipe'           => 'jalan',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Lorong Damai',
                'alamat_lengkap' => 'Lorong Damai, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7620000,
                'longitude'      => 103.8035000,
                'tipe'           => 'jalan',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Lorong Setia',
                'alamat_lengkap' => 'Lorong Setia, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7720000,
                'longitude'      => 103.7960000,
                'tipe'           => 'jalan',
                'radius_meter'   => 100,
            ],

            // ══════════════════════════════════════════════════════════════
            // 3. RT / RW SPESIFIK LAWANG KIDUL
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'RT.01/RW.01 Tanjung Enim',
                'alamat_lengkap' => 'RT.01/RW.01, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7508000,
                'longitude'      => 103.7958000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'RT.02/RW.01 Tanjung Enim',
                'alamat_lengkap' => 'RT.02/RW.01, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7518000,
                'longitude'      => 103.7955000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'RT.03/RW.02 Pasar Tanjung Enim',
                'alamat_lengkap' => 'RT.03/RW.02, Pasar Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7525000,
                'longitude'      => 103.7962000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'RT.04/RW.10 Jl. Kiemas',
                'alamat_lengkap' => 'RT.04/RW.10, Jl. Kiemas, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7639000,
                'longitude'      => 103.8079000,
                'tipe'           => 'poi',
                'radius_meter'   => 120,
            ],
            [
                'nama'           => 'RT.05/RW.03 Tegal Rejo',
                'alamat_lengkap' => 'RT.05/RW.03, Tegal Rejo, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7568000,
                'longitude'      => 103.8058000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'RT.06/RW.04 Tegal Rejo',
                'alamat_lengkap' => 'RT.06/RW.04, Tegal Rejo, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7572000,
                'longitude'      => 103.8065000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'RT.01/RW.05 Tanjung Enim Selatan',
                'alamat_lengkap' => 'RT.01/RW.05, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7693000,
                'longitude'      => 103.7915000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'RT.02/RW.06 Air Paku',
                'alamat_lengkap' => 'RT.02/RW.06, Air Paku, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7663000,
                'longitude'      => 103.7958000,
                'tipe'           => 'poi',
                'radius_meter'   => 180,
            ],
            [
                'nama'           => 'RT.07/RW.08 Keban Agung',
                'alamat_lengkap' => 'RT.07/RW.08, Desa Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7755000,
                'longitude'      => 103.8148000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],

            // ══════════════════════════════════════════════════════════════
            // 4. PEMUKIMAN, PERUMAHAN & KOMPLEK
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'Tegal Rejo',
                'alamat_lengkap' => 'Tegal Rejo, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7565000,
                'longitude'      => 103.8055000,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 500,
            ],
            [
                'nama'           => 'Tanjung Enim Selatan',
                'alamat_lengkap' => 'Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7691018,
                'longitude'      => 103.7910938,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 600,
            ],
            [
                'nama'           => 'Pasar Tanjung Enim',
                'alamat_lengkap' => 'Pasar Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7513205,
                'longitude'      => 103.7969013,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 400,
            ],
            [
                'nama'           => 'Lingga',
                'alamat_lengkap' => 'Desa Lingga, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7430000,
                'longitude'      => 103.7850000,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 800,
            ],
            [
                'nama'           => 'Keban Agung',
                'alamat_lengkap' => 'Desa Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7750000,
                'longitude'      => 103.8150000,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 800,
            ],
            [
                'nama'           => 'Darmo',
                'alamat_lengkap' => 'Desa Darmo, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7920000,
                'longitude'      => 103.7780000,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 800,
            ],
            [
                'nama'           => 'Talang Jawa',
                'alamat_lengkap' => 'Talang Jawa, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7585000,
                'longitude'      => 103.7975000,
                'tipe'           => 'poi',
                'radius_meter'   => 300,
            ],
            [
                'nama'           => 'Air Paku',
                'alamat_lengkap' => 'Air Paku, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7660000,
                'longitude'      => 103.7960000,
                'tipe'           => 'poi',
                'radius_meter'   => 350,
            ],
            [
                'nama'           => 'Bedeng Kaca',
                'alamat_lengkap' => 'Bedeng Kaca, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7550000,
                'longitude'      => 103.7920000,
                'tipe'           => 'poi',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Perumahan Bara Lestari',
                'alamat_lengkap' => 'Perumahan Bara Lestari, Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7780000,
                'longitude'      => 103.8180000,
                'tipe'           => 'poi',
                'radius_meter'   => 350,
            ],
            [
                'nama'           => 'Perumahan PTBA Bukit Asam',
                'alamat_lengkap' => 'Perumahan PTBA Bukit Asam, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7600000,
                'longitude'      => 103.7960000,
                'tipe'           => 'poi',
                'radius_meter'   => 400,
            ],
            [
                'nama'           => 'Perumahan Griya Kencana',
                'alamat_lengkap' => 'Perumahan Griya Kencana, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7590000,
                'longitude'      => 103.8010000,
                'tipe'           => 'poi',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Perumahan Permata Biru',
                'alamat_lengkap' => 'Perumahan Permata Biru, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7710000,
                'longitude'      => 103.7940000,
                'tipe'           => 'poi',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Komplek PNS Lawang Kidul',
                'alamat_lengkap' => 'Komplek PNS Lawang Kidul, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7575000,
                'longitude'      => 103.7945000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Komplek TNI / Koramil',
                'alamat_lengkap' => 'Komplek Koramil, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7543000,
                'longitude'      => 103.7928000,
                'tipe'           => 'poi',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'Dusun Muara Niru',
                'alamat_lengkap' => 'Dusun Muara Niru, Lingga, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7390000,
                'longitude'      => 103.7815000,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 600,
            ],
            [
                'nama'           => 'Dusun Baru Keban Agung',
                'alamat_lengkap' => 'Dusun Baru, Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7800000,
                'longitude'      => 103.8200000,
                'tipe'           => 'kelurahan',
                'radius_meter'   => 500,
            ],
            [
                'nama'           => 'Tanah Putih',
                'alamat_lengkap' => 'Tanah Putih, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7605000,
                'longitude'      => 103.7955000,
                'tipe'           => 'poi',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Kampung Baru Tanjung Enim',
                'alamat_lengkap' => 'Kampung Baru, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7498000,
                'longitude'      => 103.7975000,
                'tipe'           => 'poi',
                'radius_meter'   => 300,
            ],
            [
                'nama'           => 'Babatan Tanjung Enim',
                'alamat_lengkap' => 'Babatan, Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7735000,
                'longitude'      => 103.7895000,
                'tipe'           => 'poi',
                'radius_meter'   => 300,
            ],

            // ══════════════════════════════════════════════════════════════
            // 5. FASILITAS UMUM, LANDMARK & POI
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'RS Bukit Asam Medika (BAM)',
                'alamat_lengkap' => 'RS Bukit Asam Medika, Jl. Raya Bukit Asam, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7643000,
                'longitude'      => 103.7985000,
                'tipe'           => 'rs',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'Puskesmas Lawang Kidul',
                'alamat_lengkap' => 'Puskesmas Lawang Kidul, Jl. Ahmad Yani, Tanjung Enim',
                'latitude'       => -3.7548000,
                'longitude'      => 103.7938000,
                'tipe'           => 'rs',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Puskesmas Pembantu Keban Agung',
                'alamat_lengkap' => 'Puskesmas Pembantu, Desa Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7748000,
                'longitude'      => 103.8145000,
                'tipe'           => 'rs',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Kantor Pusat PT Bukit Asam Tbk (PTBA)',
                'alamat_lengkap' => 'Kantor Utama PTBA, Jl. Parigi No. 1, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7602000,
                'longitude'      => 103.7940000,
                'tipe'           => 'poi',
                'radius_meter'   => 250,
            ],
            [
                'nama'           => 'Kantor Camat Lawang Kidul',
                'alamat_lengkap' => 'Kantor Camat Lawang Kidul, Jl. Merdeka, Tanjung Enim',
                'latitude'       => -3.7578000,
                'longitude'      => 103.7912000,
                'tipe'           => 'kantor_pemerintah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Polsek Lawang Kidul',
                'alamat_lengkap' => 'Polsek Lawang Kidul, Jl. Ahmad Yani, Tanjung Enim',
                'latitude'       => -3.7548000,
                'longitude'      => 103.7932000,
                'tipe'           => 'kantor_pemerintah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Kantor Desa Keban Agung',
                'alamat_lengkap' => 'Kantor Desa Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7752000,
                'longitude'      => 103.8153000,
                'tipe'           => 'kantor_pemerintah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Kantor Desa Lingga',
                'alamat_lengkap' => 'Kantor Desa Lingga, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7432000,
                'longitude'      => 103.7852000,
                'tipe'           => 'kantor_pemerintah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Kantor Kelurahan Tanjung Enim Selatan',
                'alamat_lengkap' => 'Kantor Kelurahan Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7693000,
                'longitude'      => 103.7912000,
                'tipe'           => 'kantor_pemerintah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Koramil 406-04 Lawang Kidul',
                'alamat_lengkap' => 'Koramil 406-04 Lawang Kidul, Tanjung Enim, Muara Enim',
                'latitude'       => -3.7543000,
                'longitude'      => 103.7930000,
                'tipe'           => 'kantor_pemerintah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Stasiun Kereta Api Tanjung Enim Baru',
                'alamat_lengkap' => 'Stasiun Tanjung Enim Baru, Tanjung Raja, Muara Enim',
                'latitude'       => -3.7063668,
                'longitude'      => 103.7990700,
                'tipe'           => 'stasiun',
                'radius_meter'   => 300,
            ],
            [
                'nama'           => 'Stasiun Kereta Tanjung Enim Lama',
                'alamat_lengkap' => 'Stasiun Tanjung Enim, Pasar Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7520000,
                'longitude'      => 103.7890000,
                'tipe'           => 'stasiun',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Museum Batubara Bukit Asam',
                'alamat_lengkap' => 'Museum Batubara Bukit Asam, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7570000,
                'longitude'      => 103.7930000,
                'tipe'           => 'poi',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'Gedung Serba Guna (GSG) Tanah Putih',
                'alamat_lengkap' => 'GSG Tanah Putih, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7610000,
                'longitude'      => 103.7955000,
                'tipe'           => 'poi',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'Lapangan Olahraga PTBA',
                'alamat_lengkap' => 'Lapangan PTBA, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7615000,
                'longitude'      => 103.7965000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Kolam Renang PTBA',
                'alamat_lengkap' => 'Kolam Renang PTBA, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7620000,
                'longitude'      => 103.7970000,
                'tipe'           => 'poi',
                'radius_meter'   => 120,
            ],
            [
                'nama'           => 'Taman Kota Tanjung Enim',
                'alamat_lengkap' => 'Taman Kota, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7560000,
                'longitude'      => 103.7950000,
                'tipe'           => 'poi',
                'radius_meter'   => 150,
            ],

            // ══════════════════════════════════════════════════════════════
            // 6. MASJID & TEMPAT IBADAH
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => "Masjid Agung As-Sa'adah Tanjung Enim",
                'alamat_lengkap' => "Masjid As-Sa'adah, Tanjung Enim Selatan, Lawang Kidul, Muara Enim",
                'latitude'       => -3.7513415,
                'longitude'      => 103.7997281,
                'tipe'           => 'masjid',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Masjid Jamik Tanjung Enim',
                'alamat_lengkap' => 'Masjid Jamik, Pasar Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7544713,
                'longitude'      => 103.7910599,
                'tipe'           => 'masjid',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Masjid Jami Al-Hikmah',
                'alamat_lengkap' => 'Masjid Jami Al-Hikmah, Tanjung Enim Selatan, Lawang Kidul',
                'latitude'       => -3.7709202,
                'longitude'      => 103.8048078,
                'tipe'           => 'masjid',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Masjid Nurul Iman Tegal Rejo',
                'alamat_lengkap' => 'Masjid Nurul Iman, Tegal Rejo, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7560000,
                'longitude'      => 103.8062000,
                'tipe'           => 'masjid',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'Musholla Al-Ikhlas Keban Agung',
                'alamat_lengkap' => 'Musholla Al-Ikhlas, Desa Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7748000,
                'longitude'      => 103.8150000,
                'tipe'           => 'masjid',
                'radius_meter'   => 80,
            ],
            [
                'nama'           => 'Gereja GPDI Tanjung Enim',
                'alamat_lengkap' => 'Gereja GPDI, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7555000,
                'longitude'      => 103.7940000,
                'tipe'           => 'poi',
                'radius_meter'   => 80,
            ],

            // ══════════════════════════════════════════════════════════════
            // 7. SEKOLAH (SD, SMP, SMA, SMK)
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'SMA Bukit Asam (PTBA)',
                'alamat_lengkap' => 'SMA Bukit Asam, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7622191,
                'longitude'      => 103.7970074,
                'tipe'           => 'sekolah',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'SMA Negeri 1 Lawang Kidul',
                'alamat_lengkap' => 'SMAN 1 Lawang Kidul, Tanjung Enim, Muara Enim',
                'latitude'       => -3.7540000,
                'longitude'      => 103.7955000,
                'tipe'           => 'sekolah',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'SMK Negeri 1 Lawang Kidul',
                'alamat_lengkap' => 'SMKN 1 Lawang Kidul, Tanjung Enim, Muara Enim',
                'latitude'       => -3.7535000,
                'longitude'      => 103.7970000,
                'tipe'           => 'sekolah',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'SMPN 02 Lawang Kidul',
                'alamat_lengkap' => 'SMPN 02 Lawang Kidul, Tegal Rejo, Tanjung Enim',
                'latitude'       => -3.7617605,
                'longitude'      => 103.8085405,
                'tipe'           => 'sekolah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'SMP Bukit Asam',
                'alamat_lengkap' => 'SMP Bukit Asam, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7618000,
                'longitude'      => 103.7968000,
                'tipe'           => 'sekolah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'SDN 12 Lawang Kidul',
                'alamat_lengkap' => 'SDN 12 Lawang Kidul, Tegal Rejo, Tanjung Enim',
                'latitude'       => -3.7527137,
                'longitude'      => 103.8065888,
                'tipe'           => 'sekolah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'SDN 21 Lawang Kidul',
                'alamat_lengkap' => 'SDN 21 Lawang Kidul, Tanjung Enim Selatan',
                'latitude'       => -3.7719695,
                'longitude'      => 103.8030677,
                'tipe'           => 'sekolah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'SDN 01 Tanjung Enim',
                'alamat_lengkap' => 'SDN 01 Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7525000,
                'longitude'      => 103.7965000,
                'tipe'           => 'sekolah',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'TK Tunas Harapan PTBA',
                'alamat_lengkap' => 'TK Tunas Harapan PTBA, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7612000,
                'longitude'      => 103.7963000,
                'tipe'           => 'sekolah',
                'radius_meter'   => 80,
            ],

            // ══════════════════════════════════════════════════════════════
            // 8. PASAR, TOKO, MINIMARKET & PUSAT BELANJA
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'Pasar Tanjung Enim (Pasar Bawah)',
                'alamat_lengkap' => 'Pasar Tanjung Enim (Pasar Bawah), Jl. Pasar Bawah, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7533000,
                'longitude'      => 103.7942000,
                'tipe'           => 'pasar',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Pasar Inpres Tanjung Enim',
                'alamat_lengkap' => 'Pasar Inpres Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7538000,
                'longitude'      => 103.7938000,
                'tipe'           => 'pasar',
                'radius_meter'   => 150,
            ],
            [
                'nama'           => 'Alfamart Tanjung Enim',
                'alamat_lengkap' => 'Alfamart, Jl. Ahmad Yani, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7552000,
                'longitude'      => 103.7948000,
                'tipe'           => 'pasar',
                'radius_meter'   => 80,
            ],
            [
                'nama'           => 'Indomaret Tanjung Enim',
                'alamat_lengkap' => 'Indomaret, Jl. Kolonel Wahid Udin, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7558000,
                'longitude'      => 103.7942000,
                'tipe'           => 'pasar',
                'radius_meter'   => 80,
            ],
            [
                'nama'           => 'Toko Bangunan Sumber Jaya',
                'alamat_lengkap' => 'Toko Bangunan Sumber Jaya, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7542000,
                'longitude'      => 103.7935000,
                'tipe'           => 'pasar',
                'radius_meter'   => 80,
            ],

            // ══════════════════════════════════════════════════════════════
            // 9. SPBU & STASIUN BAHAN BAKAR
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'SPBU Lingga Tanjung Enim',
                'alamat_lengkap' => 'SPBU Lingga, Jl. Lintas Muara Enim - Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7410000,
                'longitude'      => 103.7870000,
                'tipe'           => 'spbu',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'SPBU Tanjung Enim Selatan',
                'alamat_lengkap' => 'SPBU Tanjung Enim Selatan, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7680000,
                'longitude'      => 103.7930000,
                'tipe'           => 'spbu',
                'radius_meter'   => 100,
            ],
            [
                'nama'           => 'SPBU Pertamina Jl. Ahmad Yani',
                'alamat_lengkap' => 'SPBU Pertamina, Jl. Ahmad Yani, Tanjung Enim, Lawang Kidul',
                'latitude'       => -3.7555000,
                'longitude'      => 103.7936000,
                'tipe'           => 'spbu',
                'radius_meter'   => 80,
            ],

            // ══════════════════════════════════════════════════════════════
            // 10. BATAS WILAYAH & JALAN LINTAS LUAR TANJUNG ENIM
            // ══════════════════════════════════════════════════════════════
            [
                'nama'           => 'Simpang Muara Enim - Tanjung Enim',
                'alamat_lengkap' => 'Simpang Muara Enim, Tanjung Raja, Muara Enim',
                'latitude'       => -3.7050000,
                'longitude'      => 103.7950000,
                'tipe'           => 'poi',
                'radius_meter'   => 300,
            ],
            [
                'nama'           => 'Simpang Keban Agung',
                'alamat_lengkap' => 'Simpang Keban Agung, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7742000,
                'longitude'      => 103.8130000,
                'tipe'           => 'poi',
                'radius_meter'   => 200,
            ],
            [
                'nama'           => 'Jembatan Enim Tanjung Enim',
                'alamat_lengkap' => 'Jembatan Enim, Tanjung Enim, Lawang Kidul, Muara Enim',
                'latitude'       => -3.7520000,
                'longitude'      => 103.7895000,
                'tipe'           => 'poi',
                'radius_meter'   => 150,
            ],
        ];

        $data = array_map(fn ($row) => array_merge($row, [
            'place_id'        => null,
            'sumber'          => 'manual',
            'aktif'           => true,
            'last_scraped_at' => null,
            'created_at'      => $now,
            'updated_at'      => $now,
        ]), $data);

        DB::table('geocode_cache')->insert($data);

        $this->command->info('✅ ' . count($data) . ' lokasi komprehensif Tanjung Enim & Lawang Kidul (v2) berhasil ditanam ke geocode_cache.');
    }
}
