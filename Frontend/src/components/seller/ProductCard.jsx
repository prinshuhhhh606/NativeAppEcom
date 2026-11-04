import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import AppIcon from '../AppIcon';
import OrderStatusBadge from './OrderStatusBadge';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import styles from './ProductCard.styles';

export const ProductCard = ({ product, onEdit, onDelete, onLookupBarcode }) => {
  const imageUrl = getImageUrl(
    product?.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80'
  );

  const stock = product.stock ?? 0;
  const isLowStock = stock > 0 && stock <= (product.lowStockAlert || 5);
  const isOutOfStock = stock === 0;

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {product.productName || product.title || 'Untitled Product'}
          </Text>
          <OrderStatusBadge status={product.approvalStatus || 'approved'} />
        </View>

        <Text style={styles.sku} numberOfLines={1}>
          SKU: {product.sku || 'N/A'} {product.barcode ? `• Barcode: ${product.barcode}` : ''}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price || 0)}</Text>
          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          ) : null}

          <View
            style={[
              styles.stockBadge,
              isOutOfStock
                ? styles.outOfStock
                : isLowStock
                ? styles.lowStock
                : styles.inStock,
            ]}>
            <Text
              style={[
                styles.stockText,
                isOutOfStock
                  ? styles.outOfStockText
                  : isLowStock
                  ? styles.lowStockText
                  : styles.inStockText,
              ]}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low: ${stock}` : `Stock: ${stock}`}
            </Text>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit && onEdit(product)}
            activeOpacity={0.7}>
            <AppIcon name="create-outline" size={14} color="#2563EB" />
            <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Edit</Text>
          </TouchableOpacity>

          {onLookupBarcode ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onLookupBarcode(product)}
              activeOpacity={0.7}>
              <AppIcon name="barcode-outline" size={14} color="#059669" />
              <Text style={[styles.actionBtnText, { color: '#059669' }]}>Barcode</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => onDelete && onDelete(product)}
            activeOpacity={0.7}>
            <AppIcon name="trash-outline" size={14} color="#DC2626" />
            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ProductCard;

