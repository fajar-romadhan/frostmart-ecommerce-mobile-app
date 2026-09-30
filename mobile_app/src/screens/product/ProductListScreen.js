import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../../context/ProductContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import ProductCard from '../../components/ProductCard';

// Peta emoji per kategori — 12 Kategori Della Frozen Mart
const CATEGORY_ICONS = {
  'Semua'       : '🧊',
  'Frozen Food' : '❄️',
  'Bumbu'       : '🧂',
  'Es Krim'     : '🍦',
  'Menu Bakso'  : '🥩',
  'Makanan'     : '🍱',
  'Pertopingan' : '🧀',
  'Barang'      : '📦',
  'Snack'       : '🍟',
  'Minuman'     : '🧃',
  'Saos'        : '🥫',
  'Cemilan'     : '🍿',
  'Mainan Anak' : '🧸',
};

// ─── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'default',    label: 'Paling Relevan',   icon: 'star-outline' },
  { id: 'price_asc',  label: 'Harga Terendah',   icon: 'trending-down-outline' },
  { id: 'price_desc', label: 'Harga Tertinggi',  icon: 'trending-up-outline' },
  { id: 'name_asc',   label: 'Nama A–Z',          icon: 'text-outline' },
  { id: 'name_desc',  label: 'Nama Z–A',          icon: 'text-outline' },
  { id: 'stock',      label: 'Stok Terbanyak',    icon: 'layers-outline' },
];

const STOCK_OPTIONS = [
  { id: 'all',      label: 'Semua Stok' },
  { id: 'in_stock', label: 'Tersedia' },
  { id: 'low',      label: 'Stok Terbatas (≤10)' },
];

function applySortAndFilter(products, sort, stock) {
  let list = [...products];

  // Stock filter
  if (stock === 'in_stock') list = list.filter(p => p.stok > 0);
  else if (stock === 'low')  list = list.filter(p => p.stok > 0 && p.stok <= 10);

  // Sort
  switch (sort) {
    case 'price_asc':  list.sort((a, b) => Number(a.harga) - Number(b.harga)); break;
    case 'price_desc': list.sort((a, b) => Number(b.harga) - Number(a.harga)); break;
    case 'name_asc':   list.sort((a, b) => a.nama.localeCompare(b.nama)); break;
    case 'name_desc':  list.sort((a, b) => b.nama.localeCompare(a.nama)); break;
    case 'stock':      list.sort((a, b) => Number(b.stok) - Number(a.stok)); break;
    default: break;
  }
  return list;
}

export const ProductListScreen = () => {
  const { products, categories, isLoading, getProducts, getCategories, getProductsByCategory, searchProducts } = useProducts();

  const [refreshing, setRefreshing]             = useState(false);
  const [keyword, setKeyword]                   = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTimeout, setSearchTimeout]       = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedCategoryId) {
        await getProductsByCategory(selectedCategoryId);
      } else if (keyword.trim() !== '') {
        await searchProducts(keyword);
      } else {
        await getProducts();
      }
      await getCategories();
    } catch (e) {
      console.log('Refresh product list error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter panel state
  const [showFilter, setShowFilter]   = useState(false);
  const [sortId, setSortId]           = useState('default');
  const [stockFilter, setStockFilter] = useState('all');
  // pending (inside modal before apply)
  const [pendingSort, setPendingSort]   = useState('default');
  const [pendingStock, setPendingStock] = useState('all');

  // Badge animation
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selectedCategoryId === null && keyword === '') getProducts();
    getCategories();
  }, []);

  // Pulse badge whenever filters change
  useEffect(() => {
    if (sortId !== 'default' || stockFilter !== 'all') {
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1.4, duration: 150, useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 1,   duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [sortId, stockFilter]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (text) => {
    setKeyword(text);
    setSelectedCategoryId(null);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => {
      if (text.trim() === '') getProducts();
      else searchProducts(text);
    }, 400);
    setSearchTimeout(t);
  };

  const clearSearch = () => {
    setKeyword('');
    setSelectedCategoryId(null);
    if (searchTimeout) clearTimeout(searchTimeout);
    getProducts();
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategoryId(catId);
    setKeyword('');
    if (searchTimeout) clearTimeout(searchTimeout);
    if (catId === null) getProducts();
    else getProductsByCategory(catId);
  };

  const openFilter = () => {
    setPendingSort(sortId);
    setPendingStock(stockFilter);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setSortId(pendingSort);
    setStockFilter(pendingStock);
    setShowFilter(false);
  };

  const resetFilter = () => {
    setPendingSort('default');
    setPendingStock('all');
  };

  const hasActiveFilter = sortId !== 'default' || stockFilter !== 'all';
  const activeFilterCount = (sortId !== 'default' ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0);

  // Apply sort/filter locally (API already filtered by category/search)
  const displayedProducts = applySortAndFilter(products, sortId, stockFilter);

  // ─── Renders ───────────────────────────────────────────────────────────────
  const renderCategoryChip = ({ item }) => {
    const isSelected = selectedCategoryId === item.id;
    const emoji = CATEGORY_ICONS[item.name] || '🍱';
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleCategorySelect(item.id)}>
        {isSelected ? (
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chip, styles.chipSelected]}
          >
            <Text style={styles.chipEmoji}>{emoji}</Text>
            <Text style={[styles.chipText, styles.chipTextSelected]}>{item.name}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.chip}>
            <Text style={styles.chipEmoji}>{emoji}</Text>
            <Text style={styles.chipText}>{item.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Search + Filter Button ─────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk makanan beku..."
            placeholderTextColor={COLORS.textMuted}
            value={keyword}
            onChangeText={handleSearch}
          />
          {keyword !== '' && (
            <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} style={styles.clearIcon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter icon button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openFilter}
          style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
        >
          {hasActiveFilter ? (
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.filterBtnGradient}
            >
              <Ionicons name="options" size={20} color={COLORS.white} />
              <Animated.View style={[styles.filterBadge, { transform: [{ scale: badgePulse }] }]}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </Animated.View>
            </LinearGradient>
          ) : (
            <View style={styles.filterBtnGradient}>
              <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Active Filter Pills ────────────────────────────────────────── */}
      {hasActiveFilter && (
        <View style={styles.activePillsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activePillsContent}>
            {sortId !== 'default' && (
              <TouchableOpacity
                style={styles.activePill}
                activeOpacity={0.7}
                onPress={() => setSortId('default')}
              >
                <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.activePillGradient}>
                  <Text style={styles.activePillText}>{SORT_OPTIONS.find(s => s.id === sortId)?.label}</Text>
                  <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />
                </LinearGradient>
              </TouchableOpacity>
            )}
            {stockFilter !== 'all' && (
              <TouchableOpacity
                style={styles.activePill}
                activeOpacity={0.7}
                onPress={() => setStockFilter('all')}
              >
                <LinearGradient colors={[COLORS.accent, '#D97706']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.activePillGradient}>
                  <Text style={styles.activePillText}>{STOCK_OPTIONS.find(s => s.id === stockFilter)?.label}</Text>
                  <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.clearAllPill}
              activeOpacity={0.7}
              onPress={() => { setSortId('default'); setStockFilter('all'); }}
            >
              <Text style={styles.clearAllText}>Hapus Semua</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Categories Horizontal Bar ──────────────────────────────────── */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={[{ id: null, name: 'Semua' }, ...categories]}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => (item.id === null ? 'all' : item.id.toString())}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* ── Result count ──────────────────────────────────────────────── */}
      {!isLoading && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {displayedProducts.length} produk ditemukan
          </Text>
        </View>
      )}

      {/* ── Product Grid ──────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat produk...</Text>
        </View>
      ) : displayedProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="snow-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Produk tidak ditemukan</Text>
          <Text style={styles.emptyText}>Coba kata kunci lain, kategori berbeda, atau ubah filter.</Text>
          {hasActiveFilter && (
            <TouchableOpacity
              style={styles.resetFilterBtn}
              activeOpacity={0.8}
              onPress={() => { setSortId('default'); setStockFilter('all'); }}
            >
              <Text style={styles.resetFilterText}>Reset Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedProducts}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FILTER BOTTOM SHEET MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        />
        <View style={styles.filterSheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter &amp; Urutkan</Text>
            <TouchableOpacity onPress={resetFilter} activeOpacity={0.7}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── Sort Section ──────────────────────── */}
            <Text style={styles.sectionLabel}>Urutkan Berdasarkan</Text>
            <View style={styles.optionGrid}>
              {SORT_OPTIONS.map(opt => {
                const sel = pendingSort === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setPendingSort(opt.id)}
                    style={[styles.optionCard, sel && styles.optionCardSelected]}
                  >
                    {sel ? (
                      <LinearGradient
                        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                        start={{x:0,y:0}} end={{x:1,y:1}}
                        style={styles.optionCardInner}
                      >
                        <Ionicons name={opt.icon} size={16} color={COLORS.white} />
                        <Text style={[styles.optionText, styles.optionTextSelected]}>{opt.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.optionCardInner}>
                        <Ionicons name={opt.icon} size={16} color={COLORS.primary} />
                        <Text style={styles.optionText}>{opt.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Stock Section ─────────────────────── */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Filter Stok</Text>
            <View style={styles.stockRow}>
              {STOCK_OPTIONS.map(opt => {
                const sel = pendingStock === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setPendingStock(opt.id)}
                    style={[styles.stockChip, sel && styles.stockChipSelected]}
                  >
                    {sel ? (
                      <LinearGradient
                        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                        start={{x:0,y:0}} end={{x:1,y:0}}
                        style={styles.stockChipGradient}
                      >
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.white} style={{ marginRight: 5 }} />
                        <Text style={[styles.stockChipText, styles.stockChipTextSelected]}>{opt.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.stockChipGradient}>
                        <Text style={styles.stockChipText}>{opt.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

          </ScrollView>

          {/* Apply button */}
          <TouchableOpacity activeOpacity={0.85} onPress={applyFilter} style={styles.applyBtnWrap}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={styles.applyBtn}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.applyBtnText}>Terapkan Filter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Search bar ────────────────────────────────────────────────────────────
  searchContainer: {
    paddingHorizontal: SIZES.paddingLg,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusFull,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...SHADOWS.soft,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.body,
  },
  clearIcon: { padding: 4 },

  // ── Filter button ─────────────────────────────────────────────────────────
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  filterBtnActive: {
    borderColor: 'transparent',
  },
  filterBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
  },

  // ── Active filter pills ───────────────────────────────────────────────────
  activePillsRow: {
    backgroundColor: COLORS.white,
    paddingBottom: 8,
  },
  activePillsContent: {
    paddingHorizontal: SIZES.paddingLg,
    gap: 8,
    alignItems: 'center',
  },
  activePill: {
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  activePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  clearAllPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },

  // ── Category chips ────────────────────────────────────────────────────────
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingBottom: 12,
    ...SHADOWS.soft,
  },
  categoriesList: {
    paddingHorizontal: SIZES.paddingLg - 4,
    paddingTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 5,
    ...SHADOWS.soft,
  },
  chipSelected: {
    borderColor: 'transparent',
    borderWidth: 0,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondary,
    fontSize: 12,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '800',
  },

  // ── Result row ────────────────────────────────────────────────────────────
  resultRow: {
    paddingHorizontal: SIZES.paddingLg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  resultText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // ── States ────────────────────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingLg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
    marginTop: 12,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.primaryLight,
  },
  resetFilterText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  productsGrid: {
    paddingHorizontal: SIZES.paddingLg - 8,
    paddingVertical: 12,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },

  // ═════════════════════════════════════════════════════════════════════════
  // FILTER MODAL / BOTTOM SHEET
  // ═════════════════════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,27,45,0.45)',
  },
  filterSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SIZES.paddingLg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%',
    ...SHADOWS.heavy,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
  },
  resetText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.danger,
  },

  // Sort option cards (2-column grid)
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '47%',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  optionCardSelected: {
    borderColor: 'transparent',
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
  },
  optionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: '600',
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.white,
  },

  // Stock filter chips (full-width row)
  stockRow: {
    gap: 8,
  },
  stockChip: {
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  stockChipSelected: {
    borderColor: 'transparent',
  },
  stockChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
  },
  stockChipText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  stockChipTextSelected: {
    color: COLORS.white,
  },

  // Apply button
  applyBtnWrap: {
    marginTop: 24,
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
    ...SHADOWS.colored,
  },
  applyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: SIZES.radiusFull,
  },
  applyBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});

export default ProductListScreen;
