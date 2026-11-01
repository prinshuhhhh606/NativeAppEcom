import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Vibration } from 'react-native';
import { deliveryService } from '../services/deliveryService';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

export const DeliveryContext = createContext();

export const DeliveryProvider = ({ children }) => {
  const { partner, isAuthenticated, isApproved } = useAuth();

  const [isOnline, setIsOnline] = useState(partner?.availability === 'online' || true);
  const [requests, setRequests] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync state when partner data changes
  useEffect(() => {
    if (partner) {
      setIsOnline(partner.availability === 'online');
    }
  }, [partner]);

  // Load operational data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOperationsData();

      // Listen for real-time delivery assignments
      socketService.onNewAssignment((data) => {
        try {
          Vibration.vibrate([0, 500, 200, 500]);
        } catch (e) {}
        Alert.alert(
          '🔔 New Delivery Request!',
          `Store ${data.storeName || 'Vendor'} assigned Order #${data.orderNumber} to you. Fee: ₹${data.deliveryFee || 65}`,
          [{ text: 'View Request', onPress: () => fetchRequests() }]
        );
        fetchRequests();
      });

      socketService.onCancelled((data) => {
        Alert.alert('Notice', `Delivery request #${data.orderNumber} was cancelled by store.`);
        fetchRequests();
      });
    }
  }, [isAuthenticated]);

  const fetchOperationsData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDashboard(), fetchRequests(), fetchActiveDeliveries()]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await deliveryService.getDashboard();
      if (res.data) setDashboardData(res.data);
    } catch (e) {
      // ignore
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await deliveryService.getRequests();
      const list = res.data?.requests || res.requests || [];
      setRequests(list);
    } catch (e) {
      // ignore
    }
  };

  const fetchActiveDeliveries = async () => {
    try {
      const res = await deliveryService.getActiveDeliveries();
      const list = res.data?.deliveries || res.deliveries || res.tasks || [];
      setActiveDeliveries(list);
    } catch (e) {
      // ignore
    }
  };

  // Toggle Availability
  const toggleAvailability = async () => {
    if (!isApproved && !isOnline) {
      Alert.alert(
        'Approval Required',
        'Your documents are under review. You will be able to go online once approved by Admin.'
      );
      return;
    }

    const newTarget = isOnline ? 'offline' : 'online';
    try {
      await deliveryService.updateAvailability(newTarget);
      setIsOnline(newTarget === 'online');
      Alert.alert('Status Updated', `You are now ${newTarget.toUpperCase()}`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update availability');
    }
  };

  // Accept incoming request
  const acceptRequest = async (assignmentId) => {
    try {
      const res = await deliveryService.acceptRequest(assignmentId);
      Alert.alert('🎉 Delivery Accepted!', 'Head to the vendor store for package pickup.');
      fetchRequests();
      fetchActiveDeliveries();
      return res;
    } catch (e) {
      Alert.alert('Acceptance Failed', e.message || 'Could not accept delivery request');
      throw e;
    }
  };

  // Decline incoming request
  const declineRequest = async (assignmentId, reason) => {
    try {
      const res = await deliveryService.declineRequest(assignmentId, reason);
      setRequests((prev) => prev.filter((r) => r.assignmentId !== assignmentId && r._id !== assignmentId));
      return res;
    } catch (e) {
      Alert.alert('Decline Failed', e.message || 'Could not decline request');
      throw e;
    }
  };

  // Verify Pickup OTP
  const verifyPickupOtp = async (deliveryId, otp) => {
    try {
      const res = await deliveryService.verifyPickupOtp(deliveryId, otp);
      Alert.alert('✓ Pickup Verified', 'Package marked picked up. Proceed to customer doorstep.');
      fetchActiveDeliveries();
      return res;
    } catch (e) {
      Alert.alert('Pickup Verification Failed', e.message || 'Incorrect store pickup OTP');
      throw e;
    }
  };

  // Verify Delivery OTP
  const verifyDeliveryOtp = async (deliveryId, data) => {
    try {
      const res = await deliveryService.verifyDeliveryOtp(deliveryId, data);
      Alert.alert('🎉 Order Delivered!', 'Customer verified OTP. Delivery earnings credited to your wallet.');
      fetchActiveDeliveries();
      fetchDashboard();
      return res;
    } catch (e) {
      Alert.alert('Verification Failed', e.message || 'Incorrect customer delivery OTP');
      throw e;
    }
  };

  // Report Issue
  const reportFailure = async (deliveryId, data) => {
    try {
      const res = await deliveryService.reportFailure(deliveryId, data);
      Alert.alert('Issue Submitted', 'Dispatch team has been notified.');
      fetchActiveDeliveries();
      return res;
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not report issue');
      throw e;
    }
  };

  return (
    <DeliveryContext.Provider
      value={{
        isOnline,
        toggleAvailability,
        requests,
        activeDeliveries,
        dashboardData,
        loading,
        fetchOperationsData,
        fetchRequests,
        fetchActiveDeliveries,
        acceptRequest,
        declineRequest,
        verifyPickupOtp,
        verifyDeliveryOtp,
        reportFailure,
      }}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => useContext(DeliveryContext);
export default DeliveryContext;

