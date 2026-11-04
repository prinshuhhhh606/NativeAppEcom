import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './SearchScreen.styles';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import AppIcon from '../components/AppIcon';
import { productService } from '../services/productService';

const TRENDING_SEARCHES = [
  'Silk Saree',
  'Khadi Kurta',
  'ANC Earbuds',
  'Brass Diya',
  'Kashmiri Saffron',
  'Smartwatch',
  'Cotton Bedsheet',
  'Ayurvedic Serum',
];

export const SearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadSearchHistory();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const loadSearchHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem('@appsica_search_history');
      if (raw) setSearchHistory(JSON.parse(raw));
    } catch (e) {}
  };

  const saveSearchTerm = async (term) => {
    if (!term || term.trim().length < 2) return;
    try {
      const raw = await AsyncStorage.getItem('@appsica_search_history');
      let list = raw ? JSON.parse(raw) : [];
      list = [term.trim(), ...list.filter((t) => t.toLowerCase() !== term.trim().toLowerCase())].slice(0, 8);
      await AsyncStorage.setItem('@appsica_search_history', JSON.stringify(list));
      setSearchHistory(list);
    } catch (e) {}
  };

  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem('@appsica_search_history');
      setSearchHistory([]);
    } catch (e) {}
  };

  // Debounced query change (250ms delay) to eliminate keystroke API storms
  const handleQueryChange = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setSuggestions([]);
      setResults([]);
      setSearched(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.trim().length >= 2) {
        try {
          const sugs = await productService.getSearchSuggestions(text.trim());
          setSuggestions(sugs || []);
        } catch (e) {}
      }
    }, 250);
  };

  const handleSearch = useCallback(async (text) => {
    const q = text !== undefined ? text : query;
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setSearched(true);
    setSuggestions([]);
    saveSearchTerm(q);
    const data = await productService.getProducts({ search: q, query: q });
    setResults(data || []);
  }, [query]);

  const handleTagPress = useCallback((tag) => {
    setQuery(tag);
    handleSearch(tag);
  }, [handleSearch]);

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
      <Header title="Search Products" showBack navigation={navigation} />

      <SearchBar
        value={query}
        onChangeText={handleQueryChange}
        onSubmit={() => handleSearch()}
        placeholder="Search sarees, kurtas, earbuds, spices..."
      />

      {/* Auto-complete Suggestions Dropdown */}
      {!searched && suggestions.length > 0 && (
        <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16 }}>
          {suggestions.map((sug, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSearch(sug)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: idx < suggestions.length - 1 ? 0.5 : 0, borderColor: '#f1f5f9' }}>
              <AppIcon name="search-outline" size={14} color="#64748b" />
              <Text style={{ marginLeft: 10, fontSize: 13, color: '#1e293b', fontWeight: '600' }}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searched && results.length > 0 ? (
        <FlatList
          data={results}
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
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      ) : searched && results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="search-outline" size={48} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No Matching Products</Text>
          <Text style={styles.emptyText}>
            We couldn't find anything for "{query}". Try checking the spelling or use a different keyword.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.suggestionSection}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.sectionTitle}>🕒 Recent Searches</Text>
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={{ fontSize: 12, color: '#ea580c', fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {searchHistory.map((hist, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.tag, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
                    onPress={() => handleTagPress(hist)}
                    activeOpacity={0.7}>
                    <AppIcon name="time-outline" size={13} color="#64748b" />
                    <Text style={[styles.tagText, { color: '#334155' }]}>{hist}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>🔥 Popular Searches in India</Text>
          <View style={styles.tagContainer}>
            {TRENDING_SEARCHES.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => handleTagPress(tag)}
                activeOpacity={0.7}>
                <AppIcon name="trending-up" size={14} color="#E64A19" />
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default SearchScreen;

