import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { getImageUrl } from '../../core/api';
import { validatePhone } from '../../core/utils';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export const EditProfileScreen = ({ navigation }) => {
  const { user, updateProfile, deleteProfilePhoto, isLoading, errorMessage } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);  // new local URI chosen by user
  const [removePhoto, setRemovePhoto] = useState(false);          // flag: user wants to delete
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // ─── Pick photo from gallery ───────────────────────────────────────────────
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan akses ke galeri foto Anda untuk mengubah foto profil.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhotoUri(result.assets[0].uri);
        setRemovePhoto(false); // cancel any pending remove
      }
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat membuka galeri foto. Coba lagi.');
      console.log('ImagePicker error:', e);
    }
  };

  // ─── Take photo from camera ────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan akses ke kamera untuk mengambil foto profil.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePhotoUri(result.assets[0].uri);
        setRemovePhoto(false); // cancel any pending remove
      }
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat membuka kamera.');
      console.log('Camera error:', e);
    }
  };

  // ─── Remove / reset to default Della avatar ───────────────────────────────
  const handleRemovePhoto = () => {
    Alert.alert(
      '🗑️  Hapus Foto Profil',
      'Foto profil akan dihapus dan diganti dengan avatar default Della Frozen Mart. Lanjutkan?',
      [
        {
          text: 'Hapus Foto',
          style: 'destructive',
          onPress: () => {
            setRemovePhoto(true);
            setProfilePhotoUri(null); // clear local preview
          },
        },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  // ─── Show action sheet to select source ───────────────────────────────────
  const handleChangePhoto = () => {
    const hasCurrentPhoto = !removePhoto && (profilePhotoUri || existingPhotoUrl);
    const options = [
      { text: '🖼️  Pilih dari Galeri', onPress: handlePickPhoto },
      { text: '📸  Ambil dari Kamera', onPress: handleTakePhoto },
    ];

    if (hasCurrentPhoto) {
      options.push({ text: '🗑️  Hapus Foto Profil', style: 'destructive', onPress: handleRemovePhoto });
    }

    options.push({ text: 'Batal', style: 'cancel' });

    Alert.alert('📷 Ubah Foto Profil', 'Pilih sumber foto', options, { cancelable: true });
  };

  // ─── Validate fields ───────────────────────────────────────────────────────
  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) {
      tempErrors.name = 'Nama lengkap wajib diisi.';
    }
    if (phone && !validatePhone(phone)) {
      tempErrors.phone = 'Nomor telepon tidak valid (9-15 digit).';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setUploading(true);

    // If user wants to remove photo, call the delete endpoint first
    if (removePhoto) {
      const deleted = await deleteProfilePhoto();
      setUploading(false);
      if (deleted) {
        Alert.alert('✅ Sukses', 'Foto profil berhasil dihapus!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Gagal', errorMessage || 'Gagal menghapus foto profil.');
      }
      return;
    }

    const success = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      profilePhoto: profilePhotoUri || null,
    });
    setUploading(false);

    if (success) {
      Alert.alert('✅ Sukses', 'Profil berhasil diperbarui!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Gagal', errorMessage || 'Gagal memperbarui profil.');
    }
  };

  // ─── Avatar sources ────────────────────────────────────────────────────────
  const existingPhotoUrl = user?.profile_photo ? getImageUrl(user.profile_photo) : null;
  // Show: new local pick > existing server photo > default (if not removing)
  const displayUri = removePhoto ? null : (profilePhotoUri || existingPhotoUrl);
  const initials = (user?.name || 'P').charAt(0).toUpperCase();
  const showRemoveBadge = !removePhoto && (profilePhotoUri || existingPhotoUrl);

  const isBusy = isLoading || uploading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar Section ──────────────────────────────────────── */}
          <View style={styles.avatarSection}>
            {/* Outer branded ring */}
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd, '#A8EDEA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRingOuter}
            >
              {/* Inner ring – white gap */}
              <View style={styles.avatarRingInner}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleChangePhoto}
                  style={styles.avatarTouchable}
                >
                  {displayUri ? (
                    <Image
                      source={{ uri: displayUri }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    // ── Default Della Frozen Mart branded avatar ──────────
                    <LinearGradient
                      colors={[COLORS.gradientStart, '#1565C0', COLORS.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarPlaceholder}
                    >
                      {/* Snowflake icon — ciri khas Della */}
                      <View style={styles.dellaIconWrapper}>
                        <Ionicons name="snow" size={38} color="rgba(255,255,255,0.95)" />
                      </View>
                      {/* Brand name strip at bottom */}
                      <View style={styles.dellaNameStrip}>
                        <Text style={styles.dellaNameText}>DELLA</Text>
                      </View>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Camera badge – bottom-right of ring */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleChangePhoto}
              style={styles.cameraBadge}
            >
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.cameraBadgeGradient}
              >
                <Ionicons name="camera" size={16} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Trash badge – bottom-left of ring, only when there is a photo */}
            {showRemoveBadge && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRemovePhoto}
                style={styles.removeBadge}
              >
                <View style={styles.removeBadgeInner}>
                  <Ionicons name="trash" size={14} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            )}

            {/* Della branding tag */}
            <View style={styles.brandTag}>
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.brandTagGradient}
              >
                <Ionicons name="snow" size={10} color={COLORS.white} />
                <Text style={styles.brandTagText}>  Della Frozen Mart</Text>
              </LinearGradient>
            </View>

            <Text style={styles.avatarHint}>
              {removePhoto
                ? '🗑️ Foto akan dihapus. Simpan untuk menerapkan.'
                : profilePhotoUri
                ? '✅ Foto baru dipilih. Simpan untuk menerapkan.'
                : 'Ketuk foto untuk mengubah'}
            </Text>
          </View>

          {/* ── Form Card ───────────────────────────────────────────── */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Perbarui Data Profil</Text>
            <Text style={styles.formSubtitle}>
              Pastikan informasi Anda selalu terbaru agar pengiriman berjalan lancar.
            </Text>

            <View style={styles.divider} />

            <CustomInput
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              iconName="person-outline"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              error={errors.name}
            />

            <CustomInput
              label="Nomor Telepon / WhatsApp"
              placeholder="Masukkan nomor telepon"
              iconName="call-outline"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            {isBusy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.loadingText}>
                  {profilePhotoUri ? 'Mengunggah foto profil...' : 'Menyimpan perubahan...'}
                </Text>
              </View>
            ) : (
              <CustomButton
                title="SIMPAN PERUBAHAN"
                onPress={handleSave}
                isLoading={false}
                style={styles.saveBtn}
                variant="primary"
                iconName="checkmark-circle-outline"
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const AVATAR_SIZE = 120;
const RING_OUTER_SIZE = AVATAR_SIZE + 14; // gradient ring
const RING_INNER_SIZE = AVATAR_SIZE + 6;  // white gap ring

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 50,
  },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 12,
    position: 'relative',
  },
  avatarRingOuter: {
    width: RING_OUTER_SIZE,
    height: RING_OUTER_SIZE,
    borderRadius: RING_OUTER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  avatarRingInner: {
    width: RING_INNER_SIZE,
    height: RING_INNER_SIZE,
    borderRadius: RING_INNER_SIZE / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTouchable: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  // Default Della branded avatar (no photo)
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dellaIconWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  dellaNameStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dellaNameText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  avatarInitials: {
    fontSize: 46,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Camera badge – bottom-RIGHT corner of avatar ring
  cameraBadge: {
    position: 'absolute',
    bottom: 44,
    right: '50%',
    marginRight: -(RING_OUTER_SIZE / 2) + 4,
    zIndex: 20,
    ...SHADOWS.medium,
  },
  cameraBadgeGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },

  // Trash badge – bottom-LEFT corner of avatar ring
  removeBadge: {
    position: 'absolute',
    bottom: 44,
    left: '50%',
    marginLeft: -(RING_OUTER_SIZE / 2) + 4,
    zIndex: 20,
    ...SHADOWS.medium,
  },
  removeBadgeInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },

  // Della branding tag below avatar
  brandTag: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  brandTagGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  brandTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  avatarHint: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // ── Form ───────────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.paddingLg,
    marginHorizontal: SIZES.paddingLg,
    marginTop: 8,
    ...SHADOWS.medium,
  },
  formTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  formSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 16,
  },
  saveBtn: {
    marginTop: 16,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
