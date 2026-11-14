
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { Alert, Vibration } from 'react-native';

import { deliveryService } from '../services/deliveryService';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

export const DeliveryContext = createContext(null);

// Normalize API response.
// api.js response interceptor already returns response.data.
const getPayload = (response) => {
  if (!response || typeof response !== 'object') {
    return {};
  }

  return response.data &&
    typeof response.data === 'object'
    ? response.data
    : response;
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.message ||
    error?.response?.data?.message ||
    fallback
  );
};

const getAssignmentId = (item) => {
  return String(
    item?.assignmentId ||
    item?._id ||
    item?.id ||
    ''
  );
};

export const DeliveryProvider = ({ children }) => {
  const { partner, isAuthenticated, isApproved } = useAuth();

  const [isOnline, setIsOnline] = useState(
    partner?.availability === 'online'
  );

  const [requests, setRequests] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync availability with authenticated partner.
  useEffect(() => {
    if (partner) {
      setIsOnline(partner.availability === 'online');
    } else {
      setIsOnline(false);
    }
  }, [partner]);

  // Fetch dashboard.
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await deliveryService.getDashboard();
      const data = getPayload(response);

      setDashboardData(
        data.dashboard ||
        data.stats ||
        data
      );

      return data;
    } catch (error) {
      console.warn(
        '[DeliveryContext] Dashboard fetch failed:',
        getErrorMessage(error, 'Unknown error')
      );

      return null;
    }
  }, []);

  // Fetch incoming requests.
  const fetchRequests = useCallback(async () => {
    try {
      const response = await deliveryService.getRequests();
      const data = getPayload(response);

      const list =
        data.requests ||
        data.assignments ||
        data.items ||
        [];

      setRequests(Array.isArray(list) ? list : []);

      return list;
    } catch (error) {
      console.warn(
        '[DeliveryContext] Requests fetch failed:',
        getErrorMessage(error, 'Unknown error')
      );

      return [];
    }
  }, []);

  // Fetch active deliveries.
  const fetchActiveDeliveries = useCallback(async () => {
    try {
      const response =
        await deliveryService.getActiveDeliveries();

      const data = getPayload(response);

      const list =
        data.deliveries ||
        data.tasks ||
        data.items ||
        [];

      setActiveDeliveries(
        Array.isArray(list) ? list : []
      );

      return list;
    } catch (error) {
      console.warn(
        '[DeliveryContext] Active deliveries fetch failed:',
        getErrorMessage(error, 'Unknown error')
      );

      return [];
    }
  }, []);

  // Fetch all operational data.
  const fetchOperationsData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);

    try {
      await Promise.all([
        fetchDashboard(),
        fetchRequests(),
        fetchActiveDeliveries(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    fetchDashboard,
    fetchRequests,
    fetchActiveDeliveries,
  ]);

  // Load data and register socket listeners.
  useEffect(() => {
    if (!isAuthenticated) {
      setRequests([]);
      setActiveDeliveries([]);
      setDashboardData(null);
      setLoading(false);
      return undefined;
    }

    fetchOperationsData();

    const handleNewAssignment = (eventData = {}) => {
      console.log(
        '[DeliveryContext] New assignment received:',
        eventData
      );

      try {
        Vibration.vibrate([0, 500, 200, 500]);
      } catch (error) {
        console.warn('Vibration unavailable:', error);
      }

      const data = getPayload(eventData);

      Alert.alert(
        'New Delivery Request!',
        `Store: ${data.storeName || data.sellerStoreName || 'Vendor'}\nOrder: #${data.orderNumber || 'New Order'}\nDelivery Fee: ₹${data.deliveryFee || data.deliveryCharge || 65}`,
        [
          {
            text: 'View Request',
            onPress: () => {
              fetchRequests();
            },
          },
          {
            text: 'Later',
            style: 'cancel',
          },
        ]
      );

      fetchRequests();
    };

    const handleCancelled = (eventData = {}) => {
      console.log(
        '[DeliveryContext] Assignment cancelled:',
        eventData
      );

      const data = getPayload(eventData);

      const cancelledId = String(
        data.assignmentId ||
        data._id ||
        data.id ||
        ''
      );

      if (cancelledId) {
        setRequests((previous) =>
          previous.filter(
            (item) => getAssignmentId(item) !== cancelledId
          )
        );
      }

      Alert.alert(
        'Delivery Request Cancelled',
        `Order #${data.orderNumber || ''} was cancelled by the store.`
      );

      fetchRequests();
    };

    const unsubscribeNewAssignment =
      socketService.onNewAssignment(handleNewAssignment);

    const unsubscribeCancelled =
      socketService.onCancelled(handleCancelled);

    return () => {
      if (typeof unsubscribeNewAssignment === 'function') {
        unsubscribeNewAssignment();
      }

      if (typeof unsubscribeCancelled === 'function') {
        unsubscribeCancelled();
      }
    };
  }, [
    isAuthenticated,
    fetchOperationsData,
    fetchRequests,
  ]);

  // Toggle online/offline availability.
  const toggleAvailability = useCallback(async () => {
    const goingOnline = !isOnline;

    if (goingOnline && !isApproved) {
      Alert.alert(
        'Approval Required',
        'Your documents are under review. You can go online after Admin approval.'
      );

      return;
    }

    const newStatus = goingOnline ? 'online' : 'offline';

    try {
      await deliveryService.updateAvailability(newStatus);

      setIsOnline(goingOnline);

      Alert.alert(
        'Status Updated',
        `You are now ${newStatus.toUpperCase()}`
      );
    } catch (error) {
      Alert.alert(
        'Availability Update Failed',
        getErrorMessage(
          error,
          'Could not update availability'
        )
      );
    }
  }, [isOnline, isApproved]);

  // Accept incoming delivery request.
  const acceptRequest = useCallback(
    async (assignmentId) => {
      if (!assignmentId) {
        throw new Error('Assignment ID is missing');
      }

      try {
        const response =
          await deliveryService.acceptRequest(assignmentId);

        // Wait until both lists are refreshed.
        await Promise.all([
          fetchRequests(),
          fetchActiveDeliveries(),
          fetchDashboard(),
        ]);

        Alert.alert(
          'Delivery Accepted!',
          'Head to the vendor store for package pickup.'
        );

        return response;
      } catch (error) {
        Alert.alert(
          'Acceptance Failed',
          getErrorMessage(
            error,
            'Could not accept delivery request'
          )
        );

        throw error;
      }
    },
    [
      fetchRequests,
      fetchActiveDeliveries,
      fetchDashboard,
    ]
  );

  // Decline incoming delivery request.
  const declineRequest = useCallback(
    async (assignmentId, reason) => {
      if (!assignmentId) {
        throw new Error('Assignment ID is missing');
      }

      try {
        const response =
          await deliveryService.declineRequest(
            assignmentId,
            reason
          );

        setRequests((previous) =>
          previous.filter(
            (item) =>
              getAssignmentId(item) !== String(assignmentId)
          )
        );

        await fetchRequests();

        return response;
      } catch (error) {
        Alert.alert(
          'Decline Failed',
          getErrorMessage(
            error,
            'Could not decline delivery request'
          )
        );

        throw error;
      }
    },
    [fetchRequests]
  );

  // Verify pickup OTP.
  const verifyPickupOtp = useCallback(
    async (deliveryId, otp) => {
      try {
        const response =
          await deliveryService.verifyPickupOtp(
            deliveryId,
            otp
          );

        await fetchActiveDeliveries();

        Alert.alert(
          'Handover Verified',
          'Order successfully handed over to you! Proceed to customer doorstep.'
        );

        return response;
      } catch (error) {
        Alert.alert(
          'Handover Verification Failed',
          getErrorMessage(
            error,
            'Incorrect Delivery Handover OTP'
          )
        );

        throw error;
      }
    },
    [fetchActiveDeliveries]
  );

  // Verify customer delivery OTP.
  const verifyDeliveryOtp = useCallback(
    async (deliveryId, data) => {
      try {
        const response =
          await deliveryService.verifyDeliveryOtp(
            deliveryId,
            data
          );

        await Promise.all([
          fetchActiveDeliveries(),
          fetchDashboard(),
        ]);

        Alert.alert(
          'Order Delivered!',
          'Customer verified OTP. Delivery earnings have been updated.'
        );

        return response;
      } catch (error) {
        Alert.alert(
          'Verification Failed',
          getErrorMessage(
            error,
            'Incorrect customer delivery OTP'
          )
        );

        throw error;
      }
    },
    [
      fetchActiveDeliveries,
      fetchDashboard,
    ]
  );

  // Report delivery failure.
  const reportFailure = useCallback(
    async (deliveryId, data) => {
      try {
        const response =
          await deliveryService.reportFailure(
            deliveryId,
            data
          );

        await Promise.all([
          fetchActiveDeliveries(),
          fetchDashboard(),
        ]);

        Alert.alert(
          'Issue Submitted',
          'Dispatch team has been notified.'
        );

        return response;
      } catch (error) {
        Alert.alert(
          'Issue Submission Failed',
          getErrorMessage(
            error,
            'Could not report delivery issue'
          )
        );

        throw error;
      }
    },
    [
      fetchActiveDeliveries,
      fetchDashboard,
    ]
  );

  const value = {
    isOnline,
    toggleAvailability,

    requests,
    activeDeliveries,
    dashboardData,
    loading,

    fetchOperationsData,
    fetchDashboard,
    fetchRequests,
    fetchActiveDeliveries,

    acceptRequest,
    declineRequest,

    verifyPickupOtp,
    verifyDeliveryOtp,
    reportFailure,
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);

  if (!context) {
    throw new Error(
      'useDelivery must be used inside DeliveryProvider'
    );
  }

  return context;
};

export default DeliveryContext;
