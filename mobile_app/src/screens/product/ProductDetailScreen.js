import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { formatRupiah } from '../../core/utils';
import { getImageUrl, getImageUrlObject } from '../../core/api';
import CustomButton from '../../components/CustomButton';

export const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { getProductDetail } = useProducts();
  const { addToCart, isLoading: isAdding } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (text) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    if (sanitized === '') {
      setQuantity('');
      return;
    }
    const val = parseInt(sanitized, 10);
    if (product && val > product.stock) {
      setQuantity(product.stock);
      Alert.alert(
        'Peringatan',
        `Kuantitas melebihi stok yang tersedia (${product.stock} ${product.unit || 'Pcs'}).`
      );
    } else {
      setQuantity(val);
    }
  };

  const handleQuantityBlur = () => {
    if (quantity === '' || quantity <= 0) {
      setQuantity(1);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const data = await getProductDetail(productId);
      setProduct(data);
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  const handleIncrement = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      Alert.alert('Peringatan', 'Kuantitas melebihi stok yang tersedia.');
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const res = await addToCart(product.id, quantity);
    const isSuccess = typeof res === 'object' ? res.success : !!res;
    const message = typeof res === 'object' ? res.message : null;

    if (isSuccess) {
      Alert.alert('Sukses 🎉', message || 'Produk berhasil ditambahkan ke keranjang!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Gagal Masuk Keranjang', message || 'Kuantitas melebihi stok yang tersedia.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Produk tidak ditemukan.</Text>
      </View>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock <= (product.minimum_stock ?? 5);
  const imageObj = getImageUrlObject(product.image_url);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageObj ? (
            <Image source={imageObj} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="snow-outline" size={72} color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Product Details — Overlapping card */}
        <View style={styles.infoSection}>
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryName}>{product.category?.name || 'Makanan Beku'}</Text>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatRupiah(product.price)}</Text>

          {/* Stock Info Container */}
          <View style={[styles.stockContainer, isLowStock ? styles.stockLow : styles.stockNormal]}>
            <View style={[styles.stockDot, { backgroundColor: isOutOfStock ? COLORS.danger : isLowStock ? COLORS.warning : COLORS.success }]} />
            <Text style={styles.stockLabel}>Stok Tersedia: </Text>
            <Text style={[styles.stockValue, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
              {product.stock} {product.unit || 'Pcs'}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
            <Text style={styles.descriptionText}>
              {product.description || 'Belum ada deskripsi untuk produk ini.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        {/* Quantity Controller */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={handleDecrement}
            disabled={isOutOfStock}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color={isOutOfStock ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>
          <TextInput
            style={styles.qtyInput}
            value={String(quantity)}
            onChangeText={handleQuantityChange}
            onBlur={handleQuantityBlur}
            keyboardType="numeric"
            selectTextOnFocus={true}
            editable={!isOutOfStock}
          />
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={handleIncrement}
            disabled={isOutOfStock}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={isOutOfStock ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Add Cart Button */}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <CustomButton
            title={isOutOfStock ? 'STOK HABIS' : 'TAMBAH KERANJANG'}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            isLoading={isAdding}
            variant="accent"
            iconName={isOutOfStock ? undefined : "cart-outline"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 320,
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.shimmer,
  },
  infoSection: {
    padding: SIZES.paddingLg,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    marginBottom: 10,
  },
  categoryName: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  price: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.accent,
    marginBottom: 16,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radiusMd,
    marginBottom: 20,
  },
  stockNormal: {
    backgroundColor: COLORS.successLight,
  },
  stockLow: {
    backgroundColor: COLORS.dangerLight,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stockLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  stockValue: {
    ...TYPOGRAPHY.bodyBold,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  descriptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  expSection: {
    marginBottom: 20,
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusMd,
    alignSelf: 'flex-start',
  },
  expText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    zIndex: 99,
    ...SHADOWS.heavy,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    height: 48,
    backgroundColor: COLORS.primary,
  },
  qtyBtn: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    ...TYPOGRAPHY.bodyBold,
    paddingHorizontal: 8,
    paddingVertical: 0,
    color: COLORS.white,
    textAlign: 'center',
    minWidth: 48,
    height: '100%',
    includeFontPadding: false,
  },
});

export default ProductDetailScreen;
