/**
 * Pan India E-Commerce Mobile Application
 * Root Application Container
 */
import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import { ActionFeedbackProvider } from './context/ActionFeedbackContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import ActionFeedbackModal from './components/common/ActionFeedbackModal';
import AppNavigator from './navigation/AppNavigator';
import { Colors } from './constants/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
        translucent={Platform.OS === 'android'}
      />
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <ActionFeedbackProvider>
              <WishlistProvider>
                <CartProvider>
                  <AppNavigator />
                  <ActionFeedbackModal />
                </CartProvider>
              </WishlistProvider>
            </ActionFeedbackProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

