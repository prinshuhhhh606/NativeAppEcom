import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import AppIcon from '../../components/common/AppIcon';
import CustomButton from '../../components/common/CustomButton';
import { useAuth } from '../../context/AuthContext';

export const ApprovalPendingScreen = () => {
  const insets = useSafeAreaInsets();
  const { partner, logout, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const updated = await refreshProfile();
      const status = updated?.kycStatus || partner?.kycStatus;

      if (status === 'approved') {
        Alert.alert(
          'Congratulations! 🎉',
          'Aapka account Admin dwara approve kar diya gaya hai! Delivery Dashboard open ho raha hai.'
        );
      } else if (status === 'rejected') {
        Alert.alert(
          'Application Rejected',
          `Aapki delivery partner application reject ho gayi hai: ${updated?.adminRemarks || 'Document verification criteria not met'}`
        );
      } else {
        Alert.alert(
          'Approval Pending',
          'Your account is waiting for Admin approval.'
        );
      }
    } catch (e) {
      Alert.alert('Network Error', 'Status check karne mein samasya aayi. Kripya internet connection check karein.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Kya aap Delivery App se log out karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const isRejected = partner?.kycStatus === 'rejected';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Badge */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🛵</Text>
          </View>
          <Text style={styles.hubTitle}>Bharat Bazaar Fleet</Text>
          <Text style={styles.hubSubtitle}>Pan-India Delivery Partner Logistics Network</Text>
        </View>

        {/* Main Status Card */}
        <View style={[styles.statusCard, isRejected && styles.rejectedCard]}>
          <View style={[styles.iconCircle, isRejected && styles.rejectedIconCircle]}>
            <Text style={styles.statusBigIcon}>{isRejected ? '❌' : '⏳'}</Text>
          </View>

          <Text style={styles.statusHeading}>
            {isRejected ? 'Application Rejected' : 'Your account is waiting for Admin approval.'}
          </Text>

          <Text style={styles.statusDescription}>
            {isRejected
              ? `Your account was rejected by Admin. Reason: ${partner?.adminRemarks || 'Document verification criteria not met.'}`
              : 'Your account is waiting for Admin approval. You will be able to access your Delivery Dashboard once your KYC and documents are reviewed and approved by Admin.'}
          </Text>

          <View style={[styles.badge, isRejected ? styles.badgeRejected : styles.badgePending]}>
            <Text style={[styles.badgeText, isRejected ? styles.badgeTextRejected : styles.badgeTextPending]}>
              {isRejected ? 'STATUS: REJECTED' : 'STATUS: PENDING ADMIN REVIEW'}
            </Text>
          </View>
        </View>

        {/* Partner Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Registered Fleet Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rider Name</Text>
            <Text style={styles.infoValue}>{partner?.name || 'Rider'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>{partner?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Email</Text>
            <Text style={styles.infoValue}>{partner?.email || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>
              {partner?.vehicleType || 'Bike'} • {partner?.vehicleNumber || 'N/A'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Operating City</Text>
            <Text style={styles.infoValue}>{partner?.address?.city || 'Delhi NCR'}</Text>
          </View>
        </View>

        {/* Real-Time Live Notification Note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteIcon}>🔔</Text>
          <Text style={styles.noteText}>
            Jaise hi Admin panel se aapka account approve hoga, yeh screen automatically open hokar aapko Delivery Dashboard par le jayegi.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <CustomButton
            title={checking ? 'Checking Status...' : 'Check Approval Status 🔄'}
            onPress={handleCheckStatus}
            loading={checking}
            size="large"
            style={styles.checkBtn}
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Log Out from Fleet App</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  logoIcon: {
    fontSize: 28,
  },
  hubTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  hubSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  rejectedCard: {
    borderColor: Colors.danger,
    backgroundColor: '#FEF2F2',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rejectedIconCircle: {
    backgroundColor: '#FEE2E2',
  },
  statusBigIcon: {
    fontSize: 32,
  },
  statusHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextPending: {
    color: '#B45309',
  },
  badgeTextRejected: {
    color: '#B91C1C',
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  noteBox: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primarySoft,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  noteIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 16,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  checkBtn: {
    width: '100%',
  },
  logoutBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
});

export default ApprovalPendingScreen;

