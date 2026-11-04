import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import sellerService from '../services/sellerService';
import { useAuth } from '../context/AuthContext';
import { formatPrice, getImageUrl } from '../utils/helpers';
import styles from './SellerAddProductScreen.styles';

const DRAFT_KEY = '@bb_seller_mobile_product_draft';

// Supported image formats
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const SellerAddProductScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const editingProduct = route.params?.product;
  const isEditing = !!editingProduct;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [hasOfflineDraft, setHasOfflineDraft] = useState(false);

  // Form Fields
  const [productName, setProductName] = useState(editingProduct?.productName || '');
  const [subtitle, setSubtitle] = useState(editingProduct?.subtitle || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [category, setCategory] = useState(
    editingProduct?.category?._id || editingProduct?.category || ''
  );
  const [subCategory, setSubCategory] = useState(editingProduct?.subCategory || '');
  const [brand, setBrand] = useState(editingProduct?.brand || user?.storeName || 'Bharat Bazaar');
  const [sku, setSku] = useState(
    editingProduct?.sku || `SKU-${Date.now().toString().slice(-6)}`
  );
  const [barcode, setBarcode] = useState(editingProduct?.barcode || '');

  // Pricing
  const [price, setPrice] = useState(editingProduct?.price ? String(editingProduct.price) : '');
  const [originalPrice, setOriginalPrice] = useState(
    editingProduct?.originalPrice ? String(editingProduct.originalPrice) : ''
  );
  const [costPrice, setCostPrice] = useState(
    editingProduct?.costPrice ? String(editingProduct.costPrice) : ''
  );
  const [packagingCost, setPackagingCost] = useState('20');
  const [gstPercentage, setGstPercentage] = useState(
    editingProduct?.gstPercentage ? String(editingProduct.gstPercentage) : '18'
  );
  const [hsnCode, setHsnCode] = useState(editingProduct?.hsnCode || '6204');

  // Inventory & Shipping
  const [stock, setStock] = useState(
    editingProduct?.stock !== undefined ? String(editingProduct.stock) : '10'
  );
  const [lowStockAlert, setLowStockAlert] = useState(
    editingProduct?.lowStockAlert !== undefined ? String(editingProduct.lowStockAlert) : '5'
  );
  const [weight, setWeight] = useState(
    editingProduct?.weight ? String(editingProduct.weight) : '0.5'
  );

  // Images state: array of { id, uri, fileName, type, fileSize, isRemote, isPrimary }
  const [imagesList, setImagesList] = useState(() => {
    if (editingProduct?.images && Array.isArray(editingProduct.images) && editingProduct.images.length > 0) {
      return editingProduct.images.map((imgUrl, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        uri: typeof imgUrl === 'string' ? imgUrl : imgUrl.url || '',
        fileName: `image_${idx + 1}.jpg`,
        isRemote: true,
        isPrimary: idx === 0,
      }));
    }
    return [];
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Fetch Categories
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await sellerService.getCategories();
        const list = Array.isArray(res) ? res : res.categories || res.data || [];
        setCategories(list);
        if (!category && list.length > 0) {
          setCategory(list[0]._id || list[0].slug);
        }
      } catch (e) {}
    };
    loadCats();
  }, [category]);

  // Check for Offline Draft on new product
  useEffect(() => {
    if (!isEditing) {
      AsyncStorage.getItem(DRAFT_KEY).then((val) => {
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed.productName) {
              setHasOfflineDraft(parsed);
            }
          } catch (e) {}
        }
      });
    }
  }, [isEditing]);

  // Auto-save draft
  useEffect(() => {
    if (!isEditing && productName.trim().length > 0) {
      const draftObj = {
        productName,
        subtitle,
        description,
        price,
        originalPrice,
        costPrice,
        stock,
        imagesList,
        category,
        subCategory,
        brand,
        sku,
        barcode,
      };
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
    }
  }, [
    productName,
    subtitle,
    description,
    price,
    originalPrice,
    costPrice,
    stock,
    imagesList,
    category,
    subCategory,
    brand,
    sku,
    barcode,
    isEditing,
  ]);

  const handleRestoreDraft = () => {
    if (hasOfflineDraft) {
      setProductName(hasOfflineDraft.productName || '');
      setSubtitle(hasOfflineDraft.subtitle || '');
      setDescription(hasOfflineDraft.description || '');
      setPrice(hasOfflineDraft.price || '');
      setOriginalPrice(hasOfflineDraft.originalPrice || '');
      setCostPrice(hasOfflineDraft.costPrice || '');
      setStock(hasOfflineDraft.stock || '10');
      if (hasOfflineDraft.category) setCategory(hasOfflineDraft.category);
      if (hasOfflineDraft.subCategory) setSubCategory(hasOfflineDraft.subCategory);
      if (hasOfflineDraft.brand) setBrand(hasOfflineDraft.brand);
      if (hasOfflineDraft.sku) setSku(hasOfflineDraft.sku);
      if (hasOfflineDraft.barcode) setBarcode(hasOfflineDraft.barcode);

      if (hasOfflineDraft.imagesList && Array.isArray(hasOfflineDraft.imagesList)) {
        setImagesList(hasOfflineDraft.imagesList);
      } else if (hasOfflineDraft.images && Array.isArray(hasOfflineDraft.images)) {
        setImagesList(
          hasOfflineDraft.images.map((u, i) => ({
            id: `restored-${i}`,
            uri: typeof u === 'string' ? u : u.uri || '',
            isRemote: true,
            isPrimary: i === 0,
          }))
        );
      }
      setHasOfflineDraft(false);
      Alert.alert('Draft Restored', 'Your unsaved offline product draft has been restored.');
    }
  };

  const handleDiscardDraft = () => {
    AsyncStorage.removeItem(DRAFT_KEY);
    setHasOfflineDraft(false);
  };

  // Auto-calculated Financials
  const sellingPriceNum = parseFloat(price) || 0;
  const mrpNum = parseFloat(originalPrice) || 0;
  const costNum = parseFloat(costPrice) || 0;
  const packNum = parseFloat(packagingCost) || 0;

  const discountPercent =
    mrpNum > sellingPriceNum && mrpNum > 0
      ? Math.round(((mrpNum - sellingPriceNum) / mrpNum) * 100)
      : 0;

  const estimatedProfit =
    sellingPriceNum > 0 && costNum > 0 ? sellingPriceNum - (costNum + packNum) : 0;
  const marginPercent =
    sellingPriceNum > 0 && costNum > 0 ? Math.round((estimatedProfit / sellingPriceNum) * 100) : 0;
  const isFloorPriceWarning =
    sellingPriceNum > 0 && costNum > 0 && sellingPriceNum < costNum + packNum;

  /**
   * Open Device Gallery and Pick Images
   * Android Photo Picker (PickVisualMedia) launches directly without requiring broad storage permissions.
   */
  const handlePickFromGallery = async () => {
    if (imagesList.length >= 8) {
      Alert.alert('Limit Reached', 'You can upload up to 8 images per product listing.');
      return;
    }

    const remainingSlots = 8 - imagesList.length;

    try {
      if (typeof launchImageLibrary !== 'function') {
        throw new Error('launchImageLibrary function is not exported by react-native-image-picker');
      }

      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: remainingSlots,
        includeBase64: false,
        quality: 0.85,
        maxWidth: 1600,
        maxHeight: 1600,
      });

      if (response.didCancel) {
        return; // User cancelled without picking
      }

      if (response.errorCode) {
        if (response.errorCode === 'permission') {
          Alert.alert(
            'Permission Needed',
            'Please enable photo library access in your device settings to select product images.'
          );
        } else {
          Alert.alert('Picker Notice', response.errorMessage || 'Unable to open photo gallery.');
        }
        return;
      }

      if (!response.assets || response.assets.length === 0) {
        return;
      }

      const validAssets = [];
      let skippedCount = 0;

      response.assets.forEach((asset) => {
        if (!asset || !asset.uri) return;
        const rawName = asset.fileName || asset.uri.split('/').pop() || 'product.jpg';
        const cleanExt = rawName.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = (asset.type || '').toLowerCase();
        const isValid = ALLOWED_MIMES.includes(mime) || ALLOWED_EXTS.includes(cleanExt);

        if (isValid) {
          validAssets.push({ ...asset, cleanExt, rawName });
        } else {
          skippedCount++;
        }
      });

      if (skippedCount > 0) {
        Alert.alert(
          'Unsupported Format',
          `${skippedCount} image(s) skipped. Only JPG, JPEG, PNG, and WEBP formats are supported.`
        );
      }

      if (validAssets.length === 0) {
        return;
      }

      const newItems = validAssets.map((asset, index) => {
        // Sanitize filename to handle spaces and special characters
        const safeName = asset.rawName.replace(/[^a-zA-Z0-9_.-]/g, '_');
        return {
          id: `gallery-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          uri: asset.uri, // Can be content:// or file://
          fileName: safeName || `product_${Date.now()}_${index}.${asset.cleanExt}`,
          type:
            asset.type ||
            `image/${asset.cleanExt === 'png' ? 'png' : asset.cleanExt === 'webp' ? 'webp' : 'jpeg'}`,
          fileSize: asset.fileSize || 0,
          isRemote: false,
          isPrimary: imagesList.length === 0 && index === 0,
        };
      });

      setImagesList((prev) => {
        const combined = [...prev, ...newItems].slice(0, 8);
        if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return combined;
      });
    } catch (err) {
      console.error('[SellerAddProductScreen] Gallery pick exception:', err);
      const isNativeModuleMissing =
        err?.message?.includes('null') ||
        err?.message?.includes('undefined') ||
        err?.message?.includes('ImagePicker') ||
        err?.message?.includes('TurboModule');

      if (isNativeModuleMissing) {
        Alert.alert(
          'App Rebuild Needed for Native Gallery',
          'The newly installed image picker native module is not yet compiled into your running app binary.\n\nPlease rebuild your Android app:\n• npm run android (or npx react-native run-android)\n\nIn the meantime, you can paste product image URLs using the Link button.',
          [
            { text: 'Paste Image URL', onPress: () => setShowUrlInput(true) },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert(
          'Image Picker Error',
          err?.message || 'An unexpected error occurred while selecting photos.'
        );
      }
    }
  };

  /**
   * Take Photo using Device Camera
   */
  const handleCaptureCamera = async () => {
    if (imagesList.length >= 8) {
      Alert.alert('Limit Reached', 'You can upload up to 8 images per product listing.');
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const hasCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasCamera) {
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
            title: 'Camera Access',
            message: 'Bharat Bazaar needs access to your camera to take product photos.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          });
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Camera Access',
              'Camera permission was not granted. You can tap "Choose from Gallery" to select photos directly.'
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Camera permission check error:', err);
      }
    }

    try {
      const response = await launchCamera({
        mediaType: 'photo',
        saveToPhotos: false,
        quality: 0.85,
        maxWidth: 1600,
        maxHeight: 1600,
      });

      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Unable to open camera.');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const ext = (asset.fileName || asset.uri || 'jpg').split('.').pop()?.toLowerCase() || 'jpg';
        const newItem = {
          id: `cam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          uri: asset.uri,
          fileName: asset.fileName || `product_cam_${Date.now()}.${ext}`,
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize || 0,
          isRemote: false,
          isPrimary: imagesList.length === 0,
        };

        setImagesList((prev) => {
          const combined = [...prev, newItem].slice(0, 8);
          if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
            combined[0].isPrimary = true;
          }
          return combined;
        });
      }
    } catch (err) {
      console.error('[SellerAddProductScreen] Camera error:', err);
      Alert.alert('Camera Error', err?.message || 'An unexpected error occurred while capturing photo.');
    }
  };

  /**
   * Set Selected Image as Primary (Cover Photo)
   */
  const handleSetPrimary = (index) => {
    setImagesList((prev) => {
      const selected = prev[index];
      if (!selected) return prev;
      const rest = prev.filter((_, i) => i !== index);
      return [
        { ...selected, isPrimary: true },
        ...rest.map((img) => ({ ...img, isPrimary: false })),
      ];
    });
  };

  /**
   * Remove Image from List
   */
  const handleRemoveImage = (index) => {
    setImagesList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  /**
   * Add Image via URL
   */
  const handleAddUrlImage = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (imagesList.length >= 8) {
      Alert.alert('Limit Reached', 'You can upload up to 8 images per product listing.');
      return;
    }
    const newItem = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      uri: trimmed,
      fileName: trimmed.split('/').pop() || 'product.jpg',
      type: 'image/jpeg',
      isRemote: true,
      isPrimary: imagesList.length === 0,
    };
    setImagesList((prev) => {
      const combined = [...prev, newItem];
      if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  /**
   * Save / Submit Product Listing
   */
  const handleSave = async (isDraft = false) => {
    if (!productName.trim()) {
      Alert.alert('Validation Error', 'Product title / name is required');
      return;
    }
    if (!sellingPriceNum || sellingPriceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid selling price');
      return;
    }

    setLoading(true);
    try {
      // 1. Identify local gallery/camera images needing upload
      const localImages = imagesList.filter(
        (img) =>
          !img.isRemote &&
          (img.uri.startsWith('file:') ||
            img.uri.startsWith('content:') ||
            !img.uri.startsWith('http'))
      );

      const uploadedUrlMap = new Map();

      if (localImages.length > 0) {
        setUploading(true);
        setUploadProgressText(`Uploading ${localImages.length} product image(s)...`);

        const formData = new FormData();
        localImages.forEach((img, i) => {
          // Keep content:// or file:// as required per platform
          const cleanUri = Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri;
          const safeName = (img.fileName || `product_img_${Date.now()}_${i}.jpg`).replace(
            /[^a-zA-Z0-9_.-]/g,
            '_'
          );
          formData.append('images', {
            uri: cleanUri,
            name: safeName,
            type: img.type || 'image/jpeg',
          });
        });

        const uploadRes = await sellerService.uploadProductImages(formData, (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgressText(`Uploading images: ${pct}%`);
          }
        });

        const returnedUrls =
          uploadRes?.data?.urls ||
          uploadRes?.urls ||
          (Array.isArray(uploadRes) ? uploadRes : []);

        if (Array.isArray(returnedUrls) && returnedUrls.length > 0) {
          localImages.forEach((localImg, idx) => {
            if (returnedUrls[idx]) {
              uploadedUrlMap.set(localImg.id, returnedUrls[idx]);
            }
          });
        }
        setUploading(false);
      }

      // 2. Resolve final image URLs list in proper order (Primary cover is first)
      const primaryItem = imagesList.find((img) => img.isPrimary) || imagesList[0];
      const otherItems = imagesList.filter((img) => img !== primaryItem);
      const orderedItems = primaryItem ? [primaryItem, ...otherItems] : [];

      const finalUrls = orderedItems
        .map((img) => {
          if (img.isRemote) return img.uri;
          return uploadedUrlMap.get(img.id) || img.uri;
        })
        .filter(
          (url) =>
            url &&
            typeof url === 'string' &&
            (url.startsWith('http') || url.startsWith('/uploads'))
        );

      // Safe fallback if zero images selected
      const finalImages =
        finalUrls.length > 0
          ? finalUrls
          : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'];

      const payload = {
        productName: productName.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        category,
        subCategory: subCategory.trim(),
        brand: brand.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || sku.trim().toUpperCase(),
        images: finalImages,
        price: sellingPriceNum,
        originalPrice: mrpNum || sellingPriceNum,
        costPrice: costNum,
        stock: parseInt(stock, 10) || 0,
        lowStockAlert: parseInt(lowStockAlert, 10) || 5,
        weight: parseFloat(weight) || 0.5,
        gstPercentage: parseFloat(gstPercentage) || 18,
        hsnCode: hsnCode.trim(),
        isDraft,
        approvalStatus: isDraft ? 'draft' : 'pending_approval',
      };

      if (isEditing) {
        await sellerService.updateProduct(editingProduct._id, payload);
        Alert.alert('Success', 'Product updated successfully with latest images!');
      } else {
        await sellerService.createProduct(payload);
        AsyncStorage.removeItem(DRAFT_KEY);
        Alert.alert(
          'Product Submitted',
          isDraft
            ? 'Saved to store drafts.'
            : 'Product photos and listing submitted to Admin for compliance verification!'
        );
      }
      navigation.goBack();
    } catch (err) {
      console.error('Submit product error:', err);
      Alert.alert(
        'Submission Error',
        err.response?.data?.message || err.message || 'Failed to save product'
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SellerHeader
        title={isEditing ? 'Edit Listing' : 'Add New Product'}
        subtitle={isEditing ? sku : 'Store Catalog Onboarding'}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Offline Draft Notice */}
        {hasOfflineDraft ? (
          <View style={styles.draftBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.draftTitle}>Unsaved Draft Found</Text>
              <Text style={styles.draftSubtitle}>
                "{hasOfflineDraft.productName || 'Untitled Product'}"
              </Text>
            </View>
            <View style={styles.draftActions}>
              <TouchableOpacity style={styles.restoreBtn} onPress={handleRestoreDraft}>
                <Text style={styles.restoreBtnText}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardBtn} onPress={handleDiscardDraft}>
                <Text style={styles.discardBtnText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* SECTION 1: BASIC INFO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Basic Information</Text>

          <Text style={styles.inputLabel}>Product Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pure Cotton Jaipur Printed Saree"
            placeholderTextColor="#94A3B8"
            value={productName}
            onChangeText={setProductName}
          />

          <Text style={styles.inputLabel}>Subtitle / Short Tagline</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Traditional Hand-block Artisan Weave"
            placeholderTextColor="#94A3B8"
            value={subtitle}
            onChangeText={setSubtitle}
          />

          <Text style={styles.inputLabel}>Detailed Description</Text>
          <TextInput
            style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
            placeholder="Describe material, weave, wash care, and features..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          {/* Category Selection */}
          {categories.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.inputLabel}>Select Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                {categories.map((cat) => {
                  const catId = cat._id || cat.slug;
                  const isSelected = category === catId || category === cat.slug;
                  return (
                    <TouchableOpacity
                      key={catId}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                      }}
                      onPress={() => setCategory(catId)}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isSelected ? '#FFFFFF' : '#475569',
                        }}>
                        {cat.name || cat.categoryName || cat.slug}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Sub-Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Traditional Wear"
                placeholderTextColor="#94A3B8"
                value={subCategory}
                onChangeText={setSubCategory}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Brand Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Brand"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>SKU / Code</Text>
              <TextInput
                style={styles.input}
                placeholder="SKU-XXXX"
                placeholderTextColor="#94A3B8"
                value={sku}
                onChangeText={setSku}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Barcode (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="EAN-13 / Code-128"
                placeholderTextColor="#94A3B8"
                value={barcode}
                onChangeText={setBarcode}
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: PRICING & PROFIT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Pricing & Profit Calculator</Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
              <TextInput
                style={[styles.input, { fontWeight: '700', color: '#059669' }]}
                placeholder="₹ 999"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Original MRP (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ 1499"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={originalPrice}
                onChangeText={setOriginalPrice}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Cost Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ 500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={costPrice}
                onChangeText={setCostPrice}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Packing Cost (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ 20"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={packagingCost}
                onChangeText={setPackagingCost}
              />
            </View>
          </View>

          {/* Real-time Profit Preview Box */}
          <View style={[styles.profitBox, isFloorPriceWarning && styles.floorPriceBox]}>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>Customer Discount:</Text>
              <Text style={styles.profitVal}>{discountPercent}% OFF</Text>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>Estimated Net Margin:</Text>
              <Text
                style={[
                  styles.profitVal,
                  { color: isFloorPriceWarning ? '#DC2626' : '#059669', fontWeight: '800' },
                ]}>
                {formatPrice(estimatedProfit)} ({marginPercent}%)
              </Text>
            </View>
            {isFloorPriceWarning ? (
              <Text style={styles.floorWarningText}>
                ⚠️ Warning: Selling Price is lower than cost + packaging.
              </Text>
            ) : null}
          </View>
        </View>

        {/* SECTION 3: INVENTORY & GST */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Inventory Stock & GST</Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Stock Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Low Stock Alert</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={lowStockAlert}
                onChangeText={setLowStockAlert}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>GST Slab Rate (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="18"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={gstPercentage}
                onChangeText={setGstPercentage}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>HSN Code</Text>
              <TextInput
                style={styles.input}
                placeholder="6204"
                placeholderTextColor="#94A3B8"
                value={hsnCode}
                onChangeText={setHsnCode}
              />
            </View>
          </View>
        </View>

        {/* SECTION 4: PRODUCT MEDIA & GALLERY */}
        <View style={styles.sectionCard}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.sectionTitle}>4. Product Photos ({imagesList.length} / 8)</Text>
            <View style={styles.mediaCountBadge}>
              <Text style={styles.mediaCountText}>
                {imagesList.length === 0 ? 'No photos' : `${imagesList.length} Selected`}
              </Text>
            </View>
          </View>

          <Text style={styles.mediaTipText}>
            Select crisp photos from your phone gallery. Tap on any photo or "Set as Cover" to choose your primary listing image.
          </Text>

          {/* Upload Progress Indicator */}
          {uploading && (
            <View style={styles.uploadingBanner}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.uploadingText}>{uploadProgressText}</Text>
            </View>
          )}

          {/* Media Action Buttons */}
          <View style={styles.mediaButtonRow}>
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
              disabled={loading || uploading}>
              <AppIcon name="images" size={16} color="#FFFFFF" />
              <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handleCaptureCamera}
              activeOpacity={0.8}
              disabled={loading || uploading}>
              <AppIcon name="camera" size={16} color="#7C3AED" />
              <Text style={styles.cameraBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.urlToggleBtn}
              onPress={() => setShowUrlInput(!showUrlInput)}
              activeOpacity={0.8}>
              <AppIcon name="link" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Direct URL Input Toggle */}
          {showUrlInput && (
            <View style={styles.addImageRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Paste Image URL (https://...)"
                placeholderTextColor="#94A3B8"
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
              />
              <TouchableOpacity style={styles.addImgBtn} onPress={handleAddUrlImage}>
                <Text style={styles.addImgBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image Previews List or Empty Placeholder */}
          {imagesList.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyMediaBox}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}>
              <View style={styles.emptyMediaIconWrap}>
                <AppIcon name="images" size={26} color="#2563EB" />
              </View>
              <Text style={styles.emptyMediaTitle}>No Product Photos Yet</Text>
              <Text style={styles.emptyMediaSubtitle}>
                Tap here or "Choose from Gallery" to pick photos from your mobile device
              </Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
              {imagesList.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[styles.imageCard, item.isPrimary && styles.imageCardPrimary]}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleSetPrimary(idx)}>
                    <Image
                      source={{ uri: getImageUrl(item.uri) }}
                      style={styles.imageThumb}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Primary Cover Badge */}
                  {item.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <AppIcon name="star" size={10} color="#FFFFFF" />
                      <Text style={styles.primaryBadgeText}>COVER</Text>
                    </View>
                  )}

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <AppIcon name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Bottom Footer Action */}
                  <View style={styles.imageCardFooter}>
                    {item.isPrimary ? (
                      <Text style={styles.primaryStatusText}>★ Primary</Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.setPrimaryBtn}
                        onPress={() => handleSetPrimary(idx)}>
                        <Text style={styles.setPrimaryBtnText}>Set Cover</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={() => handleSave(true)}
            disabled={loading || uploading}
            activeOpacity={0.8}>
            <Text style={styles.saveDraftText}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleSave(false)}
            disabled={loading || uploading}
            activeOpacity={0.8}>
            {loading || uploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitText}>
                {isEditing ? 'Update Listing' : 'Submit for Review'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SellerAddProductScreen;
