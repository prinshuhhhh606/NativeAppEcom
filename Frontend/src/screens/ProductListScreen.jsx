import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './ProductListScreen.styles';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import AppIcon from '../components/AppIcon';
import Loading from '../components/Loading';
import { productService } from '../services/productService';

export const ProductListScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { categoryId, categoryName, title, filter, sellerId, query } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('default'); // default, lowToHigh, highToLow

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryId) params.categoryId = categoryId;
      if (filter === 'trending') params.isTrending = true;
      if (filter === 'bestSeller') params.isBestSeller = true;
      if (filter === 'newArrival') params.isNewArrival = true;
      if (filter === 'flash') params.isFlash = true;
      if (sellerId) params.sellerId = sellerId;
      if (query) params.query = query;

      const data = await productService.getProducts(params);
      setProducts(data || []);
    } catch (e) {
      console.warn('Error fetching products', e);
    } finally {
      setLoading(false);
    }
  }, [categoryId, filter, sellerId, query]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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

  const handleProductPress = useCallback((prodId) => {
    navigation.navigate('ProductDetails', { productId: prodId });
  }, [navigation]);

  const renderProductItem = useCallback(({ item }) => {
    const prodId = item.id || item._id;
    return (
      <ProductCard
        product={item}
        onPress={() => handleProductPress(prodId)}
      />
    );
  }, [handleProductPress]);

  const keyExtractor = useCallback((item) => String(item.id || item._id), []);

  return (
    <View style={styles.container}>
      <Header
        title={title || categoryName || 'Product Listing'}
        showBack
        navigation={navigation}
      />

      <View style={styles.filterBar}>
        <Text style={styles.resultsCount}>Showing {displayList.length} Items</Text>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort} activeOpacity={0.7}>
          <Text style={styles.sortText}>
            Sort: {sortOrder === 'lowToHigh' ? 'Price ↑' : sortOrder === 'highToLow' ? 'Price ↓' : 'Featured'}
          </Text>
          <AppIcon name="filter-outline" size={14} color="#616161" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loading message="Finding products..." fullScreen />
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
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 24 },
          ]}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ProductListScreen;

