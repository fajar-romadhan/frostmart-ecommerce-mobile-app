import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ApiService, isAbortError } from '../../core/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export const AddressFormScreen = ({ navigation, route }) => {
  const editingAddress = route.params?.address || null;
  const isEdit = !!editingAddress;
  const { user } = useAuth();

  const [label, setLabel] = useState('Rumah'); // Rumah, Kantor, Lainnya
  const [receiverName, setReceiverName] = useState(isEdit ? '' : (user?.name || ''));
  const [receiverPhone, setReceiverPhone] = useState(isEdit ? '' : (user?.phone || ''));
  const [completeAddress, setCompleteAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isUtama, setIsUtama] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLabel(editingAddress.label);
      setReceiverName(editingAddress.nama_penerima);
      setReceiverPhone(editingAddress.telepon_penerima);
      setCompleteAddress(editingAddress.alamat_lengkap);
      setLatitude(editingAddress.latitude);
      setLongitude(editingAddress.longitude);
      setIsUtama(editingAddress.is_utama);
    }
  }, [editingAddress]);

  useEffect(() => {
    if (route.params?.selectedLocation) {
      const loc = route.params.selectedLocation;
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      if (loc.addressText) {
        setCompleteAddress(loc.addressText);
      }
    }
  }, [route.params?.selectedLocation]);

  const handleAutoDetectGps = async () => {
    try {
      setLoadingGps(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Lokasi Ditolak', 'Izinkan akses lokasi/GPS pada HP Anda agar sistem bisa mengisi alamat otomatis.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      // Fetch reverse geocode address text from backend
      try {
        const res = await ApiService.get(`/addresses/reverse-geocode?lat=${lat}&lng=${lng}`);
        const json = await res.json();
        if (json.success && json.address) {
          setCompleteAddress(json.address);
          if (errors.completeAddress) setErrors({ ...errors, completeAddress: null });
          Alert.alert('Lokasi Ditemukan 🎯', 'Alamat lengkap dan koordinat GPS berhasil diisi otomatis!');
        } else {
          Alert.alert('GPS Berhasil 🎯', `Koordinat berhasil didapat. Silakan sesuaikan nama jalan jika perlu.`);
        }
      } catch (geocodeErr) {
        // Geocode gagal tapi koordinat sudah tersimpan — tidak perlu alert error
        Alert.alert('GPS Berhasil 🎯', `Koordinat berhasil didapat. Silakan ketik alamat lengkap secara manual.`);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Gagal GPS:', err);
        Alert.alert('Gagal Deteksi GPS', 'Pastikan GPS HP Anda sudah aktif dan izin lokasi diberikan.');
      }
    } finally {
      setLoadingGps(false);
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!receiverName.trim()) tempErrors.receiverName = 'Nama penerima wajib diisi.';
    if (!receiverPhone.trim()) {
      tempErrors.receiverPhone = 'Nomor telepon wajib diisi.';
    } else if (receiverPhone.trim().length < 9) {
      tempErrors.receiverPhone = 'Nomor telepon minimal 9 digit.';
    }
    if (!completeAddress.trim()) tempErrors.completeAddress = 'Alamat lengkap wajib diisi.';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    const payload = {
      label,
      nama_penerima: receiverName.trim(),
      telepon_penerima: receiverPhone.trim(),
      alamat_lengkap: completeAddress.trim(),
      latitude,
      longitude,
      is_utama: isUtama,
    };

    try {
      let res;
      if (isEdit) {
        res = await ApiService.put(`/addresses/${editingAddress.id}`, payload);
      } else {
        res = await ApiService.post('/addresses', payload);
      }

      const json = await res.json();
      if (json.success) {
        Alert.alert('Sukses ✅', isEdit ? 'Alamat berhasil diperbarui.' : 'Alamat berhasil disimpan.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Error dari backend (validasi, dsb.)
        const msg = json.message || json.errors
          ? (json.message || Object.values(json.errors || {})?.[0]?.[0] || 'Gagal menyimpan alamat.')
          : 'Gagal menyimpan alamat.';
        Alert.alert('Gagal', msg);
      }
    } catch (err) {
      if (isAbortError(err)) {
        // Tunnel sedang reconnect — minta user coba lagi
        Alert.alert(
          'Koneksi Terputus Sesaat ⚠️',
          'Tunnel server sedang menyambung ulang. Tunggu 3 detik lalu tekan Simpan lagi.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('Save address error:', err?.message || err);
        Alert.alert('Error Koneksi', 'Gagal terhubung ke server. Pastikan internet aktif dan server berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.formLabel}>Label Alamat</Text>
          <View style={styles.labelButtonRow}>
            {['Rumah', 'Kantor', 'Lainnya'].map((item) => {
              const isSelected = label === item;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.8}
                  style={[
                    styles.labelOptionBtn,
                    isSelected && styles.labelOptionBtnSelected,
                  ]}
                  onPress={() => setLabel(item)}
                >
                  <Text
                    style={[
                      styles.labelOptionText,
                      isSelected && styles.labelOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <CustomInput
            label="Nama Penerima"
            placeholder="Masukkan nama penerima..."
            value={receiverName}
            onChangeText={(text) => {
              setReceiverName(text);
              if (errors.receiverName) setErrors({ ...errors, receiverName: null });
            }}
            error={errors.receiverName}
          />

          <CustomInput
            label="No. Telepon Penerima"
            placeholder="Masukkan nomor telepon..."
            keyboardType="phone-pad"
            value={receiverPhone}
            onChangeText={(text) => {
              setReceiverPhone(text);
              if (errors.receiverPhone) setErrors({ ...errors, receiverPhone: null });
            }}
            error={errors.receiverPhone}
          />

          <CustomInput
            label="Alamat Lengkap"
            placeholder="Tulis alamat jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
            value={completeAddress}
            onChangeText={(text) => {
              setCompleteAddress(text);
              if (errors.completeAddress) setErrors({ ...errors, completeAddress: null });
            }}
            multiline
            numberOfLines={4}
            error={errors.completeAddress}
            style={styles.addressInput}
          />

          {/* Button Deteksi Otomatis Lokasi GPS */}
          <TouchableOpacity
            style={styles.gpsAutoBtn}
            onPress={handleAutoDetectGps}
            disabled={loadingGps}
            activeOpacity={0.8}
          >
            {loadingGps ? (
              <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="navigate" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
            )}
            <Text style={styles.gpsAutoBtnText}>
              {loadingGps ? 'Mencari Lokasi GPS HP...' : '🎯 Deteksi Otomatis Lokasi GPS Saya'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate('MapPicker', {
              initialLocation: latitude && longitude ? { latitude, longitude } : null
            })}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.mapButtonText}>
              {latitude && longitude ? '📍 Lokasi Sudah Dipilih (Ubah di Peta)' : '📍 Atur Pin Lokasi Presisi di Peta'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Switch Utama */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Atur sebagai Alamat Utama</Text>
              <Text style={styles.switchDesc}>Alamat ini akan otomatis terpilih saat checkout.</Text>
            </View>
            <Switch
              value={isUtama}
              onValueChange={setIsUtama}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={isUtama ? COLORS.primary : COLORS.white}
            />
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <CustomButton
            title={isEdit ? 'SIMPAN PERUBAHAN' : 'SIMPAN ALAMAT'}
            onPress={handleSave}
            isLoading={loading}
            variant="accent"
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  formLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  labelButtonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  labelOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  labelOptionBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  labelOptionText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
  },
  labelOptionTextSelected: {
    color: COLORS.primaryDark,
  },
  addressInput: {
    height: 80,
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 4,
    ...SHADOWS.medium,
  },
  gpsAutoBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    marginVertical: 8,
    ...SHADOWS.light,
  },
  mapButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  switchTextCol: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  switchDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SIZES.paddingMd,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.heavy,
  },
});

export default AddressFormScreen;
