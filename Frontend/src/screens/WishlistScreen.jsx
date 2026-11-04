import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './WishlistScreen.styles';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export const WishlistScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 60;
  const { wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.container}>
      <Header title="My Wishlist" navigation={navigation} showWishlist={false} />

      {!isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="heart-outline" size={72} color={Colors.primary} />
          <Text style={styles.emptyTitle}>Sign In to View Your Wishlist</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite Indian handlooms, tech gadgets, and spices to purchase later across all your devices.
          </Text>
          <CustomButton
            title="Sign In / Register"
            size="large"
            onPress={() =>
              navigation.navigate('Login', {
                redirectTo: 'MainApp',
                redirectParams: { screen: 'WishlistTab' },
              })
            }
            style={styles.exploreBtn}
          />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="heart-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite Indian handlooms, tech gadgets, and spices to purchase later.
          </Text>
          <CustomButton
            title="Explore Products"
            size="medium"
            onPress={() => navigation.navigate('HomeTab')}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 },
          ]}>
          {wishlistItems.map((item) => {
            const prodId = item.id || item._id;
            return (
              <ProductCard
                key={prodId}
                product={item}
                onPress={() => navigation.navigate('ProductDetails', { productId: prodId })}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default WishlistScreen;

