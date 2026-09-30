# Design Spec: KTP Custom Camera Scanner with KTP Guide Frame and Flash

This document outlines the enhancement to add a selection Modal (Camera/Gallery) on KTP photo upload and build a Custom Camera Scanner screen with a KTP guide box and Flash toggle.

## Overview

To improve KTP image quality, users can choose between importing an existing image from their Gallery or capturing a new photo using a custom Camera View. The custom camera will feature a KTP frame overlay to guide alignment, a Flash toggle for low-light conditions, and a manual capture trigger.

---

## Requirements

1. **Selection Modal:** Tap on KTP upload launches a selection sheet with "Kamera" and "Galeri".
2. **Gallery Import:** Launches the Expo Image Picker gallery selection.
3. **Custom Camera View:**
   - Installs `expo-camera` and uses the modern `CameraView` component.
   - Shows a fullscreen rear camera preview.
   - Displays a KTP-shaped transparent cutout guide box in the center.
   - Includes a Flash toggle (on/off) button.
   - Includes a Close/Back button to return to the form.
   - Includes a circular Capture button at the bottom.

---

## Detailed Components

### 1. Mobile App Dependencies
* **Command:** `npx expo install expo-camera` inside `mobile_app`.
  * *Note:* This guarantees the installation of the compatible version of `expo-camera` matching Expo SDK 54.

### 2. Mobile App UI Registration Screen
* **File:** `src/screens/auth/RegisterScreen.js`
* **Changes:**
  * Import `CameraView` and `useCameraPermissions` from `expo-camera`.
  * Add state variables:
    * `showCamera` (boolean) - toggles the camera UI.
    * `showPickerModal` (boolean) - toggles the modal sheet for selection.
    * `flashMode` (string: `'off'` or `'on'`) - toggles the flash light.
  * Render a Selection Modal:
    * Options: "Ambil Foto" (Camera) and "Pilih Galeri" (Gallery).
  * Render the Fullscreen `CameraView` overlay if `showCamera` is true:
    * Transparent black overlay covering the top and bottom panels.
    * Centered clear KTP cutout box with an aspect ratio of ~1.58.
    * Top controls: Close icon, Flash icon (displays `flash-outline` or `flash-off-outline`).
    * Bottom control: Large circular Capture button.

---

## Verification Plan

### Manual Verification
1. Tap the KTP photo upload box. Confirm the selection modal pops up.
2. Select "Pilih Galeri". Choose any image, verify it populates the preview.
3. Tap "Ganti Foto KTP", choose "Ambil Foto".
   - Confirm permission request is shown if not already granted.
   - Verify the camera opens fullscreen.
   - Verify the KTP guide frame is visible in the center.
   - Tap the Flash icon. Verify that the device senter/flash toggles.
   - Tap the Capture button. Confirm the camera captures the picture, closes, and populates the registration preview box.
