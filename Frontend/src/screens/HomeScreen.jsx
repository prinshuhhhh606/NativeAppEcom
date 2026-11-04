import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './HomeScreen.styles';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import AppIcon from '../components/AppIcon';
import PincodeModal from '../components/PincodeModal';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

// Self-contained memoized Flash Deals countdown timer to prevent root re-renders
const FlashCountdownTimer = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hh = String(timeLeft.hours).padStart(2, '0');
  const mm = String(timeLeft.minutes).padStart(2, '0');
  const ss = String(timeLeft.seconds).padStart(2, '0');

  return (
    <View style={styles.timerBadge}>
      <AppIcon name="time-outline" size={13} color="#F97316" />
      <Text style={styles.timerText}>{`${hh}:${mm}:${ss}`}</Text>
    </View>
  );
});

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 60;
  const { openPincodeModal } = useLocation();
  const { isAuthenticated } = useAuth();

  // State
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('cat_all');
  const [banners, setBanners] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [popularBrands, setPopularBrands] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = useCallback(async (force = false) => {
    try {
      const [
        cats,
        bans,
        trending,
        best,
        news,
        flash,
        top,
        recom,
        sellers,
        brands,
        offers,
      ] = await Promise.all([
        productService.getCategories(force),
        productService.getBanners(force),
        productService.getProducts({ isTrending: true }, force),
        productService.getProducts({ isBestSeller: true }, force),
        productService.getProducts({ isNewArrival: true }, force),
        productService.getFlashDeals(force),
        productService.getTopRatedProducts(force),
        productService.getRecommendedProducts(force),
        productService.getFeaturedSellers(),
        productService.getPopularBrands(),
        productService.getSpecialOffers(),
      ]);

      setCategories(cats || []);
      setBanners(bans || []);
      setTrendingProducts(trending || []);
      setBestSellers(best || []);
      setNewArrivals(news || []);
      setFlashDeals(flash || []);
      setTopRated(top || []);
      setRecommended(recom || []);
      setFeaturedSellers(sellers || []);
      setPopularBrands(brands || []);
      setSpecialOffers(offers || []);

      // Check active live flash sale campaign
      try {
        const liveCampaign = await productService.getActiveFlashSale();
        if (liveCampaign?.products?.length > 0) {
          setFlashDeals(liveCampaign.products);
        }
      } catch (e) {}
    } catch (e) {
      console.warn('Error loading home data', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadRecentlyViewed = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('@appsica_recently_viewed');
      if (raw) {
        setRecentlyViewed(JSON.parse(raw));
      }
      const cloudRecent = await productService.getRecentlyViewed();
      if (Array.isArray(cloudRecent) && cloudRecent.length > 0) {
        setRecentlyViewed(cloudRecent);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Persistent Active Order Check (Restores live tracking session immediately)
  useEffect(() => {
    let isMounted = true;
    const checkActiveOrder = async () => {
      if (isAuthenticated) {
        try {
          const list = await orderService.getOrders();
          const active = list.find((o) =>
            orderService.isOrderActive(o.orderStatus || o.status)
          );
          if (isMounted) setActiveDeliveryOrder(active || null);
        } catch (e) {}
      } else {
        if (isMounted) setActiveDeliveryOrder(null);
      }
    };

    const unsub = navigation.addListener('focus', checkActiveOrder);
    checkActiveOrder();
    return () => {
      isMounted = false;
      unsub();
    };
  }, [navigation, isAuthenticated]);

  useEffect(() => {
    loadHomeData();
    loadRecentlyViewed();
  }, [loadHomeData, loadRecentlyViewed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData(true);
    loadRecentlyViewed();
  }, [loadHomeData, loadRecentlyViewed]);

  const handleCategorySelect = useCallback((catId) => {
    setSelectedCategory(catId);
    navigation.navigate('ProductList', {
      categoryId: catId,
      categoryName: categories.find((c) => c.id === catId)?.name || 'Products',
    });
  }, [categories, navigation]);

  const handleProductPress = useCallback(async (product) => {
    const prodId = product.id || product._id;
    try {
      const raw = await AsyncStorage.getItem('@appsica_recently_viewed');
      let list = raw ? JSON.parse(raw) : [];
      list = [product, ...list.filter((p) => (p.id || p._id) !== prodId)].slice(0, 8);
      await AsyncStorage.setItem('@appsica_recently_viewed', JSON.stringify(list));
      setRecentlyViewed(list);
    } catch (e) {
      // ignore
    }
    navigation.navigate('ProductDetails', { productId: prodId });
  }, [navigation]);

  const handleOfferPress = useCallback((offer) => {
    Alert.alert(
      '🎉 Coupon Applied!',
      `Coupon code "${offer.code}" is ready. You will get ${offer.title} at checkout!`,
      [{ text: 'Great!', style: 'default' }]
    );
  }, []);

  const renderProductItem = useCallback(({ item }) => (
    <View style={styles.horizontalCardWrapper}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
      />
    </View>
  ), [handleProductPress]);

  return (
    <View style={styles.container}>
      {/* 🛍️ AppsicaEcom Top Navigation Header */}
      <Header
        showPincodeBar
        showCart
        showWishlist
        showNotifications
        navigation={navigation}
      />

      {/* Global Interactive Search Bar */}
      <SearchBar
        editable={false}
        onPress={() => navigation.navigate('Search')}
        placeholder="Search sarees, kurtas, earbuds, spices, handicrafts..."
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Active Live Delivery Floating Banner */}
        {activeDeliveryOrder && (
          <TouchableOpacity
            style={{
              marginHorizontal: 16,
              marginTop: 10,
              marginBottom: 10,
              backgroundColor: '#0F172A',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#3B82F6',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('TrackOrder', {
                orderId: activeDeliveryOrder.orderId || activeDeliveryOrder.orderNumber || activeDeliveryOrder._id,
                order: activeDeliveryOrder,
              })
            }>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#1E293B',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                borderWidth: 1,
                borderColor: '#334155',
              }}>
              <AppIcon name="bicycle" size={22} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#10B981',
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: '#10B981',
                    textTransform: 'uppercase',
                  }}>
                  Live Delivery In Progress
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  marginTop: 2,
                }}>
                Order #{activeDeliveryOrder.orderId}
              </Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                {activeDeliveryOrder.deliveryPartner
                  ? `${activeDeliveryOrder.deliveryPartner.name} • ${activeDeliveryOrder.deliveryPartner.vehicleType || 'Bike'}`
                  : (activeDeliveryOrder.orderStatus || 'In transit').replace(/_/g, ' ')}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#2563EB',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
              }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                Track →
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 1. Hero Promotional Carousel Banners */}
        <View style={styles.bannerSection}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {banners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={styles.bannerSlide}
                activeOpacity={0.9}
                onPress={() => {
                  if (banner.id === 'ban_2') {
                    openPincodeModal();
                  } else {
                    navigation.navigate('ProductList', {
                      categoryId: banner.categoryTarget,
                      title: banner.title,
                    });
                  }
                }}>
                <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay}>
                  <View style={styles.bannerTag}>
                    <Text style={styles.bannerTagText}>{banner.tag}</Text>
                  </View>
                  <View>
                    <Text style={styles.bannerTitle} numberOfLines={2}>
                      {banner.title}
                    </Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    <View style={styles.bannerBtn}>
                      <Text style={styles.bannerBtnText}>{banner.buttonText} →</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2. Shop by Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.sectionTitle}>Shop by Category</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Handpicked authentic Indian crafts & essentials</Text>
            </View>
            <TouchableOpacity style={styles.seeAllPill} onPress={() => navigation.navigate('CategoryTab')}>
              <Text style={styles.seeAllBtn}>View All →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isSelected={selectedCategory === cat.id}
                onPress={() => handleCategorySelect(cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Pan India Service Assurance Banner */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={openPincodeModal}
          activeOpacity={0.88}>
          <View style={styles.infoIconBox}>
            <AppIcon name="shield-checkmark" size={26} color="#38BDF8" />
          </View>
          <View style={styles.infoTextCol}>
            <View style={styles.infoTitleRow}>
              <Text style={styles.infoTitle}>Pan India Delivery Guarantee</Text>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>28 STATES</Text>
              </View>
            </View>
            <Text style={styles.infoSubtitle}>
              Direct delivery across all 28 states & 8 UTs • Live tracking enabled
            </Text>
            <Text style={styles.infoActionText}>Tap to check your delivery pincode speed →</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Flash Deals with Live Countdown Timer */}
        <View style={styles.flashSection}>
          <View style={styles.flashHeader}>
            <View style={styles.flashTitleRow}>
              <View style={styles.flashIconPill}>
                <AppIcon name="flash" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.flashTitle}>Flash Deals</Text>
              <FlashCountdownTimer />
            </View>
            <TouchableOpacity
              style={styles.seeAllPill}
              onPress={() =>
                navigation.navigate('ProductList', { filter: 'flash', title: 'Flash Deals' })
              }>
              <Text style={[styles.seeAllBtn, { color: '#C2410C' }]}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={flashDeals}
            keyExtractor={(item) => `flash_${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderProductItem}
          />
        </View>

        {/* 4. Trending Products Across India */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.sectionTitle}>Trending Across India</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Most loved items this week</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllPill}
              onPress={() =>
                navigation.navigate('ProductList', { filter: 'trending', title: 'Trending Products' })
              }>
              <Text style={styles.seeAllBtn}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={trendingProducts}
            keyExtractor={(item) => `trend_${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderProductItem}
          />
        </View>

        {/* 5. Featured Multi-Vendor Sellers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#7C3AED' }]} />
                <Text style={styles.sectionTitle}>Featured Sellers & Artisans</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Verified multi-vendor partners from across India</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {featuredSellers.map((seller) => (
              <TouchableOpacity
                key={seller.id}
                style={styles.sellerCard}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('ProductList', {
                    sellerId: seller.id,
                    title: seller.name,
                  })
                }>
                <Image source={{ uri: seller.banner }} style={styles.sellerBanner} />
                <View style={styles.sellerBody}>
                  <View style={styles.sellerLogoRow}>
                    <Image source={{ uri: seller.logo }} style={styles.sellerLogo} />
                    <View style={styles.verifiedPill}>
                      <AppIcon name="checkmark-circle" size={13} color="#059669" />
                      <Text style={styles.verifiedText}>Verified Store</Text>
                    </View>
                  </View>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {seller.name}
                  </Text>
                  <Text style={styles.sellerSpecialty} numberOfLines={2}>
                    {seller.specialty}
                  </Text>
                  <View style={styles.sellerFooter}>
                    <View style={styles.sellerRating}>
                      <AppIcon name="star" size={13} color="#15803D" />
                      <Text style={styles.sellerRatingText}>
                        {seller.rating} ({seller.reviewCount})
                      </Text>
                    </View>
                    <Text style={styles.sellerCity}>📍 {seller.city}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6. Best Sellers Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#059669' }]} />
                <Text style={styles.sectionTitle}>Best Sellers</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Customer favorites with 4.5+ ★ ratings</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllPill}
              onPress={() =>
                navigation.navigate('ProductList', { filter: 'bestSeller', title: 'Best Sellers' })
              }>
              <Text style={styles.seeAllBtn}>See All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridContainer}>
            {bestSellers.slice(0, 4).map((item) => (
              <ProductCard
                key={`best_${item.id}`}
                product={item}
                onPress={() => handleProductPress(item)}
              />
            ))}
          </View>
        </View>

        {/* 7. Special Offers & Bank Discounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#DB2777' }]} />
                <Text style={styles.sectionTitle}>Special Offers & Bank Deals</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Tap code to apply coupon at checkout</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {specialOffers.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={[styles.offerCard, { backgroundColor: offer.color || '#2563EB' }]}
                activeOpacity={0.85}
                onPress={() => handleOfferPress(offer)}>
                <View>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDesc}>{offer.description}</Text>
                </View>
                <View style={styles.offerCodeRow}>
                  <Text style={styles.offerCode}>{offer.code}</Text>
                  <Text style={styles.offerTapText}>TAP TO APPLY 🏷️</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 8. Fresh New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#0284C7' }]} />
                <Text style={styles.sectionTitle}>Fresh New Arrivals</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Handcrafted products added today</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllPill}
              onPress={() =>
                navigation.navigate('ProductList', { filter: 'newArrival', title: 'New Arrivals' })
              }>
              <Text style={styles.seeAllBtn}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={newArrivals}
            keyExtractor={(item) => `new_${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderProductItem}
          />
        </View>

        {/* 9. Top Rated Products (4.7+ Rating Badge) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.sectionTitle}>Top Rated Gems ⭐</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Highest customer satisfaction scores</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllPill}
              onPress={() =>
                navigation.navigate('ProductList', { filter: 'topRated', title: 'Top Rated' })
              }>
              <Text style={styles.seeAllBtn}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={topRated}
            keyExtractor={(item) => `top_${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderProductItem}
          />
        </View>

        {/* 10. Recommended for You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.sectionTitle}>Recommended For You</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Tailored to your browsing taste</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllPill}
              onPress={() =>
                navigation.navigate('ProductList', { filter: 'recommended', title: 'Recommended' })
              }>
              <Text style={styles.seeAllBtn}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={recommended}
            keyExtractor={(item) => `rec_${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderProductItem}
          />
        </View>

        {/* 11. Popular Brands */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.sectionTitle}>Popular Brands</Text>
              </View>
              <Text style={styles.sectionSubtitle}>India's most trusted household labels</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {popularBrands.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.brandCard}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ProductList', {
                    query: b.name,
                    title: b.name,
                  })
                }>
                <View style={styles.brandEmojiBox}>
                  <Text style={styles.brandEmoji}>{b.logo}</Text>
                </View>
                <Text style={styles.brandName} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={styles.brandDiscount}>{b.discount}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 12. Why Shop With Us (Trust Grid) */}
        <View style={styles.trustSection}>
          <View style={styles.trustGrid}>
            <View style={[styles.trustCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <AppIcon name="paper-plane" size={17} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.trustTitle}>Free Shipping</Text>
                <Text style={styles.trustDesc}>Orders over ₹499</Text>
              </View>
            </View>

            <View style={[styles.trustCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <AppIcon name="shield-checkmark" size={17} color="#9333EA" />
              </View>
              <View>
                <Text style={styles.trustTitle}>100% Genuine</Text>
                <Text style={styles.trustDesc}>Verified artisans</Text>
              </View>
            </View>

            <View style={[styles.trustCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon name="sync" size={17} color="#D97706" />
              </View>
              <View>
                <Text style={styles.trustTitle}>7 Days Return</Text>
                <Text style={styles.trustDesc}>Hassle-free refunds</Text>
              </View>
            </View>

            <View style={[styles.trustCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <AppIcon name="call" size={17} color="#059669" />
              </View>
              <View>
                <Text style={styles.trustTitle}>24/7 Support</Text>
                <Text style={styles.trustDesc}>Toll-free helpline</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 12. Recently Viewed Products (if any) */}
        {recentlyViewed && recentlyViewed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recently Viewed</Text>
                <Text style={styles.sectionSubtitle}>Jump back into items you checked out</Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  await AsyncStorage.removeItem('@appsica_recently_viewed');
                  setRecentlyViewed([]);
                }}>
                <Text style={[styles.seeAllBtn, { color: '#9E9E9E' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={recentlyViewed}
              keyExtractor={(item) => `recent_${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={3}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={renderProductItem}
            />
          </View>
        )}
      </ScrollView>

      {/* Interactive Pan India PIN code checker modal */}
      <PincodeModal />
    </View>
  );
};

export default HomeScreen;
