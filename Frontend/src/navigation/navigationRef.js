/**
 * Global Navigation Container Reference
 * Allows top-level navigation from modals, toasts, notification listeners, and contexts
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigateToCart() {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate('MainApp', { screen: 'CartTab' });
    } catch (e) {
      navigationRef.navigate('CartTab');
    }
  }
}

export function navigateToWishlist() {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate('MainApp', { screen: 'WishlistTab' });
    } catch (e) {
      navigationRef.navigate('WishlistTab');
    }
  }
}

export default {
  navigationRef,
  navigate,
  navigateToCart,
  navigateToWishlist,
};

