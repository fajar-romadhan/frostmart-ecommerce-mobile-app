# Design Spec: User Multiple Addresses (Shopee-style)

This spec outlines the design changes required to support multiple delivery addresses per user account, with management interfaces in the mobile app, and database integration in the backend API.

---

## 1. Backend Integration (Laravel)

### A. Database Schema
Create a new migration for table `alamat_pengguna` (user_addresses).

* **Migration File:** `database/migrations/2026_07_19_000000_create_alamat_pengguna_table.php`
* **Schema Definition:**
  ```php
  Schema::create('alamat_pengguna', function (Blueprint $table) {
      $table->id();
      $table->foreignId('pengguna_id')->constrained('pengguna')->onDelete('cascade');
      $table->string('label'); // e.g. 'Rumah', 'Kantor'
      $table->string('nama_penerima');
      $table->string('telepon_penerima');
      $table->text('alamat_lengkap');
      $table->boolean('is_utama')->default(false);
      $table->timestamps();
  });
  ```

### B. UserAddress Model
* **Model File:** `app/Models/AlamatPengguna.php`
* **Attributes:** `pengguna_id`, `label`, `nama_penerima`, `telepon_penerima`, `alamat_lengkap`, `is_utama`
* **Relationships:** Belongs to `User` (represented as `pengguna` relation).

### C. Address Controller
* **Controller File:** `app/Http/Controllers/Api/AddressController.php`
* **Actions:**
  - `index`: List all addresses of the authenticated user.
  - `store`: Create a new address. If marked as `is_utama`, update other user addresses to `is_utama = 0` inside a transaction.
  - `update`: Update an address. Adjust `is_utama` similarly inside a transaction.
  - `destroy`: Delete an address.
  - `setDefault`: Quick toggle to set an address as the default primary address.

### D. API Routes
* **File:** `routes/api.php`
* **Routes:**
  ```php
  Route::middleware('auth:sanctum')->group(function () {
      Route::apiResource('addresses', AddressController::class);
      Route::put('addresses/{address}/set-default', [AddressController::class, 'setDefault']);
  });
  ```

---

## 2. Frontend Integration (React Native / Expo)

### A. API Helper Methods
* **File:** `src/core/api.js`
* **Endpoints Mapping:**
  - `getAddresses()` -> `GET /addresses`
  - `createAddress(data)` -> `POST /addresses`
  - `updateAddress(id, data)` -> `PUT /addresses/${id}`
  - `deleteAddress(id)` -> `DELETE /addresses/${id}`
  - `setAddressDefault(id)` -> `PUT /addresses/${id}/set-default`

### B. Address List Screen
* **File:** `src/screens/address/AddressListScreen.js` [NEW]
* **Features:**
  - Displays a clean bento-styled card layout of saved addresses.
  - Highlights the main address with a Sunset Coral `[Utama]` badge.
  - Displays a label badge (e.g. `[Rumah]`) in steel blue.
  - Edit and Delete icon buttons.
  - Click to select and return to Checkout (when opened in selection mode).
  - Floating button at the bottom: `+ Tambah Alamat Baru`.

### C. Add/Edit Address Screen
* **File:** `src/screens/address/AddressFormScreen.js` [NEW]
* **Features:**
  - Form fields: Nama Penerima, No Telepon, Alamat Lengkap, Label Alamat (segmented control buttons: Rumah / Kantor / Lainnya), and a Switch toggle for "Jadikan Alamat Utama".
  - Connects to backend API.

### D. Checkout Screen Integration
* **File:** `src/screens/checkout/CheckoutScreen.js`
* **Changes:**
  - Tap on the Address section navigates to `AddressListScreen` with `selectMode: true`.
  - Displays the selected address dynamically.
  - On checkout action, passes the selected address text (concatenated with notes) to the API.

---

## 3. Verification Plan

### Automated Tests
* Create `tests/Feature/AddressCrudTest.php` on the backend testing user CRUD operations and transaction safety for default flags.

### Manual Verification
1. Open Profile -> Address management. Add multiple addresses.
2. Toggle one as the default. Check that it becomes `[Utama]` and others lose the tag.
3. Open Cart -> Checkout. Confirm default address is displayed.
4. Tap the address card -> select another address from the list. Verify that the checkout screen displays the newly selected address.
5. Place the order, and verify the checkout goes through successfully.
