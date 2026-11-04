import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './Header.styles';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';
import AppIcon from './AppIcon';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export const Header = React.memo(({
  title,
  showBack = false,
  onBack,
  showPincodeBar = false,
  showCart = true,
  showWishlist = true,
  showNotifications = false,
  showAuthStatus = true,
  navigation,
  rightCustom,
}) => {
  const insets = useSafeAreaInsets();
  const { cartSummary } = useCart() || {};
  const { wishlistCount } = useWishlist() || {};
  const { selectedPincode, cityName, openPincodeModal } = useLocation() || {};
  const { isAuthenticated, user } = useAuth() || {};

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  const handleCartPress = useCallback(() => {
    if (navigation?.navigate) {
      try {
        navigation.navigate('MainApp', { screen: 'CartTab' });
      } catch (e) {
        navigation.navigate('CartTab');
      }
    }
  }, [navigation]);

  const handleWishlistPress = useCallback(() => {
    if (navigation?.navigate) {
      try {
        navigation.navigate('MainApp', { screen: 'WishlistTab' });
      } catch (e) {
        navigation.navigate('WishlistTab');
      }
    }
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    if (navigation?.navigate) {
      navigation.navigate('Notifications');
    }
  }, [navigation]);

  const headerPaddingTop = insets.top > 0 ? insets.top + 4 : 8;

  return (
    <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}>
              <AppIcon name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}

          {title ? (
            <Text style={styles.pageTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 18 }}>🛍️</Text>
                <Text style={styles.brandTitle}>{Config.APP_NAME}</Text>
              </View>
              <Text style={styles.brandSubtitle}>Premium Multi-Vendor Store</Text>
            </View>
          )}
        </View>

        <View style={styles.rightGroup}>
          {rightCustom}

          {showNotifications && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotificationPress}
              activeOpacity={0.7}>
              <AppIcon name="notifications-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}

          {showWishlist && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleWishlistPress}
              activeOpacity={0.7}>
              <AppIcon name="heart-outline" size={22} color={Colors.textPrimary} />
              {(wishlistCount > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showCart && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleCartPress}
              activeOpacity={0.7}>
              <AppIcon name="cart-outline" size={22} color={Colors.textPrimary} />
              {cartSummary?.itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartSummary.itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showAuthStatus && (
            isAuthenticated ? (
              <TouchableOpacity
                style={styles.authPill}
                onPress={() => {
                  if (navigation?.navigate) {
                    try {
                      navigation.navigate('MainApp', { screen: 'ProfileTab' });
                    } catch (e) {
                      navigation.navigate('ProfileTab');
                    }
                  }
                }}
                activeOpacity={0.75}>
                <AppIcon name="person-circle" size={18} color={Colors.primary} />
                <Text style={styles.authPillText} numberOfLines={1}>
                  {user?.fullName ? user.fullName.split(' ')[0] : user?.name ? user.name.split(' ')[0] : 'Account'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => {
                  if (navigation?.navigate) {
                    navigation.navigate('Login');
                  }
                }}
                activeOpacity={0.8}>
                <Text style={styles.loginBtnText}>Sign In</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {showPincodeBar && (
        <TouchableOpacity
          style={styles.pincodeBar}
          onPress={openPincodeModal}
          activeOpacity={0.8}>
          <AppIcon
            name="location"
            size={16}
            color={Colors.primary}
            style={styles.pincodeIcon}
          />
          <Text style={styles.pincodeText} numberOfLines={1}>
            Deliver to:{' '}
            <Text style={styles.pincodeHighlight}>
              {cityName} - {selectedPincode}
            </Text>
          </Text>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default Header;

