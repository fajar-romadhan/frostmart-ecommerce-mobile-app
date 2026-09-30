# Design Spec: Direct Numeric Quantity Input for Customers

## 1. Overview
Currently, customers adjusting product quantities on the **Product Detail Screen** (`ProductDetailScreen.js`) or the **Cart Screen** (`CartScreen.js`) must repeatedly tap the `+` or `-` buttons to change the quantity. When ordering larger quantities (e.g. 50 or 100 pcs), this requires tapping up to 100 times.

This design introduces a **Direct Numeric Input** feature, replacing the static quantity `<Text>` with a numeric `<TextInput>` so customers can tap the quantity box and type any valid integer directly.

---

## 2. Requirements & Behavior

### 2.1 Product Detail Screen (`ProductDetailScreen.js`)
- Replace the static `<Text style={styles.qtyText}>` with a `<TextInput>` styled component.
- `keyboardType="numeric"` to open numeric keyboard on mobile devices.
- `selectTextOnFocus={true}` so tapping the quantity box highlights the existing number for quick overwriting.
- **Input Sanitization & Constraints**:
  - Filter non-numeric characters using `text.replace(/[^0-9]/g, '')`.
  - While typing, allow empty string `""` transiently so the user can backspace cleanly.
  - On value change:
    - If `parsedVal > product.stock`, set quantity to `product.stock` and trigger `Alert.alert('Peringatan', 'Kuantitas melebihi stok yang tersedia (' + product.stock + ').')`.
  - On `onBlur` (focus lost / editing finished):
    - If quantity is empty `""` or `0`, reset quantity to `1`.
- Disable editing (`editable={false}`) when `isOutOfStock` is true.

### 2.2 Cart Screen (`CartScreen.js`)
- Replace the static `<Text style={styles.qtyText}>` in each cart item with a `<TextInput>`.
- Keep local state per item or handle onChange/onBlur cleanly to avoid excessive network requests while typing.
- On `onBlur` or debounced change:
  - Sanitize input `val`.
  - If `val > availableStock`, cap at `availableStock` and alert the user.
  - If `val <= 0` or empty, reset to `1`.
  - Call `updateCartItem(item.id, newQuantity)` to sync with backend database.

---

## 3. Component & UI Design
- **Styling**:
  - Maintain existing height and alignment of the quantity container bar.
  - Set a minimum width (e.g., 48px) and center-align text (`textAlign: 'center'`).
  - Font weight bold (`fontWeight: '700'`).
  - Colors: white text in `ProductDetailScreen` (blue background bar), dark text in `CartScreen`.
  - Add subtle padding and touch feedback.

---

## 4. Edge Cases & Safety Checks
1. **Empty input during typing**: Handled by allowing empty string in state, fallback to `1` on blur.
2. **Leading zeros (e.g. "05")**: Parsed cleanly using `parseInt(text, 10)` to eliminate leading zeros.
3. **Pasted text with non-numeric characters**: Regex `/[^0-9]/g` strips out all non-digits.
4. **Out of stock items**: Input disabled.
5. **Network error handling (Cart)**: Revert to previous valid quantity if backend update fails.

---

## 5. Verification Plan
- Unit & manual testing:
  - Test tapping `+` and `-` buttons still works as expected.
  - Test typing `100` on a product with 150 stock -> quantity becomes 100.
  - Test typing `999` on a product with 50 stock -> quantity capped at 50 with warning alert.
  - Test clearing text and leaving input -> resets to 1.
  - Test in CartScreen: quantity updates total price dynamically and syncs backend correctly.
