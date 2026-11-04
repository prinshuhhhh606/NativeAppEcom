/**
 * Bottom Tab Navigator
 * 5 Core Tabs: Home, Categories, Wishlist, Cart, Profile
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BottomTab from '../components/BottomTab';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const BASE_TAB_HEIGHT = 60;
  const tabHeight = BASE_TAB_HEIGHT + (insets.bottom || 0);

  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTab {...props} />}
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarStyle: {
          height: tabHeight,
          paddingBottom: insets.bottom || 0,
        },
      }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="CategoryTab" component={CategoryScreen} />
      <Tab.Screen name="WishlistTab" component={WishlistScreen} />
      <Tab.Screen name="CartTab" component={CartScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

