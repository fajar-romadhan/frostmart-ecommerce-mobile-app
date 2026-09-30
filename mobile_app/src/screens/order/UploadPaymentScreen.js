import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, SafeAreaView, Modal, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useOrders } from '../../context/OrderContext';
import { ApiService, isAbortError } from '../../core/api';
import { downloadAndSaveQris } from '../../utils/qrisHelper';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import CustomButton from '../../components/CustomButton';

export const UploadPaymentScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { uploadPaymentProof, isLoading } = useOrders();
  const [order, setOrder] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [qrisModalVisible, setQrisModalVisible] = useState(false);
  const [downloadingQris, setDownloadingQris] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const handleDownloadQris = async () => {
    setDownloadingQris(true);
    try {
      await downloadAndSaveQris();
    } finally {
      setDownloadingQris(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await ApiService.get(`/orders/${orderId}`);
        const body = await res.json();
        if (res.status === 200 && body.success) {
          setOrder(body.data);
        }
      } catch (err) {
        console.error('Fetch order detail error:', err);
      }
    };
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    const calcTimeLeft = () => {
      const deadlineStr = order.payment_deadline || order.waktu_tenggat_pembayaran;
      const deadline = deadlineStr
        ? new Date(deadlineStr)
        : new Date(new Date(order.created_at || order.order_date).getTime() + 30 * 60 * 1000);

      const diffMs = deadline.getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
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

  const requestPermission = async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const handlePickImage = async (source) => {
    const isGranted = await requestPermission(source);
    if (!isGranted) {
      Alert.alert('Izin Ditolak', `Aplikasi memerlukan izin akses ${source === 'camera' ? 'kamera' : 'galeri'} untuk mengunggah bukti.`);
      return;
    }

    try {
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error selecting image:', e);
      Alert.alert('Error', 'Gagal memilih gambar.');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Peringatan', 'Silakan pilih atau ambil foto bukti pembayaran terlebih dahulu.');
      return;
    }

    const res = await uploadPaymentProof(orderId, imageUri);
    if (res.success) {
      Alert.alert('Sukses', 'Bukti pembayaran berhasil diunggah! Menunggu konfirmasi admin.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.replace('OrderDetail', { orderId });
          },
        },
      ]);
    } else {
      Alert.alert('Gagal', res.message || 'Gagal mengunggah bukti pembayaran.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Countdown Timer Banner 30 Menit */}
        <View style={[styles.timerBanner, isExpired && styles.timerBannerExpired]}>
          <Ionicons name={isExpired ? "alert-circle" : "time-outline"} size={22} color={COLORS.white} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.timerTitle}>
              {isExpired ? 'Batas Waktu Pembayaran Habis' : 'Sisa Waktu Pembayaran (30 Menit)'}
            </Text>
            <Text style={styles.timerSub}>
              {isExpired
                ? 'Pesanan ini otomatis dibatalkan oleh sistem.'
                : 'Upload bukti pembayaran sebelum waktu habis.'}
            </Text>
          </View>
          <View style={styles.timerBadge}>
            <Text style={styles.timerBadgeText}>{timeLeft || '--:--'}</Text>
          </View>
        </View>

        {/* Bank details instruction card */}
        <View style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleIconCircle}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>Petunjuk Transfer</Text>
          </View>
          <Text style={styles.subtitleText}>
            Silakan melakukan transfer total belanjaan Anda ke rekening toko berikut:
          </Text>
          <View style={styles.divider} />

          <View style={styles.bankRow}>
            <View style={styles.bankIconCircle}>
              <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>Bank Mandiri</Text>
              <Text style={styles.bankNo}>1130002605941</Text>
              <Text style={styles.bankOwner}>a/n della adelita</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                Alert.alert('Berhasil Disalin', 'Nomor rekening Bank Mandiri (1130002605941) berhasil disalin!');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
              <Text style={styles.copyBtnText}>Salin</Text>
            </TouchableOpacity>
          </View>

          {/* Card Scan Barcode QRIS Resmi */}
          <View style={styles.qrisCard}>
            <View style={styles.qrisHeader}>
              <Ionicons name="qr-code-outline" size={20} color={COLORS.primary} />
              <Text style={styles.qrisTitle}>Scan Barcode QRIS Toko</Text>
            </View>
            <Text style={styles.qrisDesc}>
              Buka aplikasi m-Banking / E-Wallet Anda (GoPay, OVO, Dana, ShopeePay, Mandiri Livin, dll) lalu scan QRIS di bawah ini:
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setQrisModalVisible(true)}
              style={styles.qrisImageWrapper}
            >
              <Image
                source={require('../../../assets/images/qris.png')}
                style={styles.qrisImage}
                resizeMode="contain"
              />
              <View style={styles.zoomBadge}>
                <Ionicons name="search-outline" size={12} color={COLORS.white} />
                <Text style={styles.zoomBadgeText}>Tap untuk Perbesar</Text>
              </View>
            </TouchableOpacity>

            {/* Tombol Download QRIS */}
            <TouchableOpacity
              style={styles.downloadQrisBtn}
              onPress={handleDownloadQris}
              disabled={downloadingQris}
              activeOpacity={0.85}
            >
              {downloadingQris ? (
                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="download-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.downloadQrisBtnText}>
                {downloadingQris ? 'Mengunduh...' : '📥 Download Gambar QRIS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Picker Area preview */}
        <View style={styles.imageCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderIconCircle}>
                <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.placeholderTitle}>Upload Bukti Pembayaran</Text>
              <Text style={styles.placeholderText}>Pilih foto dari kamera atau galeri</Text>
            </View>
          )}
        </View>

        {/* Actions Button row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => handlePickImage('camera')}
            activeOpacity={0.7}
          >
            <View style={styles.pickerIconCircle}>
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.pickerBtnText}>Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => handlePickImage('gallery')}
            activeOpacity={0.7}
          >
            <View style={styles.pickerIconCircle}>
              <Ionicons name="images" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.pickerBtnText}>Galeri</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Trigger */}
        <View style={{ marginTop: 24 }}>
          <CustomButton
            title="UNGGAH BUKTI BAYAR"
            onPress={handleUpload}
            disabled={!imageUri}
            isLoading={isLoading}
            variant="accent"
            iconName="cloud-upload-outline"
          />
        </View>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main', state: { routes: [{ name: 'Beranda' }] } }],
            });
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Unggah Nanti (Kembali ke Beranda)</Text>
        </TouchableOpacity>

        {/* Modal Fullscreen Zoom Barcode QRIS */}
        <Modal
          visible={qrisModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setQrisModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Barcode QRIS Della Frozen Mart</Text>
                <TouchableOpacity
                  onPress={() => setQrisModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../../assets/images/qris.png')}
                style={styles.modalQrisImage}
                resizeMode="contain"
              />
              <Text style={styles.modalHintText}>
                Silakan scan barcode ini menggunakan aplikasi m-Banking atau E-Wallet pilihan Anda.
              </Text>
              <TouchableOpacity
                style={[styles.downloadQrisBtn, { width: '100%', marginTop: 8 }]}
                onPress={handleDownloadQris}
                disabled={downloadingQris}
                activeOpacity={0.85}
              >
                {downloadingQris ? (
                  <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />
                ) : (
                  <Ionicons name="download-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.downloadQrisBtnText}>
                  {downloadingQris ? 'Mengunduh QRIS...' : '📥 Simpan Gambar QRIS ke Galeri'}
                </Text>
              </TouchableOpacity>
              <CustomButton
                title="Tutup Preview"
                onPress={() => setQrisModalVisible(false)}
                type="primary"
                style={{ marginTop: 10, width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.paddingMd,
    paddingBottom: 40,
  },
  timerBanner: {
    backgroundColor: '#D97706',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  timerBannerExpired: {
    backgroundColor: '#DC2626',
  },
  timerTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  timerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  timerBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  subtitleText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 14,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bankIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  bankNo: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    marginTop: 2,
  },
  bankOwner: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copyBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
    marginLeft: 4,
  },
  qrisCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  qrisTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginLeft: 6,
  },
  qrisDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  qrisImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrisImage: {
    width: '100%',
    height: 200,
  },
  zoomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  zoomBadgeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  downloadQrisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    ...SHADOWS.light,
  },
  downloadQrisBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontSize: 13,
  },
  noteText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 12,
  },
  imageCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    minHeight: 220,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 250,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  placeholderIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  placeholderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    marginHorizontal: 6,
    ...SHADOWS.light,
  },
  pickerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pickerBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  skipBtn: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalQrisImage: {
    width: 260,
    height: 320,
  },
  modalHintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default UploadPaymentScreen;
