import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import EmptyState from '../components/seller/EmptyState';
import LoadingSkeleton from '../components/seller/LoadingSkeleton';
import sellerService from '../services/sellerService';
import { formatPrice } from '../utils/helpers';
import styles from './SellerInventoryScreen.styles';

export const SellerInventoryScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [searchQuery, setSearchQuery] = useState('');

  // Barcode / SKU Quick Scan state
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);

  // Stock Adjustment Modal State
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState('add'); // 'add' | 'reduce'
  const [quantityInput, setQuantityInput] = useState('');
  const [reasonInput, setReasonInput] = useState('New stock batch arrived');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await sellerService.getInventory();
      const list = Array.isArray(res) ? res : res.products || res.data || [];
      setItems(list);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load warehouse inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleOpenAdjust = (item, type = 'add') => {
    setSelectedItem(item);
    setAdjustType(type);
    setQuantityInput('');
    setReasonInput(type === 'add' ? 'New procurement batch arrived' : 'Damaged / audit deduction');
    setAdjustModalVisible(true);
  };

  const handleConfirmAdjust = async () => {
    const qty = parseInt(quantityInput, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity');
      return;
    }

    setSubmitting(true);
    try {
      await sellerService.adjustStock({
        productId: selectedItem._id,
        quantity: qty,
        type: adjustType,
        reason: reasonInput,
      });
      Alert.alert('Success', `Stock ${adjustType === 'add' ? 'increased' : 'reduced'} by ${qty} units.`);
      setAdjustModalVisible(false);
      fetchInventory();
    } catch (e) {
      Alert.alert('Adjustment Failed', e.message || 'Could not update inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeLookup = async () => {
    const code = barcodeQuery.trim();
    if (!code) {
      Alert.alert('Barcode Search', 'Please enter or scan a Barcode or SKU');
      return;
    }

    setBarcodeSearching(true);
    try {
      const res = await sellerService.lookupBarcode(code);
      const product = res.product || res.data || res;
      if (product && product._id) {
        handleOpenAdjust(product, 'add');
      } else {
        Alert.alert('Barcode Lookup', `No product found matching code: ${code}`);
      }
    } catch (e) {
      Alert.alert('Barcode Lookup', `Product not found for "${code}"`);
    } finally {
      setBarcodeSearching(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const title = item.productName || item.title || '';
    const sku = item.sku || '';
    const barcode = item.barcode || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barcode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    const stock = item.stock ?? 0;
    if (filter === 'low') return stock > 0 && stock <= (item.lowStockAlert || 5);
    if (filter === 'out') return stock === 0;
    return true;
  });

  const lowCount = items.filter((i) => (i.stock ?? 0) > 0 && (i.stock ?? 0) <= (i.lowStockAlert || 5)).length;
  const outCount = items.filter((i) => (i.stock ?? 0) === 0).length;

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Inventory & Stock"
        subtitle={`${items.length} managed SKUs`}
        navigation={navigation}
      />

      {/* Barcode / SKU Scan Input Bar */}
      <View style={styles.barcodeScanBar}>
        <AppIcon name="barcode-outline" size={20} color="#059669" />
        <TextInput
          style={styles.barcodeInput}
          placeholder="Scan or enter Barcode / SKU..."
          placeholderTextColor="#94A3B8"
          value={barcodeQuery}
          onChangeText={setBarcodeQuery}
          onSubmitEditing={handleBarcodeLookup}
        />
        <TouchableOpacity
          style={styles.barcodeLookupBtn}
          onPress={handleBarcodeLookup}
          disabled={barcodeSearching}>
          <Text style={styles.barcodeLookupBtnText}>
            {barcodeSearching ? 'Scanning...' : 'Scan / Find'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            All ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'low' && styles.filterChipActive]}
          onPress={() => setFilter('low')}>
          <Text style={[styles.filterChipText, filter === 'low' && styles.filterChipTextActive]}>
            Low Stock ({lowCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'out' && styles.filterChipActive]}
          onPress={() => setFilter('out')}>
          <Text style={[styles.filterChipText, filter === 'out' && styles.filterChipTextActive]}>
            Out of Stock ({outCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inventory Items List */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <LoadingSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id || item.sku}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          renderItem={({ item }) => {
            const stock = item.stock ?? 0;
            const isOut = stock === 0;
            const isLow = stock > 0 && stock <= (item.lowStockAlert || 5);

            return (
              <View style={styles.inventoryCard}>
                <View style={styles.cardInfo}>
                  <Text style={styles.productNameText} numberOfLines={1}>
                    {item.productName || item.title || 'Product'}
                  </Text>
                  <Text style={styles.skuText}>
                    SKU: {item.sku || 'N/A'} {item.barcode ? `• Barcode: ${item.barcode}` : ''}
                  </Text>
                  <Text style={styles.priceText}>{formatPrice(item.price || 0)}</Text>
                </View>

                {/* Stock Counter & Adjustment Buttons */}
                <View style={styles.stockActionCol}>
                  <View
                    style={[
                      styles.stockPill,
                      isOut
                        ? styles.stockPillOut
                        : isLow
                        ? styles.stockPillLow
                        : styles.stockPillNormal,
                    ]}>
                    <Text
                      style={[
                        styles.stockCountText,
                        isOut
                          ? styles.textOut
                          : isLow
                          ? styles.textLow
                          : styles.textNormal,
                      ]}>
                      {stock} units
                    </Text>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: '#EFF6FF' }]}
                      onPress={() => handleOpenAdjust(item, 'add')}>
                      <AppIcon name="add" size={14} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: '#FEF2F2' }]}
                      onPress={() => handleOpenAdjust(item, 'reduce')}>
                      <AppIcon name="remove" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="layers-outline"
              title="No Inventory Matches"
              description="No warehouse items match your search or filter."
            />
          }
        />
      )}

      {/* Stock Adjustment Modal */}
      <Modal visible={adjustModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {adjustType === 'add' ? '+ Add Inventory Stock' : '- Deduct Inventory Stock'}
              </Text>
              <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                <AppIcon name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.selectedProductLabel}>
              {selectedItem?.productName || 'Product'}
            </Text>
            <Text style={styles.currentStockNotice}>
              Current Warehouse Balance: <Text style={{ fontWeight: '800' }}>{selectedItem?.stock ?? 0} units</Text>
            </Text>

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, adjustType === 'add' && styles.typeBtnAddActive]}
                onPress={() => setAdjustType('add')}>
                <Text
                  style={[styles.typeBtnText, adjustType === 'add' && styles.typeBtnTextActive]}>
                  + Restock
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, adjustType === 'reduce' && styles.typeBtnReduceActive]}
                onPress={() => setAdjustType('reduce')}>
                <Text
                  style={[styles.typeBtnText, adjustType === 'reduce' && styles.typeBtnTextActive]}>
                  - Write-off / Deduct
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Quantity to {adjustType}:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 25"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={quantityInput}
              onChangeText={setQuantityInput}
            />

            <Text style={styles.fieldLabel}>Adjustment Audit Reason:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. New procurement shipment arrived"
              placeholderTextColor="#94A3B8"
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                adjustType === 'reduce' && { backgroundColor: '#DC2626' },
              ]}
              onPress={handleConfirmAdjust}
              disabled={submitting}>
              <Text style={styles.confirmBtnText}>
                {submitting ? 'Updating...' : `Confirm ${adjustType.toUpperCase()} Stock`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SellerInventoryScreen;

