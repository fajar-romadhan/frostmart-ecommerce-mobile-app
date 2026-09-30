import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ApiService, isAbortError } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';
import NotificationModal from '../../components/NotificationModal';
import NotificationService from '../../core/notificationService';

export const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner' || user?.peran === 'owner';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [latestBannerNotif, setLatestBannerNotif] = useState(null);

  const lastPendingCountRef = useRef(null);
  const lastNotifIdRef = useRef(null);
  const lastOrderIdRef = useRef(null);
  const isFetchingStatsRef = useRef(false);

  const fetchNotificationsList = async () => {
    try {
      const res = await ApiService.get('/admin/notifications');
      const body = await res.json();
      if (res.status === 200 && body.success && body.data) {
        setNotificationsList(body.data);
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.log('Gagal mengambil daftar notifikasi admin:', e?.message || e);
      }
    }
  };

  const fetchStatsAndOrders = async (isBackground = false) => {
    if (isBackground && isFetchingStatsRef.current) return;
    isFetchingStatsRef.current = true;
    try {
      const res = await ApiService.get('/admin/dashboard');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        const newStats = body.data;
        const currentPending = newStats?.total_orders_pending ?? 0;
        const currentNotifId = newStats?.latest_notification_id ?? null;
        const currentOrderId = newStats?.latest_order_id ?? null;
        const unreadCountFromApi = newStats?.unread_notifications_count ?? 0;

        const hasNewNotif = lastNotifIdRef.current !== null && currentNotifId !== null && currentNotifId > lastNotifIdRef.current;
        const hasNewOrder = lastOrderIdRef.current !== null && currentOrderId !== null && currentOrderId > lastOrderIdRef.current;
        const hasPendingIncrease = lastPendingCountRef.current !== null && currentPending > lastPendingCountRef.current;

        // Pengecekan jika ada pesanan baru atau upload bukti bayar secara real-time
        if (hasNewNotif || hasNewOrder || hasPendingIncrease) {
          fetchNotificationsList();

          try {
            const ordersRes = await ApiService.get('/admin/orders');
            const ordersBody = await ordersRes.json();
            if (ordersRes.status === 200 && ordersBody.success && ordersBody.data && ordersBody.data.length > 0) {
              const newestOrder = ordersBody.data[0];
              const code = newestOrder.order_code || newestOrder.kode_pesanan || 'ORD-BARU';
              const amount = newestOrder.total_amount || newestOrder.total_harga || 0;
              const userName = newestOrder.user?.name || newestOrder.user?.nama || 'Pelanggan';
              const isCompleted = (newestOrder.order_status || newestOrder.status_pesanan || '').toLowerCase() === 'selesai';
              const isPaymentUpload = (newestOrder.order_status || newestOrder.status_pesanan || '').toLowerCase() === 'menunggu konfirmasi';
              const isPointRedeem = (newestOrder.payment_method || newestOrder.metode_pembayaran || '').toLowerCase() === 'poin' || (newestOrder.points_used > 0 || newestOrder.poin_digunakan > 0);

              let notifTitle = '🛍️ PESANAN BARU MASUK!';
              let notifBody = `Pesanan ${code} dari ${userName} (Rp${(amount || 0).toLocaleString('id-ID')})`;

              if (isPointRedeem) {
                notifTitle = '🎁 KLAIM HADIAH POIN BARU!';
                notifBody = `Pelanggan ${userName} menukar 10 poin dengan hadiah gratis (${code}). Segera siapkan produk!`;
              } else if (isCompleted) {
                notifTitle = '🎉 PESANAN DITERIMA & SELESAI!';
                notifBody = `Pelanggan ${userName} telah mengonfirmasi penerimaan pesanan ${code}.`;
              } else if (isPaymentUpload) {
                notifTitle = '💳 BUKTI PEMBAYARAN DIUNGGAH!';
                notifBody = `Pelanggan ${userName} telah mengunggah bukti pembayaran untuk pesanan ${code}.`;
              }

              setLatestBannerNotif({
                id: newestOrder.id,
                title: notifTitle,
                code: code,
                amount: amount,
                userName: userName,
              });

              Vibration.vibrate([0, 300, 100, 300]);
              NotificationService.playIosNotificationSound();
              try {
                NotificationService.triggerLocalOrderNotification(
                  code,
                  amount,
                  userName,
                  notifTitle,
                  notifBody
                );
              } catch (e) {
                console.log('Error triggering push notification:', e);
              }
            }
          } catch (err) {
            console.log('Error fetching order list for notif:', err);
          }

          setUnreadCount(unreadCountFromApi > 0 ? unreadCountFromApi : (prev) => prev + 1);
        } else if (lastNotifIdRef.current === null) {
          setUnreadCount(unreadCountFromApi);
          fetchNotificationsList();
        }

        lastPendingCountRef.current = currentPending;
        if (currentNotifId !== null) lastNotifIdRef.current = currentNotifId;
        if (currentOrderId !== null) lastOrderIdRef.current = currentOrderId;

        setStats(newStats);
      }
    } catch (error) {
      if (!isBackground && !isAbortError(error)) {
        console.error('Gagal mengambil statistik dashboard:', error?.message || error);
      }
    } finally {
      isFetchingStatsRef.current = false;
      if (!isBackground) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchStatsAndOrders();

    // Auto-Polling Interval 5 Detik (Real-time Detection)
    const interval = setInterval(() => {
      fetchStatsAndOrders(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatsAndOrders();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenNotificationModal = async () => {
    setUnreadCount(0); // Reset unread badge count saat modal dibuka
    setIsNotifModalOpen(true);
    try {
      await ApiService.post('/admin/notifications/mark-read', {});
    } catch (e) {
      console.log('Error marking admin notifications as read:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.welcomeText}>Selamat Datang,</Text>
          <Text style={styles.adminName} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ADMIN PANEL</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Lonceng Notifikasi dengan Red Badge Counter */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={handleOpenNotificationModal}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
            {unreadCount > 0 && (
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Banner Notifikasi Melayang saat Ada Pesanan Baru */}
      {latestBannerNotif && (
        <TouchableOpacity
          style={styles.toastBanner}
          onPress={() => {
            setLatestBannerNotif(null);
            navigation.navigate('AdminOrder');
          }}
          activeOpacity={0.9}
        >
          <View style={styles.toastHeader}>
            <Ionicons name="notifications" size={20} color={COLORS.white} />
            <Text style={styles.toastTitle}>{latestBannerNotif.title || '🛍️ PESANAN BARU MASUK!'}</Text>
            <TouchableOpacity onPress={() => setLatestBannerNotif(null)} style={{ padding: 2 }}>
              <Ionicons name="close" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.toastDesc}>
            Kode: <Text style={{ fontWeight: 'bold' }}>{latestBannerNotif.code}</Text> | Pemesan: {latestBannerNotif.userName}
          </Text>
          <View style={styles.toastFooter}>
            <Text style={styles.toastAmount}>
              Rp{(latestBannerNotif.amount || 0).toLocaleString('id-ID')}
            </Text>
            <View style={styles.toastBtn}>
              <Text style={styles.toastBtnText}>👁️ PROSES PESANAN ➔</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Statistik Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Toko</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
            <Ionicons name="cube-outline" size={22} color={COLORS.primary} style={styles.statIcon} />
            <Text style={styles.statVal}>{stats?.total_products ?? 0}</Text>
            <Text style={styles.statLabel}>Total Produk</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
            <Ionicons name="time-outline" size={22} color={COLORS.warning} style={styles.statIcon} />
            <Text style={styles.statVal}>{stats?.total_orders_pending ?? 0}</Text>
            <Text style={styles.statLabel}>Pesanan Pending</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
            <Ionicons name="sync-outline" size={22} color={COLORS.success} style={styles.statIcon} />
            <Text style={styles.statVal}>{stats?.total_orders_processed ?? 0}</Text>
            <Text style={styles.statLabel}>Pesanan Diproses</Text>
          </View>

          {isOwner ? (
            <View style={[styles.statCard, { borderLeftColor: COLORS.accent }]}>
              <Ionicons name="cash-outline" size={22} color={COLORS.accent} style={styles.statIcon} />
              <Text style={[styles.statVal, { fontSize: 14 }]} numberOfLines={1}>
                Rp{(stats?.total_sales_amount ?? 0).toLocaleString('id-ID')}
              </Text>
              <Text style={styles.statLabel}>Total Omzet</Text>
            </View>
          ) : (
            <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color={COLORS.success} style={styles.statIcon} />
              <Text style={styles.statVal}>{stats?.total_orders_completed ?? 0}</Text>
              <Text style={styles.statLabel}>Pesanan Selesai</Text>
            </View>
          )}
        </View>
      </View>

      {/* Menu Kelola */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Operasional</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('AdminOrder')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="receipt" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Kelola Pesanan</Text>
              <Text style={styles.menuDesc}>Konfirmasi pembayaran & status kirim</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('AdminProduct')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="cube" size={24} color={COLORS.primaryDark} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Kelola Produk</Text>
              <Text style={styles.menuDesc}>Tambah, edit, dan hapus barang beku</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('AdminCategory')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="grid" size={24} color={COLORS.accent} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Kelola Kategori</Text>
              <Text style={styles.menuDesc}>Tambah, edit, dan hapus kategori produk</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('AdminReport')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="bar-chart" size={24} color={COLORS.success} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Laporan Penjualan</Text>
              <Text style={styles.menuDesc}>Lihat riwayat & statistik pesanan terjual</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.navigate('OwnerDashboard')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="pie-chart" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Laporan Omzet Keuangan</Text>
                <Text style={styles.menuDesc}>Lihat grafik & total omzet toko</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Modal Riwayat Notifikasi Pesanan */}
      <NotificationModal
        visible={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notificationsList}
        onSelectNotification={() => {
          navigation.navigate('AdminOrder');
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
  adminName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bellBtn: {
    padding: SIZES.paddingSm,
    backgroundColor: '#F1F5F9',
    borderRadius: SIZES.radiusMd,
    marginRight: 8,
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  redBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: SIZES.paddingSm,
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radiusMd,
  },
  toastBanner: {
    marginHorizontal: SIZES.paddingMd,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.medium,
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  toastTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    flex: 1,
    marginLeft: 8,
  },
  toastDesc: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  toastFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  toastAmount: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  toastBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toastBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  section: {
    paddingHorizontal: SIZES.paddingMd,
    marginTop: SIZES.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
    marginBottom: SIZES.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginBottom: SIZES.md,
    borderLeftWidth: 4,
    ...SHADOWS.light,
  },
  statIcon: {
    marginBottom: SIZES.xs,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginVertical: SIZES.xs,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingSm,
    ...SHADOWS.light,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingMd,
    paddingHorizontal: SIZES.paddingSm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  menuDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default AdminDashboardScreen;
