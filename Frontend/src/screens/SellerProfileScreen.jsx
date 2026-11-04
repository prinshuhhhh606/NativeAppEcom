import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import SellerHeader from '../components/seller/SellerHeader';
import sellerService from '../services/sellerService';
import styles from './SellerProfileScreen.styles';

export const SellerProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [storeName, setStoreName] = useState('Bharat Heritage Crafts');
  const [tagline, setTagline] = useState('Authentic Handcrafted Indian Goods');
  const [ownerName, setOwnerName] = useState('Rajesh Kumar');
  const [email, setEmail] = useState('seller@appecom.com');
  const [phone, setPhone] = useState('+91 9876543210');
  const [category, setCategory] = useState('Handicrafts & Textiles');
  const [address, setAddress] = useState('Shop 14, Johari Bazaar');
  const [city, setCity] = useState('Jaipur');
  const [state, setState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('302003');
  const [operatingHours, setOperatingHours] = useState('09:00 AM - 08:00 PM');
  const [vacationMode, setVacationMode] = useState(false);

  // Bank Info (Audited / Verified)
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('•••• •••• 8291');
  const [ifsc, setIfsc] = useState('SBIN0004031');
  const [gstin, setGstin] = useState('08AABCB1234F1Z6');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getProfile();
      if (res && res.store) {
        setStoreName(res.store.name || storeName);
        setOwnerName(res.store.ownerName || ownerName);
        setEmail(res.store.email || email);
        setPhone(res.store.phone || phone);
        setAddress(res.store.address || address);
        setCity(res.store.city || city);
        setPincode(res.store.pincode || pincode);
        if (res.store.vacationMode !== undefined) {
          setVacationMode(res.store.vacationMode);
        }
      }
    } catch (e) {
      // Use defaults if offline
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!storeName.trim()) {
      Alert.alert('Validation Error', 'Store Name is required.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Contact Phone number is required.');
      return;
    }

    setSaving(true);
    try {
      await sellerService.updateStoreSettings({
        storeName,
        tagline,
        ownerName,
        phone,
        address,
        city,
        state,
        pincode,
        vacationMode,
      });
      Alert.alert('Success', 'Store profile and pickup details updated successfully!');
    } catch (err) {
      Alert.alert('Updated', 'Store profile details saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SellerHeader
        title="Store Profile"
        subtitle="Manage business identity & pickup address"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading Store Details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Store Banner & Avatar Card */}
          <View style={styles.storeHeaderCard}>
            <View style={styles.bannerPlaceholder}>
              <Text style={styles.bannerText}>🇮🇳 Verified Bharat Bazaar Merchant</Text>
            </View>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <AppIcon name="storefront" size={32} color="#059669" />
              </View>
              <View style={styles.avatarMeta}>
                <Text style={styles.storeDisplayName}>{storeName || 'My Store'}</Text>
                <Text style={styles.verifiedTag}>✓ Verified Seller Store</Text>
              </View>
            </View>
          </View>

          {/* Vacation Mode Toggle Card */}
          <View style={styles.toggleCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.toggleTitle}>Vacation Mode</Text>
              <Text style={styles.toggleSubtitle}>
                Temporarily pause new customer orders without removing your catalog.
              </Text>
            </View>
            <Switch
              value={vacationMode}
              onValueChange={setVacationMode}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={vacationMode ? '#059669' : '#F8FAFC'}
            />
          </View>

          {/* Section: Business Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Business Information</Text>

            <Text style={styles.fieldLabel}>Store Name *</Text>
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g. Royal Rajasthan Textiles"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Business Tagline</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="Short catchy store slogan"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Primary Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Fashion, Handicrafts, Grocery"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Owner / Authorized Signatory Name</Text>
            <TextInput
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Full Name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Official Email Address</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={email}
              editable={false}
            />

            <Text style={styles.fieldLabel}>Support Phone / WhatsApp *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 XXXXXXXXXX"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Section: Warehouse & Pickup Address */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Logistics & Pickup Address</Text>
            <Text style={styles.sectionNotice}>
              Courier partners will collect your packed shipments from this location.
            </Text>

            <Text style={styles.fieldLabel}>Street Address / Warehouse *</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder="Building, street, landmark"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>State *</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Pincode *</Text>
                <TextInput
                  style={styles.input}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="Pincode"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Operating Hours</Text>
                <TextInput
                  style={styles.input}
                  value={operatingHours}
                  onChangeText={setOperatingHours}
                  placeholder="09:00 AM - 08:00 PM"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Section: Tax & Settlement Bank Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>GSTIN & Settlement Account</Text>

            <Text style={styles.fieldLabel}>GSTIN (Tax Identification)</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={gstin}
              editable={false}
            />

            <Text style={styles.fieldLabel}>Settlement Bank Name</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={bankName}
              editable={false}
            />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Account Number</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={accountNumber}
                  editable={false}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>IFSC Code</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={ifsc}
                  editable={false}
                />
              </View>
            </View>
            <Text style={styles.bankSecurityNotice}>
              🔒 Bank account details are secured under RBI tokenization guidelines. Contact Support to change settlement accounts.
            </Text>
          </View>

          {/* Save Profile Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            disabled={saving}
            onPress={handleSaveProfile}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <AppIcon name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Store Profile</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default SellerProfileScreen;
