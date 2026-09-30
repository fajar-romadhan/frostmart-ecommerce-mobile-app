import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';

export const AdminStockInScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [stockInsHistory, setStockInsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await ApiService.get('/admin/products');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setProducts(body.data);
        if (body.data.length > 0) {
          setProductId(String(body.data[0].id));
        }
      }
    } catch (error) {
      console.error('Gagal memuat produk:', error);
    }
  };

  const fetchStockInHistory = async () => {
    try {
      const res = await ApiService.get('/admin/stock-ins');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setStockInsHistory(body.data);
      }
    } catch (error) {
      console.error('Gagal memuat riwayat restok:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchStockInHistory()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
    const catMatch = p.category?.nama ? p.category.nama.toLowerCase().includes(q) : false;
    return nameMatch || catMatch;
  });

  const handleStockIn = async () => {
    if (!productId || !quantity || parseInt(quantity) <= 0) {
      Alert.alert('Validasi Gagal', 'Mohon pilih produk dan masukkan jumlah restok yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      const bodyData = {
        product_id: parseInt(productId),
        quantity: parseInt(quantity),
      };

      const res = await ApiService.post('/admin/stock-in', bodyData);
      const body = await res.json();

      if (res.status === 200 || res.status === 201) {
        Alert.alert('Sukses 🎉', 'Stok barang berhasil ditambahkan!');
        setQuantity('');
        loadData();
      } else {
        Alert.alert('Gagal', body.message || 'Gagal menyimpan data barang masuk.');
      }
    } catch (error) {
      console.error('Error stock in:', error);
      Alert.alert('Error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const selectedProductObj = products.find((p) => String(p.id) === String(productId));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.headerBox}>
        <Ionicons name="cube" size={28} color={COLORS.primary} style={{ marginRight: 10 }} />
        <View>
          <Text style={styles.title}>Restok Barang Masuk</Text>
          <Text style={styles.subtitle}>Tambah stok produk frozen toko secara praktis & instan</Text>
        </View>
      </View>

      {/* Card Form 1-Tap Restok */}
      <View style={styles.formCard}>
        {/* 1. Pilih Produk & Live Search */}
        <Text style={styles.sectionHeaderLabel}>1. Pilih Produk Frozen *</Text>
        
        {/* Search Bar Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Cari nama produk / kategori..."
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

        {/* Vertical Product List */}
        <View style={styles.verticalProductContainer}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptySearch}>
              <Ionicons name="search" size={24} color={COLORS.textMuted} />
              <Text style={styles.emptySearchText}>Produk "{searchQuery}" tidak ditemukan.</Text>
            </View>
          ) : (
            filteredProducts.map((prod) => {
              const isSelected = String(productId) === String(prod.id);
              return (
                <TouchableOpacity
                  key={prod.id}
                  style={[styles.productVerticalItem, isSelected && styles.productVerticalItemSelected]}
                  onPress={() => setProductId(String(prod.id))}
                  activeOpacity={0.8}
                >
                  <View style={styles.productItemLeft}>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productItemName, isSelected && styles.productItemNameSelected]} numberOfLines={1}>
                        {prod.name}
                      </Text>
                      {prod.category?.nama && (
                        <Text style={styles.productItemCat}>{prod.category.nama}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.stockBadgeVertical, isSelected ? { backgroundColor: COLORS.primary } : { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.stockBadgeText, isSelected && { color: COLORS.white }]}>
                      Stok: {prod.stock} {prod.unit || 'Pcs'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {selectedProductObj && (
          <View style={styles.selectedProductInfo}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.infoText}>
              Terpilih: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{selectedProductObj.name}</Text> (Stok Fisik: {selectedProductObj.stock} {selectedProductObj.unit || 'Pcs'})
            </Text>
          </View>
        )}

        {/* 2. Jumlah Restok */}
        <Text style={[styles.sectionHeaderLabel, { marginTop: SIZES.md }]}>2. Jumlah Tambah Stok (+)*</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.bigInput}
            placeholder="Ketik jumlah restok (cth: 50)"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        {/* Tombol Utama Hijau */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleStockIn}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <View style={styles.btnRow}>
              <Ionicons name="add-circle-outline" size={22} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>➕ TAMBAH STOK SEKARANG</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Riwayat Restok Terakhir */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Ionicons name="time-outline" size={20} color={COLORS.secondary} style={{ marginRight: 6 }} />
          <Text style={styles.historyTitle}>Riwayat Restok Terakhir</Text>
        </View>

        {stockInsHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyText}>Belum ada riwayat pencatatan barang masuk.</Text>
          </View>
        ) : (
          stockInsHistory.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyCardHeader}>
                <Text style={styles.historyProdName}>
                  {item.product?.name || item.product?.nama || 'Produk'}
                </Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>+{item.quantity} Stok</Text>
                </View>
              </View>
              <Text style={styles.historySub}>
                Pemasok: {item.supplier_name || 'Supplier Toko'} • {item.purchase_date || 'Hari Ini'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.paddingLg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.medium,
    marginBottom: SIZES.lg,
  },
  sectionHeaderLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SIZES.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    paddingVertical: 2,
  },
  verticalProductContainer: {
    maxHeight: 220,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 6,
    backgroundColor: '#FAFAFA',
  },
  productVerticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.white,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  productVerticalItemSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  productItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  productItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  productItemNameSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  productItemCat: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  stockBadgeVertical: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  emptySearch: {
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  selectedProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: SIZES.radiusSm,
    padding: 10,
    marginTop: SIZES.sm,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.secondary,
    flex: 1,
  },
  inputContainer: {
    marginVertical: SIZES.xs,
  },
  bigInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    marginTop: SIZES.md,
    ...SHADOWS.medium,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: COLORS.white,
    ...TYPOGRAPHY.button,
    fontSize: 14,
  },
  btnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  historySection: {
    marginTop: SIZES.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  historyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
  },
  emptyHistory: {
    padding: SIZES.md,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm + 2,
    marginBottom: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyProdName: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  qtyBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qtyBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  historySub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default AdminStockInScreen;
