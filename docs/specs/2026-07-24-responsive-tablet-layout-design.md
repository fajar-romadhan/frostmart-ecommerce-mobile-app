# Design Spec: Cross-Device Responsive Layout for Tablets, iOS, and Android

## 1. Overview
This design spec addresses visual layout scaling and button positioning across all screen sizes (Huawei tablets, Android tablets, iPad, and various smartphone aspect ratios). It prevents sticky action buttons and modal content from overflowing off-screen or being cut off by hardcoded pixel offsets.

---

## 2. Targeted Component & Screen Improvements

### A. Admin Order Modal (`AdminOrderScreen.js`)
- **Container Sizing**: Replace `height: '90%'` with `maxHeight: '90%'` and `flexShrink: 1`.
- **Tablet Layout Optimization**: For tablet screens (width ≥ 600dp), apply `maxWidth: 640dp`, `alignSelf: 'center'`, and centered overlay alignment.
- **Scrollable Action Block**: Ensure all action buttons (`Setujui`, `Cetak Struk`, `Chat Pelanggan`, `Batalkan`) are wrapped inside the `<ScrollView>` container with `paddingBottom: 24` to prevent overflow off-screen.

### B. Order Detail Screen (`OrderDetailScreen.js`)
- **Bottom Bar & Chat Banner**: Ensure sticky action bars handle safe area insets dynamically.
- **Scroll Content Padding**: Set dynamic scroll content padding (`paddingBottom: 120`) to guarantee that all items and the Chat Admin button are fully visible above bottom sticky bars on tablet and phone screens.

### C. Checkout & Cart Screens (`CheckoutScreen.js`, `CartScreen.js`)
- **Sticky Summary Container**: Use `flexShrink: 1` and responsive bottom padding to ensure checkout summary and order placement buttons fit comfortably on wider tablet screens without overflow.

### D. Product Detail Screen (`ProductDetailScreen.js`)
- **Sticky Add-to-Cart Bar**: Ensure quantity input and "Tambah ke Keranjang" button maintain responsive padding across iOS, Android, and Huawei tablet aspect ratios.

---

## 3. Technical Implementation Rules
- **No Hardcoded Viewport Heights**: Avoid unconstrained `height: X%` without `ScrollView` or `flexShrink: 1`.
- **Dynamic Dimension Bounds**: Utilize `useWindowDimensions()` or responsive style calculations for modal containers.
- **Platform Inset Safety**: Apply `Platform.OS === 'ios'` or `SafeAreaView` bottom padding to accommodate notch and gesture bar spaces across all OS environments.

---

## 4. Verification Plan
- **Syntax & Build Check**: Validate JavaScript syntax across modified screens.
- **Automated Test Suite**: Run `php artisan test` (35 tests passing) to ensure no API or model side-effects.
- **Manual Visual Review**: Verify screen layouts on tablets and phones to ensure action buttons are fully visible and scrollable.
