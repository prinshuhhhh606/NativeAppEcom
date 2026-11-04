import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import ProductCard from '../components/seller/ProductCard';
import EmptyState from '../components/seller/EmptyState';
import LoadingSkeleton from '../components/seller/LoadingSkeleton';
import sellerService from '../services/sellerService';
import styles from './SellerProductsScreen.styles';

export const SellerProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'approved' | 'pending_approval' | 'draft'

  const fetchProducts = useCallback(async () => {
    try {
      const res = await sellerService.getProducts();
      const list = Array.isArray(res) ? res : res.products || res.data || [];
      setProducts(list);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${product.productName || 'this item'}" from your store?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sellerService.deleteProduct(product._id);
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (product) => {
    navigation.navigate('SellerAddProduct', { product });
  };

  const handleLookupBarcode = (product) => {
    Alert.alert(
      'Product Barcode & SKU',
      `Product: ${product.productName}\nSKU: ${product.sku || 'N/A'}\nBarcode: ${product.barcode || 'N/A'}\nStock: ${product.stock} units`
    );
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      (item.productName || item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'approved') return item.approvalStatus === 'approved';
    if (activeTab === 'pending_approval' || activeTab === 'pending') {
      return item.approvalStatus === 'pending' || item.approvalStatus === 'pending_approval';
    }
    if (activeTab === 'draft') return item.approvalStatus === 'draft';

    return true;
  });

  const pendingReviewCount = products.filter(
    (p) => p.approvalStatus === 'pending' || p.approvalStatus === 'pending_approval'
  ).length;

  const tabs = [
    { id: 'all', label: `All (${products.length})` },
    { id: 'approved', label: `Live (${products.filter((p) => p.approvalStatus === 'approved').length})` },
    { id: 'pending_approval', label: `Review (${pendingReviewCount})` },
    { id: 'draft', label: `Drafts (${products.filter((p) => p.approvalStatus === 'draft').length})` },
  ];

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Product Catalog"
        subtitle={`${products.length} total listings`}
        navigation={navigation}
        rightIcon="add"
        onRightPress={() => navigation.navigate('SellerAddProduct')}
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <AppIcon name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Search by product name or SKU..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <AppIcon name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      {loading ? (
        <View style={{ padding: 16 }}>
          <LoadingSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id || String(item.sku)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLookupBarcode={handleLookupBarcode}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="No Products Found"
              description={
                searchQuery
                  ? `No listings match "${searchQuery}".`
                  : 'Your catalog is empty. Start by adding your first product listing.'
              }
              actionLabel="+ Add New Product"
              onAction={() => navigation.navigate('SellerAddProduct')}
            />
          }
        />
      )}
    </View>
  );
};

export default SellerProductsScreen;

