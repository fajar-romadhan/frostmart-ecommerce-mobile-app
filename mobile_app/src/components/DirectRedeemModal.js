import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../core/theme';
import { ApiService, getImageUrlObject } from '../core/api';

export const DirectRedeemModal = ({ visible, onClose, userPoints = 0, userAddress = '', onSuccess }) => {
  const [step, setStep] = useState(1); // 1 = Pilih Produk, 2 = Konfirmasi Klaim
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rewardProducts, setRewardProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Klaim dari Profil/Riwayat: HANYA Ambil di Toko (tidak ada antar alamat)
  const deliveryMethod = 'ambil_toko';

  const fetchRewardProducts = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/points/reward-products');
      const json = await res.json();
      if (json.success && json.data) {
        setRewardProducts(json.data.products || []);
      }
    } catch (err) {
      console.log('Error fetching reward products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedProduct(null);
      setSearchQuery('');
      fetchRewardProducts();
    }
  }, [visible]);

  const filteredProducts = rewardProducts.filter((item) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (item.name || item.nama || '').toLowerCase().includes(q);
    const codeMatch = (item.kode_produk || '').toLowerCase().includes(q);
    return nameMatch || codeMatch;
  });

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedProduct) return;
    if (userPoints < 10) {
      Alert.alert('Poin Tidak Cukup', 'Anda membutuhkan minimal 10 poin untuk klaim produk gratis.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.post('/points/redeem-direct', {
        product_id: selectedProduct.id,
        delivery_method: 'ambil_toko',
        shipping_address: null,
      });

      const json = await res.json();

      if (res.status === 201 && json.success) {
        Alert.alert(
          '🎉 Klaim Berhasil!',
          `Selamat! Anda berhasil menukar 10 poin dengan 1x ${selectedProduct.name || selectedProduct.nama}.\n\nPesanan hadiah Anda (#${json.data?.order?.order_code || json.data?.order?.kode_pesanan}) sedang disiapkan oleh toko!`,
          [
            {
              text: 'OK 🛍️',
              onPress: () => {
                if (onSuccess) onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Gagal Klaim', json.message || 'Gagal menukar poin. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Error direct redeem:', err);
      Alert.alert('Error', 'Terjadi kesalahan jaringan saat menukar poin.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProductItem = ({ item }) => {
    const imgSource = item.image || item.gambar
      ? getImageUrlObject(item.image || item.gambar)
      : null;

    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.7}
        onPress={() => handleSelectProduct(item)}
      >
        <View style={styles.productImgContainer}>
          {imgSource ? (
            <Image source={imgSource} style={styles.productImg} resizeMode="contain" />
          ) : (
            <Ionicons name="snow" size={28} color={COLORS.primary} />
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name || item.nama}
          </Text>
          <Text style={styles.productCategory}>
            {item.category?.name || item.kategori?.nama || 'Produk Frozen'}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.normalPrice}>
              Rp {Number(item.price || item.harga || 0).toLocaleString('id-ID')}
            </Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>GRATIS 10 Poin</Text>
            </View>
          </View>
        </View>

        <View style={styles.chooseBtn}>
          <Text style={styles.chooseBtnText}>PILIH ➔</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {step === 2 && (
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
                </TouchableOpacity>
              )}
              <Ionicons name="gift" size={22} color="#F59E0B" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.headerTitle}>
                  {step === 1 ? 'Pilih Produk Hadiah (10 Poin)' : 'Konfirmasi Klaim Hadiah'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Saldo Anda: <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>{userPoints} Poin</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* STEP 1: KATALOG PRODUK HADIAH */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari produk nugget, sosis, bakso..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Memuat katalog hadiah...</Text>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color={COLORS.border} />
                  <Text style={styles.emptyTitle}>Produk Tidak Ditemukan</Text>
                  <Text style={styles.emptySubtitle}>Coba kata kunci pencarian yang lain.</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredProducts}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderProductItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </View>
          )}

          {/* STEP 2: KONFIRMASI KLAIM INSTAN */}
          {step === 2 && selectedProduct && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.step2ScrollContent}>
              {/* Selected Product Card Preview */}
              <View style={styles.confirmProductCard}>
                <View style={styles.confirmImgBox}>
                  {selectedProduct.image || selectedProduct.gambar ? (
                    <Image
                      source={getImageUrlObject(selectedProduct.image || selectedProduct.gambar)}
                      style={styles.confirmImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name="snow" size={32} color={COLORS.primary} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={styles.freeTag}>
                    <Ionicons name="gift" size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.freeTagText}>HADIAH GRATIS (10 POIN)</Text>
                  </View>
                  <Text style={styles.confirmProductName}>
                    {selectedProduct.name || selectedProduct.nama}
                  </Text>
                  <Text style={styles.confirmProductPrice}>
                    Harga Normal: <Text style={{ textDecorationLine: 'line-through', color: COLORS.textMuted }}>Rp {Number(selectedProduct.price || selectedProduct.harga || 0).toLocaleString('id-ID')}</Text> ➔ <Text style={{ color: '#059669', fontWeight: 'bold' }}>Rp 0</Text>
                  </Text>
                </View>
              </View>

              {/* Delivery Method — Hanya Ambil di Toko */}
              <Text style={styles.sectionLabel}>Metode Pengambilan Hadiah</Text>

              {/* Info Ambil di Toko (tidak bisa diantar, harus ambil sendiri) */}
              <View style={[styles.methodCard, styles.methodCardActive]}>
                <View style={styles.radioOuter}>
                  <View style={styles.radioInner} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="storefront" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.methodTitle}>Ambil Sendiri di Toko</Text>
                    <View style={styles.freeBadgeSmall}>
                      <Text style={styles.freeBadgeSmallText}>GRATIS</Text>
                    </View>
                  </View>
                  <Text style={styles.methodDesc}>
                    Toko Della Frozen Mart (Tanjung Enim, Muara Enim). Tanpa biaya ongkir.
                  </Text>
                </View>
              </View>

              {/* Info banner: hadiah klaim langsung tidak bisa diantar */}
              <View style={styles.pickupOnlyBanner}>
                <Ionicons name="information-circle" size={15} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.pickupOnlyText}>
                  Hadiah klaim poin hanya bisa diambil langsung di toko. Untuk antar alamat, tukar poin saat Checkout belanja.
                </Text>
              </View>

              {/* Points Summary Breakdown */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Saldo Poin Anda</Text>
                  <Text style={styles.breakdownVal}>{userPoints} Poin</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: '#DC2626' }]}>Poin yang Digunakan</Text>
                  <Text style={[styles.breakdownVal, { color: '#DC2626', fontWeight: 'bold' }]}>-10 Poin</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Sisa Saldo Poin</Text>
                  <Text style={[styles.breakdownVal, { color: '#D97706', fontWeight: '900', fontSize: 14 }]}>
                    {userPoints - 10} Poin
                  </Text>
                </View>
                <View style={[styles.breakdownRow, { marginTop: 6 }]}>
                  <Text style={[styles.breakdownLabel, { fontWeight: 'bold', color: COLORS.secondary }]}>Total Biaya</Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#059669' }}>Rp 0 (GRATIS)</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.claimButton, submitting && { opacity: 0.7 }]}
                activeOpacity={0.8}
                onPress={handleConfirmRedeem}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.claimGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.claimButtonText}>🎉 KLAIM SEKARANG (-10 POIN)</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeProductBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.changeProductText}>⬅️ Ganti Pilihan Produk Lain</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: '92%',
    minHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    fontSize: 15,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.secondary,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: 10,
    marginBottom: 10,
    ...SHADOWS.light,
  },
  productImgContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  productImg: {
    width: 54,
    height: 54,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
  },
  productCategory: {
    ...TYPOGRAPHY.small,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  normalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  freeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  chooseBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  chooseBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
    marginTop: 12,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  step2ScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  confirmProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  confirmImgBox: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  confirmImg: {
    width: 64,
    height: 64,
  },
  freeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  confirmProductName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    color: COLORS.secondary,
  },
  confirmProductPrice: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 3,
  },
  sectionLabel: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  methodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  methodTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.secondary,
  },
  methodDesc: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  freeBadgeSmall: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  freeBadgeSmallText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#15803D',
  },
  addressBox: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressBoxLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.secondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: COLORS.secondary,
    minHeight: 50,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.light,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  breakdownVal: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 8,
  },
  claimButton: {
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
    marginTop: 8,
    ...SHADOWS.medium,
  },
  claimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  claimButtonText: {
    color: '#FFF',
    ...TYPOGRAPHY.button,
    fontSize: 14,
    fontWeight: '800',
  },
  changeProductBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  changeProductText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '700',
  },
  pickupOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: SIZES.radiusSm,
    padding: 10,
    marginBottom: 12,
  },
  pickupOnlyText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
});

export default DirectRedeemModal;

