import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../core/theme';
import { formatRupiah } from '../core/utils';
import { getImageUrl, getImageUrlObject } from '../core/api';

export const ProductCard = ({ product }) => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock <= (product.minimum_stock ?? 5);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const imageObj = getImageUrlObject(product.image_url);

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.card}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageObj ? (
            <Image
              source={imageObj}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderIconCircle}>
                <Ionicons name="snow-outline" size={28} color={COLORS.primary} />
              </View>
            </View>
          )}

          {/* Category badge */}
          {product.category?.name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category.name}</Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>STOK HABIS</Text>
              </View>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.price}>{formatRupiah(product.price)}</Text>

          <View style={styles.stockRow}>
            <View style={styles.stockDotRow}>
              <View style={[
                styles.stockDot,
                { backgroundColor: isOutOfStock ? COLORS.danger : isLowStock ? COLORS.warning : COLORS.success }
              ]} />
              <Text style={[
                styles.stock,
                isLowStock ? styles.lowStockText : styles.normalStockText,
              ]}>
                {product.stock} {product.unit ?? 'Pcs'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    flex: 1,
    ...SHADOWS.light,
  },
  imageContainer: {
    height: 150,
    backgroundColor: COLORS.shimmer,
    position: 'relative',
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
    backgroundColor: COLORS.primaryLight,
  },
  placeholderIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(10, 142, 217, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  outOfStockText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
  },
  infoContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accent,
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  stock: {
    fontSize: 11,
    fontWeight: '500',
  },
  lowStockText: {
    color: COLORS.danger,
  },
  normalStockText: {
    color: COLORS.textSecondary,
  },
});

export default ProductCard;
