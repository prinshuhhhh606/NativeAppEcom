import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import sellerService from '../services/sellerService';
import { useAuth } from '../context/AuthContext';
import styles from './SellerSettingsScreen.styles';

export const SellerSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store Automation
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationNotice, setVacationNotice] = useState('Store temporarily on leave. Back soon!');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('30');
  const [cutoffTime, setCutoffTime] = useState('18:00');
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);

  // 3KM to 20KM Radius Zones
  const [zone3kmFee, setZone3kmFee] = useState('30');
  const [zone5kmFee, setZone5kmFee] = useState('50');
  const [zone10kmFee, setZone10kmFee] = useState('80');
  const [zone20kmFee, setZone20kmFee] = useState('120');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('499');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [autoRes, zoneRes] = await Promise.all([
          sellerService.getStoreAutomation(),
          sellerService.getDeliveryZones(),
        ]);
        const auto = autoRes?.storeAutomation || autoRes?.data || {};
        const zones = zoneRes?.zones || zoneRes?.deliverySettings?.zones || {};

        setVacationMode(auto.vacationMode?.enabled ?? false);
        setVacationNotice(auto.vacationMode?.notice || 'Store temporarily on leave. Back soon!');
        setPrepTimeMinutes(String(auto.orderPrepTimeMinutes || 30));
        setCutoffTime(auto.dailyCutoffTime || '18:00');
        setAutoAcceptOrders(auto.autoAcceptOrders ?? true);

        if (zones.zone3km) setZone3kmFee(String(zones.zone3km.fee || 30));
        if (zones.zone5km) setZone5kmFee(String(zones.zone5km.fee || 50));
        if (zones.zone10km) setZone10kmFee(String(zones.zone10km.fee || 80));
        if (zones.zone20km) setZone20kmFee(String(zones.zone20km.fee || 120));
        if (zones.freeShippingThreshold) {
          setFreeShippingThreshold(String(zones.freeShippingThreshold || 499));
        }
      } catch (e) {
        console.warn('Failed to load automation settings', e?.message);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAutomation = async () => {
    setSaving(true);
    try {
      await Promise.all([
        sellerService.updateStoreAutomation({
          vacationMode: {
            enabled: vacationMode,
            notice: vacationNotice,
          },
          orderPrepTimeMinutes: parseInt(prepTimeMinutes, 10) || 30,
          dailyCutoffTime: cutoffTime,
          autoAcceptOrders,
        }),
        sellerService.updateDeliveryZones({
          zones: {
            zone3km: { fee: parseInt(zone3kmFee, 10) || 30 },
            zone5km: { fee: parseInt(zone5kmFee, 10) || 50 },
            zone10km: { fee: parseInt(zone10kmFee, 10) || 80 },
            zone20km: { fee: parseInt(zone20kmFee, 10) || 120 },
            freeShippingThreshold: parseInt(freeShippingThreshold, 10) || 499,
          },
        }),
      ]);
      Alert.alert('Settings Saved', 'Store automation and delivery zone rules updated successfully!');
    } catch (e) {
      Alert.alert('Save Error', e?.message || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Store Settings"
        subtitle="Automation & Delivery Zones"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Vacation Mode Section */}
            <View style={styles.sectionCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Vacation Mode</Text>
                  <Text style={styles.sectionDesc}>
                    Pause incoming orders while keeping your listing ranking and reviews intact.
                  </Text>
                </View>
                <Switch
                  value={vacationMode}
                  onValueChange={setVacationMode}
                  trackColor={{ false: '#CBD5E1', true: '#059669' }}
                />
              </View>

              {vacationMode ? (
                <View style={styles.vacationInputBox}>
                  <Text style={styles.fieldLabel}>Customer Notice Banner:</Text>
                  <TextInput
                    style={styles.input}
                    value={vacationNotice}
                    onChangeText={setVacationNotice}
                    placeholder="Notice shown to shoppers..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              ) : null}
            </View>

            {/* Operating Hours & Dispatch SLA */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Operating Hours & Prep SLAs</Text>
              <Text style={styles.sectionDesc}>
                Set preparation times and daily cut-offs for dispatch SLA compliance.
              </Text>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Prep Time (Minutes):</Text>
                  <TextInput
                    style={styles.input}
                    value={prepTimeMinutes}
                    onChangeText={setPrepTimeMinutes}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Daily Cut-off Time:</Text>
                  <TextInput
                    style={styles.input}
                    value={cutoffTime}
                    onChangeText={setCutoffTime}
                    placeholder="18:00"
                  />
                </View>
              </View>

              <View style={[styles.toggleRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Auto-Accept Orders</Text>
                  <Text style={styles.toggleDesc}>Instantly accept new customer orders upon placement</Text>
                </View>
                <Switch
                  value={autoAcceptOrders}
                  onValueChange={setAutoAcceptOrders}
                  trackColor={{ false: '#CBD5E1', true: '#059669' }}
                />
              </View>
            </View>

            {/* Radius Delivery Zones (3KM - 20KM) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Radius Delivery Zones (3KM – 20KM)</Text>
              <Text style={styles.sectionDesc}>
                Area delivery fee rates and free shipping threshold.
              </Text>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Zone 1 (0 – 3 KM):</Text>
                  <TextInput
                    style={styles.input}
                    value={zone3kmFee}
                    onChangeText={setZone3kmFee}
                    keyboardType="numeric"
                    placeholder="₹ 30"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Zone 2 (3 – 5 KM):</Text>
                  <TextInput
                    style={styles.input}
                    value={zone5kmFee}
                    onChangeText={setZone5kmFee}
                    keyboardType="numeric"
                    placeholder="₹ 50"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Zone 3 (5 – 10 KM):</Text>
                  <TextInput
                    style={styles.input}
                    value={zone10kmFee}
                    onChangeText={setZone10kmFee}
                    keyboardType="numeric"
                    placeholder="₹ 80"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Zone 4 (10 – 20 KM):</Text>
                  <TextInput
                    style={styles.input}
                    value={zone20kmFee}
                    onChangeText={setZone20kmFee}
                    keyboardType="numeric"
                    placeholder="₹ 120"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Free Shipping Threshold (₹):</Text>
              <TextInput
                style={styles.input}
                value={freeShippingThreshold}
                onChangeText={setFreeShippingThreshold}
                keyboardType="numeric"
                placeholder="₹ 499"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveAutomation}
              disabled={saving}
              activeOpacity={0.8}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save All Settings</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default SellerSettingsScreen;

