import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './AddressScreen.styles';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import AppIcon from '../components/AppIcon';
import { Colors } from '../constants/colors';
import { addressService } from '../services/addressService';
import { useAuth } from '../context/AuthContext';

export const AddressScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { onSelectAddress, selectedId } = route.params || {};
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        loadAddresses();
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (e) {
      console.warn('Error loading addresses', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item) => {
    await addressService.setSelectedCheckoutAddress(item);
    if (onSelectAddress) {
      onSelectAddress(item);
      navigation.goBack();
    } else {
      await addressService.setDefaultAddress(item.id || item._id);
      loadAddresses();
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await addressService.deleteAddress(id);
          loadAddresses();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title={onSelectAddress ? 'Select Delivery Address' : 'Delivery Addresses'}
        showBack
        navigation={navigation}
      />

      {!isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="location-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>Sign In to Manage Addresses</Text>
          <Text style={styles.emptySubtitle}>
            Save multiple delivery addresses for fast and seamless Pan India checkout.
          </Text>
          <CustomButton
            title="Sign In / Register"
            size="large"
            onPress={() => navigation.navigate('Login', { redirectTo: 'Address' })}
            style={{ width: 200 }}
          />
        </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary, fontWeight: '600' }}>
            Loading saved addresses...
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={addresses}
            keyExtractor={(item) => String(item.id || item._id)}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + 90 },
            ]}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { marginTop: 40 }]}>
                <AppIcon name="location-outline" size={56} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>No Saved Addresses</Text>
                <Text style={styles.emptySubtitle}>
                  You have not added any delivery address yet. Add your first address to proceed with checkout.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedId
                ? item.id === selectedId || item._id === selectedId
                : item.isDefault;
              return (
                <TouchableOpacity
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.85}>
                  <View style={styles.topRow}>
                    <View style={styles.typeBadge}>
                      <AppIcon
                        name={item.addressType === 'Home' ? 'home-outline' : 'cube-outline'}
                        size={14}
                        color="#616161"
                      />
                      <Text style={styles.typeText}>{item.addressType || 'Home'}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {item.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>DEFAULT</Text>
                        </View>
                      )}
                      {onSelectAddress && (
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: isSelected ? Colors.primary : Colors.borderLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          {isSelected && (
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: Colors.primary,
                              }}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.addressText}>{item.streetAddress || item.addressLine1}</Text>
                  {item.landmark ? (
                    <Text style={styles.addressText}>Landmark: {item.landmark}</Text>
                  ) : null}
                  <Text style={styles.addressText}>
                    {item.city}, {item.state} - {item.pincode || item.pinCode}
                  </Text>
                  <Text style={styles.phoneText}>Mobile: +91 {item.mobileNumber || item.phone}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('AddAddress', {
                          addressToEdit: item,
                        })
                      }>
                      <Text style={[styles.actionText, { color: Colors.primary }]}>Edit</Text>
                    </TouchableOpacity>

                    {!item.isDefault && (
                      <TouchableOpacity
                        onPress={() =>
                          addressService
                            .setDefaultAddress(item.id || item._id)
                            .then(loadAddresses)
                        }>
                        <Text style={styles.actionText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => handleDelete(item.id || item._id)}>
                      <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View
            style={[
              styles.bottomSticky,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}>
            <CustomButton
              title="+ Add New Delivery Address"
              size="large"
              onPress={() => navigation.navigate('AddAddress')}
            />
          </View>
        </>
      )}
    </View>
  );
};

export default AddressScreen;
