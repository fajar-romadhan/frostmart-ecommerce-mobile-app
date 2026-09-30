import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { getImageUrl, ApiService, isAbortError } from '../../core/api';
import CustomButton from '../../components/CustomButton';

import PointHistoryModal from '../../components/PointHistoryModal';
import DirectRedeemModal from '../../components/DirectRedeemModal';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, getProfile, refreshPoints, isLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [directRedeemVisible, setDirectRedeemVisible] = useState(false);
  const [eduModalVisible, setEduModalVisible] = useState(false);
  const [primaryAddress, setPrimaryAddress] = useState(null);

  const isFetchingAddressRef = useRef(false);

  const fetchPrimaryAddress = async () => {
    if (isFetchingAddressRef.current) return;
    isFetchingAddressRef.current = true;
    try {
      const res = await ApiService.get('/addresses');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const utama = json.data.find(a => a.is_utama) || json.data[0] || null;
        setPrimaryAddress(utama);
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.log('Error fetch primary address:', e?.message || e);
      }
    } finally {
      isFetchingAddressRef.current = false;
    }
  };

  useEffect(() => {
    // Polling poin loyalti & alamat utama pelanggan setiap 5 detik
    refreshPoints?.();
    fetchPrimaryAddress();
    const interval = setInterval(() => {
      refreshPoints?.();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getProfile(),
        fetchPrimaryAddress(),
      ]);
    } catch (e) {
      if (!isAbortError(e)) {
        console.log('Error refreshing profile:', e?.message || e);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const profilePhotoUrl = user.profile_photo ? getImageUrl(user.profile_photo) : null;
  const userPoints = user.total_points || 0;
  const pointsToReward = 10;
  const progressRatio = Math.min(1, userPoints / pointsToReward);
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary, COLORS.accent]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Card Header with Gradient */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeaderCard}
        >
          {/* Avatar — photo or Della branded default */}
          <View style={styles.avatarOuterRing}>
            {profilePhotoUrl ? (
              <Image
                source={{ uri: profilePhotoUrl }}
                style={styles.avatarPhoto}
              />
            ) : (
              <LinearGradient
                colors={[COLORS.gradientStart, '#1565C0', COLORS.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarCircle}
              >
                <Ionicons name="snow" size={32} color="rgba(255,255,255,0.95)" />
                <View style={styles.dellaNameStrip}>
                  <Text style={styles.dellaNameText}>DELLA</Text>
                </View>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          {user.is_ktp_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.verifiedText}>Akun Terverifikasi (KTP)</Text>
            </View>
          )}
          <Text style={styles.userEmail}>{user.email}</Text>
        </LinearGradient>

        {/* Della Member Club & Loyalty Points Card (Kopi Kenangan / Superindo style) */}
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loyaltyCard}
        >
          <View style={styles.loyaltyTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.loyaltyStarCircle}>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.loyaltyClubTitle}>Della Rewards Club</Text>
                <Text style={styles.loyaltySubtitle}>Rp 50.000 = 1 Poin Loyalti</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.historyPillBtn}
              activeOpacity={0.8}
              onPress={() => setHistoryModalVisible(true)}
            >
              <Ionicons name="receipt-outline" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.historyPillText}>Riwayat</Text>
            </TouchableOpacity>
          </View>

          {/* Points Counter */}
          <View style={styles.loyaltyPointsRow}>
            <Text style={styles.loyaltyPointsNumber}>{userPoints}</Text>
            <Text style={styles.loyaltyPointsText}> Poin Aktif</Text>
            {userPoints >= 10 && (
              <View style={styles.readyRewardBadge}>
                <Ionicons name="gift" size={12} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.readyRewardText}>Siap Tukar Hadiah!</Text>
              </View>
            )}
          </View>

          {/* Progress Bar towards 10 points reward */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabelLeft}>
                {userPoints >= 10 ? '🎉 Target 10 poin tercapai!' : `Kumpulkan ${10 - userPoints} poin lagi untuk 1 produk gratis`}
              </Text>
              <Text style={styles.progressLabelRight}>{userPoints}/10 Pt</Text>
            </View>
          </View>

          {/* Direct Point Redemption Button */}
          {userPoints >= 10 ? (
            <TouchableOpacity
              style={styles.redeemActionBtn}
              activeOpacity={0.8}
              onPress={() => setDirectRedeemVisible(true)}
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.redeemActionGradient}
              >
                <Ionicons name="gift" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.redeemActionText}>🎁 TUKAR 10 POIN (1 PRODUK GRATIS)</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.redeemOutlineBtn}
              activeOpacity={0.8}
              onPress={() => setEduModalVisible(true)}
            >
              <Ionicons name="gift-outline" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.redeemOutlineText}>🎁 Tukar 10 Poin Hadiah (Katalog)</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Info card details */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informasi Akun</Text>
          <View style={styles.divider} />

          {/* Phone row */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Nomor Telepon</Text>
              <Text style={styles.rowValue}>{user.phone || '-'}</Text>
            </View>
          </View>

          {/* Address row */}
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Alamat Pengiriman</Text>
              <Text style={styles.rowValue}>
                {primaryAddress?.alamat_lengkap || 'Belum ada alamat tersimpan. Tambahkan alamat pengiriman terlebih dahulu.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit and Logout actions */}
        <View style={styles.actionContainer}>
          <CustomButton
            title="KELOLA DAFTAR ALAMAT"
            onPress={() => navigation.navigate('AddressList')}
            style={styles.actionBtn}
            variant="primary"
            iconName="location-outline"
          />

          <CustomButton
            title="EDIT PROFIL"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.actionBtn}
            variant="primary"
            iconName="create-outline"
          />

          <CustomButton
            title="LOGOUT AKUN"
            variant="outlineDanger"
            onPress={handleLogout}
            isLoading={isLoading}
            style={styles.logoutBtn}
            iconName="log-out-outline"
          />
        </View>
      </ScrollView>

      {/* Point History Modal */}
      <PointHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        initialPoints={userPoints}
        onOpenRedeem={() => {
          setHistoryModalVisible(false);
          if (userPoints >= 10) {
            setDirectRedeemVisible(true);
          } else {
            setEduModalVisible(true);
          }
        }}
        onSelectOrder={(orderId) => {
          setHistoryModalVisible(false);
          navigation.navigate('OrderDetail', { orderId });
        }}
      />

      {/* Direct Redeem Modal (Cara ke-2 Tukar Poin) */}
      <DirectRedeemModal
        visible={directRedeemVisible}
        onClose={() => setDirectRedeemVisible(false)}
        userPoints={userPoints}
        userAddress={user.address}
        onSuccess={() => {
          // Immediately refresh points in background — no spinner, no page reload
          refreshPoints();
          setDirectRedeemVisible(false);
        }}
      />

      {/* Modal Edukatif Poin Belum Cukup */}
      <Modal
        visible={eduModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEduModalVisible(false)}
      >
        <View style={styles.eduModalOverlay}>
          <View style={styles.eduModalContent}>
            <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 8 }}>😔</Text>
            <Text style={styles.eduModalTitle}>Poin Kamu Belum Cukup!</Text>
            <Text style={styles.eduModalDesc}>
              Kamu butuh <Text style={{ fontWeight: 'bold', color: '#D97706' }}>10 Poin</Text> untuk klaim 1 produk gratis bebas pilih.
            </Text>
            <View style={styles.eduModalInfoBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Saldo Poin Kamu:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#F59E0B' }}>{userPoints} Poin</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Kekurangan Poin:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#DC2626' }}>{Math.max(0, 10 - userPoints)} Poin</Text>
              </View>
            </View>
            <Text style={styles.eduModalSubdesc}>
              💡 Belanja <Text style={{ fontWeight: 'bold', color: COLORS.secondary }}>Rp {((10 - userPoints) * 50000).toLocaleString('id-ID')}</Text> lagi di Della Frozen Mart untuk mengumpulkan sisa poin kamu! (Setiap Rp 50.000 = 1 Poin).
            </Text>
            <TouchableOpacity
              style={styles.eduModalBtn}
              activeOpacity={0.8}
              onPress={() => {
                setEduModalVisible(false);
                navigation.navigate('Home');
              }}
            >
              <Ionicons name="cart" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.eduModalBtnText}>🛒 Belanja & Kumpulkan Poin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 10, alignItems: 'center', marginTop: 4 }}
              onPress={() => setEduModalVisible(false)}
            >
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  scrollContent: {
    padding: SIZES.paddingLg,
  },
  profileHeaderCard: {
    borderRadius: SIZES.radiusXl,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.colored,
  },
  avatarOuterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dellaNameStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    paddingVertical: 3,
  },
  dellaNameText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: SIZES.radiusSm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  verifiedText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontWeight: '700',
  },
  userEmail: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loyaltyCard: {
    borderRadius: SIZES.radiusLg,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  loyaltyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyStarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  loyaltyClubTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: '#F8FAFC',
    fontSize: 14,
  },
  loyaltySubtitle: {
    ...TYPOGRAPHY.small,
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  historyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  historyPillText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  loyaltyPointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    marginBottom: 12,
  },
  loyaltyPointsNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F59E0B',
  },
  loyaltyPointsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginLeft: 6,
  },
  readyRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 12,
  },
  readyRewardText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelLeft: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  progressLabelRight: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.light,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  rowValue: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionBtn: {
    marginBottom: 12,
  },
  logoutBtn: {},
  redeemActionBtn: {
    marginTop: 16,
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  redeemActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  redeemActionText: {
    color: '#FFF',
    ...TYPOGRAPHY.button,
    fontSize: 13,
    fontWeight: '800',
  },
  redeemOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  redeemOutlineText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  eduModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  eduModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  eduModalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  eduModalDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  eduModalInfoBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: SIZES.radiusSm,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  eduModalSubdesc: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  eduModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusSm,
    width: '100%',
    ...SHADOWS.soft,
  },
  eduModalBtnText: {
    color: '#FFF',
    ...TYPOGRAPHY.button,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProfileScreen;

