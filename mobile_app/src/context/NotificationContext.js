import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ApiService, isAbortError } from '../core/api';
import { useAuth } from './AuthContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../core/theme';
import NotificationService from '../core/notificationService';
import { navigationRef } from '../../App';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  const [activePopup, setActivePopup] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef(null);

  const lastNotifiedChatIdRef = useRef(null);
  const lastOrderStatusesRef = useRef({});
  const isInitializedRef = useRef(false);
  const isPollingRef = useRef(false);

  // Fungsi untuk memunculkan Top Heads-up Floating Popup
  const showPopup = ({ title, message, type = 'chat', orderId = null, orderCode = null, screen = 'OrderChat' }) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    setActivePopup({
      title,
      message,
      type,
      orderId,
      orderCode,
      screen,
    });

    // Mainkan audio notifikasi iOS & getaran HP
    NotificationService.playIosNotificationSound();
    Vibration.vibrate([0, 250, 150, 250]);

    // Memicu notifikasi status bar sistem HP
    NotificationService.triggerLocalOrderNotification(
      orderCode || `#${orderId || ''}`,
      0,
      type === 'chat' ? 'Admin Toko' : 'Della Frozen Mart',
      title,
      message
    );

    // Animasi Pop-up Meluncur Turun dari Atas Layar
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: insets.top > 0 ? insets.top + 6 : 16,
        useNativeDriver: true,
        bounciness: 8,
        speed: 14,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Otomatis menutup kembali setelah 6.5 detik
    dismissTimerRef.current = setTimeout(() => {
      hidePopup();
    }, 6500);
  };

  const hidePopup = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActivePopup(null);
    });
  };

  const handlePopupPress = () => {
    if (!activePopup) return;
    const { screen, orderId, orderCode } = activePopup;
    hidePopup();

    if (navigationRef.isReady()) {
      if (screen === 'OrderChat' && orderId) {
        navigationRef.navigate('OrderChat', { orderId, orderCode });
      } else if (screen === 'OrderDetail' && orderId) {
        navigationRef.navigate('OrderDetail', { orderId });
      } else if (screen === 'AdminOrder' && orderId) {
        navigationRef.navigate('AdminOrder', { orderId });
      }
    }
  };

  // Polling Real-time untuk Notifikasi Pesan Chat & Status Pesanan
  const checkRealtimeUpdates = async () => {
    if (!isAuthenticated || isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      // 1. Cek unread chat & notifikasi sistem
      const notifRes = await ApiService.get('/notifications/unread-count');
      const notifBody = await notifRes.json();
      if (notifRes.status === 200 && notifBody.success && notifBody.data) {
        const { unread_chats = [], unread_notifications_count, unread_chats_count } = notifBody.data;

        if (Array.isArray(unread_chats) && unread_chats.length > 0) {
          const latestChat = unread_chats[0];
          if (lastNotifiedChatIdRef.current !== null && latestChat.id > lastNotifiedChatIdRef.current) {
            const senderName = latestChat.pengirim?.nama || 'Admin Toko';
            const code = latestChat.pesanan?.kode_pesanan || `#${latestChat.pesanan_id}`;
            const msg = `${senderName}: "${latestChat.pesan}"`;

            // Tampilkan Heads-Up Pop-up di bagian atas layar HP
            showPopup({
              title: '💬 PESAN BARU DARI ADMIN TOKO',
              message: `${msg} (Pesanan ${code})`,
              type: 'chat',
              orderId: latestChat.pesanan_id,
              orderCode: code,
              screen: 'OrderChat',
            });
          }
          lastNotifiedChatIdRef.current = latestChat.id;
        }

        setUnreadCount(unread_notifications_count || 0);
        setUnreadChatsCount(unread_chats_count || 0);
      }

      // 2. Cek pembaruan status pesanan (jika user adalah pelanggan)
      const role = user?.role || user?.peran;
      if (role === 'pelanggan') {
        const orderRes = await ApiService.get('/orders');
        const orderBody = await orderRes.json();
        if (orderRes.status === 200 && orderBody.success && Array.isArray(orderBody.data)) {
          const latestOrders = orderBody.data;
          const prevStatuses = lastOrderStatusesRef.current;
          const newStatuses = {};

          latestOrders.forEach((order) => {
            const orderId = order.id;
            const status = (order.order_status || order.status_pesanan || '').toLowerCase();
            newStatuses[orderId] = status;

            if (isInitializedRef.current && prevStatuses[orderId] && prevStatuses[orderId] !== status) {
              let readableStatus = status.toUpperCase();
              if (status === 'diproses') readableStatus = 'DIKEMAS & DISETUJUI TOKO 📦';
              else if (status === 'dikirim') readableStatus = 'SEDANG DIKIRIM KURIR 🛵';
              else if (status === 'siap diambil') readableStatus = 'SIAP DIAMBIL DI TOKO 🏪';
              else if (status === 'selesai') readableStatus = 'PESANAN SELESAI 🎉';
              else if (status === 'dibatalkan') readableStatus = 'PESANAN DIBATALKAN ❌';

              showPopup({
                title: `🔔 STATUS PESANAN: ${readableStatus}`,
                message: `Pesanan #${order.order_code || order.kode_pesanan} sekarang ${readableStatus}.`,
                type: 'order',
                orderId: order.id,
                orderCode: order.order_code || order.kode_pesanan,
                screen: 'OrderDetail',
              });
            }
          });

          lastOrderStatusesRef.current = newStatuses;
          isInitializedRef.current = true;
        }
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.log('NotificationProvider poll error:', err?.message || err);
      }
    } finally {
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    checkRealtimeUpdates();
    const interval = setInterval(checkRealtimeUpdates, 3500);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        showPopup,
        hidePopup,
        unreadCount,
        unreadChatsCount,
        notifications,
      }}
    >
      {children}

      {/* Global In-App Floating Heads-up Notification Popup */}
      {activePopup && (
        <Animated.View
          style={[
            styles.floatingPopupContainer,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[
              styles.floatingPopupCard,
              activePopup.type === 'chat' ? styles.floatingPopupCardChat : styles.floatingPopupCardOrder,
            ]}
            activeOpacity={0.9}
            onPress={handlePopupPress}
          >
            <View style={styles.popupLeftIconBox}>
              <Ionicons
                name={activePopup.type === 'chat' ? 'chatbubbles' : 'cube'}
                size={22}
                color={activePopup.type === 'chat' ? '#059669' : '#D97706'}
              />
            </View>

            <View style={styles.popupContentBox}>
              <View style={styles.popupHeaderRow}>
                <Text style={styles.popupTitleText} numberOfLines={1}>
                  {activePopup.title}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    hidePopup();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              <Text style={styles.popupBodyText} numberOfLines={2}>
                {activePopup.message}
              </Text>

              <View style={styles.popupActionRow}>
                <Text style={styles.popupActionHint}>
                  {activePopup.type === 'chat' ? 'Ketuk untuk balas chat 💬' : 'Ketuk untuk lihat detail pesanan 👉'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  floatingPopupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    elevation: 999999,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  floatingPopupCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: SIZES.radiusMd,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    ...SHADOWS.medium,
    borderWidth: 1.5,
  },
  floatingPopupCardChat: {
    backgroundColor: '#064E3B',
    borderColor: '#34D399',
  },
  floatingPopupCardOrder: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  popupLeftIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  popupContentBox: {
    flex: 1,
  },
  popupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popupTitleText: {
    ...TYPOGRAPHY.bodyBold,
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  closeBtn: {
    padding: 2,
  },
  popupBodyText: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  popupActionRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  popupActionHint: {
    ...TYPOGRAPHY.caption,
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default NotificationContext;
