import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { UrlTile } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ApiService } from '../../core/api';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';

const { width, height } = Dimensions.get('window');

// Default location — Tanjung Enim (Della Frozen Mart Pusat)
const DEFAULT_LATITUDE = -3.763872;
const DEFAULT_LONGITUDE = 103.8079257;
const LATITUDE_DELTA = 0.003; // Zoomed in to street level (~17 zoom)
const LONGITUDE_DELTA = 0.003;

/**
 * RegisterMapPickerScreen
 * Map picker specifically for the registration flow.
 * On confirm, it navigates back to "Register" with selectedLocation params.
 */
export const RegisterMapPickerScreen = ({ navigation, route }) => {
  const initialLoc = route.params?.initialLocation || null;

  const [region, setRegion] = useState({
    latitude: initialLoc?.latitude ? parseFloat(initialLoc.latitude) : DEFAULT_LATITUDE,
    longitude: initialLoc?.longitude ? parseFloat(initialLoc.longitude) : DEFAULT_LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const [currentCoords, setCurrentCoords] = useState({
    latitude: initialLoc?.latitude ? parseFloat(initialLoc.latitude) : DEFAULT_LATITUDE,
    longitude: initialLoc?.longitude ? parseFloat(initialLoc.longitude) : DEFAULT_LONGITUDE,
  });

  const [addressText, setAddressText] = useState('Mengambil lokasi...');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapType, setMapType] = useState('standard'); // 'standard' or 'hybrid'
  const mapRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const fetchReverseGeocode = async (lat, lng) => {
    try {
      setLoadingAddress(true);
      const res = await ApiService.get(`/addresses/reverse-geocode?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      if (json.success && json.address) {
        setAddressText(json.address);
      } else {
        setAddressText('Detail alamat tidak ditemukan. Geser pin ke lokasi yang benar.');
      }
    } catch (err) {
      console.error(err);
      setAddressText('Gagal memuat alamat. Periksa koneksi internet.');
    } finally {
      setLoadingAddress(false);
    }
  };

  const centerMapOnCoords = (lat, lng) => {
    const targetLat = parseFloat(lat);
    const targetLng = parseFloat(lng);
    const newRegion = {
      latitude: targetLat,
      longitude: targetLng,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    setCurrentCoords({ latitude: targetLat, longitude: targetLng });
    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 600);
    }
    fetchReverseGeocode(targetLat, targetLng);
  };

  const handleDetectGps = async () => {
    try {
      setLoadingAddress(true);

      let isGpsEnabled = true;
      if (typeof Location.hasServicesEnabledAsync === 'function') {
        isGpsEnabled = await Location.hasServicesEnabledAsync();
      } else if (typeof Location.isLocationServicesEnabledAsync === 'function') {
        isGpsEnabled = await Location.isLocationServicesEnabledAsync();
      }
      if (!isGpsEnabled) {
        Alert.alert(
          'Aktifkan GPS HP Anda 🛰️',
          'Aktifkan GPS sementara pada HP Anda untuk menentukan titik koordinat lokasi pengiriman yang tepat.',
          [
            { text: 'Nanti', style: 'cancel' },
            { text: 'Coba Lagi (Deteksi GPS)', onPress: () => handleDetectGps() },
          ]
        );
        fetchReverseGeocode(currentCoords.latitude, currentCoords.longitude);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Lokasi Ditolak ⚠️',
          'Izinkan akses lokasi GPS HP Anda agar sistem bisa membaca posisi koordinat pengiriman secara otomatis.',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Buka Pengaturan', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        fetchReverseGeocode(currentCoords.latitude, currentCoords.longitude);
        return;
      }

      // Fast check: last known position
      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown?.coords?.latitude && lastKnown?.coords?.longitude) {
        centerMapOnCoords(lastKnown.coords.latitude, lastKnown.coords.longitude);
      }

      // High accuracy fix
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (location?.coords?.latitude && location?.coords?.longitude) {
        centerMapOnCoords(location.coords.latitude, location.coords.longitude);
      }
    } catch (err) {
      console.error('Gagal deteksi GPS:', err);
      Alert.alert(
        'Aktifkan GPS HP Anda 🛰️',
        'Aktifkan GPS sementara pada HP Anda untuk menentukan titik koordinat lokasi pengiriman yang tepat.',
        [
          { text: 'Tutup', style: 'cancel' },
          { text: 'Coba Lagi (Deteksi GPS)', onPress: () => handleDetectGps() },
        ]
      );
      fetchReverseGeocode(currentCoords.latitude, currentCoords.longitude);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (!initialLoc) {
      handleDetectGps();
    } else {
      fetchReverseGeocode(currentCoords.latitude, currentCoords.longitude);
    }
  }, []);

  const handleRegionChangeComplete = (newRegion) => {
    const lat = newRegion.latitude;
    const lng = newRegion.longitude;
    setCurrentCoords({ latitude: lat, longitude: lng });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchReverseGeocode(lat, lng);
    }, 450);
  };

  const handleConfirmLocation = () => {
    if (loadingAddress) return;

    // Navigate back to Register with selectedLocation params
    navigation.navigate({
      name: 'Register',
      params: {
        selectedLocation: {
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          addressText: addressText,
        },
      },
      merge: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Controls: Back Button & Map Type Selector */}
      <View style={styles.topHeaderContainer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>

        {/* Segmented Map Mode Selector - ONLY Standar & Satelit */}
        <View style={styles.mapTypeSegmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, mapType === 'standard' && styles.segmentBtnActive]}
            onPress={() => setMapType('standard')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentBtnText, mapType === 'standard' && styles.segmentBtnTextActive]}>Standar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, mapType === 'satellite' && styles.segmentBtnActive]}
            onPress={() => setMapType('satellite')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentBtnText, mapType === 'satellite' && styles.segmentBtnTextActive]}>Satelit 🛰️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        key={`map-register-${mapType}`}
        style={styles.map}
        initialRegion={region}
        mapType={mapType === 'satellite' ? 'hybrid' : mapType}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mapType === 'satellite' && (
          <UrlTile
            urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />
        )}
      </MapView>

      {/* Static pin at map centre */}
      <View style={styles.pinContainer} pointerEvents="none">
        <Ionicons name="location" size={48} color={COLORS.accent} />
        <View style={styles.pinShadow} />
      </View>

      {/* Floating GPS Button */}
      <TouchableOpacity
        style={styles.gpsFloatingBtn}
        onPress={handleDetectGps}
        activeOpacity={0.8}
      >
        <Ionicons name="navigate-circle" size={22} color={COLORS.primary} style={{ marginRight: 6 }} />
        <Text style={styles.gpsFloatingBtnText}>Deteksi Lokasi HP (GPS)</Text>
      </TouchableOpacity>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.addressHeaderRow}>
          <Ionicons name="map-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.panelTitle}>Lokasi Pengiriman</Text>
        </View>

        <View style={styles.addressBox}>
          {loadingAddress ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.addressLoadingText}>Mendapatkan alamat...</Text>
            </View>
          ) : (
            <Text style={styles.addressText} numberOfLines={3}>
              {addressText}
            </Text>
          )}
        </View>

        <Text style={styles.coordsText}>
          Koordinat: {currentCoords.latitude.toFixed(6)}, {currentCoords.longitude.toFixed(6)}
        </Text>

        <TouchableOpacity
          disabled={loadingAddress}
          style={[styles.confirmBtn, loadingAddress && styles.confirmBtnDisabled]}
          onPress={handleConfirmLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loadingAddress ? [COLORS.border, COLORS.border] : [COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtnGradient}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>Konfirmasi Lokasi Ini</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
    width,
    height,
  },

  topHeaderContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  backBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  mapTypeSegmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 4,
    ...SHADOWS.medium,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentBtnText: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  segmentBtnTextActive: {
    color: COLORS.white,
  },

  // Branding title chip top-center
  titleChip: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    alignSelf: 'center',
    zIndex: 10,
  },
  titleChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOWS.soft,
  },
  titleChipText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  // Center pin
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  pinShadow: {
    width: 12,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 3,
    marginTop: -2,
  },

  // Bottom sheet
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    paddingBottom: Platform.OS === 'ios' ? 32 : SIZES.paddingMd,
    ...SHADOWS.heavy,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  addressBox: {
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: 6,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLoadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  coordsText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 14,
  },

  // Confirm button with gradient
  confirmBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
  },
  confirmBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  gpsFloatingBtn: {
    position: 'absolute',
    bottom: 225,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    ...SHADOWS.medium,
    zIndex: 10,
  },
  gpsFloatingBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    fontSize: 13,
  },
  mapTypeFloatingBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  mapTypeFloatingBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    fontSize: 12,
  },
});

export default RegisterMapPickerScreen;
