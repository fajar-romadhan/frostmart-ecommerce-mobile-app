import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../core/api';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';

export const AddressListScreen = ({ navigation, route }) => {
  const selectMode = route.params?.selectMode || false;
  
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get('/addresses');
      const json = await res.json();
      if (json.success) {
        setAddresses(json.data);
      } else {
        Alert.alert('Error', json.message || 'Gagal memuat daftar alamat.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSelectAddress = (item) => {
    if (selectMode) {
      navigation.navigate({
        name: 'Checkout',
        params: { selectedAddress: item },
        merge: true,
      });
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await ApiService.put(`/addresses/${id}/set-default`);
      const json = await res.json();
      if (json.success) {
        fetchAddresses();
      } else {
        Alert.alert('Gagal', json.message || 'Gagal merubah alamat utama.');
      }
    } catch (err) {
      Alert.alert('Error', 'Kesalahan koneksi saat merubah alamat utama.');
    }
  };

  const handleDeleteAddress = (id) => {
    Alert.alert(
      'Hapus Alamat',
      'Apakah Anda yakin ingin menghapus alamat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await ApiService.delete(`/addresses/${id}`);
              const json = await res.json();
              if (json.success) {
                fetchAddresses();
              } else {
                Alert.alert('Gagal', json.message || 'Gagal menghapus alamat.');
              }
            } catch (err) {
              Alert.alert('Error', 'Kesalahan koneksi saat menghapus alamat.');
            }
          },
        },
      ]
    );
  };

  const renderAddressItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={selectMode ? 0.85 : 1}
        onPress={() => handleSelectAddress(item)}
        style={[
          styles.addressCard,
          item.is_utama && styles.addressCardUtama,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.labelBadge}>
              <Text style={styles.labelBadgeText}>{item.label}</Text>
            </View>
            {item.is_utama && (
              <View style={styles.utamaBadge}>
                <Text style={styles.utamaBadgeText}>Utama</Text>
              </View>
            )}
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddressForm', { address: item })}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteAddress(item.id)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.receiverText}>
          {item.nama_penerima} | {item.telepon_penerima}
        </Text>
        
        <Text style={styles.addressBodyText}>
          {item.alamat_lengkap}
        </Text>

        {!item.is_utama && (
          <TouchableOpacity
            style={styles.setDefaultBtn}
            onPress={() => handleSetDefault(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.setDefaultBtnText}>Jadikan Alamat Utama</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && addresses.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada alamat tersimpan.</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddressForm')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Tambah Alamat Baru</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SIZES.paddingMd,
    paddingBottom: 100,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  addressCardUtama: {
    borderColor: COLORS.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  labelBadgeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  utamaBadge: {
    backgroundColor: COLORS.accentLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  utamaBadgeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.accentDark,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 10,
  },
  receiverText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  addressBodyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  setDefaultBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  setDefaultBtnText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 12,
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
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.accent,
  },
  addBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});

export default AddressListScreen;
