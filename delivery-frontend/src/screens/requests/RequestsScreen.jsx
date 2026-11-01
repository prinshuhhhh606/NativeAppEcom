import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/common/CustomHeader';
import RequestCard from '../../components/cards/RequestCard';
import Colors from '../../constants/colors';
import { useDelivery } from '../../context/DeliveryContext';

export const RequestsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { requests, loading, fetchRequests, acceptRequest, declineRequest } = useDelivery();

  const handleAccept = async (req) => {
    try {
      await acceptRequest(req.assignmentId || req._id);
      navigation.navigate('Deliveries');
    } catch (e) {
      // handled in context
    }
  };

  const handleDecline = (req) => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this delivery request? Store will reassign.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => declineRequest(req.assignmentId || req._id, 'Rider declined assignment'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Delivery Requests"
        subtitle={`${requests.length} incoming request${requests.length !== 1 ? 's' : ''}`}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>No Pending Requests</Text>
            <Text style={styles.emptySub}>
              You have reviewed all incoming delivery requests. Stay online to receive instant dispatches from nearby merchants.
            </Text>
          </View>
        ) : (
          requests.map((item) => (
            <RequestCard
              key={item.assignmentId || item._id}
              request={item}
              onAccept={() => handleAccept(item)}
              onDecline={() => handleDecline(item)}
            />
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
  content: {
    padding: 16,
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
});

export default RequestsScreen;

