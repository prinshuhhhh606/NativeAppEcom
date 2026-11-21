import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './ProductListScreen.styles';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import AppIcon from '../components/AppIcon';
import { productService } from '../services/productService';

const { width } = Dimensions.get('window');
const SKELETON_WIDTH = (width - 40) / 2;

// Lightweight Skeleton card to avoid blank screen while first page loads
const SkeletonCard = () => (
  <View
    style={{
      width: SKELETON_WIDTH,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      padding: 8,
      overflow: 'hidden',
    }}
  >
    <View
      style={{
        width: '100%',
        height: SKELETON_WIDTH * 1.05,
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
      }}
    />
    <View style={{ width: '45%', height: 10, backgroundColor: '#f1f5f9', borderRadius: 4, marginTop: 8 }} />
    <View style={{ width: '85%', height: 13, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 6 }} />
    <View style={{ width: '60%', height: 13, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 4 }} />
    <View style={{ width: '40%', height: 15, backgroundColor: '#cbd5e1', borderRadius: 4, marginTop: 8 }} />
    <View
      style={{
        width: '100%',
        height: 28,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        marginTop: 10,
      }}
    />
  </View>
);

export const ProductListScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { categoryId, categoryName, title, filter, sellerId, query } = route.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('default'); // default, lowToHigh, highToLow

  const buildParams = useCallback(
    (pageNum = 1) => {
      const params = { page: pageNum, limit: 16 };
      if (categoryId) params.categoryId = categoryId;
      if (filter === 'trending') params.isTrending = true;
      if (filter === 'bestSeller') params.isBestSeller = true;
      if (filter === 'newArrival') params.isNewArrival = true;
      if (filter === 'flash') params.isFlash = true;
      if (sellerId) params.sellerId = sellerId;
      if (query) params.query = query;
      return params;
    },
    [categoryId, filter, sellerId, query]
  );

  const loadProducts = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (pageNum === 1 && !isRefresh && products.length === 0) {
        setLoading(true);
      }
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      try {
        const params = buildParams(pageNum);
        const data = await productService.getProducts(params, isRefresh);
        const incoming = Array.isArray(data) ? data : [];

        if (pageNum === 1) {
          setProducts(incoming);
        } else {
          // Deduplicate incoming products by ID
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => String(p.id || p._id)));
            const newItems = incoming.filter((p) => !existingIds.has(String(p.id || p._id)));
            return [...prev, ...newItems];
          });
        }

        // Determine if more pages exist
        const hasNext = data?.meta?.hasMore !== undefined ? data.meta.hasMore : incoming.length >= 16;
        setHasMore(hasNext);
        setPage(pageNum);
      } catch (e) {
        console.warn('Error fetching products', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [buildParams, products.length]
  );

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const handleRefresh = useCallback(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      loadProducts(page + 1);
    }
  }, [loading, loadingMore, hasMore, page, loadProducts]);

  const displayList = useMemo(() => {
    const list = [...products];
    if (sortOrder === 'lowToHigh') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortOrder === 'highToLow') {
      return list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, sortOrder]);

  const toggleSort = useCallback(() => {
    setSortOrder((prev) => {
      if (prev === 'default') return 'lowToHigh';
      if (prev === 'lowToHigh') return 'highToLow';
      return 'default';
    });
  }, []);

  const handleProductPress = useCallback(
    (product) => {
      const prodId = product.id || product._id;
      // Pass both ID and existing product data for instant screen display (0ms transition)
      navigation.navigate('ProductDetails', { productId: prodId, product });
    },
    [navigation]
  );

  const renderProductItem = useCallback(
    ({ item }) => {
      return <ProductCard product={item} onPress={() => handleProductPress(item)} />;
    },
    [handleProductPress]
  );

  const keyExtractor = useCallback((item) => String(item.id || item._id), []);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color="#ea580c" />
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '500' }}>
          Loading more products...
        </Text>
      </View>
    );
  }, [loadingMore]);

  return (
    <View style={styles.container}>
      <Header title={title || categoryName || 'Product Listing'} showBack navigation={navigation} />

      <View style={styles.filterBar}>
        <Text style={styles.resultsCount}>
          {loading && products.length === 0 ? 'Searching...' : `Showing ${displayList.length} Items`}
        </Text>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort} activeOpacity={0.7}>
          <Text style={styles.sortText}>
            Sort: {sortOrder === 'lowToHigh' ? 'Price ↑' : sortOrder === 'highToLow' ? 'Price ↓' : 'Featured'}
          </Text>
          <AppIcon name="filter-outline" size={14} color="#616161" />
        </TouchableOpacity>
      </View>

      {loading && products.length === 0 ? (
        // Fast non-blocking skeleton placeholder cards
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="cube-outline" size={48} color="#BDBDBD" />
          <Text style={styles.emptyText}>No Products Found</Text>
          <Text style={styles.emptySubtext}>Try exploring another category or search term.</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderProductItem}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#ea580c', '#2563EB']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ProductListScreen;
