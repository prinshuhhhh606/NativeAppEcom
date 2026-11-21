/**
 * Product & Category Service with Multi-Vendor Capabilities
 * Supports Pan India catalog, flash deals, featured sellers, and product normalizer.
 */
import api from './api';
import { PRODUCTS, PROMOTIONAL_BANNERS } from '../models/productModel';
import { CATEGORIES } from '../models/categoryModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

export const FEATURED_SELLERS = [
  {
    id: 'seller_1',
    name: 'Jaipur Heritage Handlooms',
    slug: 'jaipur-handlooms',
    city: 'Jaipur, Rajasthan',
    rating: 4.9,
    reviewCount: 1420,
    badge: 'Top Rated Vendor',
    logo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80',
    specialty: 'Pure Bandhani Silk, Bagru Block Prints & Jaipuri AC Quilts',
  },
  {
    id: 'seller_2',
    name: 'Banaras Silk Weavers Guild',
    slug: 'banaras-silks',
    city: 'Varanasi, Uttar Pradesh',
    rating: 4.8,
    reviewCount: 980,
    badge: 'GI Tag Verified',
    logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    specialty: 'Authentic Katan Silk, Zari Brocades & Hand-dyed Dupattas',
  },
  {
    id: 'seller_3',
    name: 'Kutch Kutumb Handicrafts',
    slug: 'kutch-crafts',
    city: 'Bhuj, Gujarat',
    rating: 4.7,
    reviewCount: 650,
    badge: 'Artisan Cooperative',
    logo: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    specialty: 'Mirror Embroidered Shawls, Terracotta Pottery & Bell Crafts',
  },
];

export const POPULAR_BRANDS = [
  { id: 'b1', name: 'FabIndia', category: 'Ethnic Wear', discount: 'Up to 40% OFF', logo: '🏮' },
  { id: 'b2', name: 'Manyavar', category: 'Wedding Couture', discount: 'Min 30% OFF', logo: '👑' },
  { id: 'b3', name: 'Biba', category: 'Women Kurtas', discount: 'Flat 50% OFF', logo: '👗' },
  { id: 'b4', name: 'Titan', category: 'Watches', discount: 'Up to 35% OFF', logo: '⌚' },
  { id: 'b5', name: 'Khadi Gram', category: 'Organic Textiles', discount: 'Special ₹499 Store', logo: '🌿' },
  { id: 'b6', name: 'Boat', category: 'Audio & Gadgets', discount: 'Up to 60% OFF', logo: '🎧' },
];

export const SPECIAL_OFFERS = [
  {
    id: 'off_1',
    title: 'HDFC & SBI Bank Offer',
    description: 'Instant 10% Discount on Credit & Debit Cards up to ₹1,500',
    code: 'BANK10',
    color: '#1565C0',
  },
  {
    id: 'off_2',
    title: 'Flat ₹200 Cashback via UPI',
    description: 'Valid on Google Pay, PhonePe, Paytm on orders above ₹999',
    code: 'UPI200',
    color: '#2E7D32',
  },
  {
    id: 'off_3',
    title: 'Free Express Shipping Across India',
    description: 'Automatic waiver on orders above ₹499 to 19,000+ PIN codes',
    code: 'FREESHIP',
    color: '#E64A19',
  },
];

const HOME_CACHE_STORAGE_KEY = '@appsica_home_feed_v3';

export async function getCachedHomeDataFromDisk() {
  try {
    const raw = await AsyncStorage.getItem(HOME_CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function saveCachedHomeDataToDisk(data) {
  try {
    if (data && typeof data === 'object') {
      await AsyncStorage.setItem(HOME_CACHE_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    // ignore
  }
}

export function prefetchHomeImages(banners = [], categories = []) {
  try {
    if (Array.isArray(banners)) {
      banners.forEach((b) => {
        if (b?.image) Image.prefetch(b.image).catch(() => {});
      });
    }
    if (Array.isArray(categories)) {
      categories.forEach((c) => {
        if (c?.image) Image.prefetch(c.image).catch(() => {});
      });
    }
  } catch (e) {}
}

// In-memory cache & in-flight request deduplication
const memoryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

async function cachedFetch(key, fetcher, ttl = DEFAULT_CACHE_TTL, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  // Deduplicate in-flight promises so concurrent requests share one network call
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      memoryCache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Normalizes raw product object from either MongoDB API or local dataset
 */
export function normalizeProduct(raw) {
  if (!raw) return null;
  const id = raw.id || (raw._id ? raw._id.toString() : `prod_${Math.random()}`);
  const name = raw.name || raw.productName || 'Premium Product';
  const price = Number(raw.price) || 999;
  const originalPrice = Number(raw.originalPrice) || Math.round(price * 1.35);

  let images = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images;
  } else if (raw.image) {
    images = [raw.image];
  } else {
    images = ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80'];
  }

  const categoryName =
    raw.categoryName ||
    (typeof raw.category === 'object' && raw.category ? raw.category.name : '') ||
    'Ethnic Wear';

  const categoryId =
    raw.categoryId ||
    (typeof raw.category === 'object' && raw.category ? raw.category._id : raw.category) ||
    'cat_handloom';

  const sellerInfo = raw.seller && typeof raw.seller === 'object'
    ? {
        name: raw.seller.storeName || raw.seller.businessName || raw.seller.name || 'Jaipur Handlooms',
        id: raw.seller._id || raw.seller.id,
        city: raw.seller.address?.city || 'Jaipur',
        state: raw.seller.address?.state || 'Rajasthan',
        rating: 4.8,
        isVerified: true,
      }
    : {
        name: raw.brand || 'Jaipur Handlooms',
        city: 'Jaipur',
        state: 'Rajasthan',
        rating: 4.8,
        isVerified: true,
      };

  return {
    ...raw,
    id,
    _id: raw._id || id,
    name,
    productName: name,
    subtitle: raw.subtitle || `Authentic ${categoryName} curated by artisan vendors`,
    categoryId,
    categoryName,
    price,
    originalPrice,
    rating: raw.rating !== undefined ? Number(raw.rating) : (Number(raw.ratings) || 4.7),
    reviewCount: raw.reviewCount !== undefined ? Number(raw.reviewCount) : (Number(raw.reviewsCount) || Number(raw.numOfReviews) || 38),
    inStock: raw.inStock !== undefined ? raw.inStock : (raw.stock !== undefined ? raw.stock > 0 : true),
    stockCount: raw.stockCount !== undefined ? raw.stockCount : (raw.stock !== undefined ? raw.stock : 20),
    images,
    brand: raw.brand || sellerInfo.name,
    seller: sellerInfo,
    description:
      raw.description ||
      'Carefully tailored with superior premium fabrics and traditional artisan motifs. Delivers comfort, luxury elegance, and cultural authenticity.',
    highlights: raw.highlights?.length
      ? raw.highlights
      : [
          'Authentic Certified Craftsmanship',
          'Premium export quality fabric',
          'Free Pan-India Delivery on orders above ₹499',
          '7-Day Easy Return & Replacement Guarantee',
        ],
    variants: raw.variants || {
      colors: ['Crimson Red', 'Royal Blue', 'Emerald Green'],
      sizes: ['Free Size', 'M', 'L', 'XL'],
    },
    specifications: raw.specifications || [
      { label: 'Material', value: '100% Pure Silk / Combed Cotton' },
      { label: 'Origin', value: 'Jaipur, Rajasthan, India' },
      { label: 'Care', value: 'Dry Clean Only / Gentle Hand Wash' },
      { label: 'HSN Code', value: raw.hsnCode || '5208' },
      { label: 'GST Slab', value: `${raw.gstPercentage || 5}%` },
    ],
    codAvailable: raw.codAvailable ?? true,
    transitDays: raw.transitDays || 3,
    isTrending: raw.isTrending ?? true,
    isBestSeller: raw.isBestSeller ?? false,
    isNewArrival: raw.isNewArrival ?? false,
  };
}

// Instant synchronous fallback data for 0-second home screen render
const _initialProducts = PRODUCTS.map(normalizeProduct);
export const DEFAULT_HOME_FEED = {
  categories: CATEGORIES,
  banners: PROMOTIONAL_BANNERS,
  trending: _initialProducts.filter((p) => p.isTrending),
  bestSellers: _initialProducts.filter((p) => p.isBestSeller),
  newArrivals: _initialProducts.filter((p) => p.isNewArrival),
  specialOffers: SPECIAL_OFFERS,
  featuredSellers: FEATURED_SELLERS,
  popularBrands: POPULAR_BRANDS,
  flashDeals: _initialProducts.slice(0, 4).map((p, idx) => ({
    ...p,
    flashDiscount: 50 + idx * 5,
    flashPrice: Math.round(p.price * 0.7),
    claimedPercent: 65 + idx * 8,
  })),
  topRated: _initialProducts.filter((p) => p.rating >= 4.6).slice(0, 6),
  recommended: _initialProducts.slice(1, 7),
};

export const productService = {
  /**
   * Clear in-memory product cache
   */
  clearCache() {
    memoryCache.clear();
  },

  /**
   * Get all categories (Cached 5 minutes)
   */
  async getCategories(forceRefresh = false) {
    return cachedFetch('categories_all', async () => {
      try {
        const response = await api.get('/categories');
        const list = response.data || response;
        if (Array.isArray(list) && list.length > 0) {
          return list.map((c) => ({
            ...c,
            id: c.id || c._id?.toString() || c.slug,
            name: c.name,
            image: c.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80',
          }));
        }
        return CATEGORIES;
      } catch (e) {
        return CATEGORIES;
      }
    }, 5 * 60 * 1000, forceRefresh);
  },

  /**
   * Get products with optional filter params (categoryId, search, sort, isTrending, page, limit, etc.)
   */
  async getProducts(params = {}, forceRefresh = false) {
    const key = `products_${JSON.stringify(params)}`;
    return cachedFetch(
      key,
      async () => {
        try {
          const response = await api.get('/products', { params });
          const rawList = Array.isArray(response.data)
            ? response.data
            : response.data?.products || response.products || response;
          const meta = response.meta || response.pagination || {};

          let normalized = [];
          if (Array.isArray(rawList) && rawList.length > 0) {
            normalized = rawList.map(normalizeProduct);
          } else if (!params.search && !params.query && !params.categoryId && !params.page) {
            normalized = PRODUCTS.map(normalizeProduct);
          }

          normalized.meta = {
            page: Number(meta.page || params.page || 1),
            limit: Number(meta.limit || params.limit || 20),
            total: Number(meta.total || normalized.length),
            pages: Number(meta.pages || Math.ceil((meta.total || normalized.length) / (meta.limit || 20))),
            hasMore: meta.page && meta.pages ? meta.page < meta.pages : false,
          };

          return normalized;
        } catch (e) {
          let filtered = PRODUCTS.map(normalizeProduct);

          if (params.categoryId && params.categoryId !== 'cat_all') {
            filtered = filtered.filter((p) => p.categoryId === params.categoryId);
          }

          if (params.query || params.search) {
            const q = (params.query || params.search).toLowerCase().trim();
            filtered = filtered.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.categoryName.toLowerCase().includes(q) ||
                p.subtitle.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            );
          }

          if (params.isTrending) filtered = filtered.filter((p) => p.isTrending);
          if (params.isBestSeller) filtered = filtered.filter((p) => p.isBestSeller);
          if (params.isNewArrival) filtered = filtered.filter((p) => p.isNewArrival);

          filtered.meta = {
            page: 1,
            limit: filtered.length,
            total: filtered.length,
            pages: 1,
            hasMore: false,
          };

          return filtered;
        }
      },
      DEFAULT_CACHE_TTL,
      forceRefresh
    );
  },

  /**
   * Get Consolidated Home Feed in 1 fast network trip (Cached 2 minutes)
   */
  async getHomeFeed(forceRefresh = false) {
    return cachedFetch(
      'home_feed_all_v3',
      async () => {
        try {
          const response = await api.get('/products/home-feed', { timeout: 4000 });
          const data = response.data || response;
          if (data && typeof data === 'object') {
            const trending = Array.isArray(data.trending) && data.trending.length > 0
              ? data.trending.map(normalizeProduct)
              : DEFAULT_HOME_FEED.trending;
            const bestSellers = Array.isArray(data.bestSellers) && data.bestSellers.length > 0
              ? data.bestSellers.map(normalizeProduct)
              : DEFAULT_HOME_FEED.bestSellers;
            const newArrivals = Array.isArray(data.newArrivals) && data.newArrivals.length > 0
              ? data.newArrivals.map(normalizeProduct)
              : DEFAULT_HOME_FEED.newArrivals;
            const specialOffers = Array.isArray(data.specialOffers) && data.specialOffers.length > 0
              ? data.specialOffers.map(normalizeProduct)
              : SPECIAL_OFFERS;
            const banners = Array.isArray(data.banners) && data.banners.length > 0
              ? data.banners
              : PROMOTIONAL_BANNERS;

            const result = {
              trending,
              bestSellers,
              newArrivals,
              specialOffers,
              banners,
              featured: data.featured || [],
            };

            // Pre-seed individual cache entries so subsequent category/listing transitions hit instant memory cache
            memoryCache.set(`products_${JSON.stringify({ isTrending: true })}`, {
              data: result.trending,
              timestamp: Date.now(),
            });
            memoryCache.set(`products_${JSON.stringify({ isBestSeller: true })}`, {
              data: result.bestSellers,
              timestamp: Date.now(),
            });
            memoryCache.set(`products_${JSON.stringify({ isNewArrival: true })}`, {
              data: result.newArrivals,
              timestamp: Date.now(),
            });

            return result;
          }
          return DEFAULT_HOME_FEED;
        } catch (e) {
          // Instant resilient return - no blocking or repeated failing calls
          return DEFAULT_HOME_FEED;
        }
      },
      2 * 60 * 1000,
      forceRefresh
    );
  },

  /**
   * Fast Unified Home Feed: Combines categories, banners, and home products in 1 fast pass
   * Saves to disk cache and triggers image prefetching
   */
  async getFastUnifiedHomeFeed(forceRefresh = false) {
    try {
      const [cats, bans, feed] = await Promise.all([
        this.getCategories(forceRefresh),
        this.getBanners(forceRefresh),
        this.getHomeFeed(forceRefresh),
      ]);

      const trending = feed?.trending?.length ? feed.trending : DEFAULT_HOME_FEED.trending;
      const bestSellers = feed?.bestSellers?.length ? feed.bestSellers : DEFAULT_HOME_FEED.bestSellers;
      const newArrivals = feed?.newArrivals?.length ? feed.newArrivals : DEFAULT_HOME_FEED.newArrivals;
      const specialOffers = feed?.specialOffers?.length ? feed.specialOffers : SPECIAL_OFFERS;
      const finalBanners = bans?.length ? bans : (feed?.banners?.length ? feed.banners : PROMOTIONAL_BANNERS);

      const flashDeals = trending.slice(0, 4).map((p, idx) => ({
        ...p,
        flashDiscount: 50 + idx * 5,
        flashPrice: Math.round(p.price * 0.7),
        claimedPercent: 65 + idx * 8,
      }));
      const topRated = bestSellers.slice(0, 6);
      const recommended = newArrivals.slice(0, 6);

      const consolidated = {
        categories: cats?.length ? cats : CATEGORIES,
        banners: finalBanners,
        trending,
        bestSellers,
        newArrivals,
        specialOffers,
        featuredSellers: FEATURED_SELLERS,
        popularBrands: POPULAR_BRANDS,
        flashDeals,
        topRated,
        recommended,
      };

      // Persist to disk cache
      saveCachedHomeDataToDisk(consolidated);

      // Prefetch images into OS disk/memory cache for instant rendering
      prefetchHomeImages(finalBanners, cats);

      return consolidated;
    } catch (e) {
      return DEFAULT_HOME_FEED;
    }
  },

  /**
   * Get product details by ID (Cached 5 minutes)
   */
  async getProductById(id, forceRefresh = false) {
    const key = `product_detail_${id}`;
    return cachedFetch(key, async () => {
      try {
        const response = await api.get(`/products/${id}`);
        const raw = response.data?.product || response.data || response;
        return normalizeProduct(raw);
      } catch (e) {
        const product = PRODUCTS.find((p) => p.id === id || p._id === id);
        if (!product) throw { message: 'Product not found' };
        return normalizeProduct(product);
      }
    }, 5 * 60 * 1000, forceRefresh);
  },

  /**
   * Get related products
   */
  async getRelatedProducts(productId, categoryId) {
    const key = `related_${productId}_${categoryId || ''}`;
    return cachedFetch(key, async () => {
      try {
        const response = await api.get(`/products/${productId}/related`);
        const rawList = response.data?.products || response.data;
        if (Array.isArray(rawList) && rawList.length > 0) {
          return rawList.map(normalizeProduct);
        }
        return PRODUCTS.filter(
          (p) => p.id !== productId && (!categoryId || p.categoryId === categoryId)
        ).slice(0, 4).map(normalizeProduct);
      } catch (e) {
        return PRODUCTS.filter(
          (p) => p.id !== productId && (!categoryId || p.categoryId === categoryId)
        ).slice(0, 4).map(normalizeProduct);
      }
    }, 5 * 60 * 1000);
  },

  /**
   * Get Flash Deals with end time
   */
  async getFlashDeals(forceRefresh = false) {
    return cachedFetch('flash_deals', async () => {
      const feed = await this.getHomeFeed(forceRefresh).catch(() => null);
      const all = feed?.trending?.length ? feed.trending : await this.getProducts({ limit: 8 }, forceRefresh);
      return all.slice(0, 4).map((p, idx) => ({
        ...p,
        flashDiscount: 50 + idx * 5,
        flashPrice: Math.round(p.price * 0.7),
        claimedPercent: 65 + idx * 8,
      }));
    }, DEFAULT_CACHE_TTL, forceRefresh);
  },

  /**
   * Get Top Rated Products (Rating 4.7+)
   */
  async getTopRatedProducts(forceRefresh = false) {
    return cachedFetch('top_rated_products', async () => {
      const feed = await this.getHomeFeed(forceRefresh).catch(() => null);
      const candidates = feed?.bestSellers?.length ? feed.bestSellers : await this.getProducts({ limit: 12 }, forceRefresh);
      return candidates.filter((p) => p.rating >= 4.5).slice(0, 6);
    }, DEFAULT_CACHE_TTL, forceRefresh);
  },

  /**
   * Get Recommended Products for You
   */
  async getRecommendedProducts(forceRefresh = false) {
    return cachedFetch('recommended_products', async () => {
      const feed = await this.getHomeFeed(forceRefresh).catch(() => null);
      const candidates = feed?.newArrivals?.length ? feed.newArrivals : await this.getProducts({ limit: 12 }, forceRefresh);
      return [...candidates].reverse().slice(0, 6);
    }, DEFAULT_CACHE_TTL, forceRefresh);
  },

  /**
   * Get Featured Multi-Vendor Sellers
   */
  async getFeaturedSellers() {
    return FEATURED_SELLERS;
  },

  /**
   * Get Popular Brands
   */
  async getPopularBrands() {
    return POPULAR_BRANDS;
  },

  /**
   * Get Special Offers & Bank Deals
   */
  async getSpecialOffers() {
    return SPECIAL_OFFERS;
  },

  /**
   * Get home promotional banners (Cached 10 minutes)
   */
  async getBanners(forceRefresh = false) {
    return cachedFetch('banners_home', async () => {
      try {
        const response = await api.get('/banners');
        return response.data || PROMOTIONAL_BANNERS;
      } catch (e) {
        return PROMOTIONAL_BANNERS;
      }
    }, 10 * 60 * 1000, forceRefresh);
  },

  /**
   * Get instant search suggestions chips
   */
  async getSearchSuggestions(query = '') {
    try {
      const response = await api.get(`/products/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Get personalized recommendations
   */
  async getRecommendations(limit = 8) {
    try {
      const response = await api.get(`/products/recommendations?limit=${limit}`);
      const raw = response.data || [];
      return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Record viewed product on cloud & local
   */
  async recordRecentlyViewed(productId) {
    try {
      await api.post('/products/recently-viewed', { productId });
    } catch (e) {}
  },

  /**
   * Get recently viewed products from cloud
   */
  async getRecentlyViewed() {
    try {
      const response = await api.get('/products/recently-viewed');
      const raw = response.data || [];
      return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Clear recently viewed history
   */
  async clearRecentlyViewed() {
    try {
      await api.delete('/products/recently-viewed');
    } catch (e) {}
  },

  /**
   * Get active flash sale campaign
   */
  async getActiveFlashSale() {
    try {
      const response = await api.get('/flash-sales/active');
      return response.data || null;
    } catch (e) {
      return null;
    }
  },
};

export default productService;
