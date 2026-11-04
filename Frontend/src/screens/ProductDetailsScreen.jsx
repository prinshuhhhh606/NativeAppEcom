import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './ProductDetailsScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import PincodeModal from '../components/PincodeModal';
import { Colors } from '../constants/colors';
import { formatPrice, calculateDiscount, formatEstimatedDelivery, getImageUrl } from '../utils/helpers';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { questionService } from '../services/questionService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export const ProductDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const productId = route.params?.productId || route.params?.id || route.params?._id;
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [liveReviews, setLiveReviews] = useState([]);
  const [liveQuestions, setLiveQuestions] = useState([]);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { selectedPincode, cityName, openPincodeModal, isServiceable, codAvailable, deliveryDays } =
    useLocation();

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    setLoading(true);
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);

      // Default selected variants
      const initialVar = {};
      if (data.variants?.colors?.length) initialVar.color = data.variants.colors[0];
      if (data.variants?.sizes?.length) initialVar.size = data.variants.sizes[0];
      setSelectedVariant(initialVar);

      // Unblock UI immediately: product is ready for user interaction
      setLoading(false);

      // Parallelize auxiliary secondary data (related items, reviews, questions)
      Promise.allSettled([
        productService.getRelatedProducts(productId, data.categoryId),
        reviewService.getProductReviews(productId),
        questionService.getProductQuestions(productId),
      ]).then(([relRes, revRes, qRes]) => {
        if (relRes.status === 'fulfilled' && relRes.value) {
          setRelated(relRes.value);
        }
        if (revRes.status === 'fulfilled' && revRes.value?.reviews?.length > 0) {
          setLiveReviews(revRes.value.reviews);
        }
        if (qRes.status === 'fulfilled') {
          const list = Array.isArray(qRes.value?.data)
            ? qRes.value.data
            : Array.isArray(qRes.value)
            ? qRes.value
            : [];
          if (list.length > 0) {
            setLiveQuestions(list);
          }
        }
      });

      // Background asynchronous recently-viewed sync
      setTimeout(async () => {
        try {
          const raw = await AsyncStorage.getItem('@appsica_recently_viewed');
          let list = raw ? JSON.parse(raw) : [];
          list = [data, ...list.filter((p) => p.id !== data.id)].slice(0, 8);
          await AsyncStorage.setItem('@appsica_recently_viewed', JSON.stringify(list));
          productService.recordRecentlyViewed(productId).catch(() => {});
        } catch (e) {}
      }, 0);
    } catch (e) {
      Alert.alert('Error', 'Product not found');
      navigation.goBack();
      setLoading(false);
    }
  };

  const handleWriteReview = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to submit a product review.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () =>
              navigation.navigate('Login', {
                redirectTo: 'ProductDetails',
                redirectParams: { productId },
              }),
          },
        ]
      );
      return;
    }

    try {
      const eligibility = await reviewService.checkEligibility(productId);
      if (!eligibility.eligible) {
        Alert.alert(
          'Verified Purchases Only',
          'Only customers who have purchased and received this product can write a verified review.'
        );
        return;
      }

      Alert.prompt(
        'Rate & Review Product',
        'Share your feedback with other customers (Rated 5 Stars):',
        async (comment) => {
          if (!comment || comment.trim().length < 5) {
            Alert.alert('Error', 'Please enter a review of at least 5 characters.');
            return;
          }
          try {
            await reviewService.submitReview({
              productId,
              rating: 5,
              comment: comment.trim(),
            });
            Alert.alert('Thank You', 'Your verified customer review has been submitted!');
            loadProductDetails();
          } catch (err) {
            Alert.alert('Review Error', err.response?.data?.message || 'Could not submit review.');
          }
        }
      );
    } catch (e) {
      Alert.alert('Sign In Required', 'Please log in to submit a verified product review.');
    }
  };

  const handleAskQuestion = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to ask a question.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () =>
              navigation.navigate('Login', {
                redirectTo: 'ProductDetails',
                redirectParams: { productId },
              }),
          },
        ]
      );
      return;
    }

    Alert.prompt(
      'Ask a Question',
      'What would you like to know about this product? The verified seller will answer:',
      async (questionText) => {
        if (!questionText || questionText.trim().length < 5) {
          Alert.alert('Error', 'Please enter a question of at least 5 characters.');
          return;
        }
        try {
          await questionService.askQuestion(productId, questionText.trim());
          Alert.alert('Question Submitted', 'Your question has been sent to the verified seller.');
          loadProductDetails();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Please log in to ask a question.');
        }
      }
    );
  };

  if (loading || !product) {
    return (
      <View style={styles.container}>
        <Header showBack navigation={navigation} />
        <Loading message="Loading product details..." fullScreen />
      </View>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const discountPercent = calculateDiscount(product.originalPrice, product.price);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant, { silent: true });
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required for Checkout',
        'Please login or create an account to complete your order. Your cart items are saved!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In / Register',
            onPress: () => navigation.navigate('Login', { redirectTo: 'Checkout' }),
          },
        ]
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  // Complementary bundle item calculation
  const bundleAddon = related?.[0] || {
    id: 'addon_1',
    name: 'Handcrafted Heritage Matching Pouch',
    price: 349,
    originalPrice: 699,
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300&q=80'],
  };
  const bundleTotalPrice = product.price + bundleAddon.price;
  const bundleSavedAmount =
    (product.originalPrice || product.price) +
    (bundleAddon.originalPrice || bundleAddon.price) -
    bundleTotalPrice;

  const handleAddBundleToCart = () => {
    addToCart(product, quantity, selectedVariant, { silent: true });
    addToCart(bundleAddon, 1, {});
  };

  // Specifications
  const specs = product.specifications || [
    { key: 'Material / Fabric', value: '100% Pure Handwoven Cotton / Silk' },
    { key: 'Pattern / Craft', value: 'Traditional Artisan Hand Block Print' },
    { key: 'Occasion', value: 'Festive, Formal, Traditional & Casual' },
    { key: 'Fit Type', value: 'Regular / Comfort Ethnic Fit' },
    { key: 'Care Instructions', value: 'Dry clean recommended for first wash' },
    { key: 'Country of Origin', value: 'India 🇮🇳 (Bharat)' },
    { key: 'Warranty & Guarantee', value: '7 Days Return & Artisan Authenticity' },
  ];

  // Demo Reviews
  const reviews = [
    {
      id: 'rev_1',
      name: 'Ananya Deshmukh',
      rating: 5,
      date: '2 days ago',
      title: 'Exquisite craftsmanship & super soft material!',
      comment:
        'The weaving quality is magnificent. Delivered safely to Pune in 2 days. The colors are exactly as shown in the picture.',
    },
    {
      id: 'rev_2',
      name: 'Vikram Sengupta',
      rating: 5,
      date: '1 week ago',
      title: 'Proud to support authentic Indian artisans',
      comment:
        'Purchased as an anniversary gift. Packaging was secure with authentic GI tag details. Truly five-star experience from AppsicaEcom.',
    },
  ];

  const displayReviews =
    liveReviews.length > 0
      ? liveReviews.map((r) => ({
          id: r._id,
          name: r.user?.fullName || r.user?.name || 'Verified Customer',
          rating: r.rating,
          date: new Date(r.createdAt).toLocaleDateString('en-IN'),
          title: r.rating >= 4 ? 'Verified Quality Craft' : 'Customer Review',
          comment: r.comment,
          isVerifiedPurchase: r.isVerifiedPurchase !== false,
        }))
      : reviews;

  const rawImages = product.images?.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  ];
  const imagesList = rawImages.map(getImageUrl);

  return (
    <View style={styles.container}>
      <Header title="" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 95 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* 1. Large Image Carousel Gallery */}
        <TouchableOpacity
          style={styles.galleryContainer}
          activeOpacity={0.95}
          onPress={() => setZoomModalVisible(true)}>
          <Image
            source={{ uri: imagesList[selectedImageIndex] }}
            style={styles.galleryImage}
          />
          <View style={styles.zoomHintBadge}>
            <AppIcon name="search" size={11} color="#FFFFFF" />
            <Text style={styles.zoomHintText}>Tap to zoom</Text>
          </View>
          <TouchableOpacity
            style={styles.wishlistFloatBtn}
            onPress={() => {
              if (!isAuthenticated) {
                Alert.alert(
                  'Sign In Required',
                  'Please sign in or create an account to save items to your wishlist.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Sign In',
                      onPress: () =>
                        navigation.navigate('Login', {
                          redirectTo: 'ProductDetails',
                          redirectParams: { productId: product.id },
                        }),
                    },
                  ]
                );
                return;
              }
              toggleWishlist(product);
            }}
            activeOpacity={0.8}>
            <AppIcon
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? Colors.danger : Colors.textMuted}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Image Thumbnails Row */}
        {imagesList.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsContainer}>
            {imagesList.map((img, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.thumbnailItem,
                  i === selectedImageIndex && styles.thumbnailActive,
                ]}
                onPress={() => setSelectedImageIndex(i)}
                activeOpacity={0.8}>
                <Image source={{ uri: img }} style={styles.thumbnailImg} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 2. Basic Info & Pricing */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            <Text style={styles.categoryText}>{product.categoryName}</Text>
            <View style={styles.stockBadge}>
              <AppIcon name="checkmark-circle" size={12} color="#2E7D32" />
              <Text style={styles.stockBadgeText}>In Stock • Ships in 24 hrs</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.subtitle}>{product.subtitle}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{product.rating} ★</Text>
            </View>
            <Text style={styles.reviewCount}>
              ({product.reviewCount} verified customer ratings)
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>
          <Text style={styles.taxInfo}>Inclusive of all Indian taxes & GST • Free Pan-India Shipping above ₹499</Text>
        </View>

        {/* 3. Verified Multi-Vendor Seller Info Card */}
        <View style={styles.sellerSection}>
          <View style={styles.sellerHeader}>
            <View style={styles.sellerLeft}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {(product.seller?.name || 'A')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.sellerTitleRow}>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {product.seller?.name || 'Jaipur Heritage Artisans'}
                  </Text>
                  <AppIcon name="checkmark-circle" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.sellerSubtitle}>
                  {product.seller?.city || 'Jaipur, Rajasthan'} • Verified Vendor (★ 4.9)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.visitStoreBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ProductList', {
                  sellerId: product.seller?.id || 'seller_1',
                  title: product.seller?.name || 'Seller Store',
                })
              }>
              <Text style={styles.visitStoreText}>Visit Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Pan India Trust Badges */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="repeat" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.trustLabel}>7-Day Hassle-Free Returns</Text>
          </View>
          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="shield-checkmark" size={18} color="#2E7D32" />
            </View>
            <Text style={styles.trustLabel}>100% Authentic Indian Craft</Text>
          </View>
          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="cash" size={18} color="#E65100" />
            </View>
            <Text style={styles.trustLabel}>Cash on Delivery</Text>
          </View>
          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <AppIcon name="cube" size={18} color="#6A1B9A" />
            </View>
            <Text style={styles.trustLabel}>Safe Pan-India Transit</Text>
          </View>
        </View>

        {/* 5. Pan India Delivery & Pincode Serviceability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery & Serviceability Check</Text>
          <View style={styles.pincodeBox}>
            <View style={styles.pincodeHeader}>
              <Text style={styles.pincodePrompt}>
                Deliver to: <Text style={{ fontWeight: '700' }}>{cityName} ({selectedPincode})</Text>
              </Text>
              <TouchableOpacity onPress={openPincodeModal}>
                <Text style={styles.changePincode}>Change PIN</Text>
              </TouchableOpacity>
            </View>

            {isServiceable ? (
              <>
                <View style={styles.deliveryStatusRow}>
                  <AppIcon name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.deliveryDateText}>
                    Delivery by {formatEstimatedDelivery(deliveryDays)}
                  </Text>
                </View>
                <Text style={styles.codText}>
                  {codAvailable && product.codAvailable
                    ? '✓ Cash on Delivery (COD) Available for this PIN code'
                    : '⚠ Online Payment only for this destination'}
                </Text>
              </>
            ) : (
              <View style={styles.deliveryStatusRow}>
                <AppIcon name="close-circle" size={18} color={Colors.danger} />
                <Text style={[styles.deliveryDateText, { color: Colors.danger }]}>
                  Delivery not serviceable to PIN code {selectedPincode}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 6. Variant Selectors: Colors */}
        {product.variants?.colors?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Select Color:{' '}
              <Text style={{ color: Colors.primary }}>{selectedVariant.color}</Text>
            </Text>
            <View style={styles.variantRow}>
              {product.variants.colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.variantChip,
                    selectedVariant.color === c && styles.variantChipSelected,
                  ]}
                  onPress={() => setSelectedVariant({ ...selectedVariant, color: c })}>
                  <Text
                    style={[
                      styles.variantChipText,
                      selectedVariant.color === c && styles.variantChipTextSelected,
                    ]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 7. Variant Selectors: Sizes */}
        {product.variants?.sizes?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Select Size:{' '}
              <Text style={{ color: Colors.primary }}>{selectedVariant.size}</Text>
            </Text>
            <View style={styles.variantRow}>
              {product.variants.sizes.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.variantChip,
                    selectedVariant.size === s && styles.variantChipSelected,
                  ]}
                  onPress={() => setSelectedVariant({ ...selectedVariant, size: s })}>
                  <Text
                    style={[
                      styles.variantChipText,
                      selectedVariant.size === s && styles.variantChipTextSelected,
                    ]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 8. Quantity Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <AppIcon name="remove" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => setQuantity(Math.min(10, quantity + 1))}>
              <AppIcon name="add" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 9. Description & Key Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {product.highlights?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Highlights</Text>
            {product.highlights.map((h, i) => (
              <View key={i} style={styles.highlightItem}>
                <View style={styles.highlightBullet} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 10. Technical Specifications Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Specifications</Text>
          <View style={styles.specTable}>
            {specs.map((item, idx) => (
              <View
                key={idx}
                style={[styles.specRow, idx % 2 === 0 ? styles.specRowEven : styles.specRowOdd]}>
                <Text style={styles.specKey}>{item.key}</Text>
                <Text style={styles.specValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 11. Frequently Bought Together Bundle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Bought Together</Text>
          <View style={styles.bundleCard}>
            <View style={styles.bundleItemsRow}>
              <Image source={{ uri: imagesList[0] }} style={styles.bundleThumb} />
              <Text style={styles.bundlePlus}>+</Text>
              <Image
                source={{
                  uri:
                    bundleAddon.images?.[0] ||
                    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=300&q=80',
                }}
                style={styles.bundleThumb}
              />
            </View>
            <View style={styles.bundlePricesRow}>
              <View>
                <Text style={styles.bundleLabel}>Total Bundle Price:</Text>
                <Text style={styles.bundleTotalPrice}>{formatPrice(bundleTotalPrice)}</Text>
              </View>
              {bundleSavedAmount > 0 && (
                <Text style={styles.bundleSaveBadge}>Save {formatPrice(bundleSavedAmount)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.bundleBtn}
              onPress={handleAddBundleToCart}
              activeOpacity={0.85}>
              <Text style={styles.bundleBtnText}>ADD BOTH TO CART (1-CLICK)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 12. Customer Ratings & Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Ratings & Reviews</Text>
          <View style={styles.reviewSummaryRow}>
            <View style={styles.reviewBigScore}>
              <Text style={styles.reviewScoreNum}>{product.rating}</Text>
              <View style={styles.reviewScoreStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <AppIcon key={s} name="star" size={13} color="#F59E0B" />
                ))}
              </View>
              <Text style={styles.reviewScoreCount}>{product.reviewCount} ratings</Text>
            </View>
            <View style={styles.reviewBarsCol}>
              <View style={styles.starBarRow}>
                <Text style={styles.starBarLabel}>5 ★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '80%' }]} />
                </View>
              </View>
              <View style={styles.starBarRow}>
                <Text style={styles.starBarLabel}>4 ★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '15%' }]} />
                </View>
              </View>
              <View style={styles.starBarRow}>
                <Text style={styles.starBarLabel}>3 ★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '5%' }]} />
                </View>
              </View>
            </View>
          </View>

          {displayReviews.map((rev) => (
            <View key={rev.id} style={styles.userReviewCard}>
              <View style={styles.userReviewHeader}>
                <Text style={styles.userReviewName}>{rev.name}</Text>
                {rev.isVerifiedPurchase && (
                  <View style={styles.verifiedBuyerBadge}>
                    <AppIcon name="checkmark-circle" size={12} color={Colors.success} />
                    <Text style={styles.verifiedBuyerText}>Verified Buyer</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary }}>
                {rev.title}
              </Text>
              <Text style={styles.userReviewComment}>{rev.comment}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.bundleBtn, { marginTop: 12, backgroundColor: '#EA580C' }]}
            onPress={handleWriteReview}
            activeOpacity={0.85}>
            <Text style={styles.bundleBtnText}>⭐ RATE & WRITE A REVIEW</Text>
          </TouchableOpacity>
        </View>

        {/* 12b. Product Questions & Answers (Q&A) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Questions & Answers</Text>
            <TouchableOpacity onPress={handleAskQuestion}>
              <Text style={{ color: '#EA580C', fontWeight: '800', fontSize: 13 }}>+ Ask Question</Text>
            </TouchableOpacity>
          </View>
          {liveQuestions.length === 0 ? (
            <Text style={{ color: '#64748B', fontSize: 13, marginVertical: 8 }}>
              Have questions about this handcrafted product? Tap "+ Ask Question" and the verified seller will respond.
            </Text>
          ) : (
            liveQuestions.map((q) => (
              <View key={q._id || q.id} style={[styles.userReviewCard, { borderLeftWidth: 3, borderLeftColor: '#EA580C' }]}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>Q: {q.question}</Text>
                {q.answer ? (
                  <View style={{ marginTop: 6, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A', marginBottom: 2 }}>
                      ✓ Answered by Verified Seller
                    </Text>
                    <Text style={{ fontSize: 12, color: '#334155' }}>A: {q.answer}</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Pending seller reply...</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* 13. Related Products */}
        {related.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Products You May Like</Text>
            <FlatList
              horizontal
              data={related}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ marginRight: 14 }}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.push('ProductDetails', { productId: item.id })}
                  />
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal visible={zoomModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setZoomModalVisible(false)}>
            <AppIcon name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: imagesList[selectedImageIndex] }}
            style={styles.zoomImage}
          />
        </View>
      </Modal>

      {/* Bottom Sticky Action Buttons */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <CustomButton
          title="Add to Cart"
          variant="outline"
          size="large"
          iconLeft="cart-outline"
          onPress={handleAddToCart}
          style={styles.cartBtn}
        />
        <CustomButton
          title="Buy Now"
          variant="primary"
          size="large"
          onPress={handleBuyNow}
          style={styles.buyNowBtn}
        />
      </View>

      <PincodeModal />
    </View>
  );
};

export default ProductDetailsScreen;
