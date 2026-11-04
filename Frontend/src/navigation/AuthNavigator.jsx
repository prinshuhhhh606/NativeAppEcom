/**
 * Authentication Navigator
 * Customer Login, Registration, OTP, Forgot Password & Admin Login
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import SellerLoginScreen from '../screens/SellerLoginScreen';
import SellerRegisterScreen from '../screens/SellerRegisterScreen';
import DeliveryLoginScreen from '../screens/DeliveryLoginScreen';
import DeliveryRegisterScreen from '../screens/DeliveryRegisterScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />
      <Stack.Screen name="SellerRegister" component={SellerRegisterScreen} />
      <Stack.Screen name="DeliveryLogin" component={DeliveryLoginScreen} />
      <Stack.Screen name="DeliveryRegister" component={DeliveryRegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
