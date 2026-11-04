import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './SplashScreen.styles';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../context/AuthContext';

export const SplashScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAdmin, isDelivery, isSeller } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin) {
        navigation.replace('AdminDashboard');
      } else if (isDelivery) {
        navigation.replace('DeliveryDashboard');
      } else if (isSeller) {
        navigation.replace('SellerDashboard');
      } else {
        navigation.replace('MainApp');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [navigation, isAdmin, isDelivery, isSeller]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🛍️</Text>
      </View>

      <Text style={styles.appName}>{Config.APP_NAME}</Text>
      <Text style={styles.tagline}>Pan India Multi-Vendor Shopping Experience</Text>

      <View style={styles.panIndiaBadge}>
        <AppIcon name="shield-checkmark" size={16} color="#F57F17" />
        <Text style={styles.badgeText}>Delivering to 19,000+ Pin Codes across India</Text>
      </View>

      <View style={[styles.footer, { bottom: 40 + (insets.bottom || 0) }]}>
        <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
        <Text style={styles.footerText}>Made with pride in India • Version {Config.VERSION}</Text>
      </View>
    </View>
  );
};

export default SplashScreen;
