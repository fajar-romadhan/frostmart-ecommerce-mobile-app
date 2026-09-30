# Design Spec: Admin Order Printing & In-App Customer Chat

## 1. Overview
To optimize store operations for Della Frozen Mart, two key features are added:
1. **Order Printing (Struk/Receipt Printer)**: Allows Admin to print thermal receipt layouts (58mm/80mm) directly from Mobile Admin App (via `expo-print` to Bluetooth/Wi-Fi printer or PDF) and Web Admin Dashboard (`invoice.blade.php`).
2. **In-App Order Chat System**: Provides a direct in-app communication channel between Admin and Customer on each order. Includes **Quick Preset Buttons** for Admin to immediately alert customers if a product is out-of-stock, being packed, or dispatched.

---

## 2. Feature Details & Architecture

### 2.1 Feature 1: Order Printing (`expo-print` & Web Print)
- **Mobile Admin (`AdminOrderScreen.js`)**:
  - Install `expo-print` package in `mobile_app`.
  - Add **`🖨️ Cetak Struk Kasir`** button inside order detail modal.
  - Generate clean HTML receipt formatted for thermal printers (58mm width layout, clear monospace styling, order code, customer name, delivery address, items table, subtotal, shipping fee, total amount, and payment status `LUNAS`).
- **Web Admin (`admin.orders.invoice`)**:
  - Enhance `resources/views/admin/orders/invoice.blade.php` to include complete order metadata, customer phone, delivery method, courier info, and auto-trigger `window.print()`.

### 2.2 Feature 2: In-App Order Chat System

#### Database Schema (Laravel Backend)
- Table `pesan_chat`:
  - `id` (bigIncrements)
  - `pesanan_id` (foreign key to `pesanan`, onDelete cascade)
  - `pengirim_id` (foreign key to `pengguna`, onDelete cascade)
  - `penerima_id` (foreign key to `pengguna`, onDelete cascade)
  - `pesan` (text)
  - `is_read` (boolean, default false)
  - `timestamps`

#### API Endpoints (`routes/api.php` & `ChatController.php`)
- `GET /api/orders/{orderId}/chats`: Fetch message history for order (ordered by `created_at` ASC).
- `POST /api/orders/{orderId}/chats`: Send new message (`pesan` string required).

#### Mobile App UI & Flow
- **Order Chat Screen (`OrderChatScreen.js`)**:
  - Chat bubble UI: customer messages on right (primary color), admin messages on left (background/gray).
  - Admin **Quick Preset Buttons** at the top of input bar:
    - 🔴 **Stok Kosong**: `"Halo Kak, mohon maaf produk [Nama Produk] sedang kosong di toko fisik kami. Apakah berkenan diganti produk lain?"`
    - 📦 **Diproses**: `"Pesanan Kakak sedang kami kemas."`
    - 🚚 **Pengiriman**: `"Kurir toko kami sudah berangkat mengantar pesanan Kakak."`
  - Polling interval (3s) to fetch new messages automatically.
- **Navigation Integration**:
  - Customer: Add **`💬 Chat Admin Toko`** button in `OrderDetailScreen.js`.
  - Admin: Add **`💬 Chat Pelanggan`** button in `AdminOrderScreen.js`.

---

## 3. Verification Plan
- **Automated Tests**:
  - Create feature test `ChatApiTest.php` in Laravel to verify sending & retrieving order chat messages between Customer and Admin.
  - Run `php artisan test` to ensure 0 regressions across existing suites.
- **Manual Verification**:
  - Test print modal generation with `expo-print`.
  - Test sending messages from Admin to Customer and vice versa in mobile app.
