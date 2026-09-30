import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ApiService, isAbortError } from '../../core/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import NotificationService from '../../core/notificationService';

export const OrderChatScreen = ({ route, navigation }) => {
  const { orderId, orderCode } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const lastMessageIdRef = useRef(null);
  const isFetchingChatsRef = useRef(false);

  const fetchChats = async (isBackground = false) => {
    if (isBackground && isFetchingChatsRef.current) return;
    isFetchingChatsRef.current = true;
    try {
      const res = await ApiService.get(`/orders/${orderId}/chats`);
      const body = await res.json();
      if (res.status === 200 && body.success && Array.isArray(body.data)) {
        const chatData = body.data;
        if (chatData.length > 0) {
          const newestMsg = chatData[chatData.length - 1];
          if (lastMessageIdRef.current !== null && newestMsg.id !== lastMessageIdRef.current) {
            const isMyMsg = newestMsg.pengirim_id === user?.id;
            if (!isMyMsg) {
              Vibration.vibrate([0, 200, 100, 200]);
              NotificationService.playIosNotificationSound();
            }
          }
          lastMessageIdRef.current = newestMsg.id;
        }
        setMessages(chatData);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Error fetch chats:', err?.message || err);
      }
    } finally {
      isFetchingChatsRef.current = false;
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(() => fetchChats(true), 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleSend = async (textToSend) => {
    const content = textToSend || inputText;
    if (!content || !content.trim()) return;

    setSending(true);
    try {
      const res = await ApiService.post(`/orders/${orderId}/chats`, { pesan: content });
      const body = await res.json();
      if (res.status === 201 && body.success) {
        if (!textToSend) setInputText('');
        fetchChats();
      }
    } catch (err) {
      console.error('Error send chat:', err);
    } finally {
      setSending(false);
    }
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'owner');
  const hasAdminMessage = messages.some(m => {
    const role = m.pengirim?.role || m.pengirim?.peran;
    return role === 'admin' || role === 'owner';
  });

  const renderPresetButtons = () => {
    if (!isAdmin) return null;
    return (
      <View style={styles.presetContainer}>
        <Text style={styles.presetTitle}>Template Balasan Cepat Admin:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
          <TouchableOpacity
            style={[styles.presetBadge, { backgroundColor: COLORS.dangerLight }]}
            onPress={() => handleSend("🔴 Halo Kak, mohon maaf ada produk yang stoknya kosong di toko fisik kami. Apakah berkenan diganti produk lain?")}
          >
            <Text style={[styles.presetText, { color: COLORS.danger }]}>⚠️ Stok Kosong</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetBadge, { backgroundColor: COLORS.primaryLight }]}
            onPress={() => handleSend("📦 Halo Kak, pesanan Anda saat ini sedang dikemas oleh tim gudang kami.")}
          >
            <Text style={[styles.presetText, { color: COLORS.primary }]}>📦 Sedang Dikemas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetBadge, { backgroundColor: COLORS.successLight }]}
            onPress={() => handleSend("🚚 Pesanan Anda sudah dibawa oleh kurir toko dan dalam perjalanan menuju alamat Anda.")}
          >
            <Text style={[styles.presetText, { color: COLORS.success }]}>🚚 Kurir Berangkat</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isMe = item.pengirim_id === user?.id;
    return (
      <View style={[styles.msgWrapper, isMe ? styles.myMsgWrapper : styles.otherMsgWrapper]}>
        <View style={[styles.msgBubble, isMe ? styles.myMsgBubble : styles.otherMsgBubble]}>
          <Text style={styles.senderName}>{item.pengirim?.nama || item.pengirim?.name || 'Pengguna'} ({item.pengirim?.role?.toUpperCase() || 'USER'})</Text>
          <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.otherMsgText]}>{item.pesan}</Text>
          <Text style={styles.msgTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Chat Pesanan #{orderCode}</Text>
          <Text style={styles.headerSubtitle}>Toko Della Frozen Mart</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {renderPresetButtons()}

      {(!isAdmin && !hasAdminMessage && !loading) ? (
        <View style={[styles.inputContainer, { justifyContent: 'center', backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="lock-closed" size={16} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={{ ...TYPOGRAPHY.small, color: '#D97706', fontWeight: '600' }}>
            Menunggu Admin Toko memulai percakapan...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Tulis pesan balasan..."
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()} disabled={sending}>
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, ...SHADOWS.light },
  headerTitle: { ...TYPOGRAPHY.h4, color: COLORS.secondary },
  headerSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 20 },
  msgWrapper: { marginBottom: 12, width: '100%', flexDirection: 'row' },
  myMsgWrapper: { justifyContent: 'flex-end' },
  otherMsgWrapper: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  myMsgBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
  otherMsgBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 2, ...SHADOWS.light },
  senderName: { ...TYPOGRAPHY.caption, fontWeight: '700', marginBottom: 2, color: COLORS.accent },
  msgText: { ...TYPOGRAPHY.body },
  myMsgText: { color: COLORS.white },
  otherMsgText: { color: COLORS.secondary },
  msgTime: { ...TYPOGRAPHY.caption, fontSize: 10, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  presetContainer: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.white, borderTopWidth: 1, borderColor: COLORS.border },
  presetTitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: 6 },
  presetScroll: { flexDirection: 'row', gap: 8 },
  presetBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusFull, marginRight: 8 },
  presetText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.white, alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: SIZES.radiusFull, paddingHorizontal: 16, height: 42, color: COLORS.secondary },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

export default OrderChatScreen;
