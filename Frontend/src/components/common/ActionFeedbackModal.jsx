/**
 * ActionFeedbackModal
 * Premium animated popup for Add to Cart and Wishlist actions
 * Features smooth spring-scale entry, green checkmark animation, heart pulse animation,
 * thumbnail preview, and "Continue Shopping" vs "View Cart" actions.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useActionFeedback } from '../../context/ActionFeedbackContext';
import { navigateToCart } from '../../navigation/navigationRef';
import { formatPrice, getThumbnailUrl } from '../../utils/helpers';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export const ActionFeedbackModal = () => {
  const { feedback, hideFeedback } = useActionFeedback();
  const { visible, type, product, title, subtitle, isAdded } = feedback;

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Reset anims
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0.4);

      // Card entrance animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon pop / pulse animation
      if (type === 'wishlist') {
        Animated.sequence([
          Animated.timing(iconScaleAnim, {
            toValue: 1.4,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 70,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, type]);

  if (!visible) return null;

  const isCart = type === 'cart';
  const isWishlist = type === 'wishlist';
  const isError = type === 'error';

  const handleViewCart = () => {
    hideFeedback();
    navigateToCart();
  };

  const imageSource = product
    ? { uri: getThumbnailUrl(product.images?.[0] || product.image, 160) }
    : null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={hideFeedback}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={hideFeedback}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <TouchableOpacity activeOpacity={1} style={styles.cardInner}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={hideFeedback}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppIcon name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Header with Animated Icon */}
            <View style={styles.headerRow}>
              <Animated.View
                style={[
                  styles.iconCircle,
                  isCart && styles.iconCircleSuccess,
                  isWishlist && (isAdded ? styles.iconCircleWishlist : styles.iconCircleWishlistRemoved),
                  isError && styles.iconCircleError,
                  { transform: [{ scale: iconScaleAnim }] },
                ]}>
                {isCart && (
                  <AppIcon name="checkmark-circle" size={26} color="#10B981" />
                )}
                {isWishlist && (
                  <AppIcon
                    name={isAdded ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isAdded ? '#EF4444' : '#64748B'}
                  />
                )}
                {isError && (
                  <AppIcon name="close-circle" size={26} color="#EF4444" />
                )}
              </Animated.View>

              <View style={styles.titleCol}>
                <Text
                  style={[
                    styles.titleText,
                    isCart && styles.titleSuccess,
                    isWishlist && (isAdded ? styles.titleWishlist : styles.titleMuted),
                    isError && styles.titleError,
                  ]}
                  numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            </View>

            {/* Product Snapshot (if product exists) */}
            {product && (
              <View style={styles.productSnapshot}>
                {imageSource && (
                  <Image source={imageSource} style={styles.thumbnail} />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name || product.productName}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                      {formatPrice(product.discountPrice || product.price)}
                    </Text>
                    {product.originalPrice && product.originalPrice > (product.discountPrice || product.price) && (
                      <Text style={styles.originalPrice}>
                        {formatPrice(product.originalPrice)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Actions for Cart */}
            {isCart && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={hideFeedback}
                  activeOpacity={0.7}>
                  <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleViewCart}
                  activeOpacity={0.8}>
                  <AppIcon name="cart" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.primaryBtnText}>View Cart</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: Math.min(width - 36, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardInner: {
    padding: 18,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 28,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  iconCircleWishlist: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  iconCircleWishlistRemoved: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  iconCircleError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  titleCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  titleSuccess: {
    color: '#059669',
  },
  titleWishlist: {
    color: '#E11D48',
  },
  titleMuted: {
    color: '#475569',
  },
  titleError: {
    color: '#DC2626',
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748B',
  },
  productSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  originalPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ActionFeedbackModal;

