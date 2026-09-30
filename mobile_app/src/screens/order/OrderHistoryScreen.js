import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useOrders } from '../../context/OrderContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { formatRupiah } from '../../core/utils';

export const OrderHistoryScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { orders, isLoading, getOrders } = useOrders();

  useEffect(() => {
    if (isFocused) {
      getOrders();
      const interval = setInterval(() => {
        getOrders();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isFocused]);

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

  const getStatusIcon = (status) => {
    if (!status) return 'ellipse-outline';
    switch (status.toLowerCase()) {
      case 'selesai':
        return 'checkmark-circle';
      case 'dibatalkan':
        return 'close-circle';
      case 'menunggu_pembayaran':
      case 'menunggu pembayaran':
        return 'time';
      default:
        return 'hourglass';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return '';
    const clean = status.toLowerCase().replace('_', ' ');
    if (clean === 'diproses') return 'DIKEMAS';
    return clean.toUpperCase();
  };

  const renderOrderItem = ({ item }) => {
    const statusColor = getStatusColor(item.order_status);
    const statusIcon = getStatusIcon(item.order_status);
    const orderDate = item.order_date || item.orderDate || '';
    const totalAmount = item.total_amount || item.totalAmount || 0;
    const hasAdminChat = Boolean(item.has_admin_chat || item.unread_chats_count > 0 || item.latest_admin_chat);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, hasAdminChat && styles.cardWithChat]}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeContainer}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.codeText}>{item.order_code}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>{orderDate}</Text>
          </View>
        </View>

        {/* Widget Notifikasi Ciri Khas Pesan Chat Admin Toko */}
        {hasAdminChat && (
          <View style={styles.chatNotificationWidget}>
            <View style={styles.chatWidgetHeader}>
              <View style={styles.chatWidgetTitleRow}>
                <View style={styles.pulsingChatDot} />
                <Ionicons name="chatbubbles" size={15} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.chatWidgetTitle}>Pesan dari Admin Toko</Text>
                {item.unread_chats_count > 0 && (
                  <View style={styles.unreadCountChip}>
                    <Text style={styles.unreadCountText}>{item.unread_chats_count} Baru</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.chatQuickReplyBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('OrderChat', { orderId: item.id, orderCode: item.order_code })}
              >
                <Text style={styles.chatQuickReplyText}>Balas Chat 💬</Text>
              </TouchableOpacity>
            </View>
            {item.latest_admin_chat ? (
              <Text style={styles.chatWidgetSnippet} numberOfLines={2}>
                "{item.latest_admin_chat}"
              </Text>
            ) : null}
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.label}>Total Pembayaran</Text>
            <Text style={styles.amount}>{formatRupiah(totalAmount)}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
            <Ionicons name={statusIcon} size={12} color={statusColor} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item.order_status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={50} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Riwayat Pesanan</Text>
          <Text style={styles.emptySubtitle}>Belanjaan Anda akan tampil di sini setelah memesan.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={getOrders}
          refreshing={isLoading}
        />
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
    paddingHorizontal: SIZES.paddingLg * 2,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: SIZES.paddingMd,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  amount: {
    ...TYPOGRAPHY.price,
    color: COLORS.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    ...TYPOGRAPHY.small,
    fontWeight: '800',
  },
  cardWithChat: {
    borderColor: '#FCD34D',
    borderWidth: 1.5,
  },
  chatNotificationWidget: {
    backgroundColor: '#FEF3C7',
    borderRadius: SIZES.radiusSm,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  chatWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatWidgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pulsingChatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  chatWidgetTitle: {
    ...TYPOGRAPHY.small,
    fontWeight: 'bold',
    color: '#B45309',
  },
  unreadCountChip: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  unreadCountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatQuickReplyBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chatQuickReplyText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatWidgetSnippet: {
    ...TYPOGRAPHY.small,
    color: '#78350F',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default OrderHistoryScreen;
