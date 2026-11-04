import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from './ProductCard.styles';
import { Colors } from '../constants/colors';
import { formatPrice, calculateDiscount, getImageUrl, getThumbnailUrl } from '../utils/helpers';
import AppIcon from './AppIcon';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const ProductCard = React.memo(({ product, onPress, onAddToCart, style, isFavorited: propIsFavorited }) => {
  const navigation = useNavigation();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!product) return null;

  const discountPercent = calculateDiscount(product.originalPrice, product.price);
  const prodId = product.id || product._id;
  const isFavorited = propIsFavorited !== undefined ? propIsFavorited : isInWishlist(prodId);

  const handleWishlistPress = useCallback((e) => {
    e?.stopPropagation?.();
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to save items to your wishlist.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    toggleWishlist(product);
  }, [isAuthenticated, navigation, toggleWishlist, product]);

  const handleAddPress = useCallback((e) => {
    e?.stopPropagation?.();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product, 1);
    }
  }, [onAddToCart, addToCart, product]);

  const imageUri = useMemo(() => getThumbnailUrl(product.images?.[0], 360), [product.images]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, style]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          fadeDuration={120}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' }}
        />

        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleWishlistPress}
          activeOpacity={0.7}>
          <AppIcon
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorited ? Colors.danger : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.category} numberOfLines={1}>
          {product.categoryName || 'General'}
        </Text>

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{product.rating || '4.5'}</Text>
            <AppIcon name="star" size={10} color="#2E7D32" />
          </View>
          <Text style={styles.reviewsCount}>
            ({product.reviewCount || 40})
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.originalPrice && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>
              {formatPrice(product.originalPrice)}
            </Text>
          )}
        </View>

        <Text style={styles.deliveryText} numberOfLines={1}>
          🚚 Free Delivery above ₹499
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPress}
          activeOpacity={0.7}>
          <AppIcon name="add" size={14} color={Colors.primaryDark} />
          <Text style={styles.addButtonText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default ProductCard;

