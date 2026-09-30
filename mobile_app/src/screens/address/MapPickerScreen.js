import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { UrlTile, Circle, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ApiService, isAbortError } from '../../core/api';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';

const { width, height } = Dimensions.get('window');

// Titik Pusat Toko Della Frozen Mart (Pusat)
const DEFAULT_LATITUDE = -3.763872;
const DEFAULT_LONGITUDE = 103.8079257;
const MAX_DELIVERY_RADIUS_KM = 10.0;
const LATITUDE_DELTA = 0.003; // Zoomed in to street level (~17 zoom)
const LONGITUDE_DELTA = 0.003;

/**
 * Hitung jarak garis lurus (Haversine) dalam kilometer dari toko
 */
const calculateDistanceKm = (lat1, lon1, lat2 = DEFAULT_LATITUDE, lon2 = DEFAULT_LONGITUDE) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const MapPickerScreen = ({ navigation, route }) => {
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
  const FALLBACK_ADDRESS = 'Tanjung Enim, Lawang Kidul, Muara Enim';
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapType, setMapType] = useState('standard'); // 'standard' or 'hybrid'
  const mapRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Jarak realtime pin saat ini dari toko Della Frozen Mart
  const currentDistanceKm = calculateDistanceKm(currentCoords.latitude, currentCoords.longitude);
  const isWithinDeliveryRadius = currentDistanceKm <= MAX_DELIVERY_RADIUS_KM;

  const fetchReverseGeocode = async (lat, lng) => {
    try {
      setLoadingAddress(true);
      const res = await ApiService.get(`/addresses/reverse-geocode?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      if (json.success && json.address) {
        setAddressText(json.address);
      } else {
        setAddressText(FALLBACK_ADDRESS);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Geocode error:', err?.message || err);
      }
      setAddressText(FALLBACK_ADDRESS);
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

      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown?.coords?.latitude && lastKnown?.coords?.longitude) {
        centerMapOnCoords(lastKnown.coords.latitude, lastKnown.coords.longitude);
      }

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

  const proceedConfirm = () => {
    const returnTo = route.params?.returnTo || 'AddressForm';
    navigation.navigate({
      name: returnTo,
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

  const handleConfirmLocation = () => {
    if (loadingAddress) return;

    // Jika di luar radius 10 km, tampilkan alert konfirmasi
    if (!isWithinDeliveryRadius) {
      Alert.alert(
        'Lokasi di Luar Jangkauan Kurir ⚠️',
        `Titik lokasi yang Anda pilih berjarak ${currentDistanceKm.toFixed(1)} km dari toko.\n\nMaksimal jangkauan kurir antar adalah 10 km. Pesanan ke alamat ini hanya dapat menggunakan metode "Ambil Sendiri di Toko".\n\nTetap gunakan lokasi ini?`,
        [
          { text: 'Geser Ulang Pin', style: 'cancel' },
          {
            text: 'Ya, Tetap Gunakan',
            onPress: proceedConfirm,
          },
        ]
      );
      return;
    }

    proceedConfirm();
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
        key={`map-picker-${mapType}`}
        style={styles.map}
        initialRegion={region}
        mapType={mapType === 'satellite' ? 'hybrid' : mapType}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Lingkaran Batas Radius Jangkauan Pengiriman 10 KM */}
        <Circle
          center={{ latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE }}
          radius={10000}
          strokeWidth={2}
          strokeColor="rgba(37, 99, 235, 0.65)"
          fillColor="rgba(37, 99, 235, 0.08)"
        />

        {/* Marker Toko Pusat Della Frozen Mart */}
        <Marker
          coordinate={{ latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE }}
          title="Della Frozen Mart (Pusat)"
          description="Pusat Toko & Titik Acuan Pengiriman"
          pinColor="#2563EB"
        />

        {mapType === 'satellite' && (
          <UrlTile
            urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />
        )}
      </MapView>

      {/* Static Pin in Center of Screen */}
      <View style={styles.pinContainer} pointerEvents="none">
        <Ionicons name="location" size={44} color={isWithinDeliveryRadius ? COLORS.accent : '#EF4444'} />
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

      {/* Bottom Panel displaying Address, Distance Badge, and Confirmation */}
      <View style={styles.bottomPanel}>
        <View style={styles.addressHeaderRow}>
          <Ionicons name="map-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.panelTitle}>Lokasi Pengiriman Anda</Text>
        </View>

        {/* Badge Jarak Realtime dari Toko & Status Jangkauan */}
        <View
          style={[
            styles.distanceBadge,
            isWithinDeliveryRadius ? styles.distanceBadgeSuccess : styles.distanceBadgeWarning,
          ]}
        >
          <Ionicons
            name={isWithinDeliveryRadius ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={isWithinDeliveryRadius ? '#059669' : '#DC2626'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.distanceBadgeText,
              isWithinDeliveryRadius ? styles.distanceBadgeTextSuccess : styles.distanceBadgeTextWarning,
            ]}
          >
            {isWithinDeliveryRadius
              ? `Jarak: ${currentDistanceKm.toFixed(1)} km dari Toko (Dalam Jangkauan ✅)`
              : `Jarak: ${currentDistanceKm.toFixed(1)} km dari Toko (Di Luar Jangkauan > 10 km ⚠️)`}
          </Text>
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
          style={[
            styles.confirmBtn,
            loadingAddress && styles.confirmBtnDisabled,
            !isWithinDeliveryRadius && styles.confirmBtnWarning,
          ]}
          onPress={handleConfirmLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmBtnText}>
            {isWithinDeliveryRadius ? 'Konfirmasi Lokasi' : 'Konfirmasi (Di Luar Jangkauan Kurir)'}
          </Text>
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
    width: width,
    height: height,
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
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -22,
    marginTop: -44, // Align pin tip with exact center
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  pinShadow: {
    width: 10,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    marginTop: -2,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    ...SHADOWS.heavy,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  distanceBadgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  distanceBadgeWarning: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  distanceBadgeText: {
    ...TYPOGRAPHY.smallBold,
    fontSize: 12,
  },
  distanceBadgeTextSuccess: {
    color: '#065F46',
  },
  distanceBadgeTextWarning: {
    color: '#991B1B',
  },
  addressBox: {
    minHeight: 50,
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
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.accent,
  },
  confirmBtnWarning: {
    backgroundColor: '#DC2626',
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  confirmBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  gpsFloatingBtn: {
    position: 'absolute',
    bottom: 250,
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
});

export default MapPickerScreen;

