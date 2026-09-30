# Design Spec: Admin-Initiated Order Chat & Standby Customer Notification

## 1. Overview
This design spec enforces a strict business rule: Customers cannot initiate a chat with store admins out of nowhere. Instead, the chat feature is activated ONLY when an Admin Toko initiates a chat (e.g. regarding out-of-stock items or order updates).

When no chat has been initiated by the admin, the customer's order detail screen is 100% clean with zero chat buttons or banners. When an admin chat exists, a standby notification banner appears on the order detail screen with an instant reply button.

---

## 2. Targeted Component & Screen Changes

### A. Customer Order Detail (`OrderDetailScreen.js`)
- **Remove Standalone Chat Button**: Completely delete the static "💬 Chat Admin Toko Mengenai Pesanan Ini" button card.
- **Standby Notification Banner**:
  - Fetch recent chat upon screen load and via auto-polling.
  - If a message from Admin/Owner exists, display a permanent standby banner:
    - Text: Last message from Admin Toko.
    - Action Button: `💬 BALAS PESAN ADMIN`.
  - If no admin message exists, render **nothing** (100% clean interface).

### B. Admin Order Screen (`AdminOrderScreen.js`)
- **Admin Chat Initiation**: Admin retains full access to the "💬 Chat Pelanggan" button and preset quick replies (e.g. ⚠️ Stok Kosong) to initiate conversations anytime.

### C. Backend API Safeguard (`ChatController.php`)
- **Authorization Check**: In `sendMessage`, if the logged-in user is a customer (`pelanggan`), verify if at least one message in the order chat thread was sent by an `admin` or `owner`.
- If no admin/owner message exists, reject with HTTP 403 Forbidden: `"Fitur chat hanya dapat aktif setelah Admin Toko memulai percakapan."`

---

## 3. Verification Plan
- **Automated Tests**: Update/Add test cases in `ChatApiTest.php` to verify that a customer cannot send a message before an admin sends one, and succeeds after an admin sends a message.
- **Backend Test Suite**: Run `php artisan test` (35+ tests passing).
- **Manual Verification**: Confirm clean UI on customer order detail screen when no chat exists.
