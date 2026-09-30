import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ApiService, isAbortError } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';
import { exportPdfReport, exportExcelReport } from '../../utils/reportExportHelper';

const NAMA_BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const NAMA_HARI_INDO = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const OwnerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('daily'); // daily, weekly, monthly, custom

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState('start'); // 'start' | 'end'
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const TRANSACTIONS_PREVIEW_LIMIT = 5;

  // ── Top Products Modal ──────────────────────────────────────────────────────
  const [topProductsModalOpen, setTopProductsModalOpen] = useState(false);
  const [topProductsList, setTopProductsList] = useState([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [tpStartDate, setTpStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [tpEndDate, setTpEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [tpCalOpen, setTpCalOpen] = useState(false);
  const [tpCalTarget, setTpCalTarget] = useState('start');
  const [tpCalMonth, setTpCalMonth] = useState(new Date().getMonth());
  const [tpCalYear, setTpCalYear] = useState(new Date().getFullYear());

  const [allOrders, setAllOrders] = useState([]);
  const [activeTimeFrame, setActiveTimeFrame] = useState('1H'); // 1H, 1M, 1B
  const [selectedBar, setSelectedBar] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await ApiService.get('/admin/dashboard');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setStats(body.data);
      }
    } catch (error) {
      console.error('Gagal memuat statistik owner:', error);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await ApiService.get('/admin/orders');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setAllOrders(body.data || []);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Gagal memuat seluruh pesanan grafik:', error);
      }
    }
  };

  const fetchReport = async (selectedFilter, customStart = startDate, customEnd = endDate, isBackground = false) => {
    if (!isBackground) {
      setReportLoading(true);
    }
    try {
      let url = `/admin/reports/sales?filter=${selectedFilter}`;
      if (selectedFilter === 'custom' && customStart && customEnd) {
        url += `&start_date=${customStart}&end_date=${customEnd}`;
      }
      const res = await ApiService.get(url);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setReportData(body.data);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Gagal memuat laporan penjualan:', error?.message);
      }
    } finally {
      if (!isBackground) {
        setReportLoading(false);
      }
    }
  };

  const getFormattedDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const d = parseInt(parts[2]);
        return `${d} ${NAMA_BULAN_INDO[m]} ${y}`;
      }
      const d = new Date(dateStr);
      return `${d.getDate()} ${NAMA_BULAN_INDO[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
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
    fetchReport('custom', sStr, eStr);
  };

  // --- Log Aktivitas Filter Tanggal Simple ---
  const [activityLogs, setActivityLogs] = useState([]);
  const [logDateFilter, setLogDateFilter] = useState('all'); // 'all', 'today', '7d', '30d'

  const fetchActivityLogs = async (dateFilter = logDateFilter) => {
    try {
      let query = '';
      if (dateFilter === 'today') {
        const t = getFormattedDateStr(new Date());
        query = `?start_date=${t}&end_date=${t}`;
      } else if (dateFilter === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 6);
        query = `?start_date=${getFormattedDateStr(d)}&end_date=${getFormattedDateStr(new Date())}`;
      } else if (dateFilter === '30d') {
        const d = new Date(); d.setDate(d.getDate() - 29);
        query = `?start_date=${getFormattedDateStr(d)}&end_date=${getFormattedDateStr(new Date())}`;
      }

      const res = await ApiService.get(`/admin/activity-logs${query}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setActivityLogs(body.data || []);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Gagal memuat log aktivitas:', error?.message || error);
      }
    }
  };

  const handleLogDateFilterChange = (f) => {
    setLogDateFilter(f);
    fetchActivityLogs(f);
  };

  const isSyncingRef = useRef(false);

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchReport(filter, startDate, endDate, false), fetchAllOrders(), fetchActivityLogs()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    initData();
    // Realtime auto-refresh data omset, grafik & log aktivitas setiap 5 detik dengan in-flight guard
    const timer = setInterval(async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        await Promise.all([
          fetchStats(),
          fetchReport(filter, startDate, endDate, true),
          fetchAllOrders(),
          fetchActivityLogs(),
        ]);
      } catch (err) {
        if (!isAbortError(err)) {
          console.log('Owner background sync error:', err?.message || err);
        }
      } finally {
        isSyncingRef.current = false;
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [filter, startDate, endDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    initData();
  }, [filter, startDate, endDate]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setShowAllTransactions(false); // reset ke preview mode saat filter berubah
    fetchReport(newFilter, startDate, endDate);
  };

  const periodLabel =
    filter === 'daily'
      ? 'Hari Ini'
      : filter === 'weekly'
      ? 'Minggu Ini'
      : filter === 'monthly'
      ? 'Bulan Ini'
      : `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`;

  const fetchTopProducts = async (start, end) => {
    setTopProductsLoading(true);
    try {
      const params = `?start_date=${start}&end_date=${end}`;
      const res  = await ApiService.get(`/admin/reports/top-products${params}`);
      const body = await res.json();
      setTopProductsList(body?.data || []);
    } catch (e) {
      setTopProductsList([]);
    } finally {
      setTopProductsLoading(false);
    }
  };

  const openTopProductsModal = () => {
    setTopProductsModalOpen(true);
    fetchTopProducts(tpStartDate, tpEndDate);
  };

  const handleExportPdf = () => {
    const ordersList = reportData?.recent_orders || reportData?.orders || [];
    let totalItems = 0;
    let totalShipping = 0;

    ordersList.forEach((o) => {
      totalShipping += parseFloat(o.ongkos_kirim ?? o.shipping_fee ?? 0);
      const details = o.orderDetails || o.order_details || o.details || [];
      details.forEach((d) => {
        totalItems += parseInt(d.quantity || d.jumlah || 1);
      });
    });

    const totalOmzetText = `Rp ${(reportData?.total_sales ?? 0).toLocaleString('id-ID')}`;
    const totalOrdersText = `${reportData?.total_orders ?? ordersList.length} Transaksi`;

    exportPdfReport({
      title: 'LAPORAN FINANCIAL & OMZET PENJUALAN LENGKAP OWNER',
      subtitle: 'Della Frozen Mart - Distributor & Retail Frozen Food',
      periodText: periodLabel,
      isOwner: true,
      stats: [
        { label: `Total Omzet Netto (${periodLabel})`, value: totalOmzetText },
        { label: 'Total Pesanan Selesai', value: totalOrdersText },
        { label: 'Total Produk Terjual', value: `${totalItems} Item` },
        { label: 'Total Ongkir Disalurkan', value: `Rp ${totalShipping.toLocaleString('id-ID')}` },
      ],
      items: ordersList,
      user,
    });
  };

  const handleExportExcel = () => {
    const ordersList = reportData?.recent_orders || reportData?.orders || [];
    exportExcelReport({
      title: 'Laporan_Omzet_Financial_Lengkap_Owner',
      periodText: periodLabel,
      isOwner: true,
      items: ordersList,
      user,
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderOrderRow = ({ item }) => (
    <View style={styles.orderRow}>
      <View>
        <Text style={styles.orderCodeText}>{item.order_code}</Text>
        <Text style={styles.orderCustomerText}>{item.user?.name || 'Pelanggan'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.orderAmountText}>Rp {item.total_amount.toLocaleString('id-ID')}</Text>
        <Text style={styles.orderDateText}>{item.order_date}</Text>
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

  const getCryptoChartData = () => {
    const completed = allOrders.filter(
      (o) => (o.order_status || o.status || '').toLowerCase() === 'selesai'
    );

    const now = new Date();
    let bars = [];
    let prevSum = 0;
    let currSum = 0;

    if (activeTimeFrame === '1H') {
      // 7 Hari Terakhir (Harian)
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];

        const dayOrders = completed.filter((o) => {
          const oDate = (o.order_date || o.created_at || '').split(' ')[0];
          return oDate === dateStr;
        });

        const sum = dayOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
        bars.push({ label: dayLabel, fullDate: dateStr, value: sum, count: dayOrders.length });
        if (i < 3) currSum += sum;
        else prevSum += sum;
      }
    } else if (activeTimeFrame === '1M') {
      // 4 Minggu Terakhir
      for (let w = 4; w >= 1; w--) {
        const startW = new Date();
        startW.setDate(now.getDate() - w * 7);
        const endW = new Date();
        endW.setDate(now.getDate() - (w - 1) * 7);

        const weekOrders = completed.filter((o) => {
          const oDate = new Date(o.order_date || o.created_at);
          return oDate >= startW && oDate < endW;
        });

        const sum = weekOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
        bars.push({ label: `Mg ${5 - w}`, value: sum, count: weekOrders.length });
        if (w <= 2) currSum += sum;
        else prevSum += sum;
      }
    } else if (activeTimeFrame === '1B') {
      // 6 Bulan Terakhir
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const mLabel = d.toLocaleDateString('id-ID', { month: 'short' });

        const monthOrders = completed.filter((o) => {
          const oDate = new Date(o.order_date || o.created_at);
          return oDate.getMonth() === d.getMonth() && oDate.getFullYear() === d.getFullYear();
        });

        const sum = monthOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
        bars.push({ label: mLabel, value: sum, count: monthOrders.length });
        if (m < 3) currSum += sum;
        else prevSum += sum;
      }
    } else {
      // ALL / Tahunan
      for (let y = 3; y >= 0; y--) {
        const targetYear = now.getFullYear() - y;

        const yearOrders = completed.filter((o) => {
          const oDate = new Date(o.order_date || o.created_at);
          return oDate.getFullYear() === targetYear;
        });

        const sum = yearOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
        bars.push({ label: `${targetYear}`, value: sum, count: yearOrders.length });
        if (y < 2) currSum += sum;
        else prevSum += sum;
      }
    }

    const totalVal = bars.reduce((acc, b) => acc + b.value, 0);
    const growth = prevSum > 0 ? (((currSum - prevSum) / prevSum) * 100).toFixed(1) : (currSum > 0 ? '+100' : '0.0');

    return { bars, totalVal, growth };
  };

  const { bars: chartBars, totalVal: chartTotalOmzet, growth: growthPercentage } = getCryptoChartData();

  return (
    <View style={styles.container}>
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.welcomeText}>Laporan Owner,</Text>
          <Text style={styles.ownerName} numberOfLines={1}>{user?.name || 'Owner Toko'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>OWNER PANEL</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Modern Gen-Z Crypto-Style Omzet Chart Card */}
      <View style={styles.cryptoCardContainer}>
        <View style={styles.cryptoCardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="stats-chart" size={16} color="#10B981" />
              <Text style={styles.cryptoTitleText}>GRAFIK OMZET PENJUALAN</Text>
            </View>
            <Text style={styles.cryptoOmzetVal}>
              Rp {(selectedBar ? selectedBar.value : chartTotalOmzet).toLocaleString('id-ID')}
            </Text>
            <Text style={styles.cryptoSubtitleText}>
              {selectedBar ? `📌 Data ${selectedBar.fullDate || selectedBar.label}: ${selectedBar.count} Transaksi` : `📊 Total Filter Periode: ${activeTimeFrame}`}
            </Text>
          </View>

          <View style={[styles.trendBadge, parseFloat(growthPercentage) >= 0 ? styles.trendBadgeUp : styles.trendBadgeDown]}>
            <Ionicons
              name={parseFloat(growthPercentage) >= 0 ? "trending-up" : "trending-down"}
              size={14}
              color={parseFloat(growthPercentage) >= 0 ? "#10B981" : "#EF4444"}
            />
            <Text style={[styles.trendText, parseFloat(growthPercentage) >= 0 ? styles.trendTextUp : styles.trendTextDown]}>
              {parseFloat(growthPercentage) >= 0 ? `+${growthPercentage}%` : `${growthPercentage}%`}
            </Text>
          </View>
        </View>

        {/* Crypto Timeframe Filter Pills (Gen Z UI) */}
        <View style={styles.timeframePillsRow}>
          {[
            { key: '1H', label: '1H (Hari)' },
            { key: '1M', label: '1M (Minggu)' },
            { key: '1B', label: '1B (Bulan)' },
          ].map((tf) => (
            <TouchableOpacity
              key={tf.key}
              style={[styles.pillBtn, activeTimeFrame === tf.key && styles.pillBtnActive]}
              onPress={() => {
                setActiveTimeFrame(tf.key);
                setSelectedBar(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, activeTimeFrame === tf.key && styles.pillTextActive]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Crypto Bars Visualizer */}
        <View style={styles.barsVisualizerContainer}>
          {chartBars.map((b, idx) => {
            const maxVal = Math.max(...chartBars.map((item) => item.value), 1);
            const barHeightPct = Math.max((b.value / maxVal) * 100, 12);
            const isSelected = selectedBar?.label === b.label;

            return (
              <TouchableOpacity
                key={idx}
                style={styles.barCol}
                onPress={() => setSelectedBar(isSelected ? null : b)}
                activeOpacity={0.7}
              >
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${barHeightPct}%` },
                      isSelected && styles.barFillSelected,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabelText, isSelected && styles.barLabelSelected]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Ringkasan Omzet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Bisnis</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary, width: '100%' }]}>
            <Text style={styles.statVal}>{stats?.total_products ?? 0} Produk</Text>
            <Text style={styles.statLabel}>Total Produk Terdaftar</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: COLORS.accent, width: '100%', marginTop: SIZES.sm }]}>
            <Text style={[styles.statVal, { fontSize: 20 }]}>
              Rp {(stats?.total_sales_amount ?? 0).toLocaleString('id-ID')}
            </Text>
            <Text style={styles.statLabel}>Total Akumulasi Omzet Penjualan</Text>
          </View>
        </View>
      </View>

      {/* Laporan Penjualan */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Laporan Omzet Penjualan</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.pdfBtn, { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }]}
              onPress={handleExportPdf}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={13} color={COLORS.white} style={{ marginRight: 3 }} />
              <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: 'bold' }}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.excelBtn, { backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }]}
              onPress={handleExportExcel}
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart" size={13} color={COLORS.white} style={{ marginRight: 3 }} />
              <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: 'bold' }}>EXCEL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tab */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'daily' && styles.filterTabActive]}
            onPress={() => handleFilterChange('daily')}
          >
            <Text style={[styles.filterTabText, filter === 'daily' && styles.filterTabTextActive]}>Harian</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'weekly' && styles.filterTabActive]}
            onPress={() => handleFilterChange('weekly')}
          >
            <Text style={[styles.filterTabText, filter === 'weekly' && styles.filterTabTextActive]}>Mingguan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'monthly' && styles.filterTabActive]}
            onPress={() => handleFilterChange('monthly')}
          >
            <Text style={[styles.filterTabText, filter === 'monthly' && styles.filterTabTextActive]}>Bulanan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'custom' && styles.filterTabActive]}
            onPress={() => handleFilterChange('custom')}
          >
            <Text style={[styles.filterTabText, filter === 'custom' && styles.filterTabTextActive]}>Kustom</Text>
          </TouchableOpacity>
        </View>

        {filter === 'custom' && (
          <View style={styles.customDateBox}>
            <Text style={{ ...TYPOGRAPHY.smallBold, color: COLORS.secondary, marginBottom: 8 }}>PILIH RENTANG TANGGAL LAPORAN:</Text>
            
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
              onPress={() => fetchReport('custom', startDate, endDate)}
              activeOpacity={0.8}
            >
              <Ionicons name="filter" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.applyFilterText}>Terapkan Filter Laporan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Report */}
        <View style={styles.reportSummaryBox}>
          {reportLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 10 }} />
          ) : (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Omzet ({periodLabel})</Text>
                <Text style={styles.summaryVal}>Rp {(reportData?.total_sales ?? 0).toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryItemRight}>
                <Text style={styles.summaryLabel}>Jumlah Pesanan</Text>
                <Text style={styles.summaryVal}>{reportData?.total_orders ?? 0} Transaksi</Text>
              </View>
            </View>
          )}
        </View>

        {/* 🏆 Champion Card — Produk Terlaris #1 */}
        {(() => {
          const top1 = reportData?.top_products?.[0];
          if (reportLoading || !top1) return null;
          return (
            <TouchableOpacity
              style={styles.championCard}
              onPress={() => navigation.navigate('OwnerTopProducts')}
              activeOpacity={0.85}
            >
              <View style={styles.championLeft}>
                <Text style={styles.championTrophy}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.championLabel}>PRODUK TERLARIS · 30 HARI TERAKHIR</Text>
                  <Text style={styles.championName} numberOfLines={2}>
                    {top1.nama_produk || 'Produk'}
                  </Text>
                  <Text style={styles.championSub}>
                    {parseFloat(top1.total_terjual || 0)} unit terjual · Rp{' '}
                    {parseFloat(top1.total_omzet || 0).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
              <View style={styles.championArrow}>
                <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
                <Text style={{ fontSize: 9, color: '#F59E0B', fontWeight: '700', marginTop: 2 }}>
                  Lihat{'\n'}Semua
                </Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* List Pesanan Laporan */}
        {(() => {
          const allTrx = reportData?.orders || [];
          const totalTrx = allTrx.length;
          const visibleTrx = showAllTransactions ? allTrx : allTrx.slice(0, TRANSACTIONS_PREVIEW_LIMIT);
          const hasMore = totalTrx > TRANSACTIONS_PREVIEW_LIMIT;

          return (
            <>
              {/* Header row: label + count badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SIZES.md, marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, { flex: 1 }]}>Daftar Transaksi Selesai:</Text>
                {totalTrx > 0 && (
                  <View style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.primary }}>{totalTrx} transaksi</Text>
                  </View>
                )}
              </View>

              <View style={styles.listContainer}>
                {reportLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SIZES.lg }} />
                ) : totalTrx > 0 ? (
                  visibleTrx.map((item) => (
                    <View key={item.id}>
                      {renderOrderRow({ item })}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Tidak ada riwayat transaksi pada periode ini.</Text>
                )}
              </View>

              {/* Toggle Expand / Collapse */}
              {hasMore && !reportLoading && (
                <TouchableOpacity
                  style={styles.expandToggleBtn}
                  onPress={() => setShowAllTransactions((prev) => !prev)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={showAllTransactions ? 'chevron-up-circle' : 'chevron-down-circle'}
                    size={16}
                    color={COLORS.primary}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.expandToggleText}>
                    {showAllTransactions
                      ? 'Sembunyikan'
                      : `Lihat Semua (${totalTrx - TRANSACTIONS_PREVIEW_LIMIT} transaksi lainnya)`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          );
        })()}
      </View>

      {/* Log Aktivitas */}
      <View style={[styles.section, { marginBottom: SIZES.paddingLg }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="footsteps" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Log Aktivitas</Text>
          </View>
        </View>

        {/* Filter Tanggal Simple */}
        <View style={styles.logSimpleFilterRow}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'today', label: 'Hari Ini' },
            { key: '7d', label: '7 Hari' },
            { key: '30d', label: '30 Hari' },
          ].map((item) => {
            const isActive = logDateFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.logSimpleFilterBtn, isActive && styles.logSimpleFilterBtnActive]}
                onPress={() => handleLogDateFilterChange(item.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.logSimpleFilterText, isActive && styles.logSimpleFilterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.activityLogCardContainer}>
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <View key={log.id} style={styles.activityLogItem}>
                <View style={styles.activityLogAvatar}>
                  <Text style={styles.activityLogAvatarText}>
                    {(log.user_name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.activityAdminName}>
                      {log.user_name || 'Admin'}
                    </Text>
                    <View style={styles.actionTagBadge}>
                      <Text style={styles.actionTagText}>
                        {(log.action || 'AKTIVITAS').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.activityDescription}>
                    {log.description}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="time-outline" size={11} color={COLORS.textMuted} style={{ marginRight: 3 }} />
                    <Text style={styles.activityTimeText}>
                      {log.formatted_time || log.created_at}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: SIZES.paddingMd, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Tidak ada catatan aktivitas pada tanggal ini.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>




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
                        }
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.calDayText,
                          isSelected && styles.calDayTextSelected,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return grid;
              })()}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.applyFilterBtn, { flex: 1, backgroundColor: '#059669' }]}
                onPress={() => {
                  setIsCalendarOpen(false);
                  fetchReport('custom', startDate, endDate);
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.applyFilterText}>Simpan & Terapkan</Text>
              </TouchableOpacity>
            </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.paddingLg,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: SIZES.radiusLg,
    borderBottomRightRadius: SIZES.radiusLg,
    ...SHADOWS.soft,
    marginBottom: SIZES.md,
  },
  headerTitleBox: {
    flex: 1,
    marginRight: SIZES.md,
  },
  welcomeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  ownerName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accent,
  },
  logoutBtn: {
    padding: SIZES.paddingSm,
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radiusMd,
  },
  section: {
    paddingHorizontal: SIZES.paddingMd,
    marginTop: SIZES.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  stockLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  stockLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    borderLeftWidth: 4,
    ...SHADOWS.light,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: 4,
    ...SHADOWS.soft,
    marginBottom: SIZES.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: SIZES.radiusSm,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  reportSummaryBox: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    ...SHADOWS.light,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1.5,
  },
  summaryItemRight: {
    flex: 1,
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderLight,
    paddingLeft: SIZES.sm,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SIZES.sm,
  },
  listContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingSm,
    ...SHADOWS.soft,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 9,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryLight || '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* ── Champion Card (Top #1 Preview) ── */
  championCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginTop: SIZES.md,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  championLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  championTrophy: {
    fontSize: 30,
  },
  championLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  championName: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.secondary,
    marginBottom: 3,
  },
  championSub: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  championArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  topProductMedal: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
    marginTop: 1,
  },
  topProductName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    flex: 1,
    marginRight: 8,
  },
  topProductQty: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topProductBarBg: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 3,
  },
  topProductBarFill: {
    height: 5,
    borderRadius: 10,
  },
  topProductOmzet: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSm,
    paddingHorizontal: SIZES.paddingSm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  orderCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  orderCustomerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  orderDateText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SIZES.md,
  },

  /* Gen-Z Crypto Style Chart Card */
  cryptoCardContainer: {
    marginHorizontal: SIZES.paddingMd,
    backgroundColor: '#0F172A', // Midnight dark theme for crypto feel
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...SHADOWS.large,
  },
  cryptoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cryptoTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  cryptoOmzetVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  cryptoSubtitleText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendBadgeUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  trendBadgeDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  trendTextUp: {
    color: '#10B981',
  },
  trendTextDown: {
    color: '#EF4444',
  },

  /* Timeframe Pills */
  timeframePillsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  pillBtnActive: {
    backgroundColor: '#10B981',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  /* Bars Visualizer */
  barsVisualizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#1E293B',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#059669',
    borderRadius: 7,
  },
  barFillSelected: {
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  barLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  barLabelSelected: {
    color: '#10B981',
    fontWeight: '800',
  },

  /* Real-Time Activity Log Card Styles */
  activityLogCardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingSm,
    ...SHADOWS.soft,
  },
  activityLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 10,
  },
  activityLogAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activityLogAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activityAdminName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  actionTagBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
  },
  activityDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  activityTimeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  /* Simple Log Activity Date Filter Styles */
  logSimpleFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SIZES.sm,
  },
  logSimpleFilterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.soft,
  },
  logSimpleFilterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  logSimpleFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  logSimpleFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Custom Date & Interactive Calendar Modal Styles */
  customDateBox: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginBottom: SIZES.md,
    ...SHADOWS.soft,
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
  applyFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSm,
  },
  applyFilterText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
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
});

export default OwnerDashboardScreen;
