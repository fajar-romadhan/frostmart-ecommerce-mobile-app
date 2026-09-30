import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, TextInput, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';
import { exportPdfReport, exportExcelReport } from '../../utils/reportExportHelper';
import { formatRupiah } from '../../core/utils';

const NAMA_BULAN_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const NAMA_HARI_INDO = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const formatTanggalIndo = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = NAMA_BULAN_INDO[monthIdx] || parts[1];
  return `${day} ${monthName} ${year}`;
};

export const AdminReportScreen = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('daily'); // daily, yesterday, weekly, monthly, last_month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  // Indonesian Calendar Modal States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState('start'); // 'start' or 'end'
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-11

  const fetchSalesReport = async (selectedFilter, customStart = startDate, customEnd = endDate) => {
    setLoading(true);
    try {
      const res = await ApiService.get(`/admin/orders`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        // Filter orders by status 'Selesai'
        const completedOrders = body.data.filter(
          (o) => o.order_status?.toLowerCase() === 'selesai'
        );

        // Filter by date range (daily, yesterday, weekly, monthly, last_month, custom)
        const now = new Date();
        const filtered = completedOrders.filter((o) => {
          if (!o.order_date && !o.created_at) return true;
          const orderDate = new Date(o.order_date || o.created_at);
          if (selectedFilter === 'daily') {
            return orderDate.toDateString() === now.toDateString();
          } else if (selectedFilter === 'yesterday') {
            const y = new Date();
            y.setDate(now.getDate() - 1);
            return orderDate.toDateString() === y.toDateString();
          } else if (selectedFilter === 'weekly') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return orderDate >= sevenDaysAgo;
          } else if (selectedFilter === 'monthly') {
            return (
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear()
            );
          } else if (selectedFilter === 'last_month') {
            const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return (
              orderDate.getMonth() === lm.getMonth() &&
              orderDate.getFullYear() === lm.getFullYear()
            );
          } else if (selectedFilter === 'custom') {
            const sDate = customStart ? new Date(customStart) : new Date(0);
            sDate.setHours(0, 0, 0, 0);
            const eDate = customEnd ? new Date(customEnd) : new Date();
            eDate.setHours(23, 59, 59, 999);
            return orderDate >= sDate && orderDate <= eDate;
          }
          return true;
        });

        setOrders(filtered);
      }
    } catch (error) {
      console.error('Gagal mengambil laporan penjualan admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport(filter);
  }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchSalesReport(newFilter, startDate, endDate);
  };

  // Calculations for operational statistics
  const totalCompletedOrders = orders.length;
  let totalItemsSold = 0;
  let courierDeliveryCount = 0;
  let storePickupCount = 0;

  let totalSalesAmount = 0;
  orders.forEach((o) => {
    if (o.delivery_method === 'ambil_toko') {
      storePickupCount += 1;
    } else {
      courierDeliveryCount += 1;
    }

    totalSalesAmount += parseFloat(o.total_amount || o.total_harga || 0);

    const details = o.orderDetails || o.order_details || o.details || [];
    details.forEach((d) => {
      totalItemsSold += parseInt(d.quantity || d.jumlah || 1);
    });
  });

  const getFormattedDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleQuickDatePreset = (presetKey) => {
    setFilter('custom');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let sStr = '';
    let eStr = '';

    if (presetKey === 'first_half') {
      const s = new Date(currentYear, currentMonth, 1);
      const e = new Date(currentYear, currentMonth, 15);
      sStr = getFormattedDateStr(s);
      eStr = getFormattedDateStr(e);
    } else if (presetKey === 'second_half') {
      const s = new Date(currentYear, currentMonth, 16);
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const e = new Date(currentYear, currentMonth, lastDay);
      sStr = getFormattedDateStr(s);
      eStr = getFormattedDateStr(e);
    } else if (presetKey === 'this_month_full') {
      const s = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const e = new Date(currentYear, currentMonth, lastDay);
      sStr = getFormattedDateStr(s);
      eStr = getFormattedDateStr(e);
    } else if (presetKey === 'last_month_full') {
      const s = new Date(currentYear, currentMonth - 1, 1);
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const e = new Date(currentYear, currentMonth - 1, lastDay);
      sStr = getFormattedDateStr(s);
      eStr = getFormattedDateStr(e);
    }

    setStartDate(sStr);
    setEndDate(eStr);
    fetchSalesReport('custom', sStr, eStr);
  };

  const periodLabel =
    filter === 'daily'
      ? 'Hari Ini'
      : filter === 'yesterday'
      ? 'Kemarin'
      : filter === 'weekly'
      ? '7 Hari Terakhir'
      : filter === 'monthly'
      ? 'Bulan Ini'
      : filter === 'last_month'
      ? 'Bulan Lalu'
      : `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`;

  const handleExportPdf = () => {
    exportPdfReport({
      title: 'LAPORAN OPERASIONAL PENJUALAN TOKO',
      subtitle: 'Della Frozen Mart - Distributor & Retail Frozen Food',
      periodText: periodLabel,
      isOwner: false,
      stats: [
        { label: 'Pesanan Selesai', value: `${totalCompletedOrders} Transaksi` },
        { label: 'Produk Terjual', value: `${totalItemsSold} Item` },
        { label: 'Antar Kurir', value: `${courierDeliveryCount} Pesanan` },
        { label: 'Ambil di Toko', value: `${storePickupCount} Pesanan` },
      ],
      items: orders,
      user,
    });
  };

  const handleExportExcel = () => {
    exportExcelReport({
      title: 'Laporan_Operasional_Penjualan',
      periodText: periodLabel,
      isOwner: false,
      items: orders,
      user,
    });
  };

  const renderOrderItem = ({ item }) => {
    const details = item.orderDetails || item.order_details || item.details || [];
    const isPickup = item.delivery_method === 'ambil_toko';

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderCode}>{item.order_code || item.kode_pesanan}</Text>
            <Text style={styles.orderDate}>{item.order_date || item.created_at}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} style={{ marginRight: 4 }} />
            <Text style={styles.statusText}>Selesai</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.customerName}>{item.user?.name || 'Pelanggan'}</Text>
          <View style={[styles.methodBadge, isPickup ? { backgroundColor: '#E0F2FE' } : { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.methodText, isPickup ? { color: COLORS.primaryDark } : { color: '#D97706' }]}>
              {isPickup ? '🏬 Ambil di Toko' : '🛵 Antar Kurir'}
            </Text>
          </View>
        </View>

        {/* List of items purchased */}
        <View style={styles.itemListContainer}>
          {details.map((d, index) => (
            <Text key={index} style={styles.itemText}>
              • {d.quantity || d.jumlah}x {d.product_name || d.nama_produk || 'Produk Frozen'}
            </Text>
          ))}
        </View>

        {/* Nominal Harga Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Nominal Transaksi:</Text>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.success }}>
            {formatRupiah(item.total_amount || item.total_harga || 0)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs Header */}
      <View style={styles.filterWrapper}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Laporan Penjualan</Text>
            <Text style={styles.screenSubtitle}>Ringkasan transaksi pesanan selesai</Text>
          </View>
          <View style={styles.exportBtnGroup}>
            <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPdf} activeOpacity={0.8}>
              <Ionicons name="document-text" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.exportBtnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.excelBtn} onPress={handleExportExcel} activeOpacity={0.8}>
              <Ionicons name="stats-chart" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.exportBtnText}>EXCEL</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'daily' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('daily')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'daily' && styles.filterTextActive]}>Hari Ini</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'yesterday' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('yesterday')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'yesterday' && styles.filterTextActive]}>Kemarin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'weekly' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('weekly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'weekly' && styles.filterTextActive]}>7 Hari Terakhir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'monthly' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'monthly' && styles.filterTextActive]}>Bulan Ini</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'last_month' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('last_month')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'last_month' && styles.filterTextActive]}>Bulan Lalu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'custom' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('custom')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'custom' && styles.filterTextActive]}>📅 Pilih Tanggal</Text>
          </TouchableOpacity>
        </View>

        {filter === 'custom' && (
          <View style={styles.customDateBox}>
            <Text style={{ ...TYPOGRAPHY.smallBold, color: COLORS.secondary, marginBottom: 8 }}>PILIH RENTANG TANGGAL:</Text>
            
            {/* Quick Preset Buttons */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' }}
                onPress={() => handleQuickDatePreset('first_half')}
              >
                <Text style={{ fontSize: 11, color: '#4338CA', fontWeight: 'bold' }}>📅 1 s/d 15 Bulan Ini</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' }}
                onPress={() => handleQuickDatePreset('second_half')}
              >
                <Text style={{ fontSize: 11, color: '#4338CA', fontWeight: 'bold' }}>📅 16 s/d Akhir Bulan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' }}
                onPress={() => handleQuickDatePreset('this_month_full')}
              >
                <Text style={{ fontSize: 11, color: '#047857', fontWeight: 'bold' }}>📅 Seluruh Bulan Ini</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}
                onPress={() => handleQuickDatePreset('last_month_full')}
              >
                <Text style={{ fontSize: 11, color: '#B45309', fontWeight: 'bold' }}>📅 Seluruh Bulan Lalu</Text>
              </TouchableOpacity>
            </View>

            {/* Tombol Buka Kalender */}
            <TouchableOpacity
              style={styles.openCalendarBtn}
              onPress={() => setIsCalendarOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={20} color="#059669" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.secondary }}>
                  Buka Kalender
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  Mulai: <Text style={{ fontWeight: 'bold', color: '#059669' }}>{formatTanggalIndo(startDate)}</Text> | Selesai: <Text style={{ fontWeight: 'bold', color: '#0284C7' }}>{formatTanggalIndo(endDate)}</Text>
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => fetchSalesReport('custom', startDate, endDate)}
              activeOpacity={0.8}
            >
              <Ionicons name="filter" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.applyFilterText}>Terapkan Filter Laporan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal Kalender Interaktif */}
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalCard}>
            <View style={styles.calendarModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar" size={22} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.calendarModalTitle}>Kalender</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCalendarOpen(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
              {calendarTarget === 'start'
                ? '📌 Klik tanggal pada kalender di bawah untuk memilih TANGGAL MULAI:'
                : '📌 Klik tanggal pada kalender di bawah untuk memilih TANGGAL SELESAI:'}
            </Text>

            {/* Target Selector Tabs */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                style={[
                  styles.targetTabBtn,
                  calendarTarget === 'start' && { backgroundColor: '#059669', borderColor: '#059669' },
                ]}
                onPress={() => setCalendarTarget('start')}
              >
                <Text style={[styles.targetTabLabel, calendarTarget === 'start' && { color: '#FFF' }]}>
                  Mulai: {formatTanggalIndo(startDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.targetTabBtn,
                  calendarTarget === 'end' && { backgroundColor: '#0284C7', borderColor: '#0284C7' },
                ]}
                onPress={() => setCalendarTarget('end')}
              >
                <Text style={[styles.targetTabLabel, calendarTarget === 'end' && { color: '#FFF' }]}>
                  Selesai: {formatTanggalIndo(endDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigator (Indonesian) */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((prev) => prev - 1);
                  } else {
                    setCalMonth((prev) => prev - 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
              </TouchableOpacity>

              <Text style={styles.monthNavTitle}>
                {NAMA_BULAN_INDO[calMonth]} {calYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((prev) => prev + 1);
                  } else {
                    setCalMonth((prev) => prev + 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {/* Days Header (Indonesian) */}
            <View style={styles.dayNamesHeader}>
              {NAMA_HARI_INDO.map((h, i) => (
                <Text key={i} style={[styles.dayNameLabel, i === 0 && { color: COLORS.danger }]}>
                  {h}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calGridContainer}>
              {(() => {
                const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
                const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

                const grid = [];
                for (let i = 0; i < firstDayIndex; i++) {
                  grid.push(<View key={`blank-${i}`} style={styles.calDayCellEmpty} />);
                }
                for (let d = 1; d <= totalDays; d++) {
                  const monthStr = String(calMonth + 1).padStart(2, '0');
                  const dayStr = String(d).padStart(2, '0');
                  const dateStr = `${calYear}-${monthStr}-${dayStr}`;

                  const isSelectedStart = startDate === dateStr;
                  const isSelectedEnd = endDate === dateStr;
                  const isSelected = isSelectedStart || isSelectedEnd;

                  grid.push(
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[
                        styles.calDayCell,
                        isSelected && styles.calDayCellSelected,
                        isSelectedStart && { backgroundColor: '#059669' },
                        isSelectedEnd && { backgroundColor: '#0284C7' },
                      ]}
                      onPress={() => {
                        if (calendarTarget === 'start') {
                          setStartDate(dateStr);
                          setCalendarTarget('end');
                        } else {
                          setEndDate(dateStr);
                          setIsCalendarOpen(false);
                          fetchSalesReport('custom', startDate || dateStr, dateStr);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return grid;
              })()}
            </View>

            {/* Footer Apply Button */}
            <TouchableOpacity
              style={styles.calApplyBtn}
              onPress={() => {
                setIsCalendarOpen(false);
                fetchSalesReport('custom', startDate, endDate);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.calApplyText}>Terapkan Filter Tanggal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Operational Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { borderLeftColor: COLORS.success }]}>
            <Ionicons name="checkmark-done-circle" size={20} color={COLORS.success} />
            <Text style={styles.statVal}>{totalCompletedOrders}</Text>
            <Text style={styles.statLabel}>Pesanan Selesai</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: COLORS.primary }]}>
            <Ionicons name="cube" size={20} color={COLORS.primary} />
            <Text style={styles.statVal}>{totalItemsSold}</Text>
            <Text style={styles.statLabel}>Produk Terjual</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: '#D97706' }]}>
            <Ionicons name="bicycle" size={20} color="#D97706" />
            <Text style={styles.statVal}>{courierDeliveryCount}</Text>
            <Text style={styles.statLabel}>Antar Kurir</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: COLORS.primaryDark }]}>
            <Ionicons name="storefront" size={20} color={COLORS.primaryDark} />
            <Text style={styles.statVal}>{storePickupCount}</Text>
            <Text style={styles.statLabel}>Ambil di Toko</Text>
          </View>
        </View>
      </View>

      {/* Orders List Header */}
      <View style={styles.listHeaderRow}>
        <Ionicons name="list" size={18} color={COLORS.secondary} style={{ marginRight: 6 }} />
        <Text style={styles.listHeaderTitle}>Rincian Pesanan Terjual ({orders.length})</Text>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Belum Ada Pesanan Selesai</Text>
          <Text style={styles.emptySub}>
            Tidak ada transaksi penjualan selesai pada periode {filter === 'daily' ? 'Hari Ini' : filter === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.paddingMd,
    paddingTop: SIZES.paddingMd,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  exportBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  exportBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  screenTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
  },
  screenSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SIZES.sm,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    padding: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: SIZES.radiusSm,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  customDateBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm,
    marginTop: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: COLORS.secondary,
  },
  applyFilterBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  applyFilterText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: SIZES.paddingMd,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm,
    borderLeftWidth: 4,
    ...SHADOWS.soft,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingMd,
    marginBottom: SIZES.xs,
  },
  listHeaderTitle: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  listContent: {
    paddingHorizontal: SIZES.paddingMd,
    paddingBottom: SIZES.paddingLg,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingSm,
    marginBottom: SIZES.sm,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  orderDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemListContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: SIZES.radiusSm,
    padding: 8,
    marginTop: 4,
  },
  itemText: {
    fontSize: 11,
    color: COLORS.secondary,
    lineHeight: 16,
  },
  centerContainer: {
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
  openCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.large,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  targetTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  targetTabLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  monthNavBtn: {
    padding: 4,
  },
  monthNavTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  dayNamesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 6,
  },
  dayNameLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  calGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  calDayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calDayCellSelected: {
    backgroundColor: '#059669',
  },
  calDayText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calApplyBtn: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calApplyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default AdminReportScreen;
