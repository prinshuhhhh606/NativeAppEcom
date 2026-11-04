/**
 * Root Application Navigator
 * Manages full app stack transitions, deep routing, and role-based route protection
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import SellerLoginScreen from '../screens/SellerLoginScreen';
import SellerRegisterScreen from '../screens/SellerRegisterScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerProductsScreen from '../screens/SellerProductsScreen';
import SellerAddProductScreen from '../screens/SellerAddProductScreen';
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import SellerInventoryScreen from '../screens/SellerInventoryScreen';
import SellerAccountingScreen from '../screens/SellerAccountingScreen';
import SellerSettingsScreen from '../screens/SellerSettingsScreen';
import SellerStaffScreen from '../screens/SellerStaffScreen';
import SellerOrderDetailsScreen from '../screens/SellerOrderDetailsScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import SellerNotificationsScreen from '../screens/SellerNotificationsScreen';
import DeliveryLoginScreen from '../screens/DeliveryLoginScreen';
import DeliveryRegisterScreen from '../screens/DeliveryRegisterScreen';
import DeliveryDashboardScreen from '../screens/DeliveryDashboardScreen';

import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import SearchScreen from '../screens/SearchScreen';
import AddressScreen from '../screens/AddressScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isAdmin, isDelivery, isSeller } = useAuth();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          freezeOnBlur: true,
          animationDuration: 220,
        }}>
        {/* Startup & Initial Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Customer Main Shopping Portal */}
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />

        {/* Customer Authentication Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Multi-Vendor Seller Hub */}
        <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />
        <Stack.Screen name="SellerRegister" component={SellerRegisterScreen} />
        <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
        <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
        <Stack.Screen name="SellerAddProduct" component={SellerAddProductScreen} />
        <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
        <Stack.Screen name="SellerInventory" component={SellerInventoryScreen} />
        <Stack.Screen name="SellerAccounting" component={SellerAccountingScreen} />
        <Stack.Screen name="SellerSettings" component={SellerSettingsScreen} />
        <Stack.Screen name="SellerStaff" component={SellerStaffScreen} />
        <Stack.Screen name="SellerOrderDetails" component={SellerOrderDetailsScreen} />
        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
        <Stack.Screen name="SellerNotifications" component={SellerNotificationsScreen} />

        {/* Delivery Partner Fleet Hub */}
        <Stack.Screen name="DeliveryLogin" component={DeliveryLoginScreen} />
        <Stack.Screen name="DeliveryRegister" component={DeliveryRegisterScreen} />
        <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboardScreen} />

        {/* Admin Authentication & Operational Dashboard */}
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />

        {/* Product & Search Screens */}
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />

        {/* Order & Checkout Flow */}
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />

        {/* Account & Orders */}
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
