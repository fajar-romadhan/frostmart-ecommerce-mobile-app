import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../core/api';
import { COLORS, SHADOWS, SIZES } from '../../core/theme';

// ── Konstanta ──────────────────────────────────────────────────────────────────
const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'];
const NAMA_HARI  = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const toDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today     = () => new Date();
const daysAgo   = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatIndo = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${NAMA_BULAN[parseInt(m, 10) - 1]} ${y}`;
};

// ── Screen ─────────────────────────────────────────────────────────────────────
export const OwnerTopProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('30 Hari');
  const [startDate, setStartDate] = useState(toDateStr(daysAgo(29)));
  const [endDate, setEndDate] = useState(toDateStr(today()));

  // Calendar modal state
  const [calOpen, setCalOpen] = useState(false);
  const [calTarget, setCalTarget] = useState('start'); // 'start' | 'end'
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const fetchProducts = useCallback(async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await ApiService.get(`/admin/reports/top-products?start_date=${start}&end_date=${end}`);
      let body;
      try {
        body = await res.json();
      } catch (jsonErr) {
        console.error('JSON parse error in topProducts:', jsonErr);
        setProducts([]);
        setError('Gagal memuat data. Server tidak merespons dengan benar.');
        return;
      }
      if (res.status === 200 && body?.success !== false) {
        setProducts(body?.data || []);
      } else {
        setProducts([]);
        if (res.status === 401 || res.status === 403) {
          setError('Akses ditolak. Pastikan Anda login sebagai Owner.');
        } else {
          setError(body?.message || 'Gagal memuat data produk terlaris.');
        }
      }
    } catch (e) {
      console.error('Network error in fetchProducts:', e);
      setProducts([]);
      setError('Gagal terhubung ke server. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount with default 30 days
  React.useEffect(() => {
    fetchProducts(startDate, endDate);
  }, []);

  const applyFilter = () => {
    setSelectedPreset(null);
    fetchProducts(startDate, endDate);
  };

  const applyPreset = (label, days) => {
    setSelectedPreset(label);
    const s = toDateStr(daysAgo(days - 1));
    const e = toDateStr(today());
    setStartDate(s);
    setEndDate(e);
    fetchProducts(s, e);
  };

  const openCal = (target) => {
    setCalTarget(target);
    const d = new Date(calYear, calMonth, 1);
    // Jump calendar to currently selected date's month
    const ref = target === 'start' ? startDate : endDate;
    if (ref) {
      const parts = ref.split('-');
      setCalYear(parseInt(parts[0], 10));
      setCalMonth(parseInt(parts[1], 10) - 1);
    }
    setCalOpen(true);
  };

  const onDayPick = (dateStr) => {
    if (calTarget === 'start') setStartDate(dateStr);
    else setEndDate(dateStr);
    setCalOpen(false);
  };

  // ── Calendar Grid ─────────────────────────────────────────────────────────────
  const renderCalendar = () => {
    const firstDay     = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
    const selectedDate = calTarget === 'start' ? startDate : endDate;
    const cells = [];

    NAMA_HARI.forEach((h) =>
      cells.push(
        <View key={`h-${h}`} style={cal.headerCell}>
          <Text style={cal.headerText}>{h}</Text>
        </View>
      )
    );
    for (let i = 0; i < firstDay; i++)
      cells.push(<View key={`e-${i}`} style={cal.dayCell} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const ds  = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const sel = ds === selectedDate;
      cells.push(
        <TouchableOpacity key={ds} style={cal.dayCell} onPress={() => onDayPick(ds)}>
          <View style={[cal.dayCircle, sel && cal.dayCircleSel]}>
            <Text style={[cal.dayText, sel && cal.dayTextSel]}>{day}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return cells;
  };

  // ── Medal & Bar Colors ────────────────────────────────────────────────────────
  const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];
  const RANK_COLOR  = ['#F59E0B', '#94A3B8', '#B45309'];
  const maxQty      = Math.max(...products.map((p) => parseFloat(p.total_terjual || 0)), 1);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🏆 Produk Terlaris</Text>
          <Text style={styles.headerSub}>{formatIndo(startDate)} — {formatIndo(endDate)}</Text>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>FILTER PERIODE</Text>

        {/* Quick Presets */}
        <View style={styles.presetRow}>
          {[
            { label: 'Hari Ini', days: 1   },
            { label: '7 Hari',   days: 7   },
            { label: '30 Hari',  days: 30  },
            { label: '3 Bulan',  days: 90  },
            { label: 'Semua',    days: 365 },
          ].map((p) => {
            const isActive = selectedPreset === p.label;
            return (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.presetBtn,
                  isActive && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                ]}
                onPress={() => applyPreset(p.label, p.days)}
              >
                <Text style={[styles.presetText, isActive && { color: '#FFF', fontWeight: '800' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Pickers */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.datePill} onPress={() => openCal('start')}>
            <Ionicons name="calendar-outline" size={14} color="#4338CA" style={{ marginRight: 4 }} />
            <View>
              <Text style={styles.datePillLabel}>Mulai</Text>
              <Text style={styles.datePillVal}>{startDate}</Text>
            </View>
          </TouchableOpacity>

          <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>s/d</Text>

          <TouchableOpacity style={[styles.datePill, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]} onPress={() => openCal('end')}>
            <Ionicons name="calendar-outline" size={14} color="#0369A1" style={{ marginRight: 4 }} />
            <View>
              <Text style={[styles.datePillLabel, { color: '#0369A1' }]}>Selesai</Text>
              <Text style={styles.datePillVal}>{endDate}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
            <Ionicons name="search" size={16} color="#FFF" />
            <Text style={styles.applyBtnText}>Cari</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ranking List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: COLORS.danger }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.applyBtn, { marginTop: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => fetchProducts(startDate, endDate)}
            >
              <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
            <Text style={styles.emptyText}>Tidak ada data produk terjual</Text>
            <Text style={styles.emptySubText}>pada periode {formatIndo(startDate)} — {formatIndo(endDate)}</Text>
            <View style={{ marginTop: 16, backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
              <Text style={{ fontSize: 11, color: '#92400E', lineHeight: 16, fontWeight: '600' }}>
                💡 Catatan: Sistem hanya menghitung penjualan dari pesanan yang sudah berstatus <Text style={{ fontWeight: 'bold' }}>"Selesai"</Text>. Pesanan baru yang masih diproses/menunggu konfirmasi belum dihitung ke produk terlaris.
              </Text>
            </View>
          </View>
        ) : (
          products.map((p, idx) => {
            const qty   = parseFloat(p.total_terjual || 0);
            const omzet = parseFloat(p.total_omzet || 0);
            const bar   = Math.max((qty / maxQty) * 100, 3);
            const color = RANK_COLOR[idx] || COLORS.primary;
            const medal = MEDAL_EMOJI[idx];

            return (
              <View
                key={idx}
                style={[
                  styles.rankCard,
                  idx === 0 && styles.rankCardChampion,
                ]}
              >
                {/* Rank badge */}
                <View style={[styles.rankBadge, { backgroundColor: idx < 3 ? color + '22' : '#F1F5F9' }]}>
                  <Text style={[styles.rankBadgeText, { color: idx < 3 ? color : COLORS.textMuted }]}>
                    {medal || `#${idx + 1}`}
                  </Text>
                </View>

                {/* Product info */}
                <View style={{ flex: 1 }}>
                  <View style={styles.rankTopRow}>
                    <Text style={[styles.rankName, idx === 0 && { fontSize: 14, color: '#92400E' }]} numberOfLines={2}>
                      {p.nama_produk || 'Produk'}
                    </Text>
                    <Text style={[styles.rankQty, { color }]}>{qty} unit</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${bar}%`, backgroundColor: color }]} />
                  </View>

                  <Text style={styles.rankOmzet}>
                    Omzet: <Text style={{ fontWeight: '700', color: COLORS.secondary }}>
                      Rp {omzet.toLocaleString('id-ID')}
                    </Text>
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Summary footer */}
        {!loading && products.length > 0 && (
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryText}>
              📊 {products.length} produk · Total {products.reduce((a, p) => a + parseFloat(p.total_terjual || 0), 0)} unit terjual
            </Text>
            <Text style={styles.summaryText}>
              💰 Omzet: Rp {products.reduce((a, p) => a + parseFloat(p.total_omzet || 0), 0).toLocaleString('id-ID')}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={calOpen} transparent animationType="fade" onRequestClose={() => setCalOpen(false)}>
        <View style={cal.overlay}>
          <View style={cal.card}>
            {/* Header */}
            <View style={cal.modalHeader}>
              <Text style={cal.modalTitle}>
                Pilih Tanggal {calTarget === 'start' ? 'Mulai' : 'Selesai'}
              </Text>
              <TouchableOpacity onPress={() => setCalOpen(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Month navigation */}
            <View style={cal.navRow}>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(calYear, calMonth - 1, 1);
                  setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
                }}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={cal.monthLabel}>{NAMA_BULAN[calMonth]} {calYear}</Text>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(calYear, calMonth + 1, 1);
                  setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
                }}
              >
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Grid */}
            <View style={cal.grid}>{renderCalendar()}</View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.light,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.secondary },
  headerSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },

  filterCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  datePillLabel: { fontSize: 9, fontWeight: '700', color: '#4338CA' },
  datePillVal: { fontSize: 12, fontWeight: '800', color: COLORS.secondary, marginTop: 1 },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  applyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  listContent: { padding: 16 },

  rankCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    ...SHADOWS.soft,
  },
  rankCardChampion: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  rankBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankBadgeText: { fontSize: 20, fontWeight: '900' },
  rankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  rankName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
    flex: 1,
    marginRight: 8,
  },
  rankQty: { fontSize: 12, fontWeight: '900' },
  barBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  barFill: { height: 6, borderRadius: 10 },
  rankOmzet: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  summaryFooter: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginTop: 6,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
    ...SHADOWS.soft,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
  },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  emptySubText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});

const cal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    paddingBottom: 20,
    ...SHADOWS.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthLabel: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  headerCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  headerText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayCircleSel: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 13, color: COLORS.secondary },
  dayTextSel: { color: '#FFF', fontWeight: '800' },
});

export default OwnerTopProductsScreen;
