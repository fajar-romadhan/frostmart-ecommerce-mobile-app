import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { ApiService, isAbortError } from '../../core/api';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { validateEmail, validatePhone } from '../../core/utils';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';

// Titik Pusat Toko Della Frozen Mart Tanjung Enim
const DEFAULT_LATITUDE = -3.763872;
const DEFAULT_LONGITUDE = 103.8079257;

export const RegisterScreen = ({ navigation, route }) => {
  const { register, isLoading, errorMessage } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address states
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapType, setMapType] = useState('standard'); // 'standard' | 'satellite'
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [errors, setErrors] = useState({});
  const debounceRef = useRef(null);
  const mapRef = useRef(null);

  // Terima hasil pin lokasi dari MapPickerScreen
  useEffect(() => {
    if (route.params?.selectedLocation) {
      const loc = route.params.selectedLocation;
      const latNum = loc.latitude != null ? parseFloat(loc.latitude) : null;
      const lngNum = loc.longitude != null ? parseFloat(loc.longitude) : null;
      setLatitude(!isNaN(latNum) ? latNum : null);
      setLongitude(!isNaN(lngNum) ? lngNum : null);

      if (loc.addressText) {
        setAddress(loc.addressText);
        setSuggestions([]);
        setShowSuggestions(false);
        setErrors((prev) => ({ ...prev, address: null }));
      }
      if (mapRef.current && latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum)) {
        mapRef.current.animateToRegion({
          latitude: latNum,
          longitude: lngNum,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      }
    }
  }, [route.params?.selectedLocation]);

  // ─── Autocomplete: fetch suggestions from geocode_cache via backend ───
  const fetchSuggestions = useCallback((keyword) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!keyword || keyword.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await ApiService.getPublic(`/addresses/suggestions?q=${encodeURIComponent(keyword)}`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setSuggestions(json.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (e) {
        if (!isAbortError(e)) setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  const handleAddressChange = (text) => {
    setAddress(text);
    if (errors.address) setErrors({ ...errors, address: null });
    fetchSuggestions(text);
  };

  const handleSelectSuggestion = (item) => {
    setAddress(item.alamat_lengkap);
    const latNum = item.latitude != null ? parseFloat(item.latitude) : null;
    const lngNum = item.longitude != null ? parseFloat(item.longitude) : null;
    setLatitude(!isNaN(latNum) ? latNum : null);
    setLongitude(!isNaN(lngNum) ? lngNum : null);
    setSuggestions([]);
    setShowSuggestions(false);
    if (errors.address) setErrors({ ...errors, address: null });

    if (mapRef.current && latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum)) {
      mapRef.current.animateToRegion({
        latitude: latNum,
        longitude: lngNum,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      }, 500);
    }
  };

  // ─── GPS Auto-detect ───
  const handleAutoDetectGps = async () => {
    try {
      setLoadingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Izinkan akses lokasi/GPS pada HP Anda agar sistem bisa mengisi alamat otomatis.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = parseFloat(location.coords.latitude);
      const lng = parseFloat(location.coords.longitude);
      setLatitude(lat);
      setLongitude(lng);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }, 500);
      }

      // Reverse geocode via public endpoint
      try {
        const res = await ApiService.getPublic(`/addresses/reverse-geocode-public?lat=${lat}&lng=${lng}`);
        const json = await res.json();
        if (json.success && json.address) {
          setAddress(json.address);
          setSuggestions([]);
          setShowSuggestions(false);
          if (errors.address) setErrors({ ...errors, address: null });
        }
      } catch (geocodeErr) {
        // koordinat sudah tersimpan
      }
    } catch (err) {
      if (!isAbortError(err)) {
        alert('Gagal mendeteksi lokasi GPS. Pastikan GPS aktif dan izin lokasi diberikan.');
      }
    } finally {
      setLoadingGps(false);
    }
  };

  // ─── Validation ───
  const validate = () => {
    const tempErrors = {};
    if (!name) tempErrors.name = 'Nama lengkap wajib diisi.';
    if (!email) {
      tempErrors.email = 'Email wajib diisi.';
    } else if (!validateEmail(email)) {
      tempErrors.email = 'Format email tidak valid.';
    }
    if (phone && !validatePhone(phone)) {
      tempErrors.phone = 'Nomor telepon tidak valid (9-15 digit).';
    }
    if (!address.trim()) {
      tempErrors.address = 'Alamat lengkap wajib diisi.';
    }
    if (!password) {
      tempErrors.password = 'Password wajib diisi.';
    } else if (password.length < 8) {
      tempErrors.password = 'Password minimal 8 karakter.';
    }
    if (confirmPassword !== password) {
      tempErrors.confirmPassword = 'Konfirmasi password tidak cocok.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // ─── Submit ───
  const handleRegister = async () => {
    if (!validate()) return;
    const success = await register({
      name,
      email,
      password,
      confirmPassword,
      phone,
      initial_address: address.trim() || undefined,
      initial_lat: latitude ?? undefined,
      initial_lng: longitude ?? undefined,
    });
    if (success) {
      alert('Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.');
      navigation.navigate('Login');
    }
  };

  const currentLat = latitude || DEFAULT_LATITUDE;
  const currentLng = longitude || DEFAULT_LONGITUDE;

  return (
    <LinearGradient
      colors={['rgba(10, 142, 217, 0.05)', '#FFFFFF']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.2 }}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Buat Akun</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSubtitle}>
                Silakan isi data diri Anda untuk menikmati kemudahan belanja produk beku berkualitas.
              </Text>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

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
                label="Alamat Email"
                placeholder="Masukkan alamat email"
                iconName="mail-outline"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                error={errors.email}
                keyboardType="email-address"
              />

              <CustomInput
                label="Nomor Telepon / WhatsApp"
                placeholder="Contoh: 08123456789"
                iconName="call-outline"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                error={errors.phone}
                keyboardType="phone-pad"
              />

              {/* ── Smart Address Section ── */}
              <View style={styles.addressSection}>
                <Text style={styles.addressSectionTitle}>
                  <Ionicons name="location-outline" size={15} color={COLORS.primary} /> Alamat Pengiriman
                </Text>
                <Text style={styles.addressSectionSub}>
                  Isi alamat sekarang agar kurir bisa langsung antar pesanan pertama Anda.
                </Text>

                {/* Tombol GPS Otomatis */}
                <TouchableOpacity
                  style={styles.gpsBtn}
                  onPress={handleAutoDetectGps}
                  disabled={loadingGps}
                  activeOpacity={0.8}
                >
                  {loadingGps ? (
                    <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 6 }} />
                  ) : (
                    <Ionicons name="navigate" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.gpsBtnText}>
                    {loadingGps ? 'Mendeteksi Lokasi GPS...' : '🎯 Deteksi Otomatis Lokasi GPS Saya'}
                  </Text>
                </TouchableOpacity>

                {/* Field Alamat + Dropdown Autocomplete */}
                <View style={styles.addressInputWrapper}>
                  <View style={[styles.addressInputBox, errors.address && styles.addressInputBoxError]}>
                    <Ionicons name="home-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressFieldLabel}>Alamat Lengkap{loadingSuggestions ? '  ⏳' : ''}</Text>
                      <CustomInput
                        placeholder="Ketik nama jalan, kelurahan, atau landmark..."
                        value={address}
                        onChangeText={handleAddressChange}
                        multiline
                        numberOfLines={2}
                        style={styles.addressTextInput}
                        noMargin
                      />
                    </View>
                    {latitude && longitude && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={{ marginLeft: 4 }} />
                    )}
                  </View>

                  {/* Dropdown suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {suggestions.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.suggestionItem, idx === suggestions.length - 1 && styles.suggestionItemLast]}
                          onPress={() => handleSelectSuggestion(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={item.tipe === 'jalan' ? 'navigate-outline' : item.tipe === 'toko' ? 'storefront-outline' : 'pin-outline'}
                            size={16}
                            color={COLORS.primary}
                            style={{ marginRight: 8, marginTop: 2 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.suggestionName}>{item.nama}</Text>
                            <Text style={styles.suggestionAddress} numberOfLines={1}>{item.alamat_lengkap}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {errors.address && <Text style={styles.errorLabel}>{errors.address}</Text>}

                {latitude != null && longitude != null && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
                  <View style={styles.coordBadge}>
                    <Ionicons name="location" size={13} color={COLORS.success} style={{ marginRight: 4 }} />
                    <Text style={styles.coordBadgeText}>
                      Koordinat GPS tersimpan ({Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)})
                    </Text>
                  </View>
                )}

                {/* ── Visual Peta Interaktif & Mode Satelit Preview ── */}
                <View style={styles.visualMapContainer}>
                  <View style={styles.mapHeaderRow}>
                    <View style={styles.mapHeaderLeft}>
                      <Ionicons name="earth" size={15} color={COLORS.primary} style={{ marginRight: 5 }} />
                      <Text style={styles.visualMapLabel}>Visual Peta Pengiriman</Text>
                    </View>

                    {/* Toggle Mode Peta: Standar vs Satelit 🛰️ */}
                    <View style={styles.mapModeToggleBar}>
                      <TouchableOpacity
                        style={[styles.mapModeBtn, mapType === 'standard' && styles.mapModeBtnActive]}
                        onPress={() => setMapType('standard')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.mapModeBtnText, mapType === 'standard' && styles.mapModeBtnTextActive]}>
                          Standar
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mapModeBtn, mapType === 'satellite' && styles.mapModeBtnActive]}
                        onPress={() => setMapType('satellite')}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.mapModeBtnText, mapType === 'satellite' && styles.mapModeBtnTextActive]}>
                          Satelit 🛰️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Embedded Visual Map Preview */}
                  <View style={styles.mapWrapper}>
                    <MapView
                      ref={mapRef}
                      key={`reg-map-${mapType}`}
                      style={styles.embeddedMap}
                      initialRegion={{
                        latitude: currentLat,
                        longitude: currentLng,
                        latitudeDelta: 0.008,
                        longitudeDelta: 0.008,
                      }}
                      mapType={mapType === 'satellite' ? 'hybrid' : 'standard'}
                      showsUserLocation={true}
                    >
                      {/* Radius Jangkauan 10 KM Toko Della */}
                      <Circle
                        center={{ latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE }}
                        radius={10000}
                        strokeWidth={1.5}
                        strokeColor="rgba(37, 99, 235, 0.6)"
                        fillColor="rgba(37, 99, 235, 0.06)"
                      />

                      {/* Marker Pusat Della Frozen Mart */}
                      <Marker
                        coordinate={{ latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE }}
                        title="Della Frozen Mart (Pusat)"
                        description="Pusat Toko & Pengiriman"
                        pinColor="#2563EB"
                      />

                      {/* Marker Titik Alamat Pelanggan */}
                      {latitude != null && longitude != null && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
                        <Marker
                          coordinate={{ latitude: Number(latitude), longitude: Number(longitude) }}
                          title="Titik Alamat Anda"
                          description={address || "Titik Pengiriman"}
                          pinColor="#EF4444"
                        />
                      )}

                      {mapType === 'satellite' && (
                        <UrlTile
                          urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          maximumZ={19}
                          flipY={false}
                          tileSize={256}
                        />
                      )}
                    </MapView>

                    {/* Overlay Action Bar di atas Peta */}
                    <TouchableOpacity
                      style={styles.expandMapOverlayBtn}
                      onPress={() => navigation.navigate('MapPicker', {
                        initialLocation: latitude && longitude ? { latitude, longitude } : null,
                        returnTo: 'Register',
                      })}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="expand-outline" size={14} color={COLORS.white} style={{ marginRight: 5 }} />
                      <Text style={styles.expandMapOverlayText}>
                        {latitude && longitude ? 'Buka Peta Penuh / Geser Pin' : 'Atur Pin Presisi di Peta Penuh'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <CustomInput
                label="Password"
                placeholder="Buat password minimal 8 karakter"
                iconName="lock-closed-outline"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                error={errors.password}
              />

              <CustomInput
                label="Konfirmasi Password"
                placeholder="Masukkan ulang password Anda"
                iconName="lock-closed-outline"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                error={errors.confirmPassword}
              />

              <CustomButton
                title="Daftar Sekarang"
                onPress={handleRegister}
                isLoading={isLoading}
                style={styles.registerBtn}
                variant="primary"
              />

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>atau</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.loginLinkContainer}>
                <Text style={styles.hasAccountText}>Sudah punya akun? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={styles.loginText}>Masuk di sini</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.paddingLg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.soft,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.secondary,
  },
  formSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.paddingLg,
    ...SHADOWS.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    flex: 1,
  },

  // ── Address Section ──
  addressSection: {
    marginBottom: 16,
  },
  addressSectionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  addressSectionSub: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  gpsBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontSize: 13,
  },
  addressInputWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  addressInputBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    ...SHADOWS.light,
  },
  addressInputBoxError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  addressFieldLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 2,
    fontSize: 11,
  },
  addressTextInput: {
    minHeight: 42,
    textAlignVertical: 'top',
  },

  // Dropdown suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 999,
    ...SHADOWS.heavy,
    marginTop: 2,
    maxHeight: 240,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    fontSize: 13,
  },
  suggestionAddress: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 1,
    fontSize: 11,
  },

  errorLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 6,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  coordBadgeText: {
    ...TYPOGRAPHY.small,
    color: '#166534',
    fontSize: 11,
  },

  // ── Visual Map Section Styles ──
  visualMapContainer: {
    marginTop: 14,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visualMapLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondary,
    fontSize: 12,
  },
  mapModeToggleBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
  },
  mapModeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  mapModeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  mapModeBtnText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  mapModeBtnTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  mapWrapper: {
    height: 190,
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  embeddedMap: {
    width: '100%',
    height: '100%',
  },
  expandMapOverlayBtn: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    ...SHADOWS.medium,
  },
  expandMapOverlayText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Footer fields ──
  registerBtn: {
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasAccountText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  loginText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
});

export default RegisterScreen;
