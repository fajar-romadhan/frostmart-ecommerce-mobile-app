import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Image, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { ApiService, getImageUrl, getImageUrlObject, isAbortError } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';

export const AdminOrderScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const isFetchingOrdersRef = useRef(false);
  const isFetchingCouriersRef = useRef(false);

  const fetchOrders = async (isBackground = false) => {
    if (isBackground && isFetchingOrdersRef.current) return;
    isFetchingOrdersRef.current = true;
    try {
      const res = await ApiService.get('/admin/orders');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setOrders(body.data);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Gagal mengambil data pesanan:', error?.message || error);
      }
    } finally {
      isFetchingOrdersRef.current = false;
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const fetchCouriers = async () => {
    if (isFetchingCouriersRef.current) return;
    isFetchingCouriersRef.current = true;
    try {
      const res = await ApiService.get('/admin/kurirs');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setCouriers(body.data);
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Gagal memuat daftar kurir:', err?.message || err);
      }
    } finally {
      isFetchingCouriersRef.current = false;
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCouriers();
    const interval = setInterval(() => fetchOrders(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrintReceipt = async (order) => {
    if (!order) return;
    try {
      const isPaid = order.payment_status === 'lunas' || order.status_pembayaran === 'lunas' || ['diproses', 'dikirim', 'siap diambil', 'selesai'].includes((order.order_status || '').toLowerCase());
      const paymentStatusStr = isPaid ? 'LUNAS (SUDAH DIBAYAR)' : 'BELUM BAYAR';

      const itemsHtml = (order.order_details || []).map(item => `
        <tr>
          <td style="padding: 4px 0;">${item.product_name || 'Produk'}<br><small>@ Rp ${Number(item.price).toLocaleString('id-ID')}</small></td>
          <td style="text-align: center; vertical-align: top; padding: 4px 0;">${item.quantity}</td>
          <td style="text-align: right; vertical-align: top; padding: 4px 0;">Rp ${Number(item.subtotal).toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: monospace; font-size: 12px; padding: 10px; width: 280px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .header h3 { margin: 0; font-size: 15px; }
            .info-table, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .info-table td { padding: 2px 0; vertical-align: top; }
            .items-table th { border-bottom: 1px dashed #000; text-align: left; padding-bottom: 4px; }
            .total-row td { border-top: 1px dashed #000; font-weight: bold; padding-top: 6px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>DELLA FROZEN MART</h3>
            <div>Tanjung Enim, Muara Enim</div>
            <div>WA: 0821-8282-6108</div>
          </div>
          <table class="info-table">
            <tr><td style="width:75px;">Nota</td><td>: ${order.order_code || order.kode_pesanan}</td></tr>
            <tr><td>Tanggal</td><td>: ${order.order_date || 'Hari Ini'}</td></tr>
            <tr><td>Pelanggan</td><td>: ${order.user?.name || order.user?.nama || 'Pelanggan'}</td></tr>
            <tr><td>No. HP</td><td>: ${order.user?.phone || order.user?.no_hp || '-'}</td></tr>
            <tr><td>Kirim</td><td>: ${order.delivery_method === 'ambil_toko' ? 'Ambil di Toko' : 'Antar Alamat'}</td></tr>
            ${order.shipping_address ? `<tr><td>Alamat</td><td>: ${order.shipping_address}</td></tr>` : ''}
            <tr><td>Pembayaran</td><td>: <b>${paymentStatusStr}</b></td></tr>
          </table>
          <table class="items-table">
            <thead>
              <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Total</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${(() => {
                const detailsList = order.order_details || order.details || [];
                const calculatedSubtotal = detailsList.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
                const rawShipping = order.ongkos_kirim ?? order.shipping_fee ?? 0;
                const isTakeaway = order.delivery_method === 'ambil_toko';
                const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : ((order.total_amount || 0) - rawShipping);
                const shippingStr = isTakeaway || rawShipping === 0 ? 'Gratis (Rp 0)' : `Rp ${Number(rawShipping).toLocaleString('id-ID')}`;

                return `
                  <tr>
                    <td colspan="2" style="text-align:right; font-size:11px; padding-top:6px;">Subtotal Produk:</td>
                    <td style="text-align:right; font-size:11px; padding-top:6px;">Rp ${Number(finalSubtotal).toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="text-align:right; font-size:11px;">Ongkos Kirim ${isTakeaway ? '(Ambil Toko)' : ''}:</td>
                    <td style="text-align:right; font-size:11px;">${shippingStr}</td>
                  </tr>
                `;
              })()}
              <tr class="total-row">
                <td colspan="2" style="text-align:right;">TOTAL:</td>
                <td style="text-align:right;">Rp ${Number(order.total_amount || 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Terima Kasih Atas Kunjungan Anda!</p>
            <p>Produk Frozen Berkualitas & Higienis</p>
          </div>
        </body>
        </html>
      `;

      await Print.printAsync({ html: htmlContent });
    } catch (err) {
      console.error('Print error:', err);
      Alert.alert('Error', 'Gagal memproses pencetakan struk.');
    }
  };

  const openOrderDetail = async (orderId) => {
    setModalVisible(true);
    setActionLoading(true);
    fetchCouriers();
    try {
      const res = await ApiService.get(`/admin/orders/${orderId}`);
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setSelectedOrder(body.data);
      }
    } catch (error) {
      console.error('Gagal mengambil detail pesanan:', error);
      Alert.alert('Error', 'Gagal memuat detail pesanan.');
      setModalVisible(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOrder = async (id) => {
    Alert.alert(
      'Konfirmasi Pembayaran',
      'Apakah Anda yakin bukti transfer valid dan ingin menyetujui pesanan ini? Stok produk akan otomatis terpotong.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await ApiService.put(`/admin/orders/${id}/confirm`);
              const body = await res.json();
              if (res.status === 200 && body.success) {
                Alert.alert('Sukses', 'Pesanan berhasil disetujui.');
                // Refresh detail and list
                openOrderDetail(id);
                fetchOrders();
              } else {
                Alert.alert('Gagal', body.message || 'Gagal mengonfirmasi pesanan.');
              }
            } catch (error) {
              console.error('Error confirm order:', error);
              Alert.alert('Error', 'Kesalahan jaringan.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAssignCourier = async (kurirId, kurirName) => {
    if (!selectedOrder) return;
    Alert.alert(
      'Tugaskan Kurir Toko',
      `Tugaskan ${kurirName || 'kurir ini'} untuk mengantar pesanan #${selectedOrder.order_code || selectedOrder.kode_pesanan}? Status pesanan akan otomatis diubah menjadi "Dikirim".`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Tugaskan 🛵',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await ApiService.post(`/admin/orders/${selectedOrder.id}/assign-kurir`, {
                kurir_id: kurirId,
              });
              const body = await res.json();
              if (res.status === 200 && body.success) {
                Alert.alert('Sukses 🛵', body.message || 'Kurir berhasil ditugaskan.');
                openOrderDetail(selectedOrder.id);
                fetchOrders();
              } else {
                Alert.alert('Gagal', body.message || 'Gagal menugaskan kurir.');
              }
            } catch (err) {
              console.error('Error assign courier:', err);
              Alert.alert('Error', 'Kesalahan jaringan saat menugaskan kurir.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (id, status) => {
    Alert.alert(
      'Perbarui Status',
      `Ubah status pesanan menjadi "${status}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ubah',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await ApiService.put(`/admin/orders/${id}/status`, { order_status: status });
              const body = await res.json();
              if (res.status === 200 && body.success) {
                Alert.alert('Sukses', `Status pesanan diubah ke "${status}".`);
                openOrderDetail(id);
                fetchOrders();
              } else {
                Alert.alert('Gagal', body.message || 'Gagal mengubah status.');
              }
            } catch (error) {
              console.error('Error status update:', error);
              Alert.alert('Error', 'Kesalahan jaringan.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'menunggu pembayaran') return { bg: COLORS.warningLight, text: COLORS.warning };
    if (s === 'menunggu konfirmasi') return { bg: '#FEF3C7', text: '#D97706' };
    if (s === 'dibatalkan') return { bg: COLORS.dangerLight, text: COLORS.danger };
    if (s === 'selesai') return { bg: COLORS.successLight, text: COLORS.success };
    return { bg: COLORS.primaryLight, text: COLORS.primary }; // Diproses, Dikirim, Siap Diambil
  };

  const renderOrderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.order_status);
    const isPointOrder = item.payment_method?.toLowerCase() === 'poin' || (item.points_used && item.points_used > 0) || (item.total_amount === 0 && item.delivery_method === 'ambil_toko');

    return (
      <TouchableOpacity style={[styles.card, isPointOrder && styles.pointOrderCard]} onPress={() => openOrderDetail(item.id)} activeOpacity={0.8}>
        {isPointOrder && (
          <View style={styles.pointClaimBanner}>
            <Ionicons name="gift" size={14} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.pointClaimBannerText}>🎁 PESANAN CLAIM POINT (TUKAR HADIAH)</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.orderCode}>{item.order_code}</Text>
            {isPointOrder && (
              <View style={styles.pointMiniBadge}>
                <Text style={styles.pointMiniBadgeText}>CLAIM POINT</Text>
              </View>
            )}
          </View>
          <Text style={styles.orderDate}>{item.order_date}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>Pelanggan:</Text>
            <Text style={styles.valueBold}>{item.user?.name || 'Pelanggan'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Bayar:</Text>
            <Text style={[styles.valueBold, { color: isPointOrder ? '#059669' : COLORS.accent }]}>
              {isPointOrder ? 'Rp 0 (Tukar 10 Poin)' : `Rp ${item.total_amount.toLocaleString('id-ID')}`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Metode:</Text>
            <Text style={[styles.value, isPointOrder && { color: '#059669', fontWeight: 'bold' }]}>
              {isPointOrder ? '🎁 KLAIM POIN' : item.payment_method?.toUpperCase()} ({item.delivery_method === 'ambil_toko' ? 'Ambil Toko' : 'Kirim Alamat'})
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.order_status}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={20} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Belum ada data pesanan.</Text>
          </View>
        }
      />

      {/* Modal Detail Pesanan */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, isTablet && { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <View style={[styles.modalContent, isTablet && { width: '90%', maxWidth: 640, borderRadius: SIZES.radiusLg, maxHeight: '90%', flexShrink: 1 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedOrder?.order_code || 'Detail Pesanan'}</Text>
                <Text style={styles.modalSubtitle}>{selectedOrder?.order_date}</Text>
              </View>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedOrder(null); }}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {actionLoading && !selectedOrder ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Banner Claim Point */}
                {(selectedOrder?.payment_method?.toLowerCase() === 'poin' || (selectedOrder?.points_used && selectedOrder?.points_used > 0) || (selectedOrder?.total_amount === 0 && selectedOrder?.delivery_method === 'ambil_toko')) && (
                  <View style={styles.modalClaimPointBanner}>
                    <Ionicons name="gift" size={24} color="#059669" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalClaimPointTitle}>🎁 PESANAN CLAIM POINT LOYALTI</Text>
                      <Text style={styles.modalClaimPointSubtitle}>
                        Pelanggan menukar 10 Poin Loyalti dengan produk gratis (Rp 0). Silakan siapkan produk hadiah dalam kondisi beku sempurna.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Pelanggan */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Informasi Pemesan</Text>
                  <Text style={styles.infoText}>Nama: {selectedOrder?.user?.name}</Text>
                  <Text style={styles.infoText}>Telepon: {selectedOrder?.user?.phone || '-'}</Text>
                  <Text style={styles.infoText}>Alamat Kirim: {selectedOrder?.shipping_address || 'Ambil di Toko'}</Text>
                </View>

                {/* Status Saat Ini */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Status Transaksi</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.badge, { backgroundColor: getStatusStyle(selectedOrder?.order_status).bg, marginRight: 10 }]}>
                      <Text style={[styles.badgeText, { color: getStatusStyle(selectedOrder?.order_status).text }]}>
                        Pesanan: {selectedOrder?.order_status}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: selectedOrder?.payment_status === 'lunas' ? COLORS.successLight : COLORS.dangerLight }]}>
                      <Text style={[styles.badgeText, { color: selectedOrder?.payment_status === 'lunas' ? COLORS.success : COLORS.danger }]}>
                        Pembayaran: {selectedOrder?.payment_status === 'lunas' ? 'LUNAS' : 'Belum Lunas'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Kurir Bertugas */}
                {selectedOrder?.kurir && (
                  <View style={[styles.infoSection, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1 }]}>
                    <Text style={[styles.sectionHeader, { color: COLORS.primary }]}>🛵 Kurir Bertugas Toko</Text>
                    <Text style={styles.infoText}>Nama Kurir: {selectedOrder.kurir.name}</Text>
                    <Text style={styles.infoText}>No. WhatsApp: {selectedOrder.kurir.phone || '-'}</Text>
                    <Text style={styles.infoText}>Kendaraan: {selectedOrder.kurir.jenis_kendaraan || 'Motor Toko'} ({selectedOrder.kurir.plat_kendaraan || 'Della Mart'})</Text>
                  </View>
                )}

                {/* Items */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Daftar Belanja</Text>
                  {selectedOrder?.order_details?.map((detail) => {
                    const isReward = detail.is_reward || detail.subtotal === 0 || (detail.product_name && detail.product_name.toLowerCase().includes('hadiah poin'));
                    return (
                      <View key={detail.id} style={styles.detailItemRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.detailItemName} numberOfLines={1}>
                            {detail.product_name}
                          </Text>
                          {isReward && (
                            <View style={styles.itemRewardBadge}>
                              <Text style={styles.itemRewardBadgeText}>🎁 HADIAH 10 POIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.detailItemQty}>
                          {detail.quantity} x Rp {detail.price?.toLocaleString('id-ID')}
                        </Text>
                        <Text style={[styles.detailItemSubtotal, isReward && { color: '#059669', fontWeight: 'bold' }]}>
                          {isReward ? 'GRATIS' : `Rp ${detail.subtotal?.toLocaleString('id-ID')}`}
                        </Text>
                      </View>
                    );
                  })}

                  <View style={{ borderTopWidth: 1, borderTopColor: COLORS.borderLight, marginTop: 10, paddingTop: 10 }}>
                    {(() => {
                      const detailsList = selectedOrder?.order_details || [];
                      const calculatedSubtotal = detailsList.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
                      const rawShipping = selectedOrder?.ongkos_kirim ?? selectedOrder?.shipping_fee ?? 0;
                      const isTakeaway = selectedOrder?.delivery_method === 'ambil_toko';
                      const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : ((selectedOrder?.total_amount || 0) - rawShipping);

                      return (
                        <>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, color: COLORS.textMuted }}>Subtotal Produk</Text>
                            <Text style={{ fontSize: 13, color: COLORS.secondary, fontWeight: '600' }}>
                              Rp {finalSubtotal.toLocaleString('id-ID')}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
                              Ongkos Kirim {isTakeaway ? '(Ambil di Toko)' : ''}
                            </Text>
                            <Text style={{ fontSize: 13, color: isTakeaway || rawShipping === 0 ? COLORS.success : COLORS.secondary, fontWeight: '600' }}>
                              {isTakeaway || rawShipping === 0 ? 'Gratis (Rp 0)' : `Rp ${Number(rawShipping).toLocaleString('id-ID')}`}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Pembayaran</Text>
                    <Text style={styles.totalVal}>
                      Rp {selectedOrder?.total_amount?.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>

                {/* Bukti Pembayaran */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Bukti Transfer Pelanggan</Text>
                  {(selectedOrder?.payment?.payment_proof_url || selectedOrder?.payment?.payment_proof || selectedOrder?.bukti_pembayaran) ? (
                    <Image
                      source={getImageUrlObject(
                        selectedOrder?.payment?.payment_proof_url ||
                        selectedOrder?.payment?.payment_proof ||
                        selectedOrder?.bukti_pembayaran
                      )}
                      style={styles.proofImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.emptyProofBox}>
                      <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                      <Text style={styles.emptyProofText}>
                        Pelanggan belum mengunggah foto bukti pembayaran.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {actionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SIZES.md }} />
                ) : (
                  <View style={styles.actionBlock}>
                    {/* Tahap 1: Pesanan Menunggu Pembayaran / Konfirmasi */}
                    {(selectedOrder?.order_status?.toLowerCase() === 'menunggu pembayaran' ||
                      selectedOrder?.order_status?.toLowerCase() === 'menunggu konfirmasi' ||
                      selectedOrder?.order_status?.toLowerCase() === 'pending') && (
                      <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: COLORS.success }]}
                        onPress={() => handleConfirmOrder(selectedOrder.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                        <Text style={styles.btnTextWhite}>✅ SETUJUI BUKTI BAYAR & KEMAS</Text>
                      </TouchableOpacity>
                    )}

                    {/* Tahap 2: Pesanan Sedang Dikemas (Diproses) */}
                    {selectedOrder?.order_status?.toLowerCase() === 'diproses' &&
                     selectedOrder?.delivery_method === 'ambil_toko' && (
                      <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => handleUpdateStatus(selectedOrder.id, 'Siap Diambil')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="storefront-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                        <Text style={styles.btnTextWhite}>🏬 TANDAI SIAP DIAMBIL DI TOKO</Text>
                      </TouchableOpacity>
                    )}

                    {selectedOrder?.order_status?.toLowerCase() === 'diproses' &&
                     selectedOrder?.delivery_method !== 'ambil_toko' && (
                      <View style={[styles.infoSection, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B', borderWidth: 1.5, marginBottom: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Ionicons name="bicycle" size={22} color="#D97706" style={{ marginRight: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ ...TYPOGRAPHY.bodyBold, color: '#92400E', fontSize: 13 }}>🛵 Tugaskan Kurir Toko & Kirim</Text>
                            <Text style={{ ...TYPOGRAPHY.small, color: '#B45309', fontSize: 11 }}>Pilih kurir toko resmi untuk mengantar pesanan ini:</Text>
                          </View>
                        </View>

                        {couriers.length === 0 ? (
                          <View style={{ padding: 12, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#D97706" />
                            <Text style={{ ...TYPOGRAPHY.small, color: '#92400E', marginTop: 4 }}>Memuat daftar kurir toko...</Text>
                          </View>
                        ) : (
                          couriers.map((k) => (
                            <TouchableOpacity
                              key={k.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#FFFFFF',
                                padding: 12,
                                borderRadius: SIZES.radiusSm,
                                marginBottom: 8,
                                borderWidth: 1.5,
                                borderColor: '#F59E0B',
                                ...SHADOWS.soft,
                              }}
                              onPress={() => handleAssignCourier(k.id, k.name)}
                              activeOpacity={0.7}
                            >
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <Ionicons name="bicycle" size={22} color="#D97706" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.secondary, fontSize: 13 }}>{k.name}</Text>
                                <Text style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, fontSize: 11 }}>🛵 {k.jenis_kendaraan || 'Motor Toko'} ({k.plat_kendaraan || 'BG 4821 EY'})</Text>
                                <Text style={{ ...TYPOGRAPHY.small, color: '#059669', fontWeight: 'bold', fontSize: 11, marginTop: 1 }}>📞 WA: {k.phone || '-'}</Text>
                              </View>
                              <View style={{ backgroundColor: '#D97706', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>PILIH ➔</Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    )}

                    {/* Khusus Pesanan Klaim Poin Murni: Tombol Selesaikan oleh Admin / Kasir Toko */}
                    {(selectedOrder?.payment_method?.toLowerCase() === 'poin' ||
                      (selectedOrder?.total_amount === 0 && selectedOrder?.delivery_method === 'ambil_toko')) &&
                      selectedOrder?.order_status?.toLowerCase() !== 'selesai' &&
                      selectedOrder?.order_status?.toLowerCase() !== 'dibatalkan' && (
                      <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: '#059669', marginBottom: 12 }]}
                        onPress={() => handleUpdateStatus(selectedOrder.id, 'Selesai')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-done-circle" size={22} color={COLORS.white} style={{ marginRight: 8 }} />
                        <Text style={[styles.btnTextWhite, { fontWeight: '900', fontSize: 13 }]}>🎉 SERAHKAN HADIAH & KLIK SELESAI</Text>
                      </TouchableOpacity>
                    )}

                    {/* Tahap 3: Pesanan Sedang Dikirim / Siap Diambil */}
                    {(selectedOrder?.order_status?.toLowerCase() === 'dikirim' ||
                      selectedOrder?.order_status?.toLowerCase() === 'siap diambil') && (
                      <View style={{ marginBottom: 12, backgroundColor: '#EFF6FF', borderRadius: SIZES.radiusSm, padding: SIZES.md, borderWidth: 1, borderColor: '#BFDBFE' }}>
                        <Ionicons name="time-outline" size={24} color="#1D4ED8" style={{ alignSelf: 'center', marginBottom: 4 }} />
                        <Text style={{ ...TYPOGRAPHY.bodyBold, color: '#1E40AF', textAlign: 'center', marginBottom: 2 }}>
                          {selectedOrder?.delivery_method === 'ambil_toko'
                            ? '🏬 Pesanan Siap Diambil di Toko'
                            : '🛵 Pesanan Sedang Dalam Pengiriman'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#1E3A8A', textAlign: 'center', lineHeight: 16 }}>
                          {(selectedOrder?.payment_method?.toLowerCase() === 'poin' ||
                            (selectedOrder?.total_amount === 0 && selectedOrder?.delivery_method === 'ambil_toko'))
                            ? 'Pesanan klaim hadiah poin diselesaikan langsung oleh Kasir / Admin Toko setelah menyerahkan barang di toko.'
                            : selectedOrder?.points_used > 0
                              ? 'Pesanan ini menggunakan poin + bayar reguler. Konfirmasi selesai dilakukan oleh Pelanggan sendiri setelah barang diterima.'
                              : 'Konfirmasi pesanan selesai dilakukan langsung oleh Pelanggan (atau otomatis bertanda Selesai oleh sistem setelah 15 menit).'}
                        </Text>
                      </View>
                    )}

                    {/* Button Chat Pelanggan */}
                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: COLORS.primary, marginTop: 8 }]}
                      onPress={() => {
                        setModalVisible(false);
                        navigation.navigate('OrderChat', {
                          orderId: selectedOrder.id,
                          orderCode: selectedOrder.order_code || selectedOrder.kode_pesanan
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubbles-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={styles.btnTextWhite}>💬 CHAT PELANGGAN</Text>
                    </TouchableOpacity>

                    {/* Button Cetak Struk Kasir */}
                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: COLORS.secondary, marginTop: 8 }]}
                      onPress={() => handlePrintReceipt(selectedOrder)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="print-outline" size={20} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={styles.btnTextWhite}>🖨️ CETAK STRUK KASIR</Text>
                    </TouchableOpacity>

                    {/* Button Batalkan Pesanan (jika pesanan belum selesai / dibatalkan) */}
                    {selectedOrder?.order_status?.toLowerCase() !== 'selesai' &&
                      selectedOrder?.order_status?.toLowerCase() !== 'dibatalkan' && (
                      <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: COLORS.dangerLight, borderWidth: 1, borderColor: COLORS.danger, marginTop: 8 }]}
                        onPress={() => handleUpdateStatus(selectedOrder.id, 'Dibatalkan')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
                        <Text style={[styles.btnTextWhite, { color: COLORS.danger }]}>❌ Batalkan Pesanan</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
    padding: SIZES.paddingLg,
  },
  listContainer: {
    padding: SIZES.paddingMd,
  },
  emptyText: {
    color: COLORS.textSecondary,
    ...TYPOGRAPHY.body,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.paddingMd,
    marginBottom: SIZES.md,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xs,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.sm,
  },
  cardBody: {
    marginBottom: SIZES.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  valueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '92%',
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.paddingMd,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: SIZES.paddingMd,
  },
  infoSection: {
    backgroundColor: COLORS.background,
    padding: SIZES.paddingMd,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: SIZES.xs,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailItemName: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  detailItemQty: {
    flex: 1.5,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  detailItemSubtotal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  totalVal: {
    ...TYPOGRAPHY.priceLarge,
    color: COLORS.accent,
  },
  proofImage: {
    width: '100%',
    height: 300,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.sm,
    backgroundColor: COLORS.white,
  },
  emptyProofBox: {
    padding: SIZES.paddingLg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyProofText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  actionBlock: {
    marginTop: SIZES.md,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.paddingMd,
    borderRadius: SIZES.radiusSm,
    ...SHADOWS.soft,
    marginBottom: SIZES.md,
  },
  btnTextWhite: {
    color: COLORS.white,
    ...TYPOGRAPHY.button,
  },
  btnTextRed: {
    color: COLORS.danger,
    ...TYPOGRAPHY.button,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: SIZES.paddingMd,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginBottom: 20,
  },
  statusUpdateContainer: {
    marginBottom: SIZES.md,
  },
  statusUpdateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SIZES.sm,
  },
  btnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOptionBtn: {
    width: '23%',
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  statusOptionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pointOrderCard: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  pointClaimBanner: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginHorizontal: -SIZES.paddingMd,
    marginTop: -SIZES.paddingMd,
    marginBottom: 8,
  },
  pointClaimBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pointMiniBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pointMiniBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
  },
  modalClaimPointBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1.5,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  modalClaimPointTitle: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  modalClaimPointSubtitle: {
    color: '#047857',
    fontSize: 11,
    lineHeight: 15,
  },
  itemRewardBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  itemRewardBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
  },
});

export default AdminOrderScreen;
