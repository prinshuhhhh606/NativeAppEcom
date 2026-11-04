import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './BottomTab.styles';
import { Colors } from '../constants/colors';
import AppIcon from './AppIcon';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export const BottomTab = React.memo(({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { cartSummary } = useCart();
  const { wishlistCount } = useWishlist();

  const BASE_TAB_HEIGHT = 60;
  const bottomInset = insets?.bottom || 0;
  const tabHeight = BASE_TAB_HEIGHT + bottomInset;
  const tabPaddingBottom = bottomInset > 0 ? bottomInset : 6;

  const getTabIcon = (routeName, isFocused) => {
    switch (routeName) {
      case 'HomeTab':
        return isFocused ? 'home' : 'home-outline';
      case 'CategoryTab':
        return isFocused ? 'grid' : 'grid-outline';
      case 'WishlistTab':
        return isFocused ? 'heart' : 'heart-outline';
      case 'CartTab':
        return isFocused ? 'cart' : 'cart-outline';
      case 'ProfileTab':
        return isFocused ? 'person' : 'person-outline';
      default:
        return 'home';
    }
  };

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case 'HomeTab':
        return 'Home';
      case 'CategoryTab':
        return 'Categories';
      case 'WishlistTab':
        return 'Wishlist';
      case 'CartTab':
        return 'Cart';
      case 'ProfileTab':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: tabHeight,
          paddingBottom: tabPaddingBottom,
        },
      ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconName = getTabIcon(route.name, isFocused);
        const label = getTabLabel(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const renderBadge = () => {
          if (route.name === 'CartTab' && cartSummary?.itemCount > 0) {
            return (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartSummary.itemCount}</Text>
              </View>
            );
          }
          const wlCount = wishlistCount ?? 0;
          if (route.name === 'WishlistTab' && wlCount > 0) {
            return (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wlCount}</Text>
              </View>
            );
          }
          return null;
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.8}>
            <View>
              <AppIcon
                name={iconName}
                size={22}
                color={isFocused ? Colors.primary : Colors.textMuted}
              />
              {renderBadge()}
            </View>
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export default BottomTab;

