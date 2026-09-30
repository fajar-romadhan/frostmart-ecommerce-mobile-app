# Design Spec: 150 Sample Products Seeding from PRODUK.xlsx

## 1. Overview
To allow the user to analyze and learn the product data pattern in the Della Frozen Mart E-Commerce application, this spec defines the automated extraction and database seeding of **150 sample products** from `PRODUK.xlsx`. The dataset emphasizes **Frozen Food** while keeping non-food categories like **Mainan Anak** strictly minimal.

---

## 2. Product Category Distribution (150 Total Products)

| Category Name | Target Count | Description / Items Included |
| :--- | :---: | :--- |
| **Frozen Food** | **80 products** | Core focus: sausages, nuggets, dimsum, seafood, frozen meat |
| **Makanan** | **25 products** | Prepared & ready-to-heat foods |
| **Cemilan & Cemilan Toples** | **15 products** | Dry snacks, packaged jars, chips |
| **Menu Bakso & Pertopingan** | **10 products** | Meatballs, cheese, mayonnaise, nori toppings |
| **Minuman & Es Krim** | **10 products** | Aice ice cream & packaged cold beverages |
| **Bumbu & Saos** | **6 products** | Instant seasonings, chili/tomato sauces |
| **Mainan Anak** | **4 products** | Restricted to 4 items as requested |
| **Total** | **150 products** | |

---

## 3. Data Mapping & Schema Constraints
Each sampled product record from `PRODUK.xlsx` maps to the `produk` (Product) database model:
- `kode_produk`: Generated code `PRD-EX-001` through `PRD-EX-150`
- `nama`: Product name extracted directly from `PRODUK.xlsx`
- `kategori_id`: Foreign key mapped to the matching `kategori` (Category) record
- `harga`: Sample market price (range Rp 10.000 to Rp 65.000)
- `stok`: Available stock (range 30 to 80 pcs)
- `stok_minimal`: Minimum stock threshold (10 pcs)
- `satuan`: `Pcs` / `Pack` / `Toples`
- `deskripsi`: Descriptive text generated from name and category

---

## 4. Implementation Strategy
- **Script/Seeder**: Create `Import150ProdukSeeder.php` in `backend_api/database/seeders/` or execute via Artisan command.
- **Data Integrity**: Map categories to the 12 established category definitions using `Kategori::firstOrCreate()`.
- **Idempotency**: Use `Produk::firstOrCreate(['nama' => ...])` to ensure re-running the seeder doesn't produce duplicates.
- **Database Reset**: Update `DatabaseSeeder.php` to include `Import150ProdukSeeder` so `php artisan migrate:fresh --seed` populates the 150 products cleanly.

---

## 5. Verification Plan
- **Automated Verification**:
  - Query database: `Product::count()` equals exactly 150 (or 150 newly seeded items).
  - Verify category distribution breakdown via Artisan test / script.
  - Run full test suite `php artisan test` (35+ tests passing).
- **Manual Verification**:
  - Launch `jalankan.bat` / Expo App and verify 150 products appear in Product Catalog with category filter tabs working smoothly.
