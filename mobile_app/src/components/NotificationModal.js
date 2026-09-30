import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../core/theme';

export const NotificationModal = ({ visible, onClose, notifications, onSelectNotification }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.bellIconCircle}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Notifikasi Pesanan Masuk</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          {/* List Notifikasi */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {notifications && notifications.length > 0 ? (
              notifications.map((item, index) => {
                const isDbNotif = Boolean(item.title || item.judul);
                const title = item.title || item.judul || (item.order_code ? `Pesanan ${item.order_code}` : 'Notifikasi');
                const message = item.message || item.pesan || `Pemesan: ${item.user_name || 'Pelanggan'} | Total: Rp${(item.total_amount || 0).toLocaleString('id-ID')}`;
                const isPayment = (item.type === 'bukti_pembayaran' || item.jenis === 'bukti_pembayaran');
                const isRewardClaim = (item.type === 'klaim_hadiah' || item.jenis === 'klaim_hadiah' || (item.title || item.judul || '').includes('HADIAH'));
                const badgeLabel = isRewardClaim ? '🎁 KLAIM HADIAH' : (isPayment ? '💳 BUKTI BAYAR' : (isDbNotif ? '🔔 NOTIFIKASI' : '🛍️ PESANAN BARU'));
                const badgeColor = isRewardClaim ? '#059669' : (isPayment ? COLORS.accent : COLORS.primary);
                const timeText = item.created_at 
                  ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                  : (item.time || 'Baru saja');

                return (
                  <TouchableOpacity
                    key={item.id || index}
                    style={styles.notifCard}
                    onPress={() => {
                      onClose();
                      onSelectNotification(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.notifHeaderRow}>
                      <View style={[styles.badgeNew, { backgroundColor: badgeColor + '15' }]}>
                        <Text style={[styles.badgeNewText, { color: badgeColor }]}>{badgeLabel}</Text>
                      </View>
                      <Text style={styles.notifTime}>{timeText}</Text>
                    </View>
                    <Text style={styles.notifCode}>{title}</Text>
                    <Text style={styles.notifUser}>{message}</Text>
                    <View style={styles.notifFooterRow}>
                      <View style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>Lihat Pesanan ➔</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Belum Ada Notifikasi Baru</Text>
                <Text style={styles.emptyDesc}>
                  Semua pesanan baru yang masuk ke toko akan secara otomatis ditampilkan di sini.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: SIZES.paddingMd,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  notifCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.light,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeNew: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeNewText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  notifTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  notifCode: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  notifUser: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notifFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notifAmount: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginTop: 12,
  },
  emptyDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

export default NotificationModal;
