import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './ProfileScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 60;
  const { user, logout, isAuthenticated, isAdmin, isSeller, isDelivery, role, switchMode, activeMode } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of AppsicaEcom?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Login');
        },
      },
    ]);
  };

  const getRoleDisplayName = () => {
    if (isAdmin) return 'Super Administrator';
    if (isSeller) return 'Registered Vendor / Seller';
    if (isDelivery) return 'Delivery Fleet Partner';
    return 'Customer';
  };

  return (
    <View style={styles.container}>
      <Header title="My Account" navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* User Card */}
        {isAuthenticated ? (
          <View style={styles.userHeader}>
            <Image
              source={{
                uri:
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
              }}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user?.fullName || user?.name || 'Customer'}</Text>
            <Text style={styles.userPhone}>
              {user?.mobileNumber || user?.phone ? `+91 ${user?.mobileNumber || user?.phone}` : user?.email}
            </Text>

            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{getRoleDisplayName()}</Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestBanner}>
            <View style={styles.guestLeft}>
              <Text style={styles.guestTitle}>Welcome, Guest Shopper!</Text>
              <Text style={styles.guestSubtitle}>
                Sign in to track orders, save delivery addresses, and enjoy Pan-India express checkout.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.guestLoginBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.guestLoginBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dual Access System Mode Switcher Banner */}
        {isAuthenticated && isSeller && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              backgroundColor: '#1E1B4B',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#6366F1',
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: '#4338CA', padding: 6, borderRadius: 8 }}>
                  <AppIcon name="storefront" size={18} color="#FFFFFF" />
                </View>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                  Seller Studio & Merchant Hub
                </Text>
              </View>
              <View style={{ backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>VERIFIED SELLER</Text>
              </View>
            </View>

            <Text style={{ color: '#C7D2FE', fontSize: 12, lineHeight: 17, marginBottom: 14 }}>
              Dual access active: manage catalog, orders, and thermal shipping labels, or browse and shop anytime with your unified session.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                backgroundColor: '#4F46E5',
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              onPress={async () => {
                await switchMode('seller');
                navigation.navigate('SellerDashboard');
              }}>
              <AppIcon name="swap-horizontal" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                Switch to Seller Business Mode →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. Orders & Shopping */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders & Shopping</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isAuthenticated) {
                navigation.navigate('MyOrders');
              } else {
                Alert.alert('Sign In Required', 'Please sign in to view your past orders.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign In', onPress: () => navigation.navigate('Login', { redirectTo: 'MyOrders' }) },
                ]);
              }
            }}>
            <AppIcon name="cube-outline" size={20} color={Colors.primary} style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>My Personal Orders & Tracking</Text>
              {isSeller && (
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  Personal items purchased for yourself
                </Text>
              )}
            </View>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('WishlistTab')}>
            <AppIcon name="heart-outline" size={20} color="#E91E63" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>My Wishlist</Text>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CartTab')}>
            <AppIcon name="cart-outline" size={20} color="#00897B" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>Shopping Cart</Text>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* 2. Multi-Role Portals & Partner Hubs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Multi-Vendor & Partner Hubs</Text>

          {/* Seller Portal */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              if (isSeller) {
                await switchMode('seller');
                navigation.navigate('SellerDashboard');
              } else {
                navigation.navigate('SellerLogin');
              }
            }}
            activeOpacity={0.8}>
            <AppIcon name="storefront-outline" size={20} color="#4F46E5" style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Seller Studio & Vendor Panel</Text>
              {isSeller && (
                <Text style={{ fontSize: 11, color: '#4F46E5', fontWeight: '600', marginTop: 2 }}>
                  Store: {user?.storeName || user?.businessName || 'Jaipur Handlooms'}
                </Text>
              )}
            </View>
            <View style={[styles.menuBadge, { backgroundColor: isSeller ? '#D1FAE5' : '#EDE9FE' }]}>
              <Text style={[styles.menuBadgeText, { color: isSeller ? '#065F46' : '#6D28D9' }]}>
                {isSeller ? 'Active Vendor' : 'Vendor'}
              </Text>
            </View>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>

          {/* Delivery Partner Hub */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isDelivery) {
                navigation.navigate('DeliveryDashboard');
              } else {
                navigation.navigate('DeliveryLogin');
              }
            }}
            activeOpacity={0.8}>
            <AppIcon name="bicycle-outline" size={20} color="#0D9488" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>Delivery Partner Fleet Hub</Text>
            <View style={[styles.menuBadge, { backgroundColor: '#CCFBF1' }]}>
              <Text style={[styles.menuBadgeText, { color: '#0F766E' }]}>Rider</Text>
            </View>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>

          {/* Admin Control Hub */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isAdmin) {
                navigation.navigate('AdminDashboard');
              } else {
                navigation.navigate('AdminLogin');
              }
            }}
            activeOpacity={0.8}>
            <AppIcon name="shield-checkmark-outline" size={20} color="#DC2626" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>Admin Control & Operations</Text>
            <View style={[styles.menuBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.menuBadgeText, { color: '#B91C1C' }]}>Port 3000</Text>
            </View>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* 3. Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Delivery Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isAuthenticated) {
                navigation.navigate('Address');
              } else {
                navigation.navigate('Login', { redirectTo: 'Address' });
              }
            }}>
            <AppIcon name="location-outline" size={20} color="#1565C0" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>Saved Delivery Addresses</Text>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}>
            <AppIcon name="notifications-outline" size={20} color="#F57F17" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>Notifications & Offers</Text>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* 4. Support & Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}>
            <AppIcon name="help-circle-outline" size={20} color="#6A1B9A" style={styles.menuIcon} />
            <Text style={styles.menuTitle}>24x7 Help & Pan-India Support</Text>
            <AppIcon name="chevron-forward" size={18} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <CustomButton
            title="Log Out of AppsicaEcom"
            variant="outline"
            iconLeft="log-out-outline"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
