import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '../core/theme';

export const CustomerNotificationModal = ({ visible, onClose, notifications = [], onSelectOrder }) => {
  const renderItem = ({ item }) => {
    const isChat = item.type === 'chat' || item.jenis === 'chat';
    return (
      <TouchableOpacity
        style={[styles.notifItem, item.is_read === false && styles.notifItemUnread]}
        onPress={() => {
          onClose();
          if (item.orderId && onSelectOrder) {
            onSelectOrder(item.orderId, isChat ? 'OrderChat' : 'OrderDetail', item.orderCode);
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, isChat && { backgroundColor: '#ECFDF5' }]}>
          <Ionicons
            name={isChat ? "chatbubble-ellipses" : "notifications"}
            size={22}
            color={isChat ? "#059669" : COLORS.primary}
          />
        </View>
        <View style={styles.notifContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.notifTitle, isChat && { color: '#059669' }]}>
              {item.title || item.judul || 'Notifikasi'}
            </Text>
            {item.is_read === false && (
              <View style={styles.unreadDot} />
            )}
          </View>
          <Text style={styles.notifBody}>{item.body || item.message || item.pesan}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={styles.notifTime}>{item.time || 'Baru saja'}</Text>
            {isChat && (
              <Text style={styles.chatActionHint}> • Ketuk untuk Balas Chat 💬</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Notifikasi Pesanan Anda</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item, idx) => String(item.id || idx)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Belum ada notifikasi pesanan atau chat.</Text>
              </View>
            }
          />
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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  listContent: {
    padding: SIZES.md,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notifBody: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginVertical: 2,
  },
  notifItemUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  chatActionHint: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: '#059669',
    fontWeight: 'bold',
  },
  notifTime: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});

export default CustomerNotificationModal;
