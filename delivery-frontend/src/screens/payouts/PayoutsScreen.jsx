import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice, formatDate } from '../../utils/helpers';

export const PayoutsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { partner } = useAuth();

  const [payouts, setPayouts] = useState([]);
  const [bankDetails, setBankDetails] = useState(partner?.bankDetails || {});
  const [availableForPayout, setAvailableForPayout] = useState(partner?.earnings?.available || 1450);
  const [amountInput, setAmountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getPayouts();
      if (res.data?.payouts) setPayouts(res.data.payouts);
      if (res.data?.bankDetails) setBankDetails(res.data.bankDetails);
      if (res.data?.availableForPayout !== undefined) setAvailableForPayout(res.data.availableForPayout);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const val = Number(amountInput);
    if (!val || val < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is ₹100.');
      return;
    }

    if (val > availableForPayout) {
      Alert.alert('Insufficient Balance', `Available balance is ₹${availableForPayout}`);
      return;
    }

    setRequesting(true);
    try {
      const res = await deliveryService.requestPayout({
        amount: val,
        payoutMethod: 'BANK_TRANSFER',
      });
      Alert.alert('Payout Requested', res.message || 'Settlement initiated to your registered bank account.');
      setAmountInput('');
      loadPayouts();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not request payout');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Bank Settlements & Payouts" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPayouts} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {/* Linked Bank Card */}
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Text style={{ fontSize: 24 }}>🏛️</Text>
            <View style={styles.bankBadge}>
              <Text style={styles.bankBadgeText}>Verified Account</Text>
            </View>
          </View>
          <Text style={styles.bankName}>{bankDetails.bankName || 'HDFC Bank'}</Text>
          <Text style={styles.accountNumber}>
            A/C: •••• •••• {bankDetails.accountNumber ? bankDetails.accountNumber.slice(-4) : '1928'}
          </Text>
          <Text style={styles.ifscCode}>
            IFSC: {bankDetails.ifscCode || 'HDFC0001234'} • Name: {bankDetails.accountHolderName || partner?.name}
          </Text>
          {bankDetails.upiId ? (
            <Text style={styles.upiText}>UPI ID: {bankDetails.upiId}</Text>
          ) : null}
        </View>

        {/* Withdrawal Form */}
        <View style={styles.formCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available for Withdrawal:</Text>
            <Text style={styles.balanceValue}>{formatPrice(availableForPayout)}</Text>
          </View>

          <CustomInput
            label="Withdrawal Amount (₹)"
            required
            keyboardType="number-pad"
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="Min ₹100, Max ₹10,000 per request"
            leftIcon="₹"
          />

          <View style={styles.quickChipsRow}>
            {[500, 1000, availableForPayout].map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.chip}
                onPress={() => setAmountInput(String(Math.min(v, availableForPayout)))}>
                <Text style={styles.chipText}>₹{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <CustomButton
            title="Request Instant Bank Transfer ⚡"
            variant="primary"
            size="large"
            loading={requesting}
            onPress={handleRequestPayout}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Payout History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settlement History</Text>
        </View>

        {payouts.map((item, idx) => (
          <View key={item._id || item.payoutId || idx} style={styles.payoutCard}>
            <View style={styles.payoutTop}>
              <Text style={styles.payoutId}>{item.payoutId}</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      item.status === 'completed'
                        ? '#D1FAE5'
                        : item.status === 'pending'
                        ? '#FEF3C7'
                        : '#FEE2E2',
                  },
                ]}>
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color:
                        item.status === 'completed'
                          ? '#059669'
                          : item.status === 'pending'
                          ? '#D97706'
                          : '#DC2626',
                    },
                  ]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.payoutBottom}>
              <View>
                <Text style={styles.payoutMethod}>
                  {item.payoutMethod} • {item.referenceNumber ? `UTR: ${item.referenceNumber}` : 'Processing'}
                </Text>
                <Text style={styles.payoutDate}>{formatDate(item.requestedAt)}</Text>
              </View>
              <Text style={styles.payoutAmount}>{formatPrice(item.amount)}</Text>
            </View>
          </View>
        ))}
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
  bankCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bankBadge: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bankBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  bankName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
  },
  accountNumber: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  ifscCode: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
  },
  upiText: {
    fontSize: 11,
    color: '#2DD4BF',
    marginTop: 4,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  payoutCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  payoutId: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  payoutBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  payoutMethod: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  payoutDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
});

export default PayoutsScreen;

