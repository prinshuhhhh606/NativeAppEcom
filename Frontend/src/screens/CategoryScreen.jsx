import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './CategoryScreen.styles';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import { productService } from '../services/productService';

export const CategoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 60;
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productService.getCategories().then(setCategories);
  }, []);

  const handleCategoryPress = (category) => {
    navigation.navigate('ProductList', {
      categoryId: category.id || category._id,
      categoryName: category.name,
    });
  };

  return (
    <View style={styles.container}>
      <Header title="All Categories" navigation={navigation} />

      <FlatList
        data={categories}
        keyExtractor={(item) => (item.id || item._id || item.slug || Math.random()).toString()}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleCategoryPress(item)}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.count}>{item.itemCount}+ Products</Text>
              {item.highlight && (
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightText}>{item.highlight}</Text>
                </View>
              )}
            </View>
            <AppIcon
              name="chevron-forward"
              size={20}
              color="#9E9E9E"
              style={styles.chevron}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default CategoryScreen;

