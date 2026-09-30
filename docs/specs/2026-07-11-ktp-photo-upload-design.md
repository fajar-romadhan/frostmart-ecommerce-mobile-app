# Design Spec: KTP Photo Upload and Verification

This spec outlines the changes required to add a KTP Photo upload field on registration, save it on the backend, auto-verify the status, and display the verification badge in the user profile.

## Overview

To ensure data validity, registering customers must upload an image of their KTP (ID Card) along with their NIK number. The system will automatically mark the user as verified upon successful registration and save the photo.

---

## Requirements

1. **Required Upload:** KTP photo is mandatory during registration.
2. **Accepted Formats:** JPEG, PNG, JPG. Max size 2MB.
3. **Automatic Verification:** Setting the verification status flag to `true` automatically on registration.
4. **UI Badge:** Display a green "KTP Terverifikasi" badge in the Profile Screen when `is_ktp_verified` is true.

---

## Detailed Components

### 1. Database Schema
Create a new migration to add the columns to the `pengguna` table.

* **File:** `database/migrations/xxxx_xx_xx_xxxxxx_add_ktp_fields_to_pengguna_table.php`
* **Columns:**
  - `foto_ktp` (string, nullable)
  - `is_ktp_verified` (boolean, default false)

### 2. User Model
* **File:** `app/Models/User.php`
* **Changes:**
  - Add `foto_ktp` and `is_ktp_verified` handling.
  - Implement accessors/getters for `ktp_photo` (mapping to `foto_ktp` and generating full asset URL) and `is_ktp_verified`.
  - Expose `'ktp_photo'` and `'is_ktp_verified'` in `toArray()`.

### 3. Backend API Authentication Controller
* **File:** `app/Http/Controllers/Api/AuthController.php`
* **Changes:**
  - Update `register` validation rules to require `ktp_photo` as an image file (max 2048 KB).
  - Handle file upload, saving KTP photo to `public/storage/ktp_photos`.
  - Save `foto_ktp` path and set `is_ktp_verified = true` in `User::create()`.

### 4. Mobile API Service Helper
* **File:** `src/core/api.js`
* **Changes:**
  - Add helper `postRegisterMultipart` to support posting text fields and the `ktp_photo` image file as a `FormData` object.

### 5. Mobile App Authentication Context
* **File:** `src/context/AuthContext.js`
* **Changes:**
  - Update `register` method signature to accept `ktpPhoto`.
  - Call `ApiService.postRegisterMultipart('/register', fields, ktpPhoto)` to register.

### 6. Mobile App UI Registration Screen
* **File:** `src/screens/auth/RegisterScreen.js`
* **Changes:**
  - Add state `const [ktpPhoto, setKtpPhoto] = useState(null);`
  - Implement `pickKtpPhoto` method using `expo-image-picker` to trigger image selection from gallery.
  - Add validation: `ktpPhoto` must be selected.
  - Add UI visual element (upload button / placeholder card / image preview) in the JSX scroll view.

### 7. Mobile App Profile Screen
* **File:** `src/screens/profile/ProfileScreen.js`
* **Changes:**
  - Add a checkmark and "KTP Terverifikasi" badge under the user's name inside the gradient profile header.

---

## Verification Plan

### Automated Tests
- Extend `AuthNikValidationTest.php` to include KTP photo upload validation tests using Laravel's `UploadedFile::fake()`.

### Manual Verification
1. Open the Registration screen on the mobile app.
2. Attempt to register without selecting a KTP photo. Confirm validation fails with "Foto KTP wajib diunggah."
3. Select a KTP image using the picker. Check that the preview displays correctly.
4. Complete registration. Verify that the user is logged in, their profile screen displays "KTP Terverifikasi", and the KTP image path is populated correctly in the database.
