import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../core/api';
import { COLORS, SHADOWS, TYPOGRAPHY, SIZES } from '../../core/theme';

export const AdminCategoryScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await ApiService.get('/categories');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setCategories(body.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data kategori:', error);
      Alert.alert('Error', 'Gagal memuat kategori produk.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setIsEditing(false);
    setEditingCategoryId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEditModal = (category) => {
    setName(category.name);
    setIsEditing(true);
    setEditingCategoryId(category.id);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validasi Gagal', 'Nama kategori wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
      };

      let res;
      if (isEditing) {
        res = await ApiService.put(`/admin/categories/${editingCategoryId}`, payload);
      } else {
        res = await ApiService.post('/admin/categories', payload);
      }

      const body = await res.json();

      if ((res.status === 200 || res.status === 201) && body.success) {
        Alert.alert('Sukses', isEditing ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.');
        setModalVisible(false);
        resetForm();
        fetchCategories();
      } else {
        Alert.alert('Gagal', body.message || 'Terjadi kesalahan pada server.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Masalah koneksi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category) => {
    Alert.alert(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await ApiService.delete(`/admin/categories/${category.id}`);
              const body = await res.json();
              
              if (res.status === 200 && body.success) {
                Alert.alert('Sukses', 'Kategori berhasil dihapus.');
                fetchCategories();
              } else {
                Alert.alert('Tidak Dapat Dihapus', body.message || 'Gagal menghapus kategori.');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Gagal menghubungi server.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCategoryCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="folder-open" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDesc} numberOfLines={2}>
            {item.description || 'Tidak ada deskripsi.'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleOpenEditModal(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} style={{ marginRight: 4 }} />
          <Text style={styles.deleteBtnText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Add Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Cari kategori..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>Kategori</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Tidak ada kategori ditemukan.</Text>
          </View>
        }
      />

      {/* Add / Edit Category Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Kategori *</Text>
                <TextInput
                  placeholder="Contoh: Daging Beku, Olahan Seafood"
                  value={name}
                  onChangeText={setName}
                  style={styles.textInput}
                />
              </View>



              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    paddingVertical: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    height: 40,
    paddingHorizontal: 12,
  },
  addBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  categoryName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  categoryDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusSm,
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: COLORS.primaryLight,
  },
  editBtnText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerLight,
  },
  deleteBtnText: {
    ...TYPOGRAPHY.small,
    color: COLORS.danger,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: 10,
    fontSize: 14,
    color: COLORS.secondary,
    backgroundColor: COLORS.borderLight,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
});

export default AdminCategoryScreen;
