import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ApiService, getImageUrl } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';
import { formatRupiah } from '../../core/utils';

const getCategoryTheme = (categoryName) => {
  if (!categoryName) return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: 'cube-outline' };
  const name = categoryName.toLowerCase();

  // 1. Frozen Food (Cool Ice Blue)
  if (name.includes('frozen') || name === 'frozen food') {
    return { bg: '#E0F2FE', text: '#0284C7', border: '#7DD3FC', icon: 'snow-outline' };
  }
  // 2. Bumbu & Rempah (Fresh Emerald Green)
  if (name.includes('bumbu') || name.includes('rempah') || name.includes('racik')) {
    return { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7', icon: 'leaf-outline' };
  }
  // 3. Saos & Pertopingan (Warm Orange)
  if (name.includes('saos') || name.includes('sauce') || name.includes('toping')) {
    return { bg: '#FFEDD5', text: '#EA580C', border: '#FDBA74', icon: 'sparkles-outline' };
  }
  // 4. Sosis & Bakso (Crimson Red)
  if (name.includes('sosis') || name.includes('bakso') || name.includes('baso')) {
    return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', icon: 'flame-outline' };
  }
  // 5. Nugget & Olahan Ayam/Ikan (Golden Amber)
  if (name.includes('nugget') || name.includes('olahan')) {
    return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', icon: 'nutrition-outline' };
  }
  // 6. Kentang & Snack (Golden Yellow)
  if (name.includes('kentang') || name.includes('snack') || name.includes('goreng')) {
    return { bg: '#FEF9C3', text: '#CA8A04', border: '#FDE047', icon: 'fast-food-outline' };
  }
  // 7. Dimsum & Steamboat (Mint Teal)
  if (name.includes('dimsum') || name.includes('dumpling') || name.includes('steamboat')) {
    return { bg: '#CCFBF1', text: '#0D9488', border: '#5EEAD4', icon: 'restaurant-outline' };
  }
  // 8. Es Krim & Dessert (Cyan Blue)
  if (name.includes('es') || name.includes('ice') || name.includes('krim')) {
    return { bg: '#CFFAFE', text: '#0891B2', border: '#67E8F9', icon: 'ice-cream-outline' };
  }
  // 9. Minuman (Royal Blue)
  if (name.includes('minum') || name.includes('drink') || name.includes('teh') || name.includes('susu')) {
    return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', icon: 'beer-outline' };
  }
  // 10. Mainan & Barang Non-Food (Lavender Purple)
  if (name.includes('mainan') || name.includes('barang') || name.includes('plastik')) {
    return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE', icon: 'gift-outline' };
  }

  // Fallback default
  return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: 'pricetag-outline' };
};

export const AdminProductScreen = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('Pack');
  const [imageUri, setImageUri] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [status, setStatus] = useState('active');

  const fetchData = async () => {
    try {
      const prodRes = await ApiService.get('/admin/products');
      const prodBody = await prodRes.json();
      if (prodRes.status === 200 && prodBody.success) {
        setProducts(prodBody.data);
      }

      const catRes = await ApiService.get('/categories');
      const catBody = await catRes.json();
      if (catRes.status === 200 && catBody.success) {
        setCategories(catBody.data);
        if (catBody.data.length > 0 && !categoryId) {
          setCategoryId(String(catBody.data[0].id));
        }
      }
    } catch (error) {
      console.error('Gagal mengambil data produk/kategori:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin galeri untuk mengunggah gambar produk.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddProduct = async () => {
    if (!name || !price || !stock || !categoryId) {
      Alert.alert('Validasi Gagal', 'Mohon lengkapi kolom Nama, Kategori, Harga, dan Stok.');
      return;
    }

    setSubmitting(true);
    try {
      const fields = {
        category_id: categoryId,
        name,
        description: '',
        price: parseFloat(price),
        stock: parseInt(stock),
        minimum_stock: 5,
        unit: unit || 'Pack',
      };

      const res = await ApiService.postProductMultipart('/admin/products', fields, imageUri, 'image');
      const body = await res.json();

      if (res.status === 201 && body.success) {
        Alert.alert('Sukses 🎉', 'Produk berhasil ditambahkan.');
        setModalVisible(false);
        resetForm();
        fetchData();
      } else {
        const errorDetail = body.errors ? Object.values(body.errors).flat().join('\n') : '';
        Alert.alert('Gagal', (body.message || 'Gagal menyimpan produk.') + (errorDetail ? `\n\n${errorDetail}` : ''));
      }
    } catch (error) {
      console.error('Error post product:', error);
      Alert.alert('Error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (id, prodName) => {
    Alert.alert(
      'Hapus Produk',
      `Apakah Anda yakin ingin menghapus produk "${prodName}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await ApiService.delete(`/admin/products/${id}`);
              const body = await res.json();
              if (res.status === 200 && body.success) {
                Alert.alert('Sukses', 'Produk berhasil dihapus.');
                fetchData();
              } else {
                Alert.alert('Gagal', body.message || 'Gagal menghapus produk.');
              }
            } catch (error) {
              console.error('Error delete product:', error);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setUnit('Pack');
    setImageUri(null);
    setIsEditing(false);
    setEditingProductId(null);
    setStatus('active');
    if (categories.length > 0) {
      setCategoryId(String(categories[0].id));
    }
  };

  const startEditProduct = (product) => {
    setName(product.name);
    setCategoryId(String(product.category_id || ''));
    setPrice(String(product.price));
    setStock(String(product.stock));
    setUnit(product.unit || 'Pack');
    setImageUri(product.image_url ? getImageUrl(product.image_url) : null);
    setIsEditing(true);
    setEditingProductId(product.id);
    setStatus(product.status || 'active');
    setModalVisible(true);
  };

  const handleEditProduct = async () => {
    if (!name || !price || !stock || !categoryId) {
      Alert.alert('Validasi Gagal', 'Mohon lengkapi kolom Nama, Kategori, Harga, dan Stok.');
      return;
    }

    setSubmitting(true);
    try {
      const fields = {
        category_id: categoryId,
        name,
        description: '',
        price: parseFloat(price),
        stock: parseInt(stock),
        minimum_stock: 5,
        unit: unit || 'Pack',
        status: status || 'active',
      };

      const hasNewImage = imageUri && !imageUri.startsWith('http://') && !imageUri.startsWith('https://');

      const res = await ApiService.postProductMultipart(
        `/admin/products/${editingProductId}`,
        fields,
        hasNewImage ? imageUri : null,
        'image'
      );
      const body = await res.json();

      if (res.status === 200 && body.success) {
        Alert.alert('Sukses 🎉', 'Produk berhasil diperbarui.');
        setModalVisible(false);
        resetForm();
        fetchData();
      } else {
        const errorDetail = body.errors ? Object.values(body.errors).flat().join('\n') : '';
        Alert.alert('Gagal', (body.message || 'Gagal memperbarui produk.') + (errorDetail ? `\n\n${errorDetail}` : ''));
      }
    } catch (error) {
      console.error('Error edit product:', error);
      Alert.alert('Error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Products Logic
  const filteredProducts = products.filter((product) => {
    if (selectedCatFilter !== 'all') {
      if (String(product.category_id) !== String(selectedCatFilter)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = product.name ? product.name.toLowerCase().includes(q) : false;
      const codeMatch = (product.code || product.kode_produk) ? (product.code || product.kode_produk).toLowerCase().includes(q) : false;
      const catMatch = (product.category?.name || product.category?.nama) ? (product.category?.name || product.category?.nama).toLowerCase().includes(q) : false;
      const unitMatch = product.unit ? product.unit.toLowerCase().includes(q) : false;
      return nameMatch || codeMatch || catMatch || unitMatch;
    }
    return true;
  });

  const renderProductItem = ({ item }) => {
    const catName = item.category?.name || item.category?.nama || 'Frozen Food';
    const theme = getCategoryTheme(catName);
    const isLowStock = item.stock <= (item.minimum_stock ?? 5);

    return (
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.text }]}>
        {/* Gambar Produk */}
        <View style={styles.imageContainer}>
          <Image
            source={
              item.image_url
                ? { uri: getImageUrl(item.image_url) }
                : require('../../../assets/icon.png')
            }
            style={styles.productImage}
          />
          <View style={[styles.catBadgeOverlay, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Ionicons name={theme.icon} size={11} color={theme.text} style={{ marginRight: 3 }} />
            <Text style={[styles.catBadgeText, { color: theme.text }]} numberOfLines={1}>{catName}</Text>
          </View>
        </View>

        {/* Informasi Produk */}
        <View style={styles.productInfo}>
          <View style={styles.rowTitle}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.status === 'inactive' && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Non-aktif</Text>
              </View>
            )}
          </View>

          {(item.code || item.kode_produk) && (
            <Text style={styles.codeText}>Kode: {item.code || item.kode_produk}</Text>
          )}

          <Text style={styles.priceText}>{formatRupiah(item.price)} <Text style={styles.unitText}>/ {item.unit || 'Pack'}</Text></Text>

          <View style={styles.stockRow}>
            <View style={[styles.stockBadge, isLowStock ? styles.lowStockBadge : styles.normalStockBadge]}>
              <Ionicons
                name={isLowStock ? 'warning' : 'cube'}
                size={12}
                color={isLowStock ? COLORS.danger : COLORS.success}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.stockBadgeText, isLowStock ? { color: COLORS.danger } : { color: COLORS.success }]}>
                Stok: {item.stock} {item.unit || 'Pack'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tombol Aksi */}
        <View style={styles.actionColumn}>
          <TouchableOpacity style={styles.editBtn} onPress={() => startEditProduct(item)} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item.id, item.name)} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenTitle}>Kelola Produk Toko</Text>
          <Text style={styles.screenSubtitle}>Katalog produk & stok Della Frozen Mart</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.white} style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>+ TAMBAH PRODUK</Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Search Engine Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Cari nama produk, kode PRD-xxx, atau satuan..."
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
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.categoryTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsContent}>
          {/* Tab Semua */}
          <TouchableOpacity
            style={[styles.catTabItem, selectedCatFilter === 'all' && styles.catTabItemSelected]}
            onPress={() => setSelectedCatFilter('all')}
            activeOpacity={0.8}
          >
            <Ionicons name="apps" size={14} color={selectedCatFilter === 'all' ? COLORS.white : COLORS.secondary} style={{ marginRight: 5 }} />
            <Text style={[styles.catTabText, selectedCatFilter === 'all' && styles.catTabTextSelected]}>
              Semua ({products.length})
            </Text>
          </TouchableOpacity>

          {/* Tab per Kategori */}
          {categories.map((cat) => {
            const catTitle = cat.name || cat.nama || 'Kategori';
            const isSelected = String(selectedCatFilter) === String(cat.id);
            const theme = getCategoryTheme(catTitle);
            const count = products.filter((p) => String(p.category_id) === String(cat.id)).length;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catTabItem,
                  { backgroundColor: isSelected ? theme.text : theme.bg, borderColor: theme.border, borderWidth: 1 }
                ]}
                onPress={() => setSelectedCatFilter(String(cat.id))}
                activeOpacity={0.8}
              >
                <Ionicons name={theme.icon} size={14} color={isSelected ? COLORS.white : theme.text} style={{ marginRight: 5 }} />
                <Text style={[styles.catTabText, { color: isSelected ? COLORS.white : theme.text, fontWeight: 'bold' }]}>
                  {catTitle} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Information Counter Header */}
      <View style={styles.resultInfoRow}>
        <Text style={styles.resultInfoText}>
          Menampilkan <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{filteredProducts.length}</Text> dari {products.length} produk
          {searchQuery ? ` untuk "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* FlatList Produk */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Produk Tidak Ditemukan</Text>
          <Text style={styles.emptySub}>Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Tambah & Edit Produk */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Gambar Produk Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                    <Text style={styles.imagePlaceholderText}>Pilih Foto Produk</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Nama Produk */}
              <Text style={styles.fieldLabel}>Nama Produk *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Fiesta Chicken Nugget 500g"
                value={name}
                onChangeText={setName}
              />

              {/* Kategori */}
              <Text style={styles.fieldLabel}>Kategori Produk *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: SIZES.sm }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryOption, categoryId === String(cat.id) && styles.categoryOptionSelected]}
                    onPress={() => setCategoryId(String(cat.id))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryOptionText, categoryId === String(cat.id) && styles.categoryOptionTextSelected]}>
                      {cat.name || cat.nama}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Harga Jual */}
              <Text style={styles.fieldLabel}>Harga Jual (Rp) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 45000"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              {/* Stok Produk */}
              <Text style={styles.fieldLabel}>{isEditing ? 'Stok Produk *' : 'Stok Awal *'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 50"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />

              {/* Satuan Produk Dropdown Chips */}
              <Text style={styles.fieldLabel}>Satuan Produk *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SIZES.sm }}>
                {['Pack', 'Pcs', 'Kg', 'Gram', 'Bungkus', 'Dus'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.categoryOption, unit === u && styles.categoryOptionSelected]}
                    onPress={() => setUnit(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryOptionText, unit === u && styles.categoryOptionTextSelected]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status Penjualan (Hanya saat edit) */}
              {isEditing && (
                <View style={{ marginBottom: SIZES.sm }}>
                  <Text style={styles.fieldLabel}>Status Penjualan *</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      style={[styles.categoryOption, status === 'active' && styles.categoryOptionSelected]}
                      onPress={() => setStatus('active')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryOptionText, status === 'active' && styles.categoryOptionTextSelected]}>
                        Aktif
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryOption, status === 'inactive' && styles.categoryOptionSelected]}
                      onPress={() => setStatus('inactive')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryOptionText, status === 'inactive' && styles.categoryOptionTextSelected]}>
                        Non-aktif
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Tombol Simpan */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={isEditing ? handleEditProduct : handleAddProduct}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>{isEditing ? 'Perbarui Produk' : 'Simpan Produk'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    padding: SIZES.paddingLg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingMd,
    paddingTop: SIZES.paddingMd,
    paddingBottom: SIZES.xs,
    backgroundColor: COLORS.white,
  },
  screenTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
  },
  screenSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: SIZES.radiusSm,
    ...SHADOWS.small,
  },
  addBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.paddingMd,
    paddingBottom: SIZES.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    paddingVertical: 2,
  },
  categoryTabsWrapper: {
    backgroundColor: COLORS.white,
    paddingBottom: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoryTabsContent: {
    paddingHorizontal: SIZES.paddingMd,
    flexDirection: 'row',
    gap: 8,
  },
  catTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  catTabItemSelected: {
    backgroundColor: COLORS.primary,
  },
  catTabText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  catTabTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  resultInfoRow: {
    paddingHorizontal: SIZES.paddingMd,
    paddingVertical: SIZES.xs,
  },
  resultInfoText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  listContainer: {
    padding: SIZES.paddingMd,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingSm,
    marginBottom: SIZES.sm,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.background,
  },
  catBadgeOverlay: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 76,
  },
  catBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  inactiveBadgeText: {
    fontSize: 9,
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: 'normal',
  },
  stockRow: {
    marginTop: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  normalStockBadge: {
    backgroundColor: COLORS.successLight,
  },
  lowStockBadge: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionColumn: {
    justifyContent: 'center',
    gap: 6,
    marginLeft: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  actionBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    marginTop: SIZES.sm,
  },
  emptySub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.paddingMd,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
  },
  modalBody: {
    padding: SIZES.paddingMd,
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: SIZES.md,
  },
  pickedImage: {
    width: 90,
    height: 90,
    borderRadius: SIZES.radiusMd,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
    marginTop: SIZES.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.paddingSm,
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.background,
    marginRight: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  categoryOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.paddingMd,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.soft,
  },
  submitBtnText: {
    color: COLORS.white,
    ...TYPOGRAPHY.button,
  },
  btnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});

export default AdminProductScreen;
