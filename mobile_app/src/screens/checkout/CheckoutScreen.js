import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, SafeAreaView, ActivityIndicator, TouchableOpacity, Image, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '../../core/theme';
import { formatRupiah } from '../../core/utils';
import { getImageUrl, ApiService } from '../../core/api';
import { downloadAndSaveQris } from '../../utils/qrisHelper';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';

const StripeBorder = () => (
  <View style={styles.stripeContainer}>
    {[...Array(16)].map((_, i) => (
      <View
        key={i}
        style={[
          styles.stripeItem,
          { backgroundColor: i % 2 === 0 ? COLORS.accent : COLORS.primary }
        ]}
      />
    ))}
  </View>
);

export const CheckoutScreen = ({ navigation, route }) => {
  const { user, refreshPoints } = useAuth();
  const { cart, clearLocalCart } = useCart();
  const { checkout, isLoading, errorMessage } = useOrders();

  const [deliveryMethod, setDeliveryMethod] = useState('ambil_toko'); // ambil_toko, antar_alamat
  const [paymentMethod, setPaymentMethod] = useState('transfer'); // transfer, qris, cod
  const [paymentProofImage, setPaymentProofImage] = useState(null);
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [note, setNote] = useState('');
  const [addressError, setAddressError] = useState(null);

  // Loyalty Points & Reward State
  const [userPoints, setUserPoints] = useState(user?.total_points || 0);
  const [selectedRewardProduct, setSelectedRewardProduct] = useState(null);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);

  // QRIS Download & Zoom State
  const [qrisModalVisible, setQrisModalVisible] = useState(false);
  const [downloadingQris, setDownloadingQris] = useState(false);

  const handleDownloadQris = async () => {
    setDownloadingQris(true);
    try {
      await downloadAndSaveQris();
    } finally {
      setDownloadingQris(false);
    }
  };

  const [insufficientPointsModalVisible, setInsufficientPointsModalVisible] = useState(false);
  const [rewardProducts, setRewardProducts] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [rewardSearchQuery, setRewardSearchQuery] = useState('');

  // Shipping & Branch states
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingDistance, setShippingDistance] = useState(0);
  const [assignedBranch, setAssignedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedPickupBranch, setSelectedPickupBranch] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const fetchDefaultAddress = async () => {
    try {
      const res = await ApiService.get('/addresses');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const primary = json.data.find(addr => addr.is_utama) || json.data[0];
        setSelectedAddress(primary);
        if (primary.alamat_lengkap) {
          setAddress(primary.alamat_lengkap);
        }
        setDeliveryMethod('antar_alamat');
      }
    } catch (err) {
      console.error('Gagal mengambil alamat:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await ApiService.get('/branches');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setBranches(json.data);
        setSelectedPickupBranch(json.data[0]); // Default to first branch
      }
    } catch (err) {
      console.error('Gagal mengambil cabang:', err);
    }
  };

  const calculateShipping = async (lat, lng) => {
    try {
      setLoadingShipping(true);
      const res = await ApiService.get(`/addresses/calculate-shipping?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      if (json.success) {
        setShippingFee(json.shipping_fee);
        setShippingDistance(json.distance);
        setAssignedBranch(json.branch);
      } else {
        Alert.alert('Alamat Di luar Jangkauan', json.message || 'Alamat di luar jangkauan pengiriman.');
        setShippingFee(0);
        setShippingDistance(0);
        setAssignedBranch(null);
      }
    } catch (err) {
      console.error('Gagal menghitung ongkir:', err);
    } finally {
      setLoadingShipping(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const res = await ApiService.get('/points/history');
      const json = await res.json();
      if (json.success && json.data) {
        setUserPoints(json.data.total_points ?? (user?.total_points || 0));
      }
    } catch (e) {
      console.log('Error fetching user points:', e);
    }
  };

  const fetchRewardProducts = async () => {
    try {
      setLoadingRewards(true);
      const res = await ApiService.get('/points/reward-products');
      const json = await res.json();
      if (json.success && json.data) {
        setRewardProducts(json.data.products || []);
      }
    } catch (e) {
      console.log('Error fetching reward products:', e);
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleOpenRewardSelector = () => {
    if (userPoints < 10) {
      setInsufficientPointsModalVisible(true);
    } else {
      fetchRewardProducts();
      setRewardModalVisible(true);
    }
  };

  const handleSelectRewardProduct = (product) => {
    setSelectedRewardProduct(product);
    setRewardModalVisible(false);
  };

  const handleRemoveReward = () => {
    setSelectedRewardProduct(null);
  };

  useEffect(() => {
    fetchDefaultAddress();
    fetchBranches();
    fetchUserPoints();
  }, []);

  useEffect(() => {
    if (deliveryMethod === 'antar_alamat' && selectedAddress) {
      calculateShipping(selectedAddress.latitude, selectedAddress.longitude);
    } else {
      setShippingFee(0);
      setShippingDistance(0);
      setAssignedBranch(null);
    }
  }, [selectedAddress, deliveryMethod]);

  useEffect(() => {
    if (route.params?.selectedAddress) {
      const newAddr = route.params.selectedAddress;
      setSelectedAddress(newAddr);
      if (newAddr.alamat_lengkap) {
        setAddress(newAddr.alamat_lengkap);
      }
      setDeliveryMethod('antar_alamat');
    }
  }, [route.params?.selectedAddress]);

  const handlePickPaymentProof = async (source) => {
    try {
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert('Izin Ditolak', `Aplikasi memerlukan izin akses ${source === 'camera' ? 'kamera' : 'galeri'} untuk mengunggah bukti.`);
        return;
      }

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
        setPaymentProofImage(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error selecting payment proof image:', e);
      Alert.alert('Error', 'Gagal memilih gambar bukti pembayaran.');
    }
  };

  const handleCheckout = async () => {
    if (deliveryMethod === 'antar_alamat' && !selectedAddress) {
      Alert.alert('Alamat Kosong', 'Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.');
      return;
    }

    if (deliveryMethod === 'antar_alamat' && !assignedBranch && !loadingShipping) {
      Alert.alert('Wilayah Tidak Didukung', 'Alamat pengiriman Anda berada di luar jangkauan pengiriman Della Frozen Mart.');
      return;
    }

    if (paymentMethod !== 'cod' && !paymentProofImage) {
      Alert.alert(
        'Bukti Pembayaran Wajib Diunggah',
        'Untuk metode pembayaran Transfer Bank & QRIS, Anda wajib mengunggah foto bukti pembayaran terlebih dahulu sebelum membuat pesanan.'
      );
      return;
    }

    let finalAddress = 'Ambil di Toko';
    if (deliveryMethod === 'antar_alamat') {
      finalAddress = `${selectedAddress.nama_penerima} (${selectedAddress.telepon_penerima}) - ${selectedAddress.alamat_lengkap}`;
      if (note.trim() !== '') {
        finalAddress += ` (Catatan: ${note.trim()})`;
      }
    } else if (deliveryMethod === 'ambil_toko' && selectedPickupBranch) {
      finalAddress = `Ambil di: ${selectedPickupBranch.nama}`;
    }

    const data = await checkout({
      deliveryMethod,
      shippingAddress: finalAddress,
      paymentMethod,
      latitude: deliveryMethod === 'antar_alamat' && selectedAddress ? selectedAddress.latitude : null,
      longitude: deliveryMethod === 'antar_alamat' && selectedAddress ? selectedAddress.longitude : null,
      branch_id: deliveryMethod === 'antar_alamat' ? (assignedBranch?.id || null) : (selectedPickupBranch?.id || null),
      paymentProofUri: paymentMethod !== 'cod' ? paymentProofImage : null,
      reward_product_id: selectedRewardProduct ? selectedRewardProduct.id : null,
    });

    if (data) {
      clearLocalCart();
      // Immediately update points balance in background after order placed
      refreshPoints();
      Alert.alert('Sukses 🎉', 'Pesanan berhasil dibuat!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main', state: { routes: [{ name: 'Pesanan' }] } }],
            });
          },
        },
      ]);
    } else {
      Alert.alert('Gagal', errorMessage || 'Gagal memproses checkout.');
    }
  };

  if (!cart) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Stripe Postage Border & Shipping Address Section */}
        <TouchableOpacity
          activeOpacity={deliveryMethod === 'antar_alamat' ? 0.85 : 1}
          onPress={() => {
            if (deliveryMethod === 'antar_alamat') {
              navigation.navigate('AddressList', { selectMode: true });
            }
          }}
          style={styles.addressSectionCard}
        >
          <StripeBorder />
          <View style={styles.addressSectionContent}>
            {deliveryMethod === 'antar_alamat' ? (
              <View style={styles.addressContentRow}>
                <Ionicons name="location" size={20} color={COLORS.accent} style={styles.addressIcon} />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressSectionTitle}>Alamat Pengiriman</Text>
                  {selectedAddress ? (
                    <>
                      <Text style={styles.addressUser}>
                        {selectedAddress.nama_penerima} | {selectedAddress.telepon_penerima}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {selectedAddress.alamat_lengkap}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.addressText}>
                      Belum ada alamat pengiriman. Silakan tambah alamat.
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textMuted} style={styles.chevronIcon} />
              </View>
            ) : (
              <View style={styles.addressContentRow}>
                <Ionicons name="storefront" size={20} color={COLORS.primary} style={styles.addressIcon} />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressSectionTitle}>Alamat Pengambilan Toko</Text>
                  <Text style={styles.addressUser}>Della Frozen Mart (Gerai Utama)</Text>
                  <Text style={styles.addressText}>
                    Jl. Pandawa, Tanjung Enim (Siap diambil dalam 1 jam)
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Delivery Method Selector (Shopee-style Shipping Options) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pilihan Pengambilan</Text>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.shippingOption, deliveryMethod === 'ambil_toko' && styles.shippingOptionSelected]}
            onPress={() => setDeliveryMethod('ambil_toko')}
          >
            <Ionicons 
              name="storefront-outline" 
              size={20} 
              color={deliveryMethod === 'ambil_toko' ? COLORS.primary : COLORS.textSecondary} 
              style={styles.optionIcon} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionLabel}>Ambil Sendiri di Toko</Text>
              <Text style={styles.optionDesc}>Ambil belanjaan langsung ke gerai terdekat</Text>
            </View>
            <Text style={styles.optionPrice}>Gratis</Text>
            {deliveryMethod === 'ambil_toko' && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={styles.checkIcon} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.shippingOption, deliveryMethod === 'antar_alamat' && styles.shippingOptionSelected]}
            onPress={() => setDeliveryMethod('antar_alamat')}
          >
            <Ionicons 
              name="car-outline" 
              size={20} 
              color={deliveryMethod === 'antar_alamat' ? COLORS.primary : COLORS.textSecondary} 
              style={styles.optionIcon} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionLabel}>Antar ke Alamat</Text>
              <Text style={styles.optionDesc}>Pesanan dikirim kurir toko ke alamat Anda</Text>
            </View>
            <Text style={styles.optionPrice}>
              {shippingFee > 0 ? formatRupiah(shippingFee) : (loadingShipping ? '...' : 'Hitung Jarak')}
            </Text>
            {deliveryMethod === 'antar_alamat' && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        </View>

        {/* Branch Selection for Store Pickup */}
        {deliveryMethod === 'ambil_toko' && branches.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📍 Pilih Cabang Pengambilan</Text>
            <View style={styles.branchList}>
              {branches.map((b) => {
                const isSelected = selectedPickupBranch?.id === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPickupBranch(b)}
                    style={[styles.branchBtn, isSelected && styles.branchBtnSelected]}
                  >
                    <View style={styles.branchBtnHeader}>
                      <Text style={[styles.branchBtnTitle, isSelected && styles.branchBtnTitleSelected]}>
                        {b.nama}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      )}
                    </View>
                    <Text style={styles.branchBtnAddress}>{b.alamat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Shipping Assigned Branch Detail */}
        {deliveryMethod === 'antar_alamat' && assignedBranch && (
          <View style={styles.sectionCard}>
            <View style={styles.assignedBranchRow}>
              <Ionicons name="car" size={22} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.assignedBranchLabel}>Dikirim dari Cabang Terdekat:</Text>
                <Text style={styles.assignedBranchName}>{assignedBranch.name}</Text>
                <Text style={styles.assignedBranchDistance}>Jarak Pengiriman: ~{shippingDistance} km</Text>
              </View>
            </View>
          </View>
        )}

        {/* Store Header & Items List (Shopee-style Grouping) */}
        <View style={styles.sectionCard}>
          <View style={styles.storeHeader}>
            <Ionicons name="business-outline" size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.storeName}>Della Frozen Mart</Text>
          </View>

          {cart.items.map((item, index) => {
            const formattedImage = getImageUrl(item.image_url);
            return (
              <View key={item.id} style={[styles.productRow, index === cart.items.length - 1 && { borderBottomWidth: 0 }]}>
                {/* Product Thumbnail */}
                <View style={styles.productImageContainer}>
                  {formattedImage ? (
                    <Image source={{ uri: formattedImage }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.productPlaceholder}>
                      <Ionicons name="snow-outline" size={20} color={COLORS.primary} />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
                </View>

                {/* Quantity and Subtotal */}
                <View style={styles.productSubtotalCol}>
                  <Text style={styles.productQty}>x{item.quantity}</Text>
                  <Text style={styles.productSubtotal}>{formatRupiah(item.subtotal)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Seller Notes / Pesan Section */}
        <View style={styles.sectionCard}>
          <View style={styles.noteRow}>
            <Text style={styles.noteLabel}>Pesan:</Text>
            <TextInput
              placeholder="Silakan tinggalkan pesan untuk toko..."
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
            />
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.paymentOption, paymentMethod === 'transfer' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('transfer')}
          >
            <Ionicons 
              name="card-outline" 
              size={20} 
              color={paymentMethod === 'transfer' ? COLORS.accent : COLORS.textSecondary} 
              style={styles.optionIcon} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionLabel}>Transfer Bank (Verifikasi Manual)</Text>
              <Text style={styles.optionDesc}>Transfer ke rekening Mandiri/BCA Della Frozen Mart</Text>
            </View>
            {paymentMethod === 'transfer' && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} style={styles.checkIcon} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.paymentOption, paymentMethod === 'qris' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('qris')}
          >
            <Ionicons 
              name="qr-code-outline" 
              size={20} 
              color={paymentMethod === 'qris' ? COLORS.accent : COLORS.textSecondary} 
              style={styles.optionIcon} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionLabel}>QRIS (Scan Barcode Otomatis)</Text>
              <Text style={styles.optionDesc}>Pindai kode QRIS Della Frozen Mart</Text>
            </View>
            {paymentMethod === 'qris' && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} style={styles.checkIcon} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}
          >
            <Ionicons 
              name="cash-outline" 
              size={20} 
              color={paymentMethod === 'cod' ? COLORS.accent : COLORS.textSecondary} 
              style={styles.optionIcon} 
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionLabel}>COD (Bayar di Tempat)</Text>
              <Text style={styles.optionDesc}>Bayar tunai langsung saat pesanan diterima</Text>
            </View>
            {paymentMethod === 'cod' && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} style={styles.checkIcon} />
            )}
          </TouchableOpacity>
        </View>

        {/* Upload Bukti Pembayaran Card (Wajib untuk Transfer Bank & QRIS) */}
        {paymentMethod !== 'cod' && (
          <View style={[styles.sectionCard, { borderColor: paymentProofImage ? COLORS.success : COLORS.accent, borderWidth: 1.5 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="cloud-upload" size={20} color={COLORS.accent} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Unggah Bukti Pembayaran (Wajib)</Text>
            </View>

            {paymentMethod === 'transfer' && (
              <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted }}>Rekening Pembayaran Resmi Toko:</Text>
                <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.primary, marginTop: 2 }}>Bank Mandiri: 1130002605941</Text>
                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.secondary }}>a.n. della adelita</Text>
              </View>
            )}

            {paymentMethod === 'qris' && (
              <View style={styles.qrisSectionContainer}>
                <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.secondary, marginBottom: 4 }}>
                  Scan Barcode QRIS Resmi Toko:
                </Text>
                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, marginBottom: 10, textAlign: 'center' }}>
                  Bisa bayar dari semua Bank & E-Wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay)
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setQrisModalVisible(true)}
                  style={styles.qrisImageCard}
                >
                  <Image
                    source={require('../../../assets/images/qris.png')}
                    style={styles.qrisThumbnail}
                    resizeMode="contain"
                  />
                  <View style={styles.qrisZoomOverlayBadge}>
                    <Ionicons name="scan-outline" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.qrisZoomOverlayText}>Ketuk untuk Perbesar</Text>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons: Download QRIS & Perbesar */}
                <View style={styles.qrisButtonRow}>
                  <TouchableOpacity
                    style={styles.qrisDownloadBtn}
                    onPress={handleDownloadQris}
                    disabled={downloadingQris}
                    activeOpacity={0.8}
                  >
                    {downloadingQris ? (
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons name="download-outline" size={17} color="#FFF" style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.qrisDownloadBtnText}>
                      {downloadingQris ? 'Mengunduh...' : '📥 Download QRIS'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.qrisExpandBtn}
                    onPress={() => setQrisModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="expand-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.qrisExpandBtnText}>Perbesar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paymentProofImage ? (
              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <Image source={{ uri: paymentProofImage }} style={{ width: '100%', height: 180, borderRadius: 8 }} resizeMode="cover" />
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: COLORS.dangerLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                  onPress={() => setPaymentProofImage(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} style={{ marginRight: 4 }} />
                  <Text style={{ ...TYPOGRAPHY.small, color: COLORS.danger, fontWeight: 'bold' }}>Hapus & Ganti Foto Bukti</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, marginBottom: 8, fontStyle: 'italic' }}>
                  *Silakan transfer/scan QRIS terlebih dahulu, lalu unggah foto struk/bukti bayar di bawah ini.
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent, paddingVertical: 10, borderRadius: 8 }}
                    onPress={() => handlePickPaymentProof('camera')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ ...TYPOGRAPHY.button, color: '#FFF', fontSize: 13 }}>Kamera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8 }}
                    onPress={() => handlePickPaymentProof('library')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="images-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ ...TYPOGRAPHY.button, color: '#FFF', fontSize: 13 }}>Galeri Foto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Loyalty Reward Card (Kopi Kenangan / Superindo Style) */}
        <View style={[styles.sectionCard, selectedRewardProduct ? styles.rewardCardSelected : styles.rewardCardDefault]}>
          <View style={styles.rewardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="gift" size={20} color={selectedRewardProduct ? '#059669' : '#D97706'} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Hadiah Poin Loyalti (10 Poin)</Text>
            </View>
            <View style={styles.userPointsBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.userPointsBadgeText}>{userPoints} Poin</Text>
            </View>
          </View>

          {selectedRewardProduct ? (
            <View style={styles.selectedRewardContainer}>
              <View style={styles.selectedRewardRow}>
                <View style={styles.rewardImageContainer}>
                  {selectedRewardProduct.image ? (
                    <Image source={{ uri: getImageUrl(selectedRewardProduct.image) }} style={styles.rewardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.rewardImagePlaceholder}>
                      <Ionicons name="gift-outline" size={22} color="#059669" />
                    </View>
                  )}
                </View>
                <View style={styles.selectedRewardDetails}>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>🎁 GRATIS (10 Poin)</Text>
                  </View>
                  <Text style={styles.selectedRewardName} numberOfLines={2}>{selectedRewardProduct.name}</Text>
                  <Text style={styles.selectedRewardCategory}>{selectedRewardProduct.category?.name || 'Produk Hadiah'}</Text>
                </View>
              </View>

              <View style={styles.rewardActionRow}>
                <TouchableOpacity
                  style={styles.changeRewardBtn}
                  activeOpacity={0.8}
                  onPress={handleOpenRewardSelector}
                >
                  <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.changeRewardText}>Ganti Produk</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelRewardBtn}
                  activeOpacity={0.8}
                  onPress={handleRemoveReward}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} style={{ marginRight: 4 }} />
                  <Text style={styles.cancelRewardText}>Batalkan Hadiah</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.claimRewardContainer}>
              <Text style={styles.claimRewardDesc}>
                {userPoints >= 10
                  ? '🎉 Anda memiliki poin yang cukup! Tukarkan 10 Poin dengan 1 produk pilihan Anda secara GRATIS.'
                  : `Tukarkan 10 poin dengan 1 produk gratis bebas pilih. Saldo Anda saat ini ${userPoints} Poin.`}
              </Text>

              <TouchableOpacity
                style={[styles.claimRewardBtn, userPoints < 10 && styles.claimRewardBtnLocked]}
                activeOpacity={0.85}
                onPress={handleOpenRewardSelector}
              >
                <Ionicons
                  name={userPoints >= 10 ? 'sparkles' : 'lock-closed'}
                  size={16}
                  color={userPoints >= 10 ? '#FFF' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.claimRewardBtnText, userPoints < 10 && styles.claimRewardBtnTextLocked]}>
                  {userPoints >= 10 ? '🎁 Klaim 1 Produk Gratis (10 Poin)' : '🎁 Tukar 1 Produk Hadiah (10 Poin)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Breakdown Rincian Pembayaran */}
        <View style={styles.sectionCard}>
          <View style={styles.breakdownHeader}>
            <Ionicons name="receipt-outline" size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.breakdownTitle}>Rincian Pembayaran</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal untuk Produk</Text>
            <Text style={styles.breakdownValue}>{formatRupiah(cart.total_price)}</Text>
          </View>

          {selectedRewardProduct && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#059669' }]}>🎁 1x Produk Hadiah Poin</Text>
              <Text style={[styles.breakdownValue, { color: '#059669', fontWeight: 'bold' }]}>GRATIS (-10 Poin)</Text>
            </View>
          )}

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal Pengiriman</Text>
            <Text style={styles.breakdownValue}>{formatRupiah(shippingFee)}</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 6 }]}>
            <Text style={[styles.breakdownLabel, { color: COLORS.secondary, fontWeight: '700' }]}>Total Pembayaran</Text>
            <Text style={styles.breakdownTotalPrice}>{formatRupiah(cart.total_price + shippingFee)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Insufficient Points Modal (Emoticon 😔 Friendly Education) */}
      <Modal
        visible={insufficientPointsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInsufficientPointsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.insufficientModalBox}>
            <Text style={styles.sadEmote}>😔</Text>
            <Text style={styles.insufficientModalTitle}>Poin Kamu Belum Cukup!</Text>
            <Text style={styles.insufficientModalBody}>
              Kamu butuh <Text style={{ fontWeight: 'bold', color: '#D97706' }}>10 Poin</Text> untuk mendapatkan 1 produk gratis bebas pilih.
            </Text>

            <View style={styles.pointsStatusCard}>
              <View style={styles.pointsStatusRow}>
                <Text style={styles.statusLabel}>Saldo Poin Anda:</Text>
                <Text style={styles.statusPointsValue}>⭐ {userPoints} Poin</Text>
              </View>
              <View style={styles.pointsStatusRow}>
                <Text style={styles.statusLabel}>Sisa Poin Dibutuhkan:</Text>
                <Text style={[styles.statusPointsValue, { color: '#DC2626' }]}>{Math.max(0, 10 - userPoints)} Poin lagi</Text>
              </View>
              <View style={[styles.pointsStatusRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 }]}>
                <Text style={styles.statusLabel}>Belanja Tambahan:</Text>
                <Text style={[styles.statusPointsValue, { color: COLORS.primary }]}>
                  {formatRupiah(Math.max(0, 10 - userPoints) * 50000)}
                </Text>
              </View>
            </View>

            <Text style={styles.insufficientModalTip}>
              💡 Belanja kelipatan Rp 50.000 untuk mengumpulkan 1 poin loyalti pada setiap pesanan Anda!
            </Text>

            <TouchableOpacity
              style={styles.insufficientModalBtn}
              activeOpacity={0.85}
              onPress={() => setInsufficientPointsModalVisible(false)}
            >
              <Text style={styles.insufficientModalBtnText}>Siap, Kumpulkan Poin!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reward Product Picker Modal */}
      <Modal
        visible={rewardModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRewardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.pickerModalContainer}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="gift" size={22} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.pickerTitle}>Pilih 1 Produk Hadiah</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerCloseBtn}
                onPress={() => setRewardModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerNotice}>
              <Ionicons name="information-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.pickerNoticeText}>
                Pilih 1 produk apa saja dari katalog. 10 Poin Anda akan ditukarkan saat pesanan selesai diproses.
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.rewardSearchContainer}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Cari produk hadiah..."
                placeholderTextColor={COLORS.textMuted}
                value={rewardSearchQuery}
                onChangeText={setRewardSearchQuery}
                style={styles.rewardSearchInput}
              />
              {rewardSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setRewardSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Product List */}
            {loadingRewards ? (
              <View style={styles.pickerLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.pickerLoadingText}>Memuat produk hadiah...</Text>
              </View>
            ) : (
              <FlatList
                data={rewardProducts.filter(p => p.name.toLowerCase().includes(rewardSearchQuery.toLowerCase()))}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.rewardItemCard}>
                    <View style={styles.rewardItemImageWrap}>
                      {item.image ? (
                        <Image source={{ uri: getImageUrl(item.image) }} style={styles.rewardItemImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.rewardItemImagePlaceholder}>
                          <Ionicons name="snow-outline" size={22} color={COLORS.primary} />
                        </View>
                      )}
                    </View>

                    <View style={styles.rewardItemDetails}>
                      <Text style={styles.rewardItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.rewardItemCategory}>{item.category?.name || 'Frozen Food'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={styles.rewardItemOriginalPrice}>{formatRupiah(item.price)}</Text>
                        <View style={styles.rewardFreeBadgeSmall}>
                          <Text style={styles.rewardFreeBadgeSmallText}>GRATIS 🎁</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.selectRewardItemBtn}
                      activeOpacity={0.85}
                      onPress={() => handleSelectRewardProduct(item)}
                    >
                      <Text style={styles.selectRewardItemBtnText}>Pilih</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal Fullscreen Zoom Barcode QRIS */}
      <Modal
        visible={qrisModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrisModalVisible(false)}
      >
        <View style={styles.qrisModalOverlay}>
          <View style={styles.qrisModalCard}>
            <View style={styles.qrisModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="qr-code" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.qrisModalTitle}>Barcode QRIS Della Frozen Mart</Text>
              </View>
              <TouchableOpacity
                onPress={() => setQrisModalVisible(false)}
                style={styles.qrisModalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <Image
              source={require('../../../assets/images/qris.png')}
              style={styles.qrisModalImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={[styles.qrisDownloadBtn, { width: '100%', marginTop: 16 }]}
              onPress={handleDownloadQris}
              disabled={downloadingQris}
              activeOpacity={0.85}
            >
              {downloadingQris ? (
                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="download-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.qrisDownloadBtnText}>
                {downloadingQris ? 'Mengunduh QRIS...' : '📥 Download / Simpan ke Galeri'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Checkout Sticky Bottom Bar */}
      <View style={styles.footer}>
        <View style={styles.footerTotalContainer}>
          <Text style={styles.footerTotalLabel}>Total Pembayaran</Text>
          <Text style={styles.footerTotalPrice}>{formatRupiah(cart.total_price + shippingFee)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.orderButton} 
          onPress={handleCheckout}
          activeOpacity={0.85}
          disabled={isLoading || loadingShipping}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.orderButtonText}>
              {paymentMethod === 'cod' ? 'Buat Pesanan (COD)' : 'Kirim Bukti & Buat Pesanan'}
            </Text>
          )}
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
  scrollContent: {
    padding: SIZES.paddingMd,
    paddingBottom: 120,
  },
  stripeContainer: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    overflow: 'hidden',
  },
  stripeItem: {
    flex: 1,
    height: '100%',
    transform: [{ skewX: '-20deg' }],
    marginHorizontal: 1,
  },
  addressSectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: 12,
    ...SHADOWS.light,
  },
  addressSectionContent: {
    padding: SIZES.paddingMd,
  },
  addressContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  addressDetails: {
    flex: 1,
  },
  addressSectionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  addressUser: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  chevronIcon: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingMd,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  rewardCardDefault: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  rewardCardSelected: {
    borderColor: '#059669',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  userPointsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  selectedRewardContainer: {
    marginTop: 4,
  },
  selectedRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rewardImageContainer: {
    width: 55,
    height: 55,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    overflow: 'hidden',
    marginRight: 10,
  },
  rewardImage: {
    width: '100%',
    height: '100%',
  },
  rewardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRewardDetails: {
    flex: 1,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  freeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedRewardName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.secondary,
  },
  selectedRewardCategory: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  rewardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  changeRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
  },
  changeRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cancelRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  cancelRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  claimRewardContainer: {
    marginTop: 2,
  },
  claimRewardDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  claimRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.small,
  },
  claimRewardBtnLocked: {
    backgroundColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  claimRewardBtnText: {
    ...TYPOGRAPHY.button,
    color: '#FFF',
    fontSize: 13,
  },
  claimRewardBtnTextLocked: {
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  insufficientModalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.heavy,
  },
  sadEmote: {
    fontSize: 54,
    marginBottom: 10,
  },
  insufficientModalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  insufficientModalBody: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  pointsStatusCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  pointsStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  statusLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statusPointsValue: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: '#D97706',
  },
  insufficientModalTip: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 18,
  },
  insufficientModalBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  insufficientModalBtnText: {
    ...TYPOGRAPHY.button,
    color: '#FFF',
  },
  pickerModalContainer: {
    width: '100%',
    height: '85%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  pickerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.secondary,
  },
  pickerCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  pickerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  pickerNoticeText: {
    ...TYPOGRAPHY.small,
    color: '#065F46',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  rewardSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
  },
  rewardSearchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.secondary,
    padding: 0,
  },
  pickerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  pickerLoadingText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  rewardItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...SHADOWS.light,
  },
  rewardItemImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginRight: 12,
  },
  rewardItemImage: {
    width: '100%',
    height: '100%',
  },
  rewardItemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardItemDetails: {
    flex: 1,
    marginRight: 10,
  },
  rewardItemName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.secondary,
  },
  rewardItemCategory: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rewardItemOriginalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  rewardFreeBadgeSmall: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rewardFreeBadgeSmallText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectRewardItemBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectRewardItemBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  shippingOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionIcon: {
    marginRight: 10,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  optionDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  optionPrice: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primaryDark,
    marginRight: 4,
  },
  checkIcon: {
    marginLeft: 4,
  },
  addressInput: {
    marginBottom: 0,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: 10,
    marginBottom: 10,
  },
  storeName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    fontSize: 13,
  },
  productPrice: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productSubtotalCol: {
    alignItems: 'flex-end',
  },
  productQty: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  productSubtotal: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    fontWeight: '600',
    marginRight: 10,
  },
  noteInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    paddingVertical: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  paymentOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  breakdownValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    fontSize: 13,
  },
  breakdownTotalPrice: {
    ...TYPOGRAPHY.price,
    color: COLORS.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SIZES.paddingLg,
    paddingVertical: SIZES.paddingMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99,
    ...SHADOWS.heavy,
  },
  footerTotalContainer: {
    flexDirection: 'column',
  },
  footerTotalLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  footerTotalPrice: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.accent,
    marginTop: 2,
  },
  orderButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.accent,
  },
  orderButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  branchList: {
    marginTop: 8,
  },
  branchBtn: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.paddingMd,
    marginBottom: 8,
  },
  branchBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  branchBtnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  branchBtnTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  branchBtnTitleSelected: {
    color: COLORS.primary,
  },
  branchBtnAddress: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  assignedBranchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assignedBranchLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  assignedBranchName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  assignedBranchDistance: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  qrisSectionContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: SIZES.radiusMd,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrisImageCard: {
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrisThumbnail: {
    width: 140,
    height: 140,
    borderRadius: 6,
  },
  qrisZoomOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  qrisZoomOverlayText: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.primary,
    fontSize: 11,
  },
  qrisButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  qrisDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    ...SHADOWS.light,
  },
  qrisDownloadBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontSize: 13,
  },
  qrisExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  qrisExpandBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
    fontSize: 13,
  },
  qrisTipBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  qrisTipText: {
    ...TYPOGRAPHY.small,
    color: '#92400E',
    fontSize: 11.5,
    lineHeight: 16,
  },
  qrisModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrisModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...SHADOWS.heavy,
  },
  qrisModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  qrisModalTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    fontSize: 14,
  },
  qrisModalCloseBtn: {
    padding: 4,
  },
  qrisModalImage: {
    width: 250,
    height: 250,
    borderRadius: 8,
  },
});

export default CheckoutScreen;


