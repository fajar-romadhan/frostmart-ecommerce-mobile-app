import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Linking, Dimensions, Platform, Modal, Image, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { ApiService, isAbortError } from '../../core/api';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { formatRupiah } from '../../core/utils';
import CustomButton from '../../components/CustomButton';
import NotificationService from '../../core/notificationService';

export const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { getOrderDetail, cancelOrder, isLoading: isCancelling } = useOrders();
  const { refreshPoints } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [recentChat, setRecentChat] = useState(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const lastAdminChatIdRef = useRef(null);
  const isFetchingChatRef = useRef(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    const data = await getOrderDetail(orderId);
    setOrder(data);
    setLoading(false);
  };

  const fetchTracking = async () => {
    try {
      const res = await ApiService.get(`/orders/${orderId}/tracking`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setTrackingData(body.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data tracking kurir:', err);
    }
  };

  const fetchRecentChat = async () => {
    if (isFetchingChatRef.current) return;
    isFetchingChatRef.current = true;
    try {
      const res = await ApiService.get(`/orders/${orderId}/chats`);
      const body = await res.json();
      if (res.status === 200 && body.success && Array.isArray(body.data)) {
        const chats = body.data;
        const adminMsg = [...chats].reverse().find(c => {
          const role = (c.pengirim?.role || c.pengirim?.peran || c.pengirim_role || c.sender_role || '').toLowerCase();
          return role === 'admin' || role === 'owner';
        });

        if (adminMsg) {
          if (lastAdminChatIdRef.current !== null && adminMsg.id !== lastAdminChatIdRef.current) {
            // New message arrived in real-time from Admin!
            Vibration.vibrate([0, 200, 100, 200]);
            NotificationService.playIosNotificationSound();
            NotificationService.triggerLocalOrderNotification(
              order?.order_code || order?.kode_pesanan || `#${orderId}`,
              0,
              'Admin Toko',
              `💬 Pesan Baru dari Admin Toko`,
              adminMsg.pesan
            );
          }
          lastAdminChatIdRef.current = adminMsg.id;
        }

        setRecentChat(adminMsg || null);
      } else {
        setRecentChat(null);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Gagal memuat pesan chat:', err?.message || err);
      }
    } finally {
      isFetchingChatRef.current = false;
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    fetchTracking();
    fetchRecentChat();
    const interval = setInterval(fetchRecentChat, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!order) return;
    const isPendingPayment =
      order.order_status?.toLowerCase() === 'menunggu_pembayaran' ||
      order.order_status?.toLowerCase() === 'menunggu pembayaran';

    if (!isPendingPayment || order.payment_method?.toLowerCase() === 'cod') {
      return;
    }

    const calcTimeLeft = () => {
      const deadlineStr = order.payment_deadline || order.waktu_tenggat_pembayaran;
      const deadline = deadlineStr
        ? new Date(deadlineStr)
        : new Date(new Date(order.created_at || order.order_date).getTime() + 30 * 60 * 1000);

      const diffMs = deadline.getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setTimeLeft('00:00');
        if (!isExpired) {
          setIsExpired(true);
          fetchOrderDetail();
        }
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      setTimeLeft(formatted);
    };

    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const [autoCompleteTimeLeft, setAutoCompleteTimeLeft] = useState(null);

  useEffect(() => {
    if (!order) return;
    const isPointRedeemOrder = (order.payment_method || order.metode_pembayaran || '').toLowerCase() === 'poin' || (order.points_used > 0 || order.poin_digunakan > 0) || ((order.total_amount === 0 || order.total_harga === 0) && order.delivery_method === 'ambil_toko');
    if (isPointRedeemOrder) {
      setAutoCompleteTimeLeft(null);
      return;
    }

    const status = order.order_status?.toLowerCase();
    if (status !== 'dikirim' && status !== 'siap diambil') {
      return;
    }

    const calcAutoCompleteTimeLeft = () => {
      const statusTimeStr = order.updated_at || order.created_at || order.order_date;
      const statusTime = statusTimeStr ? new Date(statusTimeStr).getTime() : new Date().getTime();
      const completionDeadline = statusTime + 15 * 60 * 1000;

      const diffMs = completionDeadline - new Date().getTime();
      if (diffMs <= 0) {
        setAutoCompleteTimeLeft('00:00');
        fetchOrderDetail();
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      setAutoCompleteTimeLeft(formatted);
    };

    calcAutoCompleteTimeLeft();
    const interval = setInterval(calcAutoCompleteTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleOpenWhatsApp = (phone) => {
    if (!phone) {
      Alert.alert('Info', 'Nomor WhatsApp kurir tidak tersedia.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;

    const customerName = order?.user?.name || trackingData?.customer_name || 'Pemesan';
    const orderCode = order?.order_code || trackingData?.order_code || '';
    const address = order?.shipping_address || trackingData?.shipping_address || 'Ambil di Toko';
    
    let productList = '';
    if (order?.details && order.details.length > 0) {
      productList = order.details.map(d => `- ${d.quantity}x ${d.product_name}`).join('\n');
    } else if (order?.order_details && order.order_details.length > 0) {
      productList = order.order_details.map(d => `- ${d.quantity}x ${d.product_name}`).join('\n');
    } else {
      productList = '- Produk Pesanan Frozen Food';
    }

    const msg = `Halo Mas Kurir Della Frozen Mart 🛵\n\nSaya ingin menanyakan posisi pengantaran pesanan saya:\n👤 Nama Pemesan: ${customerName}\n📑 Kode Pesanan: ${orderCode}\n📍 Alamat Kirim: ${address}\n\n📦 Produk yang Dipesan:\n${productList}\n\nMohon info estimasi tiba dan lokasi mas kurir sekarang ya. Terima kasih!`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Aplikasi WhatsApp tidak terinstall pada HP Anda.');
    });
  };

  const handleCallPhone = (phone) => {
    if (!phone) {
      Alert.alert('Info', 'Nomor telepon kurir tidak tersedia.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleMarkReceived = () => {
    setIsConfirmModalOpen(true);
  };

  const executeMarkReceived = async () => {
    setIsConfirmModalOpen(false);
    setIsReceiving(true);
    try {
      const res = await ApiService.put(`/orders/${orderId}/received`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        // Award poin diberikan backend saat ini — refresh langsung
        refreshPoints();
        Alert.alert('Sukses 🎉', 'Terima kasih telah berbelanja di Della Frozen Mart!');
        fetchOrderDetail();
      } else {
        Alert.alert('Gagal', body.message || 'Gagal mengonfirmasi pesanan.');
      }
    } catch (err) {
      console.error('Error mark received:', err);
      Alert.alert('Error', 'Kesalahan jaringan.');
    } finally {
      setIsReceiving(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Batalkan Pesanan?',
      'Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat dibatalkan.',
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelOrder(orderId);
            if (success) {
              Alert.alert('Sukses', 'Pesanan berhasil dibatalkan.');
              fetchOrderDetail(); // Refresh screen
            } else {
              Alert.alert('Gagal', 'Gagal membatalkan pesanan.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Pesanan tidak ditemukan.</Text>
      </View>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return COLORS.primary;
    switch (status.toLowerCase()) {
      case 'selesai':
        return COLORS.success;
      case 'dibatalkan':
        return COLORS.danger;
      case 'menunggu_pembayaran':
      case 'menunggu pembayaran':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  const getStatusGradient = (status) => {
    if (!status) return [COLORS.gradientStart, COLORS.gradientEnd];
    switch (status.toLowerCase()) {
      case 'selesai':
        return ['#10B981', '#34D399'];
      case 'dibatalkan':
        return ['#EF4444', '#F87171'];
      case 'menunggu_pembayaran':
      case 'menunggu pembayaran':
        return ['#F59E0B', '#FBBF24'];
      default:
        return [COLORS.gradientStart, COLORS.gradientEnd];
    }
  };
  const getStatusLabel = (status) => {
    if (!status) return '';
    const clean = status.toLowerCase().replace('_', ' ');
    if (clean === 'diproses') return 'DIKEMAS';
    return clean.toUpperCase();
  };

  const statusColor = getStatusColor(order.order_status);
  const statusGradient = getStatusGradient(order.order_status);
  const isPendingPayment =
    order.order_status.toLowerCase() === 'menunggu_pembayaran' ||
    order.order_status.toLowerCase() === 'menunggu pembayaran';
  const isPendingConfirmation =
    order.order_status.toLowerCase() === 'menunggu_konfirmasi' ||
    order.order_status.toLowerCase() === 'menunggu konfirmasi';
  const isCod = order.payment_method.toLowerCase() === 'cod';
  // isPurePointOrder: HANYA pesanan murni tukar poin (tidak ada pembayaran nyata)
  // Mixed order (produk reguler + reward poin) tetap mengikuti alur normal
  const isPointOrder =
    (order.payment_method || order.metode_pembayaran || '').toLowerCase() === 'poin' ||
    ((order.total_amount === 0 || order.total_harga === 0) && order.delivery_method === 'ambil_toko');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Header Card with Gradient */}
        <LinearGradient
          colors={statusGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusHeaderCard}
        >
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.statusHeaderSubtitle}>Status Pesanan</Text>
              <Text style={styles.statusHeaderText}>
                {getStatusLabel(order.order_status)}
              </Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>
                {order.payment_status === 'lunas' ? 'LUNAS' : 'BELUM BAYAR'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bukti Klaim Hadiah / Ambil di Toko */}
        {order.delivery_method === 'ambil_toko' && (
          <View style={[styles.sectionCard, styles.storeClaimVoucherCard]}>
            <View style={styles.voucherHeaderRow}>
              <View style={styles.voucherIconCircle}>
                <Ionicons
                  name={order.payment_method?.toLowerCase() === 'poin' || order.points_used > 0 ? "gift" : "storefront"}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voucherTitle}>
                  {order.payment_method?.toLowerCase() === 'poin' || order.points_used > 0 ? '🎁 BUKTI KLAIM HADIAH DI TOKO' : '🏬 BUKTI PENGAMBILAN DI TOKO'}
                </Text>
                <Text style={styles.voucherSubtitle}>
                  Kode: <Text style={{ color: COLORS.primary, fontWeight: '900' }}>#{order.order_code || order.kode_pesanan}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.voucherDivider} />

            <View style={styles.voucherBody}>
              <View style={styles.voucherInfoRow}>
                <Ionicons name="location" size={16} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.voucherStoreText}>
                  Toko Della Frozen Mart (Tanjung Enim, Muara Enim)
                </Text>
              </View>
              <View style={[styles.voucherInfoRow, { marginTop: 6 }]}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.voucherStatusText}>
                  Status: <Text style={{ fontWeight: 'bold', color: '#059669' }}>Lunas (Rp 0 / Siap Diambil)</Text>
                </Text>
              </View>
              <View style={styles.voucherHelpBox}>
                <Ionicons name="information-circle" size={16} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.voucherHelpText}>
                  {isPointOrder
                    ? 'Tunjukkan layar bukti pesanan ini kepada kasir saat mengambil produk hadiah di toko. Status pesanan akan diselesaikan langsung oleh kasir toko saat produk diserahkan.'
                    : 'Tunjukkan layar bukti pesanan ini kepada kasir toko saat mengambil produk belanjaan Anda.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Banner Batas Waktu Pembayaran 30 Menit */}
        {isPendingPayment && !isCod && (
          <View style={[styles.sectionCard, { backgroundColor: isExpired ? '#FEF2F2' : '#FFFBEB', borderColor: isExpired ? '#EF4444' : '#F59E0B', borderWidth: 1.5, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <Ionicons name={isExpired ? "alert-circle" : "time-outline"} size={22} color={isExpired ? "#EF4444" : "#D97706"} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.bodyBold, color: isExpired ? "#EF4444" : "#D97706" }}>
                    {isExpired ? 'Batas Waktu Pembayaran Habis' : 'Sisa Waktu Pembayaran (30 Menit)'}
                  </Text>
                  <Text style={{ fontSize: 11, color: isExpired ? "#991B1B" : "#B45309", marginTop: 2 }}>
                    {isExpired
                      ? 'Pesanan ini otomatis dibatalkan oleh sistem.'
                      : 'Upload bukti pembayaran sebelum waktu habis.'}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: isExpired ? '#EF4444' : '#F59E0B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {timeLeft || '--:--'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Banner Hitung Mundur Pesanan Selesai Otomatis (15 Menit) - Khusus Pesanan Reguler (Bukan Claim Point) */}
        {!isPointOrder && (order?.order_status?.toLowerCase() === 'dikirim' ||
          order?.order_status?.toLowerCase() === 'siap diambil') && (
          <View style={[styles.sectionCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1.5, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <Ionicons name="timer-outline" size={24} color="#059669" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.bodyBold, color: "#047857" }}>
                    Pesanan Otomatis Selesai Dalam
                  </Text>
                  <Text style={{ fontSize: 11, color: "#065F46", marginTop: 2 }}>
                    Konfirmasi "Pesanan Diterima" sebelum waktu habis!
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {autoCompleteTimeLeft || '15:00'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Banner Alert Pesan Terbaru dari Admin Toko */}
        {recentChat && (
          <TouchableOpacity
            style={[styles.sectionCard, styles.adminChatNoticeCard]}
            onPress={() => navigation.navigate('OrderChat', { orderId: order.id, orderCode: order.order_code || order.kode_pesanan })}
            activeOpacity={0.85}
          >
            <View style={styles.adminChatNoticeHeader}>
              <View style={styles.adminChatNoticeTitleRow}>
                <View style={styles.pulsingDotLive} />
                <Ionicons name="chatbubbles" size={18} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.adminChatNoticeTitle}>Pesan Khusus Admin Toko</Text>
                <View style={styles.chatBadgeLive}>
                  <Text style={styles.chatBadgeLiveText}>Aktif 💬</Text>
                </View>
              </View>
              <View style={styles.adminChatReplyBadge}>
                <Text style={styles.adminChatReplyText}>Balas Chat 👉</Text>
              </View>
            </View>
            <View style={styles.adminChatSnippetContainer}>
              <Text style={styles.adminChatSnippetText} numberOfLines={2}>
                "{recentChat.pesan}"
              </Text>
            </View>
            <Text style={styles.adminChatTapHint}>Ketuk kartu ini untuk masuk ke percakapan langsung dengan Admin.</Text>
          </TouchableOpacity>
        )}

        {/* Card Status Pengiriman Kurir (Tanpa Map Live Tracking) */}
        {order?.order_status?.toLowerCase() === 'dikirim' && (
          <View style={[styles.sectionCard, styles.deliveryActiveCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1.5 }]}>
            <View style={styles.deliveryActiveHeader}>
              <Ionicons name="bicycle" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.deliveryActiveTitle, { color: COLORS.primary }]}>🛵 Pesanan Sedang Diantar Kurir Toko</Text>
            </View>
            <Text style={styles.deliveryActiveDesc}>
              Pesanan Anda sedang dalam perjalanan pengiriman oleh Kurir Toko Della Frozen Mart ke alamat tujuan.
            </Text>
            {trackingData?.kurir && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0F2FE' }}>
                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.secondary, marginBottom: 8, fontWeight: '600' }}>
                  Kurir Pengantar: <Text style={{ fontWeight: 'bold' }}>{trackingData.kurir.name}</Text> ({trackingData.kurir.jenis_kendaraan} • {trackingData.kurir.plat_kendaraan})
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {trackingData.kurir.phone && (
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 8, borderRadius: SIZES.radiusSm }}
                      onPress={() => handleOpenWhatsApp(trackingData.kurir.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={{ ...TYPOGRAPHY.button, color: COLORS.white, fontSize: 13 }}>Chat WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {trackingData.kurir.phone && (
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 8, borderRadius: SIZES.radiusSm }}
                      onPress={() => handleCallPhone(trackingData.kurir.phone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={{ ...TYPOGRAPHY.button, color: COLORS.white, fontSize: 13 }}>Telepon Kurir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {order?.order_status?.toLowerCase() === 'diproses' && (
          <View style={[styles.sectionCard, styles.deliveryActiveCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <View style={styles.deliveryActiveHeader}>
              <Ionicons name="cube-outline" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.deliveryActiveTitle, { color: COLORS.primary }]}>📦 Pesanan Sedang Dikemas</Text>
            </View>
            <Text style={styles.deliveryActiveDesc}>
              Pesanan Anda sedang disiapkan dan dikemas dengan rapi oleh tim Della Frozen Mart.
            </Text>
          </View>
        )}

        {/* Bank Instructions (only if pending transfer/qris) */}
        {isPendingPayment && !isCod && (
          <View style={[styles.sectionCard, styles.bankCard]}>
            <View style={styles.bankTitleRow}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.bankTitle}>Petunjuk Pembayaran</Text>
            </View>
            <Text style={styles.bankText}>
              Silakan melakukan pembayaran sebesar <Text style={styles.bankAmount}>{formatRupiah(order.total_amount)}</Text> ke rekening di bawah ini:
            </Text>
            <View style={styles.divider} />
            <Text style={styles.bankDetails}>
              <Text style={{ fontWeight: 'bold' }}>Bank Mandiri</Text>{'\n'}
              No. Rekening: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>1130002605941</Text>{'\n'}
              Atas Nama: <Text style={{ fontWeight: 'bold' }}>della adelita</Text>
            </Text>
            {order.payment_method.toLowerCase() === 'qris' && (
              <Text style={[styles.bankText, { marginTop: 10, fontStyle: 'italic' }]}>
                *Untuk pembayaran QRIS, silakan gunakan QRIS resmi toko Della Frozen Mart dan upload foto bukti pembayarannya.
              </Text>
            )}
          </View>
        )}

        {/* Shipping Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informasi Pengiriman</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="car-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Metode Pengiriman</Text>
              <Text style={styles.infoValue}>
                {order.delivery_method === 'ambil_toko' ? 'Ambil di Toko' : 'Antar ke Alamat'}
              </Text>
            </View>
          </View>
          {order.delivery_method === 'antar_alamat' && (
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Alamat Tujuan</Text>
                <Text style={styles.addressText}>{order.shipping_address || '-'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Products Dipesan dengan Foto & Detail */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daftar Produk Dipesan</Text>
          <View style={styles.divider} />
          {(order.orderDetails || order.details || order.order_details || []).map((detail) => {
            const rawImg =
              detail?.product?.image_url ||
              detail?.product?.foto ||
              detail?.image_url ||
              detail?.foto;
            const baseUrl = ApiService.BASE_URL ? ApiService.BASE_URL.replace('/api', '') : 'http://localhost:8000';
            const imageUri = rawImg
              ? (rawImg.startsWith('http://') || rawImg.startsWith('https://') ? rawImg : `${baseUrl}/storage/${rawImg.replace(/^\//, '')}`)
              : 'https://via.placeholder.com/150';

            const isRewardItem = detail.is_reward || detail.subtotal == 0 || (detail.product_name && detail.product_name.includes('Hadiah Poin'));

            return (
              <View key={detail.id || detail.product_id} style={[styles.productRowWithImage, isRewardItem && { backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, borderColor: '#A7F3D0' }]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.productThumbImage}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                  {isRewardItem && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#059669', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>🎁 HADIAH POIN LOYALTI</Text>
                    </View>
                  )}
                  <Text style={styles.productNameText} numberOfLines={2}>
                    {detail.product_name || detail.product?.name || detail.product?.nama || 'Produk'}
                  </Text>
                  <Text style={styles.productQtyPriceText}>
                    {isRewardItem ? '1 unit (Ditukar 10 Poin)' : `${detail.quantity} x ${formatRupiah(detail.price)}`}
                  </Text>
                </View>
                <Text style={[styles.productSubtotalText, isRewardItem && { color: '#059669' }]}>
                  {isRewardItem ? 'GRATIS' : formatRupiah(detail.subtotal)}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalDivider} />

          {/* Loyalty Points Info for this Order */}
          {(order.points_earned > 0 || order.points_used > 0 || order.poin_diperoleh > 0 || order.poin_digunakan > 0) && (
            <View style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
              {(order.points_earned > 0 || order.poin_diperoleh > 0) && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={16} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>
                    +{order.points_earned || order.poin_diperoleh} Poin Loyalti diperoleh dari pesanan ini! 🎉
                  </Text>
                </View>
              )}
              {(order.points_used > 0 || order.poin_digunakan > 0) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: (order.points_earned > 0 || order.poin_diperoleh > 0) ? 4 : 0 }}>
                  <Ionicons name="gift" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#065F46' }}>
                    10 Poin Loyalti digunakan untuk 1 produk gratis.
                  </Text>
                </View>
              )}
            </View>
          )}

          {(() => {
            const detailsList = order.orderDetails || order.details || order.order_details || [];
            const calculatedSubtotal = detailsList.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
            const rawShipping = order.ongkos_kirim ?? order.shipping_fee ?? 0;
            const isTakeaway = order.delivery_method === 'ambil_toko';
            const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (order.total_amount - rawShipping);

            return (
              <>
                <View style={[styles.rowJustify, { marginBottom: 6 }]}>
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted }}>Subtotal Produk</Text>
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.secondary, fontWeight: '600' }}>
                    {formatRupiah(finalSubtotal)}
                  </Text>
                </View>

                <View style={[styles.rowJustify, { marginBottom: 10 }]}>
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted }}>
                    Ongkos Kirim {isTakeaway ? '(Ambil di Toko)' : ''}
                  </Text>
                  <Text style={{ ...TYPOGRAPHY.body, color: isTakeaway || rawShipping === 0 ? COLORS.success : COLORS.secondary, fontWeight: '600' }}>
                    {isTakeaway || rawShipping === 0 ? 'Gratis (Rp 0)' : formatRupiah(rawShipping)}
                  </Text>
                </View>

                <View style={[styles.totalDivider, { marginTop: 0, marginBottom: 10 }]} />
              </>
            );
          })()}

          <View style={styles.rowJustify}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalPrice}>{formatRupiah(order.total_amount)}</Text>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Metode Pembayaran</Text>
              <Text style={[styles.infoValue, { textTransform: 'uppercase', fontWeight: '800' }]}>
                {order.payment_method}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Tombol Pesanan Diterima (Khusus Pesanan Reguler - Klaim Poin diselesaikan langsung oleh Kasir Toko) */}
      {!isPointOrder &&
        (order?.order_status?.toLowerCase() === 'dikirim' ||
          order?.order_status?.toLowerCase() === 'siap diambil') && (
        <View style={styles.receivedBottomContainer}>
          <View style={styles.receivedInfoBanner}>
            <Ionicons name="timer-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.receivedInfoText}>
              Selesai otomatis dalam <Text style={{ fontWeight: 'bold', color: '#047857' }}>{autoCompleteTimeLeft || '15:00'}</Text>. Konfirmasi penerimaan di bawah:
            </Text>
          </View>

          <TouchableOpacity
            style={styles.receivedGradientBtn}
            onPress={handleMarkReceived}
            disabled={isReceiving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#059669', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.receivedGradientInner}
            >
              {isReceiving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <View style={styles.receivedIconCircle}>
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  </View>
                  <View style={styles.receivedTextColumn}>
                    <Text style={styles.receivedBtnMainText}>PESANAN DITERIMA & SELESAI 🎉</Text>
                    <Text style={styles.receivedBtnSubText}>Klik untuk konfirmasi penerimaan barang</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Confirmation Popup */}
      <Modal
        visible={isConfirmModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsConfirmModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-done-circle" size={54} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Konfirmasi Pesanan Diterima</Text>
            <Text style={styles.modalDesc}>
              Apakah produk pesanan <Text style={{ fontWeight: 'bold', color: COLORS.secondary }}>#{order?.order_code || order?.kode_pesanan}</Text> telah Anda terima dalam kondisi baik?
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsConfirmModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Nanti Dulu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={executeMarkReceived}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>Ya, Diterima 🎉</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sticky Bottom Actions */}
      {!isCod && (isPendingPayment || isPendingConfirmation) && (
        <View style={styles.bottomBar}>
          <View style={{ flex: 1, marginRight: isPendingPayment ? 12 : 0 }}>
            <CustomButton
              title="BATALKAN"
              variant="outlineDanger"
              onPress={handleCancelOrder}
              isLoading={isCancelling}
            />
          </View>
          {isPendingPayment && (
            <View style={{ flex: 1 }}>
              <CustomButton
                title="KIRIM BUKTI"
                variant="accent"
                iconName="cloud-upload-outline"
                onPress={() => navigation.replace('UploadPayment', { orderId: order.id })}
              />
            </View>
          )}
        </View>
      )}

      {isCod && isPendingPayment && (
        <View style={styles.bottomBar}>
          <View style={{ flex: 1 }}>
            <CustomButton
              title="BATALKAN PESANAN"
              variant="outlineDanger"
              onPress={handleCancelOrder}
              isLoading={isCancelling}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
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
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  scrollContent: {
    padding: SIZES.paddingMd,
    paddingBottom: 100,
  },
  statusHeaderCard: {
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd + 4,
    marginBottom: 12,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusHeaderSubtitle: {
    ...TYPOGRAPHY.small,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statusHeaderText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  paymentBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '800',
    color: COLORS.white,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    lineHeight: 20,
    marginTop: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  productName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  productQty: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  productSubtotal: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  totalLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  totalPrice: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.accent,
  },
  deliveryActiveCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginTop: SIZES.md,
  },
  deliveryActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryActiveTitle: {
    ...TYPOGRAPHY.h4,
    color: '#B45309',
  },
  deliveryActiveDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  bankCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primaryDark,
  },
  bankText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  bankAmount: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bankDetails: {
    ...TYPOGRAPHY.body,
    lineHeight: 24,
    color: COLORS.secondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    padding: 16,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    zIndex: 99,
    ...SHADOWS.heavy,
  },
  receivedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    padding: SIZES.paddingMd,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    zIndex: 99,
    ...SHADOWS.heavy,
  },
  receivedInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  receivedInfoText: {
    ...TYPOGRAPHY.small,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
  },
  receivedGradientBtn: {
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  receivedGradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  receivedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receivedTextColumn: {
    flex: 1,
  },
  receivedBtnMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  receivedBtnSubText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textMuted,
  },
  modalConfirmBtn: {
    flex: 1.2,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  productRowWithImage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  productThumbImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  productNameText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  productQtyPriceText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  productSubtotalText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  storeClaimVoucherCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#34D399',
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: '#065F46',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  voucherOrderCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: '#A7F3D0',
    marginVertical: 12,
  },
  voucherBody: {},
  voucherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherStoreText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
    flex: 1,
  },
  voucherStatusText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  voucherHelpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: SIZES.radiusSm,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  voucherHelpText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '500',
  },
  adminChatNoticeCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    marginBottom: 14,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    ...SHADOWS.small,
  },
  adminChatNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adminChatNoticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pulsingDotLive: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  adminChatNoticeTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: '#92400E',
    fontSize: 13,
  },
  chatBadgeLive: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  chatBadgeLiveText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  adminChatReplyBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminChatReplyText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  adminChatSnippetContainer: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: SIZES.radiusXs,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginVertical: 4,
  },
  adminChatSnippetText: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },
  adminChatTapHint: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: '#B45309',
    marginTop: 4,
  },
});

export default OrderDetailScreen;
