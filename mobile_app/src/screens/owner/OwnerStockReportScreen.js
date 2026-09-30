import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';

export const OwnerStockReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('all'); // all, warning, best

  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/admin/reports/stocks');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setData(body.data);
      }
    } catch (error) {
      console.error('Gagal mengambil laporan stok:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockReport();
  }, []);

  const renderProductRow = ({ item }) => (
    <View style={styles.rowItem}>
      <View style={{ flex: 2 }}>
        <Text style={styles.prodNameText} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.prodCatText}>{item.category?.name || 'Kategori'}</Text>
      </View>
      <View style={styles.rightInfoBox}>
        <Text style={styles.stockValText}>{item.stock} {item.unit}</Text>
        <Text style={styles.stockMinLabel}>Min: {item.minimum_stock}</Text>
      </View>
    </View>
  );

  const renderWarningRow = ({ item }) => (
    <View style={[styles.rowItem, styles.warningRow]}>
      <View style={{ flex: 2 }}>
        <Text style={[styles.prodNameText, { color: COLORS.danger }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.prodCatText}>{item.category?.name || 'Kategori'}</Text>
      </View>
      <View style={styles.rightInfoBox}>
        <Text style={[styles.stockValText, { color: COLORS.danger }]}>{item.stock} {item.unit}</Text>
        <Text style={styles.stockMinLabel}>Min: {item.minimum_stock}</Text>
      </View>
    </View>
  );

  const renderBestSellerRow = ({ item, index }) => (
    <View style={styles.rowItem}>
      <View style={styles.rankBox}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <View style={{ flex: 2 }}>
        <Text style={styles.prodNameText} numberOfLines={1}>{item.nama_produk || 'Produk'}</Text>
        <Text style={styles.prodCatText}>ID Produk: {item.produk_id}</Text>
      </View>
      <View style={styles.rightInfoBox}>
        <Text style={[styles.stockValText, { color: COLORS.success }]}>{item.total_sold} Terjual</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Determine list items based on selected tab
  let listData = [];
  let renderItemFunc = renderProductRow;
  let emptyMsg = '';

  if (tab === 'all') {
    listData = data?.all_products || [];
    renderItemFunc = renderProductRow;
    emptyMsg = 'Tidak ada data produk.';
  } else if (tab === 'warning') {
    listData = data?.warning_products || [];
    renderItemFunc = renderWarningRow;
    emptyMsg = 'Stok semua produk aman (tidak ada produk menipis).';
  } else if (tab === 'best') {
    listData = data?.best_sellers || [];
    renderItemFunc = renderBestSellerRow;
    emptyMsg = 'Belum ada data barang terjual.';
  }

  return (
    <View style={styles.container}>
      {/* Subheader tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'all' && styles.tabActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Semua Stok</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'warning' && styles.tabActive]}
          onPress={() => setTab('warning')}
        >
          <Text style={[styles.tabText, tab === 'warning' && styles.tabTextActive]}>Stok Menipis</Text>
          {data?.warning_products?.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{data.warning_products.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'best' && styles.tabActive]}
          onPress={() => setTab('best')}
        >
          <Text style={[styles.tabText, tab === 'best' && styles.tabTextActive]}>Terlaris</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={listData}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderItemFunc}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyMsg}</Text>
          </View>
        }
      />
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SIZES.sm,
    ...SHADOWS.soft,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  badgeCount: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
  },
  listContainer: {
    padding: SIZES.paddingMd,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.paddingMd,
    marginBottom: SIZES.sm,
    ...SHADOWS.soft,
  },
  warningRow: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  rankBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  prodNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  prodCatText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightInfoBox: {
    alignItems: 'flex-end',
  },
  stockValText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  stockMinLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    padding: SIZES.paddingLg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default OwnerStockReportScreen;
