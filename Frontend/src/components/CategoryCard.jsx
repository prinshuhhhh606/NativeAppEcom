import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from './CategoryCard.styles';
import { Colors } from '../constants/colors';
import AppIcon from './AppIcon';

export const CategoryCard = React.memo(({
  category,
  isSelected = false,
  onPress,
  style,
}) => {
  if (!category) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, style]}>
      <View
        style={[
          styles.imageWrapper,
          isSelected && styles.imageWrapperSelected,
        ]}>
        {category.image ? (
          <Image source={{ uri: category.image }} style={styles.image} />
        ) : (
          <AppIcon
            name={category.iconName || 'grid-outline'}
            size={28}
            color={isSelected ? Colors.primary : Colors.textSecondary}
          />
        )}
      </View>
      <Text
        style={[styles.title, isSelected && styles.titleSelected]}
        numberOfLines={1}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
});

export default CategoryCard;

