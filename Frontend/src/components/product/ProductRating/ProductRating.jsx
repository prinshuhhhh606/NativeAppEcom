import React from 'react';
import { View, Text } from 'react-native';
import styles from './ProductRating.styles';
import AppIcon from '../../AppIcon';
import colors from '../../../theme/colors';

export const ProductRating = ({
  rating = 4.5,
  reviewCount,
  showCount = true,
  style,
}) => {
  const numericRating = Number(rating) || 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.pill}>
        <Text style={styles.ratingText}>{numericRating.toFixed(1)}</Text>
        <AppIcon name="star" size={10} color={colors.white} />
      </View>
      {showCount && reviewCount !== undefined ? (
        <Text style={styles.reviewCount}>({reviewCount})</Text>
      ) : null}
    </View>
  );
};

export default ProductRating;

