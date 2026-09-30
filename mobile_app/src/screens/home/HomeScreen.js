import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Image, Vibration, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { ApiService, getImageUrl, isAbortError } from '../../core/api';
import ProductCard from '../../components/ProductCard';
import CustomerNotificationModal from '../../components/CustomerNotificationModal';
import NotificationService from '../../core/notificationService';

export const HomeScreen = ({ navigation }) => {
  const { user, refreshPoints } = useAuth();
  const { unreadCount: globalUnreadNotifs, unreadChatsCount: globalUnreadChats } = useNotification();
  const { products, categories, isLoading, getProducts, getCategories, getProductsByCategory } = useProducts();
  const { getCart } = useCart();

  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const lastOrderStatusesRef = useRef({});
  const isInitializedRef = useRef(false);
  const isCheckingOrdersRef = useRef(false);
  const lastNotifiedChatIdRef = useRef(null);
  const isCheckingNotifsRef = useRef(false);

  const checkOrderUpdates = async () => {
    if (isCheckingOrdersRef.current) return;
    isCheckingOrdersRef.current = true;
    try {
      const res = await ApiService.get('/orders');
      const body = await res.json();
      if (res.status === 200 && body.success && Array.isArray(body.data)) {
        const latestOrders = body.data;
        const previousStatuses = lastOrderStatusesRef.current;
        const newStatuses = {};
        const newNotifs = [];

        latestOrders.forEach((order) => {
          const orderId = order.id;
          const status = (order.order_status || order.status_pesanan || '').toLowerCase();
          newStatuses[orderId] = status;

          if (isInitializedRef.current && previousStatuses[orderId] && previousStatuses[orderId] !== status) {
            let readableStatus = status.toUpperCase();
            if (status === 'diproses') readableStatus = 'DIKEMAS & DISETUJUI TOKO 📦';
            else if (status === 'dikirim') readableStatus = 'SEDANG DIKIRIM KURIR 🛵';
            else if (status === 'siap diambil') readableStatus = 'SIAP DIAMBIL DI TOKO 🏪';
            else if (status === 'selesai') readableStatus = 'PESANAN SELESAI 🎉';
            else if (status === 'dibatalkan') readableStatus = 'PESANAN DIBATALKAN ❌';

            const title = `Status Pesanan: ${readableStatus}`;
            const msg = `Pesanan #${order.order_code || order.kode_pesanan} sekarang ${readableStatus}.`;

            newNotifs.push({
              id: `${orderId}-${Date.now()}`,
              orderId: orderId,
              orderCode: order.order_code || order.kode_pesanan,
              type: 'order',
              title: title,
              message: msg,
              time: 'Baru saja',
              is_read: false,
            });

            // Trigger Toast & Signature iOS Audio Notification Sound
            setToastNotif({
              orderId,
              orderCode: order.order_code || order.kode_pesanan,
              screen: 'OrderDetail',
              title: '🚚 STATUS PESANAN DIPERBARUI!',
              status: readableStatus,
              message: msg,
            });

            Vibration.vibrate([0, 250, 150, 250]);
            NotificationService.playIosNotificationSound();
            NotificationService.triggerLocalOrderNotification(
              order.order_code || order.kode_pesanan,
              order.total_amount,
              'Pelanggan',
              `🔔 Status Pesanan #${order.order_code || order.kode_pesanan}`,
              msg
            );
          }
        });

        lastOrderStatusesRef.current = newStatuses;
        isInitializedRef.current = true;

        if (newNotifs.length > 0) {
          setNotifications((prev) => [...newNotifs, ...prev]);
        }
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.log('Customer order update check error:', err?.message || err);
      }
    } finally {
      isCheckingOrdersRef.current = false;
    }
  };

  const checkRealtimeNotifications = async () => {
    if (isCheckingNotifsRef.current) return;
    isCheckingNotifsRef.current = true;
    try {
      const res = await ApiService.get('/notifications/unread-count');
      const body = await res.json();
      if (res.status === 200 && body.success && body.data) {
        const { unread_chats = [], unread_notifications_count, unread_chats_count } = body.data;

        // Cek jika ada pesan chat baru yang masuk dari Admin
        if (Array.isArray(unread_chats) && unread_chats.length > 0) {
          const latestChat = unread_chats[0];
          if (lastNotifiedChatIdRef.current !== null && latestChat.id > lastNotifiedChatIdRef.current) {
            const senderName = latestChat.pengirim?.nama || 'Admin Toko';
            const orderCode = latestChat.pesanan?.kode_pesanan || `#${latestChat.pesanan_id}`;
            const msg = `${senderName}: "${latestChat.pesan}" (Pesanan ${orderCode})`;

            // Tampilkan Toast & Suara Notifikasi iOS
            setToastNotif({
              orderId: latestChat.pesanan_id,
              orderCode: orderCode,
              screen: 'OrderChat',
              title: '💬 PESAN BARU DARI ADMIN TOKO!',
              message: msg,
            });

            Vibration.vibrate([0, 250, 150, 250]);
            NotificationService.playIosNotificationSound();
            NotificationService.triggerLocalOrderNotification(
              orderCode,
              0,
              senderName,
              '💬 Pesan Baru dari Admin Toko',
              latestChat.pesan
            );

            // Tambahkan ke riwayat notifikasi lokal
            setNotifications((prev) => [
              {
                id: `chat-${latestChat.id}`,
                orderId: latestChat.pesanan_id,
                orderCode: orderCode,
                type: 'chat',
                title: '💬 Pesan Baru dari Admin Toko',
                message: msg,
                time: 'Baru saja',
                is_read: false,
              },
              ...prev,
            ]);
          }
          lastNotifiedChatIdRef.current = latestChat.id;
        }

        const totalUnread = (unread_notifications_count || 0) + (unread_chats_count || 0);
        setUnreadNotifCount(totalUnread);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.log('Customer realtime notif check error:', err?.message || err);
      }
    } finally {
      isCheckingNotifsRef.current = false;
    }
  };

  const fetchCustomerNotifications = async () => {
    try {
      const res = await ApiService.get('/notifications');
      const body = await res.json();
      if (res.status === 200 && body.success && body.data) {
        setNotifications(body.data.notifications || []);
      }
      await ApiService.post('/notifications/mark-read');
    } catch (err) {
      console.log('Error fetch notifications:', err);
    }
  };

  const isPollingRef = useRef(false);

  // Combined polling: order status + chat notifications + points refresh every 4 seconds
  const pollAll = async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      await Promise.all([
        checkOrderUpdates(),
        checkRealtimeNotifications(),
        refreshPoints(),
      ]);
    } catch (err) {
      if (!isAbortError(err)) {
        console.log('Poll error:', err?.message || err);
      }
    } finally {
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    getProducts();
    getCategories();
    getCart();
    fetchCustomerNotifications();

    pollAll();
    const interval = setInterval(pollAll, 4000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getProducts(),
        getCategories(),
        getCart(),
        checkOrderUpdates(),
        checkRealtimeNotifications(),
        fetchCustomerNotifications(),
        refreshPoints(),
      ]);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategorySelect = async (catId) => {
    await getProductsByCategory(catId);
    navigation.navigate('Katalog');
  };

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.chip}
      onPress={() => handleCategorySelect(item.id)}
    >
      <LinearGradient
        colors={[COLORS.white, '#F8FAFC']}
        style={styles.chipGradient}
      >
        <Text style={styles.chipText}>{item.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const customerName = user?.name || 'Pelanggan';
  const profilePhotoUrl = user?.profile_photo ? getImageUrl(user.profile_photo) : null;

  const totalUnreadCount = (globalUnreadNotifs || 0) + (globalUnreadChats || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary, COLORS.accent]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Welcome Header with Gradient */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Halo,</Text>
            <Text style={styles.nameText} numberOfLines={1}>{customerName}</Text>
          </View>

          <View style={styles.headerIconsRight}>
            {/* Golden Points Chip (Kopi Kenangan / Superindo style) */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.pointsBadgeBtn}
              onPress={() => navigation.navigate('Profil')}
            >
              <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.pointsBadgeText}>{user?.total_points || 0} Poin</Text>
            </TouchableOpacity>

            {/* Header Bell Icon Notifikasi */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bellBtn}
              onPress={async () => {
                await fetchCustomerNotifications();
                setNotifModalVisible(true);
              }}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
              {totalUnreadCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Avatar Profile */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Profil')}
              style={styles.avatarBtn}
            >
              {profilePhotoUrl ? (
                <Image
                  source={{ uri: profilePhotoUrl }}
                  style={styles.avatarPhoto}
                />
              ) : (
                <LinearGradient
                  colors={['#ffffff', '#e8f4ff']}
                  style={styles.avatarCircle}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, '#1565C0', COLORS.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarDellaInner}
                  >
                    <Ionicons name="snow" size={18} color="rgba(255,255,255,0.95)" />
                  </LinearGradient>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Promo Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Della Frozen Mart</Text>
                <Text style={styles.bannerSubtitle}>Solusi Produk Frozen Higienis & Terjangkau</Text>
              </View>
              <TouchableOpacity
                style={styles.bannerBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Katalog')}
              >
                <Text style={styles.bannerBtnText}>Belanja Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategori Pilihan</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Katalog')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SIZES.md }} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCategoryChip}
            contentContainerStyle={styles.categoriesList}
          />
        )}

        {/* Featured Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produk Terpopuler</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Katalog')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SIZES.lg }} />
        ) : (
          <View style={styles.productsGrid}>
            {products.slice(0, 6).map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ProductCard product={item} navigation={navigation} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Customer Notification Modal */}
      <CustomerNotificationModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
        notifications={notifications}
        onSelectOrder={(orderId, screen, orderCode) => {
          if (screen === 'OrderChat') {
            navigation.navigate('OrderChat', { orderId, orderCode });
          } else {
            navigation.navigate('OrderDetail', { orderId });
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SIZES.xl,
  },
  header: {
    paddingTop: SIZES.md,
    paddingBottom: SIZES.xl,
    paddingHorizontal: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: SIZES.radiusLg,
    borderBottomRightRadius: SIZES.radiusLg,
  },
  welcomeText: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  nameText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
  },
  pointsBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeCountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarBtn: {
    padding: 2,
  },
  avatarPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    ...SHADOWS.small,
  },
  avatarDellaInner: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastBanner: {
    backgroundColor: COLORS.primaryDark,
    padding: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.sm,
    ...SHADOWS.medium,
    zIndex: 999,
  },
  toastBannerChat: {
    backgroundColor: '#065F46',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  toastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  toastBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginVertical: 4,
  },
  toastActionBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  toastActionText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerContainer: {
    paddingHorizontal: SIZES.lg,
    marginTop: -SIZES.lg,
  },
  banner: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    ...SHADOWS.medium,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
  },
  bannerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  bannerBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
    marginLeft: SIZES.sm,
  },
  bannerBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.xl,
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  seeAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xs,
  },
  chip: {
    marginRight: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    ...SHADOWS.small,
  },
  chipGradient: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs + 2,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg - 4,
  },
  gridItem: {
    width: '50%',
    padding: 4,
  },
});

export default HomeScreen;
