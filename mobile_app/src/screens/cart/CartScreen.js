import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, TextInput, RefreshControl, ScrollView } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { formatRupiah } from '../../core/utils';
import { getImageUrl } from '../../core/api';
import CustomButton from '../../components/CustomButton';

export const CartScreen = ({ navigation }) => {
  const { cart, isLoading, getCart, updateCartItem, deleteCartItem } = useCart();
  const [editingQty, setEditingQty] = useState({});

  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = 0;
  }

  useEffect(() => {
    getCart();
  }, []);

  const handleQtyChange = (item, text) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    setEditingQty((prev) => ({ ...prev, [item.id]: sanitized }));
    if (sanitized !== '') {
      const val = parseInt(sanitized, 10);
      const availableStock = item.available_stock ?? 999;
      if (val > availableStock) {
        Alert.alert(
          'Stok Tidak Mencukupi',
          `Kuantitas tidak dapat ditambah karena stok yang tersedia hanya ${availableStock} pcs.`
        );
        setEditingQty((prev) => ({ ...prev, [item.id]: String(availableStock) }));
        updateCartItem(item.id, availableStock);
      } else if (val >= 1) {
        updateCartItem(item.id, val);
      }
    }
  };

  const handleQtyBlur = (item) => {
    const currentVal = editingQty[item.id];
    if (currentVal === '' || parseInt(currentVal, 10) < 1) {
      setEditingQty((prev) => ({ ...prev, [item.id]: '1' }));
      updateCartItem(item.id, 1);
    } else {
      setEditingQty((prev) => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    }
  };

  const handleIncrement = (item) => {
    setEditingQty((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });
    const availableStock = item.available_stock ?? 999;
    if (item.quantity < availableStock) {
      updateCartItem(item.id, item.quantity + 1);
    } else {
      Alert.alert(
        'Stok Tidak Mencukupi',
        `Kuantitas tidak dapat ditambah karena stok yang tersedia hanya ${availableStock} pcs.`
      );
    }
  };

  const handleDecrement = (item) => {
    setEditingQty((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });
    if (item.quantity > 1) {
      updateCartItem(item.id, item.quantity - 1);
    }
  };

  const handleDelete = async (itemId) => {
    await deleteCartItem(itemId);
  };

  const renderCartItem = ({ item }) => {
    const formattedImage = getImageUrl(item.image_url);
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {formattedImage ? (
              <Image source={{ uri: formattedImage }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="snow-outline" size={24} color={COLORS.primary} />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>{formatRupiah(item.price)}</Text>

            {/* Qty and Delete controls */}
            <View style={styles.controlsRow}>
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => handleDecrement(item)}
                  disabled={item.quantity <= 1}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={item.quantity <= 1 ? COLORS.textMuted : COLORS.white}
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={String(editingQty[item.id] !== undefined ? editingQty[item.id] : item.quantity)}
                  onChangeText={(text) => handleQtyChange(item, text)}
                  onBlur={() => handleQtyBlur(item)}
                  keyboardType="numeric"
                  selectTextOnFocus={true}
                />
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleIncrement(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && !cart) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isCartEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {isCartEmpty ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={getCart}
              colors={[COLORS.primary, COLORS.accent]}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={56} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Keranjang Anda Kosong</Text>
            <Text style={styles.emptySubtitle}>Silakan cari produk favorit Anda di Katalog.</Text>
            <CustomButton
              title="Mulai Belanja"
              onPress={() => navigation.navigate('Katalog')}
              style={styles.shopBtn}
              variant="primary"
              iconName="grid-outline"
            />
          </View>
        </ScrollView>
      ) : (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={getCart}
            refreshing={isLoading}
          />

          {/* Checkout sticky bottom bar */}
          <View style={[styles.footer, { bottom: tabBarHeight }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalPrice}>{formatRupiah(cart.total_price)}</Text>
            </View>
            <CustomButton
              title="CHECKOUT PESANAN"
              onPress={() => navigation.navigate('Checkout')}
              style={styles.checkoutBtn}
              variant="accent"
              iconName="card-outline"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLg * 2,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopBtn: {
    width: '100%',
  },
  listContent: {
    padding: SIZES.paddingMd,
    paddingBottom: 160,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 75,
    height: 75,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.shimmer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.shimmer,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    ...TYPOGRAPHY.price,
    color: COLORS.accent,
    marginBottom: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  qtyInput: {
    ...TYPOGRAPHY.bodyBold,
    paddingHorizontal: 6,
    paddingVertical: 0,
    color: COLORS.secondary,
    textAlign: 'center',
    minWidth: 46,
    height: 32,
    fontSize: 15,
    includeFontPadding: false,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSm,
    marginHorizontal: 4,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    padding: SIZES.paddingLg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    zIndex: 99,
    ...SHADOWS.heavy,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  totalPrice: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.accent,
  },
  checkoutBtn: {
    width: '100%',
  },
});

export default CartScreen;
