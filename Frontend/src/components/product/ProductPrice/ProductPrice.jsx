import React from 'react';
import { View, Text } from 'react-native';
import styles from './ProductPrice.styles';
import { formatPrice } from '../../../utils/helpers';

export const ProductPrice = ({
  price = 0,
  originalPrice,
  mrp,
  discount,
  size = 'medium', // small, medium, large
  style,
}) => {
  const compMrp = mrp || originalPrice;
  const hasDiscount = compMrp && compMrp > price;
  const discountPercent =
    discount || (hasDiscount ? Math.round(((compMrp - price) / compMrp) * 100) : 0);

  const priceStyle =
    size === 'large'
      ? styles.priceLarge
      : size === 'small'
      ? styles.priceSmall
      : styles.price;

  return (
    <View style={[styles.container, style]}>
      <Text style={priceStyle}>{formatPrice(price)}</Text>
      {hasDiscount && (
        <Text style={styles.mrp}>{formatPrice(compMrp)}</Text>
      )}
      {discountPercent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPercent}% OFF</Text>
        </View>
      )}
    </View>
  );
};

export default ProductPrice;

