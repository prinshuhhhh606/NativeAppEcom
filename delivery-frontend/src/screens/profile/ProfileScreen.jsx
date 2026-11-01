import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import CustomButton from '../../components/common/CustomButton';
import StatusBadge from '../../components/common/StatusBadge';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { partner, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout Fleet Hub', 'Are you sure you want to end your shift and log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Partner Profile & Fleet Hub" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Rider Card */}
        <View style={styles.riderHero}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 32 }}>🛵</Text>
          </View>
          <Text style={styles.riderName}>{partner?.name || 'Rajesh Kumar'}</Text>
          <Text style={styles.riderContact}>
            +91 {partner?.phone || '9876543212'} • {partner?.email || 'delivery@appecom.in'}
          </Text>

          <View style={styles.badgesRow}>
            <StatusBadge status={partner?.kycStatus || 'approved'} />
            <View style={styles.ratingBadge}>
              <Text style={{ fontSize: 11, color: '#F59E0B' }}>⭐</Text>
              <Text style={styles.ratingText}>{partner?.rating || 4.85} Rating</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Assigned Delivery Vehicle</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Model & Type</Text>
            <Text style={styles.infoValue}>{partner?.vehicleType || 'Bike'} (Two Wheeler)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration Number</Text>
            <Text style={[styles.infoValue, { fontFamily: 'monospace' }]}>
              {partner?.vehicleNumber || 'DL-04-CK-8821'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driving License (DL)</Text>
            <Text style={[styles.infoValue, { fontFamily: 'monospace' }]}>
              {partner?.drivingLicenseNumber || 'DL1420110012345'}
            </Text>
          </View>
        </View>

        {/* Navigation Links */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Fleet Operations & Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.menuEmoji}>💰</Text>
            <Text style={styles.menuTitle}>Wallet, Ledger & Incentives</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Payouts')}>
            <Text style={styles.menuEmoji}>🏛️</Text>
            <Text style={styles.menuTitle}>Bank Account & Payouts</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('History')}>
            <Text style={styles.menuEmoji}>📜</Text>
            <Text style={styles.menuTitle}>Trip Delivery History</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.menuEmoji}>🔔</Text>
            <Text style={styles.menuTitle}>Fleet Notifications & Alerts</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Rider Support & Safety</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Fleet Emergency Helpline',
                '24x7 Roadside & Logistics Dispatch: +91 1800-419-8821',
                [{ text: 'OK' }]
              )
            }>
            <Text style={styles.menuEmoji}>🚨</Text>
            <Text style={[styles.menuTitle, { color: Colors.danger }]}>24x7 Roadside Emergency SOS</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <CustomButton
          title="End Shift & Log Out"
          variant="outline"
          size="large"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={{ color: Colors.danger }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  riderHero: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#99F6E4',
  },
  riderName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  riderContact: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  menuSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  menuEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  menuTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuArrow: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  logoutBtn: {
    marginTop: 10,
    borderColor: '#FECACA',
  },
});

export default ProfileScreen;

