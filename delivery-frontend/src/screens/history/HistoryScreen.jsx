import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Colors from '../../constants/colors';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice, formatDate } from '../../utils/helpers';

export const HistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getHistory({
        status: statusFilter,
        search,
      });
      setHistory(res.data?.history || res.history || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Trips' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'delivery_failed', label: 'Failed' },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader title="Delivery History" showBack navigation={navigation} />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadHistory}
          placeholder="Search by Order # or customer name..."
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={loadHistory}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, statusFilter === t.id && styles.tabActive]}
            onPress={() => setStatusFilter(t.id)}>
            <Text style={[styles.tabText, statusFilter === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📜</Text>
            <Text style={styles.emptyTitle}>No past deliveries found</Text>
            <Text style={styles.emptySub}>Delivered trips will appear here with timestamps and earnings.</Text>
          </View>
        ) : (
          history.map((del) => (
            <View key={del._id || del.deliveryNumber} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>#{del.orderNumber || del.deliveryNumber}</Text>
                  <Text style={styles.storeName}>
                    {del.pickupAddress?.storeName || 'Jaipur Heritage Handlooms'}
                  </Text>
                </View>
                <StatusBadge status={del.status} />
              </View>

              <View style={styles.addressRow}>
                <Text style={{ fontSize: 12 }}>📍</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {del.deliveryAddress?.fullName || 'Customer'} • {del.deliveryAddress?.addressLine || 'City Area'}, {del.deliveryAddress?.city}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.dateText}>{formatDate(del.deliveredAt || del.createdAt)}</Text>
                <Text style={styles.feeText}>+{formatPrice(del.deliveryFee || 65)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  searchBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  storeName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
  },
  dateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.success,
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default HistoryScreen;

