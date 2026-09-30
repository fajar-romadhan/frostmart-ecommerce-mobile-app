import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../core/theme';
import { ApiService } from '../core/api';

export const PointHistoryModal = ({ visible, onClose, initialPoints = 0, onOpenRedeem, onSelectOrder }) => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [totalPoints, setTotalPoints] = useState(initialPoints);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/points/history');
      const json = await res.json();
      if (json.success && json.data) {
        setTotalPoints(json.data.total_points ?? initialPoints);
        setTotalEarned(json.data.total_earned ?? 0);
        setTotalSpent(json.data.total_spent ?? 0);
        setHistoryData(json.data.history || []);
      }
    } catch (err) {
      console.log('Error fetching point history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchHistory();
    }
  }, [visible]);

  const handleItemPress = (item) => {
    const orderId = item.order_id || item.pesanan_id;
    if (orderId && onSelectOrder) {
      onClose();
      onSelectOrder(orderId);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const isMasuk = item.type === 'masuk' || item.jenis === 'masuk';
    const pointsCount = item.points || item.jumlah_poin;
    const desc = item.description || item.keterangan;
    const dateStr = item.formatted_date || item.created_at;
    const orderId = item.order_id || item.pesanan_id;

    return (
      <TouchableOpacity
        style={styles.historyItemCard}
        activeOpacity={orderId ? 0.7 : 1}
        onPress={() => handleItemPress(item)}
      >
        <View style={[styles.iconCircle, isMasuk ? styles.iconMasuk : styles.iconKeluar]}>
          <Ionicons
            name={isMasuk ? 'star' : 'gift'}
            size={20}
            color={isMasuk ? '#D97706' : '#DC2626'}
          />
        </View>

        <View style={styles.historyDetails}>
          <Text style={styles.historyTitle}>{desc}</Text>
          <View style={styles.historySubRow}>
            <Text style={styles.historyDate}>{dateStr}</Text>
            {orderId && (
              <View style={styles.proofBadge}>
                <Ionicons name="receipt-outline" size={10} color={COLORS.primary} style={{ marginRight: 3 }} />
                <Text style={styles.proofBadgeText}>Bukti Pesanan ➔</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.pointsColumn}>
          <Text style={[styles.pointsText, isMasuk ? styles.pointsMasuk : styles.pointsKeluar]}>
            {isMasuk ? `+${pointsCount}` : `-${pointsCount}`}
          </Text>
          <Text style={styles.pointsLabel}>Poin</Text>
          {orderId && (
            <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} style={{ marginTop: 2 }} />
          )}
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
              <Ionicons name="sparkles" size={22} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Riwayat Poin Loyalti</Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Points Summary Card */}
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Total Saldo Poin Aktif</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={28} color="#F59E0B" style={{ marginRight: 8 }} />
                  <Text style={styles.summaryPoints}>{totalPoints}</Text>
                  <Text style={styles.summaryPointsUnit}> Poin</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                {onOpenRedeem && (
                  <TouchableOpacity
                    style={styles.redeemDirectBtn}
                    activeOpacity={0.8}
                    onPress={onOpenRedeem}
                  >
                    <Ionicons name="gift" size={14} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.redeemDirectBtnText}>Tukar Hadiah</Text>
                  </TouchableOpacity>
                )}
                <View style={[styles.badgeInfo, { marginTop: onOpenRedeem ? 6 : 0 }]}>
                  <Text style={styles.badgeInfoText}>10 Poin = 1 Gratis</Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Didapat</Text>
                <Text style={[styles.statValue, { color: '#34D399' }]}>+{totalEarned} Poin</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Digunakan</Text>
                <Text style={[styles.statValue, { color: '#F87171' }]}>-{totalSpent} Poin</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Rasio Belanja</Text>
                <Text style={styles.statValue}>Rp 50rb = 1 Pt</Text>
              </View>
            </View>
          </LinearGradient>

          {/* History List */}
          <View style={styles.listContainer}>
            <Text style={styles.listSectionTitle}>Aktivitas Poin</Text>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Memuat riwayat poin...</Text>
              </View>
            ) : historyData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Belum Ada Riwayat Poin</Text>
                <Text style={styles.emptySubtitle}>
                  Setiap belanja kelipatan Rp 50.000, Anda akan mendapatkan 1 Poin loyalti secara otomatis!
                </Text>
              </View>
            ) : (
              <FlatList
                data={historyData}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderHistoryItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              />
            )}
          </View>
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
    maxHeight: '88%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  summaryCard: {
    margin: 16,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    ...SHADOWS.medium,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...TYPOGRAPHY.small,
    color: '#94A3B8',
  },
  summaryPoints: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F59E0B',
  },
  summaryPointsUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  badgeInfo: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeInfoText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listSectionTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginBottom: 12,
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
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.light,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconMasuk: {
    backgroundColor: '#FEF3C7',
  },
  iconKeluar: {
    backgroundColor: '#FEE2E2',
  },
  historyDetails: {
    flex: 1,
    marginRight: 10,
  },
  historyTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.secondary,
  },
  historyDate: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  pointsColumn: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pointsMasuk: {
    color: '#059669',
  },
  pointsKeluar: {
    color: '#DC2626',
  },
  pointsLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  redeemDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34D399',
    ...SHADOWS.soft,
  },
  redeemDirectBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  historySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 0.8,
    borderColor: '#BFDBFE',
  },
  proofBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default PointHistoryModal;

