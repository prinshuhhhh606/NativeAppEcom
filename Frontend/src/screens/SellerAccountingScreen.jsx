import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import DashboardStatCard from '../components/seller/DashboardStatCard';
import LoadingSkeleton from '../components/seller/LoadingSkeleton';
import sellerService from '../services/sellerService';
import { formatPrice } from '../utils/helpers';
import styles from './SellerAccountingScreen.styles';

export const SellerAccountingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gstData, setGstData] = useState(null);
  const [settlementData, setSettlementData] = useState(null);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchAccounting = useCallback(async () => {
    try {
      const [gstRes, setRes] = useState = await Promise.all([
        sellerService.getGstReport(selectedMonth, selectedYear),
        sellerService.getSettlements(),
      ]);
      setGstData(gstRes.data || gstRes);
      setSettlementData(setRes.data || setRes);
    } catch (err) {
      console.warn('Accounting load warning:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAccounting();
  }, [fetchAccounting]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounting();
  };

  const gst = gstData?.gstSummary || gstData || {};
  const settlements = settlementData?.settlements || [];
  const balance = settlementData?.balance || {};

  return (
    <View style={styles.container}>
      <SellerHeader
        title="GST & Accounting"
        subtitle="Indian GSTR-1 & Bank Settlements"
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }>
        {/* Month Selector Bar */}
        <View style={styles.periodBar}>
          <Text style={styles.periodLabel}>Filing Period:</Text>
          <View style={styles.periodBadge}>
            <Text style={styles.periodText}>
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : (
          <>
            {/* Top Stat Cards */}
            <View style={styles.row}>
              <DashboardStatCard
                label="Gross Taxable Sales"
                value={formatPrice(gst.totalTaxableValue || gst.totalSales || 0)}
                subtext="Eligible GSTR invoices"
                iconName="receipt-outline"
                iconColor="#2563EB"
                style={styles.half}
              />
              <DashboardStatCard
                label="Total GST Collected"
                value={formatPrice(gst.totalGst || 0)}
                subtext="CGST + SGST + IGST"
                iconName="calculator-outline"
                iconColor="#059669"
                style={styles.half}
              />
            </View>

            {/* GST Tax Breakdown Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AppIcon name="shield-checkmark" size={18} color="#059669" />
                <Text style={styles.sectionTitle}>GSTR Tax Ledger Breakdown</Text>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLeft}>
                  <Text style={styles.taxKey}>CGST (Intra-State Central Tax):</Text>
                  <Text style={styles.taxDesc}>Applies to deliveries within your home state</Text>
                </View>
                <Text style={styles.taxVal}>{formatPrice(gst.totalCgst || 0)}</Text>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLeft}>
                  <Text style={styles.taxKey}>SGST (Intra-State State Tax):</Text>
                  <Text style={styles.taxDesc}>Applies to deliveries within your home state</Text>
                </View>
                <Text style={styles.taxVal}>{formatPrice(gst.totalSgst || 0)}</Text>
              </View>

              <View style={[styles.taxRow, { borderBottomWidth: 0 }]}>
                <View style={styles.taxLeft}>
                  <Text style={styles.taxKey}>IGST (Inter-State Tax):</Text>
                  <Text style={styles.taxDesc}>Applies to all Pan-India cross-state shipments</Text>
                </View>
                <Text style={styles.taxVal}>{formatPrice(gst.totalIgst || 0)}</Text>
              </View>
            </View>

            {/* Bank Settlements & Payouts Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AppIcon name="wallet" size={18} color="#7C3AED" />
                <Text style={styles.sectionTitle}>Bank Settlements & Balance</Text>
              </View>

              <View style={styles.balanceBox}>
                <View>
                  <Text style={styles.balanceLabel}>Available for Bank Transfer</Text>
                  <Text style={styles.balanceVal}>
                    {formatPrice(balance.available || 0)}
                  </Text>
                </View>
                <View style={styles.settleBadge}>
                  <Text style={styles.settleBadgeText}>T+2 Cycle</Text>
                </View>
              </View>

              <Text style={styles.subHeading}>Recent Settlement Batches</Text>
              {settlements.length === 0 ? (
                <Text style={styles.emptyText}>
                  Settlements are processed automatically 48 hours after customer delivery confirmation.
                </Text>
              ) : (
                settlements.slice(0, 3).map((item, idx) => (
                  <View key={idx} style={styles.settlementRow}>
                    <View>
                      <Text style={styles.settlementRef}>Ref: {item.reference || `SET-${idx + 1}`}</Text>
                      <Text style={styles.settlementDate}>
                        {new Date(item.date || Date.now()).toLocaleDateString()} • Bank Transfer
                      </Text>
                    </View>
                    <Text style={styles.settlementAmount}>{formatPrice(item.amount || 0)}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default SellerAccountingScreen;

