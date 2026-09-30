<?php

namespace Database\Seeders;

use App\Models\Kategori;
use App\Models\Produk;
use App\Models\User;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use App\Models\Pembayaran;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

/**
 * Seeder Data Produk & Penjualan Della Frozen Mart
 * ─────────────────────────────────────────────────
 * Produk  : 40 produk dalam 5 kategori simpel
 * Kategori: Sosis | Nugget | Bakso | Seafood | Dimsum & Snack
 * Penjualan: 58 transaksi historis (01 Jan 2026 – 30 Apr 2026)
 */
class ProdukDanPenjualanSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedProducts();
        $this->seedSalesHistory();
    }

    // =========================================================================
    // A. SEED PRODUK (5 Kategori Simpel)
    // =========================================================================
    private function seedProducts(): void
    {
        // 12 kategori lengkap Della Frozen Mart
        $catDefs = [
            'Frozen Food' => 'Berbagai makanan olahan beku: sosis, nugget, dimsum, dan olahan seafood',
            'Bumbu'       => 'Bumbu instan, bumbu kuah, dan bumbu tabur pelengkap masakan',
            'Es Krim'     => 'Es krim beku aneka rasa yang segar dan manis',
            'Menu Bakso'  => 'Bakso sapi, bakso ayam, bakso ikan, dan baso aci khas',
            'Makanan'     => 'Makanan siap saji dan olahan kukus / hangat',
            'Pertopingan' => 'Keju, mayonaise, nori, dan topping pelengkap sajian',
            'Barang'      => 'Perlengkapan kemasan, tusuk sate, tempat makan, dan kantong plastik',
            'Snack'       => 'Kentang goreng, cimol, dan camilan renyah',
            'Minuman'     => 'Minuman segar kemasan, boba frozen, dan susu',
            'Saos'        => 'Saus sambal, saus tomat, saus tiram, dan saus keju',
            'Cemilan'     => 'Sayuran beku, edamame, dan camilan sehat',
            'Mainan Anak' => 'Mainan edukasi, figur mini, dan aksesoris anak',
        ];

        $cats = [];
        foreach ($catDefs as $nama => $desk) {
            $cats[$nama] = Kategori::firstOrCreate(['nama' => $nama], ['deskripsi' => $desk]);
        }

        $products = [
            // ── FROZEN FOOD (24 produk) ─────────────────────────────────────────────
            ['kode'=>'PRD-001','nama'=>'Kanzler Sosis Sapi 500gr',       'kat'=>'Frozen Food','harga'=>45000,'stok'=>80,'min'=>10,'sat'=>'Pcs','exp'=>'2027-03-31','desk'=>'Sosis sapi premium Kanzler, tekstur lembut dan gurih, kemasan 500 gr.'],
            ['kode'=>'PRD-002','nama'=>'Kanzler Sosis Ayam 500gr',       'kat'=>'Frozen Food','harga'=>42000,'stok'=>75,'min'=>10,'sat'=>'Pcs','exp'=>'2027-03-31','desk'=>'Sosis ayam premium Kanzler, rendah lemak, cocok untuk anak-anak, 500 gr.'],
            ['kode'=>'PRD-003','nama'=>'Champ Sosis Ayam 375gr',         'kat'=>'Frozen Food','harga'=>22000,'stok'=>60,'min'=>10,'sat'=>'Pcs','exp'=>'2026-12-31','desk'=>'Sosis ayam Champ, rasa gurih, kemasan ekonomis 375 gr.'],
            ['kode'=>'PRD-004','nama'=>'Kimbo Sosis Sapi 500gr',         'kat'=>'Frozen Food','harga'=>48000,'stok'=>55,'min'=>10,'sat'=>'Pcs','exp'=>'2027-02-28','desk'=>'Sosis sapi Kimbo tanpa bahan pengawet berbahaya, halal, 500 gr.'],
            ['kode'=>'PRD-005','nama'=>'So Good Sosis Keju 375gr',       'kat'=>'Frozen Food','harga'=>28000,'stok'=>50,'min'=>10,'sat'=>'Pcs','exp'=>'2027-01-31','desk'=>'Sosis keju So Good, rasa keju meleleh di setiap gigitan, 375 gr.'],
            ['kode'=>'PRD-006','nama'=>'Bernardi Sosis Sapi Jumbo 500gr','kat'=>'Frozen Food','harga'=>52000,'stok'=>40,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-04-30','desk'=>'Sosis sapi jumbo Bernardi, ukuran besar, cocok untuk bakar, 500 gr.'],
            ['kode'=>'PRD-007','nama'=>'Sozzis Sosis Mini Isi 20pcs',   'kat'=>'Frozen Food','harga'=>18000,'stok'=>70,'min'=>10,'sat'=>'Pcs','exp'=>'2026-11-30','desk'=>'Sosis mini Sozzis, cocok untuk bekal anak, isi 20 pcs per kemasan.'],
            ['kode'=>'PRD-008','nama'=>'Fiesta Nugget Ayam 250gr',       'kat'=>'Frozen Food','harga'=>38000,'stok'=>90,'min'=>10,'sat'=>'Pcs','exp'=>'2027-01-31','desk'=>'Nugget ayam Fiesta rasa original, renyah di luar lembut di dalam, 250 gr.'],
            ['kode'=>'PRD-009','nama'=>'Fiesta Nugget Ayam 500gr',       'kat'=>'Frozen Food','harga'=>72000,'stok'=>70,'min'=>10,'sat'=>'Pcs','exp'=>'2027-01-31','desk'=>'Nugget ayam Fiesta rasa original kemasan keluarga 500 gr.'],
            ['kode'=>'PRD-010','nama'=>'So Good Nugget Ayam 400gr',      'kat'=>'Frozen Food','harga'=>55000,'stok'=>65,'min'=>10,'sat'=>'Pcs','exp'=>'2026-12-31','desk'=>'Nugget ayam So Good halal, tekstur crispy sempurna, 400 gr.'],
            ['kode'=>'PRD-011','nama'=>'Champ Nugget Ayam 400gr',        'kat'=>'Frozen Food','harga'=>42000,'stok'=>80,'min'=>10,'sat'=>'Pcs','exp'=>'2026-12-31','desk'=>'Nugget ayam Champ harga terjangkau, cocok untuk camilan, 400 gr.'],
            ['kode'=>'PRD-012','nama'=>'Sajiku Nugget Ikan 250gr',       'kat'=>'Frozen Food','harga'=>32000,'stok'=>45,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-02-28','desk'=>'Nugget ikan Sajiku, kaya protein omega-3, cocok untuk anak, 250 gr.'],
            ['kode'=>'PRD-013','nama'=>'Bernardi Chicken Fingers 250gr', 'kat'=>'Frozen Food','harga'=>35000,'stok'=>50,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-01-31','desk'=>'Chicken fingers Bernardi, potongan memanjang, crispy dan gurih, 250 gr.'],
            ['kode'=>'PRD-025','nama'=>'Crabstick Frozen 250gr',         'kat'=>'Frozen Food','harga'=>28000,'stok'=>50,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Crabstick (kanikama) frozen, cocok untuk sushi dan salad, 250 gr.'],
            ['kode'=>'PRD-026','nama'=>'Otak-Otak Ikan Frozen 10pcs',   'kat'=>'Frozen Food','harga'=>22000,'stok'=>60,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-04-30','desk'=>'Otak-otak ikan Bangka, bumbu rempah khas, frozen siap bakar/goreng.'],
            ['kode'=>'PRD-027','nama'=>'Fish Roll Frozen 250gr',         'kat'=>'Frozen Food','harga'=>25000,'stok'=>45,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Fish roll frozen, rasa ikan gurih dengan tekstur kenyal, 250 gr.'],
            ['kode'=>'PRD-028','nama'=>'Udang Kupas Frozen 300gr',       'kat'=>'Frozen Food','harga'=>48000,'stok'=>35,'min'=> 5,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Udang windu kupas bersih frozen, siap masak, 300 gr.'],
            ['kode'=>'PRD-029','nama'=>'Cumi Frozen 300gr',              'kat'=>'Frozen Food','harga'=>45000,'stok'=>30,'min'=> 5,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Cumi-cumi segar frozen, dibersihkan dan siap dimasak, 300 gr.'],
            ['kode'=>'PRD-030','nama'=>'Scallop Frozen 200gr',           'kat'=>'Frozen Food','harga'=>55000,'stok'=>20,'min'=> 5,'sat'=>'Pcs','exp'=>'2027-07-31','desk'=>'Kerang simping (scallop) segar beku, cocok untuk steak dan pasta, 200 gr.'],
            ['kode'=>'PRD-031','nama'=>'Dimsum Ayam Frozen 10pcs',       'kat'=>'Frozen Food','harga'=>30000,'stok'=>55,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Dimsum ayam lengkap dengan saus kacang, isi 10 pcs per kemasan.'],
            ['kode'=>'PRD-032','nama'=>'Dimsum Udang Frozen 10pcs',      'kat'=>'Frozen Food','harga'=>35000,'stok'=>45,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Dimsum udang segar, lembut dan gurih, isi 10 pcs per kemasan.'],
            ['kode'=>'PRD-033','nama'=>'Siomay Ayam Frozen 10pcs',       'kat'=>'Frozen Food','harga'=>25000,'stok'=>50,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-04-30','desk'=>'Siomay ayam khas Bandung, cocok dikukus dengan bumbu kacang.'],
            ['kode'=>'PRD-038','nama'=>'Gyoza Ayam Frozen 10pcs',        'kat'=>'Frozen Food','harga'=>32000,'stok'=>40,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Gyoza Jepang isi ayam, lembut di dalam crispy di luar, isi 10 pcs.'],
            ['kode'=>'PRD-039','nama'=>'Shumai Udang Frozen 10pcs',      'kat'=>'Frozen Food','harga'=>30000,'stok'=>35,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Shumai isi udang segar, rasa autentik dim sum resto, isi 10 pcs.'],

            // ── MENU BAKSO (6 produk) ──────────────────────────────────────────────
            ['kode'=>'PRD-014','nama'=>'Bakso Sapi Frozen 50 Butir',     'kat'=>'Menu Bakso','harga'=>35000,'stok'=>60,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Bakso sapi frozen 50 butir, daging sapi pilihan, kenyal dan enak.'],
            ['kode'=>'PRD-015','nama'=>'Bakso Sapi Premium 25 Butir',    'kat'=>'Menu Bakso','harga'=>28000,'stok'=>55,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Bakso sapi premium kenyal isi 25 butir, cocok untuk mie bakso.'],
            ['kode'=>'PRD-016','nama'=>'Bakso Ayam Frozen 50 Butir',     'kat'=>'Menu Bakso','harga'=>30000,'stok'=>65,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Bakso ayam frozen 50 butir, lebih ringan dan rendah lemak.'],
            ['kode'=>'PRD-017','nama'=>'Bakso Ikan Frozen 30 Butir',     'kat'=>'Menu Bakso','harga'=>25000,'stok'=>40,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Bakso ikan pilihan, gurih dan kenyal, isi 30 butir per kemasan.'],
            ['kode'=>'PRD-018','nama'=>'Baso Aci Sapi Frozen 300gr',     'kat'=>'Menu Bakso','harga'=>20000,'stok'=>50,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-04-30','desk'=>'Baso aci khas Sunda berbahan sapi, frozen siap saji 300 gr.'],
            ['kode'=>'PRD-040','nama'=>'Tahu Bakso Frozen 10pcs',        'kat'=>'Menu Bakso','harga'=>15000,'stok'=>80,'min'=>10,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Tahu bakso khas Bandung isi bakso sapi, siap goreng, isi 10 pcs.'],

            // ── MAKANAN (5 produk) ─────────────────────────────────────────────
            ['kode'=>'PRD-034','nama'=>'Bakpao Isi Ayam Frozen 5pcs',    'kat'=>'Makanan','harga'=>22000,'stok'=>60,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-04-30','desk'=>'Bakpao isi ayam berbumbu, lembut dan mengenyangkan, isi 5 pcs.'],
            ['kode'=>'PRD-035','nama'=>'Bakpao Isi Coklat Frozen 5pcs',  'kat'=>'Makanan','harga'=>22000,'stok'=>55,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-04-30','desk'=>'Bakpao isi coklat lembut manis, favorit anak-anak, isi 5 pcs.'],
            ['kode'=>'PRD-036','nama'=>'Lumpia Sayur Frozen 10pcs',      'kat'=>'Makanan','harga'=>20000,'stok'=>65,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-03-31','desk'=>'Lumpia sayur beku isi wortel-kubis, siap goreng, isi 10 pcs.'],
            ['kode'=>'PRD-037','nama'=>'Pangsit Goreng Frozen 20pcs',    'kat'=>'Makanan','harga'=>18000,'stok'=>70,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-03-31','desk'=>'Pangsit goreng isi ayam-udang, renyah dan gurih, isi 20 pcs.'],
            ['kode'=>'PRD-041','nama'=>'Nasi Bento Chicken Katsu',       'kat'=>'Makanan','harga'=>25000,'stok'=>30,'min'=> 5,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Paket bento nasi dengan chicken katsu & salad mini, frozen siap hangatkan.'],

            // ── SNACK (4 produk) ──────────────────────────────────────────────
            ['kode'=>'PRD-020','nama'=>'Kentang Goreng Crinkle 1kg',     'kat'=>'Snack','harga'=>28000,'stok'=>75,'min'=>10,'sat'=>'Pcs','exp'=>'2027-09-30','desk'=>'Kentang goreng crinkle (bergelombang) 1 kg, renyah dan gurih.'],
            ['kode'=>'PRD-021','nama'=>'Kentang Goreng Stick 1kg',       'kat'=>'Snack','harga'=>27000,'stok'=>80,'min'=>10,'sat'=>'Pcs','exp'=>'2027-09-30','desk'=>'Kentang goreng stick lurus 1 kg, cocok untuk fast food rumahan.'],
            ['kode'=>'PRD-022','nama'=>'Tambora Kentang Wedges 1kg',     'kat'=>'Snack','harga'=>32000,'stok'=>60,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-08-31','desk'=>'Kentang wedges Tambora, rasa BBQ, renyah dan empuk dalam, 1 kg.'],
            ['kode'=>'PRD-019','nama'=>'Cimol Frozen 500gr',             'kat'=>'Snack','harga'=>22000,'stok'=>35,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-03-31','desk'=>'Cimol frozen siap goreng, tekstur kenyal, kemasan 500 gr.'],

            // ── CEMILAN (3 produk) ────────────────────────────────────────────
            ['kode'=>'PRD-023','nama'=>'Sayur Mix Frozen 500gr',         'kat'=>'Cemilan','harga'=>18000,'stok'=>45,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Campuran sayuran beku (wortel, jagung, buncis, kacang polong) 500 gr.'],
            ['kode'=>'PRD-024','nama'=>'Edamame Frozen 500gr',           'kat'=>'Cemilan','harga'=>24000,'stok'=>40,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-07-31','desk'=>'Edamame beku kukus bersama garam, camilan sehat 500 gr.'],
            ['kode'=>'PRD-042','nama'=>'Risol Mayo Frozen 10pcs',        'kat'=>'Cemilan','harga'=>23000,'stok'=>50,'min'=> 8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Risol isi telur, smoked beef, dan mayonaise meleleh, isi 10 pcs.'],

            // ── BUMBU (3 produk) ──────────────────────────────────────────────
            ['kode'=>'PRD-043','nama'=>'Bumbu Kuah Bakso Mamasuka 100g','kat'=>'Bumbu','harga'=>12000,'stok'=>100,'min'=>15,'sat'=>'Pcs','exp'=>'2027-12-31','desk'=>'Bumbu instan kuah bakso sapi kaya rempah, praktis dan gurih.'],
            ['kode'=>'PRD-044','nama'=>'Bumbu Tabur Balado Antaka 100g', 'kat'=>'Bumbu','harga'=>10000,'stok'=>90,'min'=>15,'sat'=>'Pcs','exp'=>'2027-12-31','desk'=>'Bumbu tabur rasa balado manis pedas untuk kentang & cimol.'],
            ['kode'=>'PRD-045','nama'=>'Bumbu Racik Ayam Goreng Indofood','kat'=>'Bumbu','harga'=>5000,'stok'=>120,'min'=>20,'sat'=>'Pcs','exp'=>'2027-12-31','desk'=>'Bumbu racik komplit siap pakai untuk ungkep ayam goreng.'],

            // ── ES KRIM (3 produk) ────────────────────────────────────────────
            ['kode'=>'PRD-046','nama'=>'Es Krim Walls Feast Cokelat 65ml','kat'=>'Es Krim','harga'=>6000,'stok'=>80,'min'=>10,'sat'=>'Pcs','exp'=>'2027-08-31','desk'=>'Es krim stik rasa cokelat berbalut lapisan cokelat renyah dan kacang.'],
            ['kode'=>'PRD-047','nama'=>'Es Krim Aice Mochi Vanilla 45g','kat'=>'Es Krim','harga'=>4000,'stok'=>100,'min'=>15,'sat'=>'Pcs','exp'=>'2027-08-31','desk'=>'Es krim mochi kulit kenyal rasa vanilla manis lembut.'],
            ['kode'=>'PRD-048','nama'=>'Es Krim Campina Hula Hula Kacang Hijau','kat'=>'Es Krim','harga'=>5000,'stok'=>70,'min'=>10,'sat'=>'Pcs','exp'=>'2027-08-31','desk'=>'Es krim rasa tradisional kacang hijau segar alami.'],

            // ── PERTOPINGAN (3 produk) ────────────────────────────────────────
            ['kode'=>'PRD-049','nama'=>'Keju Mozzarella Parut Kraft 160g','kat'=>'Pertopingan','harga'=>32000,'stok'=>50,'min'=>8,'sat'=>'Pcs','exp'=>'2027-06-30','desk'=>'Keju mozzarella siap pakai, mudah meleleh dan mulur tinggi.'],
            ['kode'=>'PRD-050','nama'=>'Mayonaise Mamasuka Pouch 480g','kat'=>'Pertopingan','harga'=>18000,'stok'=>65,'min'=>10,'sat'=>'Pcs','exp'=>'2027-10-31','desk'=>'Mayonnaise asam manis lembut cocok untuk burger dan risol.'],
            ['kode'=>'PRD-051','nama'=>'Nori Rumput Laut Tabur 30g',    'kat'=>'Pertopingan','harga'=>15000,'stok'=>75,'min'=>10,'sat'=>'Pcs','exp'=>'2027-09-30','desk'=>'Rumput laut tabur renyah berbumbu gurih untuk nasi & makanan.'],

            // ── BARANG (3 produk) ─────────────────────────────────────────────
            ['kode'=>'PRD-052','nama'=>'Tusuk Sate & Bakso Kayu 200g',  'kat'=>'Barang','harga'=>8000,'stok'=>150,'min'=>20,'sat'=>'Pcs','exp'=>'2030-12-31','desk'=>'Tusuk kayu halus higienis untuk sosis dan bakso bakar.'],
            ['kode'=>'PRD-053','nama'=>'Thinwall Box Makanan 500ml 10pcs','kat'=>'Barang','harga'=>15000,'stok'=>100,'min'=>10,'sat'=>'Pcs','exp'=>'2030-12-31','desk'=>'Wadah plastik transparan microwave-safe isi 10 pcs.'],
            ['kode'=>'PRD-054','nama'=>'Kantong Plastik Ziplock Isi 20','kat'=>'Barang','harga'=>12000,'stok'=>120,'min'=>15,'sat'=>'Pcs','exp'=>'2030-12-31','desk'=>'Plastik klip kedap udara tebal cocok simpan makanan frozen.'],

            // ── MINUMAN (3 produk) ────────────────────────────────────────────
            ['kode'=>'PRD-055','nama'=>'Teh Pucuk Harum Botol 350ml',  'kat'=>'Minuman','harga'=>4000,'stok'=>200,'min'=>24,'sat'=>'Pcs','exp'=>'2027-08-31','desk'=>'Teh melati manis segar dipetik dari pucuk teh pilihan.'],
            ['kode'=>'PRD-056','nama'=>'Ultra Milk Susu UHT Cokelat 250ml','kat'=>'Minuman','harga'=>7000,'stok'=>150,'min'=>20,'sat'=>'Pcs','exp'=>'2027-07-31','desk'=>'Susu UHT lezat tinggi kalsium rasa cokelat.'],
            ['kode'=>'PRD-057','nama'=>'Milk Tea Boba Frozen 250ml',   'kat'=>'Minuman','harga'=>18000,'stok'=>45,'min'=>8,'sat'=>'Pcs','exp'=>'2027-05-31','desk'=>'Minuman boba milk tea beku siap minum setelah dicairkan.'],

            // ── SAOS (3 produk) ───────────────────────────────────────────────
            ['kode'=>'PRD-058','nama'=>'Saos Sambal Extra Pedas Del Monte 330ml','kat'=>'Saos','harga'=>14000,'stok'=>90,'min'=>10,'sat'=>'Pcs','exp'=>'2027-11-30','desk'=>'Saus sambal ekstra pedas nikmat untuk cocolan gorengan.'],
            ['kode'=>'PRD-059','nama'=>'Saos Tomat ABC Botol 335ml',     'kat'=>'Saos','harga'=>12000,'stok'=>85,'min'=>10,'sat'=>'Pcs','exp'=>'2027-11-30','desk'=>'Saus tomat segar kental rasa manis asam seimbang.'],
            ['kode'=>'PRD-060','nama'=>'Saos Tiram Saori Botol 133ml',   'kat'=>'Saos','harga'=>11000,'stok'=>95,'min'=>10,'sat'=>'Pcs','exp'=>'2027-11-30','desk'=>'Saus tiram gurih dibuat dari ekstrak tiram asli.'],

            // ── MAINAN ANAK (3 produk) ────────────────────────────────────────
            ['kode'=>'PRD-061','nama'=>'Mainan Figur Mini Superhero',   'kat'=>'Mainan Anak','harga'=>15000,'stok'=>50,'min'=>5,'sat'=>'Pcs','exp'=>'2030-12-31','desk'=>'Mainan action figure mini bahan aman untuk koleksi anak.'],
            ['kode'=>'PRD-062','nama'=>'Mainan Gelembung Sabun Bubble Wand','kat'=>'Mainan Anak','harga'=>10000,'stok'=>60,'min'=>10,'sat'=>'Pcs','exp'=>'2030-12-31','desk'=>'Mainan gelembung tiup dengan stik lucu berbagai warna.'],
            ['kode'=>'PRD-063','nama'=>'Mainan Puzzle Edukasi Kayu Anak','kat'=>'Mainan Anak','harga'=>20000,'stok'=>40,'min'=>5,'sat'=>'Pcs','exp'=>'2030-12-31','desk'=>'Puzzle kayu edukatif melatih kecerdasan dan motorik anak.'],
        ];

        $imgMap = [
            'PRD-001' => 'products/prd_001_kanzler_sosis_sapi_500gr.png',
            'PRD-002' => 'products/prd_002_kanzler_sosis_ayam_500gr.png',
            'PRD-003' => 'products/prd_003_champ_sosis_ayam_375gr.png',
            'PRD-004' => 'products/prd_004_kimbo_sosis_sapi_500gr.png',
            'PRD-005' => 'products/prd_005_so_good_sosis_keju_375gr.png',
            'PRD-006' => 'products/prd_006_bernardi_sosis_sapi_jumbo_500g.png',
            'PRD-007' => 'products/prd_007_sozzis_sosis_mini_isi_20pcs.png',
            'PRD-008' => 'products/prd_008_fiesta_nugget_ayam_250gr.png',
            'PRD-009' => 'products/prd_009_fiesta_nugget_ayam_500gr.png',
            'PRD-010' => 'products/prd_010_so_good_nugget_ayam_400gr.png',
            'PRD-011' => 'products/prd_011_champ_nugget_ayam_400gr.png',
            'PRD-012' => 'products/prd_012_sajiku_nugget_ikan_250gr.png',
            'PRD-013' => 'products/prd_013_bernardi_chicken_fingers_250gr.png',
            'PRD-025' => 'products/prd_014_crabstick_frozen_250gr.png',
            'PRD-026' => 'products/prd_015_otak_otak_ikan_frozen_10pcs.png',
            'PRD-027' => 'products/prd_016_fish_roll_frozen_250gr.png',
            'PRD-028' => 'products/prd_017_udang_kupas_frozen_300gr.png',
            'PRD-029' => 'products/prd_018_cumi_frozen_300gr.png',
            'PRD-030' => 'products/prd_019_scallop_frozen_200gr.png',
            'PRD-031' => 'products/prd_020_dimsum_ayam_frozen_10pcs.png',
            'PRD-032' => 'products/prd_021_dimsum_udang_frozen_10pcs.png',
            'PRD-033' => 'products/prd_022_siomay_ayam_frozen_10pcs.png',
            'PRD-038' => 'products/prd_023_gyoza_ayam_frozen_10pcs.png',
            'PRD-039' => 'products/prd_024_shumai_udang_frozen_10pcs.png',
            'PRD-014' => 'products/prd_025_bakso_sapi_frozen_50_butir.png',
            'PRD-015' => 'products/prd_026_bakso_sapi_premium_25_butir.png',
            'PRD-016' => 'products/prd_027_bakso_ayam_frozen_50_butir.png',
            'PRD-017' => 'products/prd_028_bakso_ikan_frozen_30_butir.png',
            'PRD-018' => 'products/prd_029_baso_aci_sapi_frozen_300gr.png',
            'PRD-040' => 'products/prd_030_tahu_bakso_frozen_10pcs.png',
            'PRD-034' => 'products/prd_031_bakpao_isi_ayam_frozen_5pcs.png',
            'PRD-035' => 'products/prd_032_bakpao_isi_coklat_frozen_5pcs.png',
            'PRD-036' => 'products/prd_033_lumpia_sayur_frozen_10pcs.png',
            'PRD-037' => 'products/prd_034_pangsit_goreng_frozen_20pcs.png',
            'PRD-041' => 'products/prd_035_nasi_bento_chicken_katsu.png',
            'PRD-020' => 'products/prd_036_kentang_goreng_crinkle_1kg.png',
            'PRD-021' => 'products/prd_037_kentang_goreng_stick_1kg.png',
            'PRD-022' => 'products/prd_038_tambora_kentang_wedges_1kg.png',
            'PRD-019' => 'products/prd_039_cimol_frozen_500gr.png',
            'PRD-023' => 'products/prd_040_sayur_mix_frozen_500gr.png',
            'PRD-024' => 'products/prd_041_edamame_frozen_500gr.png',
            'PRD-042' => 'products/prd_042_risol_mayo_frozen_10pcs.png',
            'PRD-043' => 'products/prd_043_bumbu_kuah_bakso_mamasuka_100g.png',
            'PRD-044' => 'products/prd_044_bumbu_tabur_balado_antaka_100g.png',
            'PRD-045' => 'products/prd_045_bumbu_racik_ayam_goreng_indofo.png',
            'PRD-046' => 'products/prd_046_es_krim_walls_feast_cokelat_65.png',
            'PRD-047' => 'products/prd_047_es_krim_aice_mochi_vanilla_45g.png',
            'PRD-048' => 'products/prd_048_es_krim_campina_hula_hula_kaca.png',
            'PRD-049' => 'products/prd_049_keju_mozzarella_parut_kraft_16.png',
            'PRD-050' => 'products/prd_050_mayonaise_mamasuka_pouch_480g.png',
            'PRD-051' => 'products/prd_051_nori_rumput_laut_tabur_30g.png',
            'PRD-052' => 'products/prd_052_tusuk_sate_bakso_kayu_200g.png',
            'PRD-053' => 'products/prd_053_thinwall_box_makanan_500ml_10p.png',
            'PRD-054' => 'products/prd_054_kantong_plastik_ziplock_isi_20.png',
            'PRD-055' => 'products/prd_055_teh_pucuk_harum_botol_350ml.png',
            'PRD-056' => 'products/prd_056_ultra_milk_susu_uht_cokelat_25.png',
            'PRD-057' => 'products/prd_057_milk_tea_boba_frozen_250ml.png',
            'PRD-058' => 'products/prd_058_saos_sambal_extra_pedas_del_mo.png',
            'PRD-059' => 'products/prd_059_saos_tomat_abc_botol_335ml.png',
            'PRD-060' => 'products/prd_060_saos_tiram_saori_botol_133ml.png',
            'PRD-061' => 'products/prd_061_mainan_figur_mini_superhero.png',
            'PRD-062' => 'products/prd_062_mainan_gelembung_sabun_bubble_.png',
            'PRD-063' => 'products/prd_063_mainan_puzzle_edukasi_kayu_ana.png',
            'PRD-EX-001' => 'products/prd_064_99_kulit_pangsit.png',
            'PRD-EX-002' => 'products/prd_065_abon_ayam_karwati_ori_250gr.png',
            'PRD-EX-003' => 'products/prd_066_abon_ayam_karwati_pedas_250gr.png',
            'PRD-EX-004' => 'products/prd_067_adabi_sos_korea.png',
            'PRD-EX-005' => 'products/prd_068_adabi_tomyam.png',
            'PRD-EX-006' => 'products/prd_069_aice_8_liter_ember.png',
            'PRD-EX-007' => 'products/prd_070_akumo_nugget_250gr.png',
            'PRD-EX-008' => 'products/prd_071_alfa_one.png',
            'PRD-EX-009' => 'products/prd_072_allana_daging_kerbau_1kg.png',
            'PRD-EX-010' => 'products/prd_073_amroon_1_kg.png',
            'PRD-EX-011' => 'products/prd_074_asimo_nugget_250gr.png',
            'PRD-EX-012' => 'products/prd_075_ayam_ungkep_1_kg.png',
            'PRD-EX-013' => 'products/prd_076_ayam_ungkep_500_gr.png',
            'PRD-EX-014' => 'products/prd_077_b19_bakso_ayam_200gr.png',
            'PRD-EX-015' => 'products/prd_078_b19_bakso_basreng.png',
            'PRD-EX-016' => 'products/prd_079_b19_bakso_ikan_250gr.png',
            'PRD-EX-017' => 'products/prd_080_bakpow_karakter.png',
            'PRD-EX-018' => 'products/prd_081_bakso_basreng_rb.png',
            'PRD-EX-019' => 'products/prd_082_bakso_bms_isi_25.png',
            'PRD-EX-020' => 'products/prd_083_bakso_bul_bul_hijau.png',
            'PRD-EX-021' => 'products/prd_084_bakso_bul_bul_kuning.png',
            'PRD-EX-022' => 'products/prd_085_bakso_bul_bul_merah.png',
            'PRD-EX-023' => 'products/prd_086_bakso_bul_bul_ungu.png',
            'PRD-EX-024' => 'products/prd_087_bakso_iman_sa.png',
            'PRD-EX-025' => 'products/prd_088_bakso_iman_sapi.png',
            'PRD-EX-026' => 'products/prd_089_bakso_jawara_isi_100.png',
            'PRD-EX-027' => 'products/prd_090_bakso_kahiji.png',
            'PRD-EX-028' => 'products/prd_091_bakso_mekar_sari_kembang_jer.png',
            'PRD-EX-029' => 'products/prd_092_bakso_sedap_daging_cincang.png',
            'PRD-EX-030' => 'products/prd_093_bakso_sedap_sari_keju.png',
            'PRD-EX-031' => 'products/prd_094_bakso_sumber_selera_origina.png',
            'PRD-EX-032' => 'products/prd_095_bakso_tusuk_kirana.png',
            'PRD-EX-033' => 'products/prd_096_bartoz_nugget_500gr.png',
            'PRD-EX-034' => 'products/prd_097_basreng_umkm_all_varian_250.png',
            'PRD-EX-035' => 'products/prd_098_bawang_goreng_toples_kecil.png',
            'PRD-EX-036' => 'products/prd_099_be_best_daging_kerbau_1kg.png',
            'PRD-EX-037' => 'products/prd_100_bebek_1_3_kg.png',
            'PRD-EX-038' => 'products/prd_101_bebek_frozen_1_8_kg.png',
            'PRD-EX-039' => 'products/prd_102_bebek_peking_1_kg.png',
            'PRD-EX-040' => 'products/prd_103_bebek_peking_2_1_kg.png',
            'PRD-EX-041' => 'products/prd_104_belfood_chicken_nugget_ayam.png',
            'PRD-EX-042' => 'products/prd_105_belfood_kentang_175gr.png',
            'PRD-EX-043' => 'products/prd_106_belfood_nugget_ceria_170gr.png',
            'PRD-EX-044' => 'products/prd_107_belfood_nugget_ceria_500gr.png',
            'PRD-EX-045' => 'products/prd_108_belfood_nugget_sp_170gr.png',
            'PRD-EX-046' => 'products/prd_109_belfood_nugget_stik_170gr.png',
            'PRD-EX-047' => 'products/prd_110_belfood_royal_nugget_200g.png',
            'PRD-EX-048' => 'products/prd_111_belfood_sosis_ayam_200gr.png',
            'PRD-EX-049' => 'products/prd_112_belfoods_bakso_ayam_100_gr.png',
            'PRD-EX-050' => 'products/prd_113_belfoods_favorite_nugget_50.png',
            'PRD-EX-051' => 'products/prd_114_belfoods_favorite_sosis_aya.png',
            'PRD-EX-052' => 'products/prd_115_belfoods_favotite_sosis_sap.png',
            'PRD-EX-053' => 'products/prd_116_belfoods_nugget_safari_450g.png',
            'PRD-EX-054' => 'products/prd_117_belfoods_royal_cheesy_bite.png',
            'PRD-EX-055' => 'products/prd_118_belfoods_sosis_ayam_500_gr.png',
            'PRD-EX-056' => 'products/prd_119_belfoods_sosis_sapi_500_gr.png',
            'PRD-EX-057' => 'products/prd_120_belfoods_sosis_sapi_bakar_5.png',
            'PRD-EX-058' => 'products/prd_121_belfoods_sosis_sapi_goreng_.png',
            'PRD-EX-059' => 'products/prd_122_belfoods_uenaak_nugget_250g.png',
            'PRD-EX-060' => 'products/prd_123_belfoods_uenak_sosis_ayam_3.png',
            'PRD-EX-061' => 'products/prd_124_belfoods_uenak_sosis_sapi_3.png',
            'PRD-EX-062' => 'products/prd_125_bento_series_frozen.png',
            'PRD-EX-063' => 'products/prd_126_bernardi_bakso_sapi_kecil_5.png',
            'PRD-EX-064' => 'products/prd_127_bernardi_sosis_sapi_500g.png',
            'PRD-EX-065' => 'products/prd_128_bernardi_sosis_sapi_goreng_.png',
            'PRD-EX-066' => 'products/prd_129_bila_sosis_ayam_500gr.png',
            'PRD-EX-067' => 'products/prd_130_bobo_bakso_ikan_500gr.png',
            'PRD-EX-068' => 'products/prd_131_bobo_fish_cake_250g.png',
            'PRD-EX-069' => 'products/prd_132_bobo_otak_otak_singapore_50.png',
            'PRD-EX-070' => 'products/prd_133_bobo_sosis_ikan_500gr.png',
            'PRD-EX-071' => 'products/prd_134_bravos_nugget_500gr.png',
            'PRD-EX-072' => 'products/prd_135_bua_nugget_ayam_500g.png',
            'PRD-EX-073' => 'products/prd_136_bumbu_bakso_sony.png',
            'PRD-EX-074' => 'products/prd_137_bumbu_dapur_all_varian.png',
            'PRD-EX-075' => 'products/prd_138_burger_gagang.png',
            'PRD-EX-076' => 'products/prd_139_cedea_bagel_cheese_200g.png',
            'PRD-EX-077' => 'products/prd_140_cedea_bakso_ikan_500gr.png',
            'PRD-EX-078' => 'products/prd_141_cedea_bakso_ikan_goreng_50.png',
            'PRD-EX-079' => 'products/prd_142_cedea_bakso_salmon_500gr.png',
            'PRD-EX-080' => 'products/prd_143_cedea_chikuwa_long_1kg.png',
            'PRD-EX-081' => 'products/prd_144_bakso_bahari_ikan_ayam.png',
            'PRD-EX-082' => 'products/prd_145_bakso_ikan_sinar_bahari_isi_10.png',
            'PRD-EX-083' => 'products/prd_146_bakso_sumber_selera_keju.png',
            'PRD-EX-084' => 'products/prd_147_barcelona_1_kg.png',
            'PRD-EX-085' => 'products/prd_148_barcelona_100_g.png',
            'PRD-EX-086' => 'products/prd_149_barcelona_250_g.png',
            'PRD-EX-087' => 'products/prd_150_barcelona_50_g.png',
            'PRD-EX-088' => 'products/prd_151_barcelona_500_g.png',
            'PRD-EX-089' => 'products/prd_152_basreng_50_g.png',
            'PRD-EX-090' => 'products/prd_153_basreng_origina_1_kg.png',
            'PRD-EX-091' => 'products/prd_154_basreng_origina_100_g.png',
            'PRD-EX-092' => 'products/prd_155_basreng_origina_250_g.png',
            'PRD-EX-093' => 'products/prd_156_basreng_origina_50_g.png',
            'PRD-EX-094' => 'products/prd_157_basreng_origina_500_g.png',
            'PRD-EX-095' => 'products/prd_158_basreng_toples_500_gr.png',
            'PRD-EX-096' => 'products/prd_159_basreng_toples_1_kg.png',
            'PRD-EX-097' => 'products/prd_160_basreng_toples_250_gr.png',
            'PRD-EX-098' => 'products/prd_161_bika_ambon.png',
            'PRD-EX-099' => 'products/prd_162_bolu_bandung.png',
            'PRD-EX-100' => 'products/prd_163_bon_cabe_lv_15_botol.png',
            'PRD-EX-101' => 'products/prd_164_bon_cabe_lv_30.png',
            'PRD-EX-102' => 'products/prd_165_bon_cabe_lv_30_sachet_4_5_g.png',
            'PRD-EX-103' => 'products/prd_166_bon_cabe_lv_50_maxed_sachet_2_.png',
            'PRD-EX-104' => 'products/prd_167_bumbu_pecel_sinti_100gr.png',
            'PRD-EX-105' => 'products/prd_168_cabe_kering_250gr.png',
            'PRD-EX-106' => 'products/prd_169_astor_all_varian.png',
            'PRD-EX-107' => 'products/prd_170_astor_all_varian_250_gr.png',
            'PRD-EX-108' => 'products/prd_171_bola_pelangi.png',
            'PRD-EX-109' => 'products/prd_172_dodol_kertas_eka_sari_1_kg.png',
            'PRD-EX-110' => 'products/prd_173_dodol_kertas_ekasari_250_gr.png',
            'PRD-EX-111' => 'products/prd_174_dodol_kertas_eksari_500_gr.png',
            'PRD-EX-112' => 'products/prd_175_dodol_warna.png',
            'PRD-EX-113' => 'products/prd_176_gem_kembang_ball.png',
            'PRD-EX-114' => 'products/prd_177_jeli_inaco_1_kg.png',
            'PRD-EX-115' => 'products/prd_178_jeli_inaco_500_gr.png',
            'PRD-EX-116' => 'products/prd_179_hasan_isi_6.png',
            'PRD-EX-117' => 'products/prd_180_hasanah_isi_6.png',
            'PRD-EX-118' => 'products/prd_181_jeli_bit_1_kg.png',
            'PRD-EX-119' => 'products/prd_182_jeli_bit_500_gr.png',
            'PRD-EX-120' => 'products/prd_183_kacang_atom_100_gr.png',
            'PRD-EX-121' => 'products/prd_184_aice_2_colors.png',
            'PRD-EX-122' => 'products/prd_185_aice_chocolate_crispy.png',
            'PRD-EX-123' => 'products/prd_186_aice_cofee_crispy.png',
            'PRD-EX-124' => 'products/prd_187_aice_ember_5_liter.png',
            'PRD-EX-125' => 'products/prd_188_aice_ember_8_liter.png',
            'PRD-EX-126' => 'products/prd_189_cimory_bites_120_ml.png',
            'PRD-EX-127' => 'products/prd_190_cimory_eatmilk.png',
            'PRD-EX-128' => 'products/prd_191_cimory_pororo_325_ml.png',
            'PRD-EX-129' => 'products/prd_192_cimory_squeze.png',
            'PRD-EX-130' => 'products/prd_193_cimory_uht_125_ml.png',
            'PRD-EX-131' => 'products/prd_194_bakso_mozzarella.png',
            'PRD-EX-132' => 'products/prd_195_bakso_pentol_kecil.png',
            'PRD-EX-133' => 'products/prd_196_bakso_rusuk.png',
            'PRD-EX-134' => 'products/prd_197_bakso_rusuk_biasa.png',
            'PRD-EX-135' => 'products/prd_198_bakso_rusuk_jumbo.png',
            'PRD-EX-136' => 'products/prd_199_bakso_bul.png',
            'PRD-EX-137' => 'products/prd_200_bintang.png',
            'PRD-EX-138' => 'products/prd_201_bola_salmon.png',
            'PRD-EX-139' => 'products/prd_202_chikua.png',
            'PRD-EX-140' => 'products/prd_203_duo_flowers.png',
            'PRD-EX-141' => 'products/prd_204_adabi_rempah_sup_tulang_13_gr.png',
            'PRD-EX-142' => 'products/prd_205_asam_jawa.png',
            'PRD-EX-143' => 'products/prd_206_biji_pala_37_gr.png',
            'PRD-EX-144' => 'products/prd_207_del_monte_bbq_250_gr.png',
            'PRD-EX-145' => 'products/prd_208_del_monte_extra_hot_sachet_8_g.png',
            'PRD-EX-146' => 'products/prd_209_dua_belibis_saos_cabe_1_kg.png',
            'PRD-EX-147' => 'products/prd_210_156_mobil_tumbling.png',
            'PRD-EX-148' => 'products/prd_211_627_8_paw_patrol.png',
            'PRD-EX-149' => 'products/prd_212_6602b_boneka_padat.png',
            'PRD-EX-150' => 'products/prd_213_99_818_pistol_rambo.png',
            'PRD-0214' => 'products/prd_214_bumbu_rendang.png',
            'PRD-0215' => 'products/prd_215_bumbu_opor.png',
        ];

        $created = 0;
        foreach ($products as $p) {
            $img = isset($imgMap[$p['kode']]) ? $imgMap[$p['kode']] : null;
            $existing = Produk::where('kode_produk', $p['kode'])->orWhere('nama', $p['nama'])->first();
            if ($existing) {
                if ($img) {
                    $existing->update(['gambar' => $img]);
                }
                continue;
            }

            Produk::create([
                'kategori_id'        => $cats[$p['kat']]->id,
                'kode_produk'        => $p['kode'],
                'nama'               => $p['nama'],
                'deskripsi'          => $p['desk'],
                'harga'              => $p['harga'],
                'stok'               => $p['stok'],
                'stok_minimum'       => $p['min'],
                'satuan'             => $p['sat'],
                'tanggal_kadaluarsa' => $p['exp'],
                'gambar'             => $img,
                'status'             => 'active',
            ]);
            $created++;
        }

        $this->command->info("✅ {$created} produk baru (12 kategori) berhasil di-seed.");
    }

    // =========================================================================
    // B. SEED PENJUALAN HISTORIS (1 Jan – 30 Apr 2026)
    // =========================================================================
    private function seedSalesHistory(): void
    {
        $admin     = User::where('peran', 'admin')->first();
        $pelanggan = User::where('peran', 'pelanggan')->first();

        if (!$admin || !$pelanggan) {
            $this->command->warn('⚠️  Lewati seeder penjualan: pengguna tidak ditemukan.');
            return;
        }

        $produkMap = Produk::all()->keyBy('kode_produk');

        // 58 transaksi historis [tanggal, [[kode,qty],...], metode_bayar, metode_kirim]
        $transactions = [
            // Januari
            ['2026-01-03',[['PRD-001',2],['PRD-008',1]],'transfer','antar_alamat'],
            ['2026-01-05',[['PRD-014',3],['PRD-020',2]],'qris','antar_alamat'],
            ['2026-01-07',[['PRD-003',2],['PRD-031',2]],'transfer','ambil_toko'],
            ['2026-01-09',[['PRD-002',1],['PRD-025',2]],'transfer','antar_alamat'],
            ['2026-01-11',[['PRD-009',1],['PRD-021',1]],'cod','antar_alamat'],
            ['2026-01-13',[['PRD-008',2],['PRD-033',2]],'transfer','antar_alamat'],
            ['2026-01-15',[['PRD-001',3],['PRD-015',2]],'qris','antar_alamat'],
            ['2026-01-17',[['PRD-005',1],['PRD-034',3]],'transfer','ambil_toko'],
            ['2026-01-20',[['PRD-010',1],['PRD-026',2]],'transfer','antar_alamat'],
            ['2026-01-22',[['PRD-001',2],['PRD-020',3]],'qris','antar_alamat'],
            ['2026-01-24',[['PRD-007',4],['PRD-036',3]],'cod','antar_alamat'],
            ['2026-01-26',[['PRD-008',1],['PRD-022',2]],'transfer','antar_alamat'],
            ['2026-01-28',[['PRD-003',2],['PRD-014',2]],'transfer','ambil_toko'],
            ['2026-01-30',[['PRD-011',1],['PRD-031',1]],'qris','antar_alamat'],
            // Februari
            ['2026-02-02',[['PRD-001',2],['PRD-028',1]],'transfer','antar_alamat'],
            ['2026-02-04',[['PRD-009',2],['PRD-020',2]],'qris','antar_alamat'],
            ['2026-02-06',[['PRD-004',1],['PRD-032',2]],'transfer','ambil_toko'],
            ['2026-02-08',[['PRD-008',3],['PRD-026',1]],'transfer','antar_alamat'],
            ['2026-02-10',[['PRD-001',1],['PRD-033',2]],'cod','antar_alamat'],
            ['2026-02-12',[['PRD-016',2],['PRD-021',2]],'transfer','antar_alamat'],
            ['2026-02-14',[['PRD-002',2],['PRD-034',2]],'qris','antar_alamat'],
            ['2026-02-15',[['PRD-008',1],['PRD-035',3]],'transfer','ambil_toko'],
            ['2026-02-17',[['PRD-003',2],['PRD-038',1]],'transfer','antar_alamat'],
            ['2026-02-19',[['PRD-010',1],['PRD-022',1]],'transfer','antar_alamat'],
            ['2026-02-21',[['PRD-001',3],['PRD-025',2]],'qris','antar_alamat'],
            ['2026-02-23',[['PRD-014',2],['PRD-036',2]],'transfer','ambil_toko'],
            ['2026-02-25',[['PRD-007',3],['PRD-031',2]],'cod','antar_alamat'],
            ['2026-02-27',[['PRD-008',2],['PRD-029',1]],'transfer','antar_alamat'],
            // Maret
            ['2026-03-02',[['PRD-001',2],['PRD-040',4]],'transfer','antar_alamat'],
            ['2026-03-04',[['PRD-009',1],['PRD-021',2]],'qris','antar_alamat'],
            ['2026-03-06',[['PRD-005',2],['PRD-026',2]],'transfer','ambil_toko'],
            ['2026-03-08',[['PRD-008',2],['PRD-033',1]],'transfer','antar_alamat'],
            ['2026-03-10',[['PRD-004',1],['PRD-032',1]],'cod','antar_alamat'],
            ['2026-03-12',[['PRD-001',3],['PRD-020',2]],'qris','antar_alamat'],
            ['2026-03-14',[['PRD-016',1],['PRD-034',3]],'transfer','antar_alamat'],
            ['2026-03-16',[['PRD-003',2],['PRD-037',4]],'transfer','ambil_toko'],
            ['2026-03-18',[['PRD-010',2],['PRD-025',1]],'transfer','antar_alamat'],
            ['2026-03-20',[['PRD-002',1],['PRD-031',2]],'qris','antar_alamat'],
            ['2026-03-22',[['PRD-008',3],['PRD-022',1]],'transfer','antar_alamat'],
            ['2026-03-24',[['PRD-014',2],['PRD-036',3]],'cod','ambil_toko'],
            ['2026-03-26',[['PRD-001',2],['PRD-029',1]],'transfer','antar_alamat'],
            ['2026-03-28',[['PRD-007',3],['PRD-040',5]],'qris','antar_alamat'],
            ['2026-03-30',[['PRD-009',1],['PRD-028',1]],'transfer','antar_alamat'],
            // April
            ['2026-04-01',[['PRD-001',2],['PRD-023',2]],'transfer','antar_alamat'],
            ['2026-04-03',[['PRD-008',1],['PRD-036',3]],'qris','antar_alamat'],
            ['2026-04-05',[['PRD-003',2],['PRD-031',2]],'transfer','ambil_toko'],
            ['2026-04-07',[['PRD-011',1],['PRD-020',2]],'transfer','antar_alamat'],
            ['2026-04-09',[['PRD-004',1],['PRD-034',3]],'cod','antar_alamat'],
            ['2026-04-11',[['PRD-001',3],['PRD-026',2]],'qris','antar_alamat'],
            ['2026-04-13',[['PRD-009',2],['PRD-033',1]],'transfer','antar_alamat'],
            ['2026-04-15',[['PRD-002',2],['PRD-040',4]],'transfer','ambil_toko'],
            ['2026-04-17',[['PRD-005',1],['PRD-025',2]],'transfer','antar_alamat'],
            ['2026-04-19',[['PRD-008',2],['PRD-021',1]],'qris','antar_alamat'],
            ['2026-04-21',[['PRD-016',2],['PRD-037',3]],'transfer','antar_alamat'],
            ['2026-04-23',[['PRD-014',1],['PRD-032',2]],'cod','ambil_toko'],
            ['2026-04-25',[['PRD-001',2],['PRD-022',2]],'transfer','antar_alamat'],
            ['2026-04-27',[['PRD-007',4],['PRD-031',2]],'qris','antar_alamat'],
            ['2026-04-29',[['PRD-003',2],['PRD-038',1]],'transfer','antar_alamat'],
        ];

        $orderCount = 0;
        foreach ($transactions as [$tgl, $items, $metodeBayar, $metodeKirim]) {
            $orderDate = Carbon::parse($tgl);
            $details   = [];
            $subtotal  = 0;

            foreach ($items as [$kode, $qty]) {
                if (!isset($produkMap[$kode])) continue;
                $produk      = $produkMap[$kode];
                $hargaSatuan = (float) $produk->harga;
                $subtotal   += $hargaSatuan * $qty;
                $details[]   = compact('produk', 'qty', 'hargaSatuan');
            }
            if (empty($details)) continue;

            $ongkir = ($metodeKirim === 'antar_alamat') ? 5000 : 0;
            $total  = $subtotal + $ongkir;
            $alamat = ($metodeKirim === 'ambil_toko')
                ? 'Ambil di Toko – Jl. Pandawa, depan Polsek Tanjung Enim'
                : 'Jl. Pandawa, Tanjung Enim';

            $pesanan = Pesanan::create([
                'pengguna_id'       => $pelanggan->id,
                'cabang_toko_id'    => null,
                'kode_pesanan'      => 'ORD-' . $orderDate->format('ymd') . '-' . str_pad($orderCount + 1, 3, '0', STR_PAD_LEFT),
                'tanggal_pesanan'   => $orderDate->toDateString(),
                'total_harga'       => $total,
                'ongkos_kirim'      => $ongkir,
                'jarak_pengiriman'  => $metodeKirim === 'antar_alamat' ? 2.5 : 0,
                'metode_pembayaran' => $metodeBayar,
                'metode_pengiriman' => $metodeKirim,
                'alamat_pengiriman' => $alamat,
                'status_pesanan'    => 'Selesai',
                'status_pembayaran' => 'lunas',
                'created_at'        => $orderDate,
                'updated_at'        => $orderDate->copy()->addHours(2),
            ]);

            foreach ($details as $d) {
                DetailPesanan::create([
                    'pesanan_id'  => $pesanan->id,
                    'produk_id'   => $d['produk']->id,
                    'nama_produk' => $d['produk']->nama,
                    'harga'       => $d['hargaSatuan'],
                    'jumlah'      => $d['qty'],
                    'subtotal'    => $d['hargaSatuan'] * $d['qty'],
                ]);
            }

            Pembayaran::create([
                'pesanan_id'        => $pesanan->id,
                'metode_pembayaran' => $metodeBayar,
                'bukti_pembayaran'  => null,
                'status_pembayaran' => 'approved',
                'dikonfirmasi_oleh' => $admin->id,
                'dikonfirmasi_pada' => $orderDate->copy()->addHour(),
                'created_at'        => $orderDate->copy()->addMinutes(30),
                'updated_at'        => $orderDate->copy()->addHour(),
            ]);

            $orderCount++;
        }

        $this->command->info("✅ {$orderCount} data penjualan historis (Jan–Apr 2026) berhasil di-seed.");
    }
}
