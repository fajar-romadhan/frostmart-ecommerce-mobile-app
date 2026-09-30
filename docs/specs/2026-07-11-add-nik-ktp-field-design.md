# Design Spec: Add NIK KTP Field to Registration

This document outlines the changes required to add a NIK KTP field to the registration form in the mobile application (React Native) and backend API (Laravel).

## Overview

Users registering for a new account will be required to input a valid 16-digit Indonesian National ID Number (NIK KTP). This data is essential for user verification and must be unique across all registered customers.

## Requirements

1. **Required Input:** NIK KTP is mandatory during registration.
2. **Format Validation:** NIK KTP must be exactly 16 digits and numeric.
3. **Structural Validation (Offline):**
   - Province code (digits 1-2) must be between `11` and `96`.
   - Date of birth (digits 7-8) must be valid:
     - For males: `01` - `31`
     - For females: `41` - `71`
   - Month of birth (digits 9-10) must be between `01` and `12`.
   - Avoid trivial/repeated sequences (e.g. `1111111111111111`, `1234567890123456` structural check).
4. **Uniqueness:** A NIK KTP can only be registered once. The backend will enforce a unique constraint.

---

## Detailed Components

### 1. Database Schema
A migration will be added to the Laravel backend.

* **File:** `database/migrations/xxxx_xx_xx_xxxxxx_add_nik_to_pengguna_table.php`
* **Column:** `nik`, type `string(16)`, `nullable`, `unique`, placed after `email`.
  * *Note:* We use `nullable` to prevent issues with existing customer records, but enforce `required` at the validation layer for new registrations.

### 2. User Model
* **File:** `app/Models/User.php`
* **Changes:** Expose `'nik' => $this->nik` in the `toArray()` output.

### 3. Backend API Authentication Controller
* **File:** `app/Http/Controllers/Api/AuthController.php`
* **Changes:**
  * Add validation rules to the `register` method for `nik`.
  * Include custom closure validation rule to verify NIK structure (province, month, and day codes).
  * Save the `nik` field during user creation (`User::create`).

### 4. Mobile App Registration Screen
* **File:** `src/screens/auth/RegisterScreen.js`
* **Changes:**
  * Add a new `nik` field to state.
  * Add `CustomInput` component for NIK KTP with numeric keyboard layout, filtering non-numeric inputs, and limiting length to 16 characters.
  * Add validation errors and structural check matching backend validation before dispatching the registration action.

### 5. Mobile App Authentication Context
* **File:** `src/context/AuthContext.js`
* **Changes:** Pass the `nik` payload key to the backend `/register` API call.

---

## Verification Plan

### Manual Verification
1. **Valid NIK Registration:** Try registering with a valid structural NIK. Verify that the account is created and the NIK is stored correctly in the database.
2. **Duplicate NIK:** Try registering again with the same NIK. Verify that the app shows a "NIK KTP sudah terdaftar" error.
3. **Invalid NIK Format:** Try registering with less than 16 digits or using dummy numbers (like `1111111111111111`). Verify that validation fails instantly.
