import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  BackHandler,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './TrackOrderScreen.styles';
import Header from '../components/Header';
import AppIcon from '../components/AppIcon';
import CustomButton from '../components/CustomButton';
import Loading from '../components/Loading';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { orderService } from '../services/orderService';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

// Normalized rank hierarchy for 7-milestone tracking progression:
// Order Confirmed -> Processing -> Packed -> Shipped -> In Transit -> Out for Delivery -> Delivered
const STATUS_RANK = {
  placed: 1,
  pending: 1,
  new: 1,
  confirmed: 1,
  order_confirmed: 1,
  accepted: 1,
  seller_accepted: 1,
  preparing: 2,
  processing: 2,
  order_processing: 2,
  packing: 3,
  packed: 3,
  ready_to_ship: 3,
  ready_for_pickup: 3,
  pickup_scheduled: 3,
  delivery_partner_assigned: 3,
  delivery_partner_accepted: 3,
  picked_up: 3,
  shipped: 4,
  in_transit: 5,
  out_for_delivery: 6,
  nearing_destination: 6,
  delivered: 7,
  cancelled: -1,
  rejected: -1,
};

// Exact 7 canonical milestones specification
const CANONICAL_STEPS = [
  {
    key: 'confirmed',
    status: 'Order Confirmed',
    title: 'ORDER CONFIRMED',
    defaultDesc: 'Order verified and confirmed with merchant',
    rank: 1,
  },
  {
    key: 'processing',
    status: 'Processing',
    title: 'PROCESSING',
    defaultDesc: 'Order is being processed by seller',
    rank: 2,
  },
  {
    key: 'packed',
    status: 'Packed',
    title: 'PACKED',
    defaultDesc: 'Items packed and labeled for dispatch',
    rank: 3,
  },
  {
    key: 'shipped',
    status: 'Shipped',
    title: 'SHIPPED',
    defaultDesc: 'Handed over to courier partner',
    rank: 4,
  },
  {
    key: 'in_transit',
    status: 'In Transit',
    title: 'IN TRANSIT',
    defaultDesc: 'Package moving towards delivery hub',
    rank: 5,
  },
  {
    key: 'out_for_delivery',
    status: 'Out for Delivery',
    title: 'OUT FOR DELIVERY',
    defaultDesc: 'Rider is en route to customer doorstep',
    rank: 6,
  },
  {
    key: 'delivered',
    status: 'Delivered',
    title: 'DELIVERED',
    defaultDesc: 'Handover verified with customer OTP',
    rank: 7,
  },
];

export const TrackOrderScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { orderId, order: passedOrder } = route.params || {};

  const sanitizeId = (id) => {
    if (!id || id === 'undefined' || id === 'null') return null;
    return String(id).trim().replace(/^[#\s]+/, '');
  };

  const initialOrderId =
    sanitizeId(orderId) ||
    sanitizeId(passedOrder?.orderId) ||
    sanitizeId(passedOrder?.orderNumber) ||
    sanitizeId(passedOrder?._id);

  const [targetOrderId, setTargetOrderId] = useState(initialOrderId || null);
  const [order, setOrder] = useState(
    passedOrder ? orderService._enrichOrderWithLiveTracking(passedOrder) : null
  );
  const [loading, setLoading] = useState(!passedOrder);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastLocationPing, setLastLocationPing] = useState(null);

  // Auto-restore active order if no orderId was passed (persistent session restoration)
  useEffect(() => {
    if (!targetOrderId && isAuthenticated) {
      let isMounted = true;
      (async () => {
        try {
          const list = await orderService.getOrders();
          const active =
            list.find((o) => orderService.isOrderActive(o.orderStatus || o.status)) ||
            list[0];
          if (isMounted) {
            if (active) {
              const restoredId = sanitizeId(active.orderId || active.orderNumber || active._id);
              setTargetOrderId(restoredId);
              setOrder(orderService._enrichOrderWithLiveTracking(active));
            } else {
              setLoading(false);
            }
          }
        } catch (e) {
          if (isMounted) setLoading(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }
  }, [targetOrderId, isAuthenticated]);

  // Dynamic live tracking data
  const [riderLocation, setRiderLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(2.4);
  const [etaMins, setEtaMins] = useState(8);
  const [deliveryPartner, setDeliveryPartner] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [pickupCoord, setPickupCoord] = useState({ latitude: 26.9124, longitude: 75.7873, storeName: 'Store Hub' });
  const [destCoord, setDestCoord] = useState({ latitude: 26.9015, longitude: 75.7421, fullName: 'Customer Address' });

  const handleContinueShopping = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      handleContinueShopping();
    }
  }, [navigation, handleContinueShopping]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [handleBack]);

  // Load Order Data via REST API
  const loadOrderRef = useRef(null);

  const loadOrder = useCallback(async () => {
    const activeTargetId = targetOrderId || initialOrderId;
    if (!activeTargetId) {
      setLoading(false);
      return;
    }
    try {
      const data = await orderService.getLiveTracking(activeTargetId);
      if (data) {
        setOrder(data);

        if (data.deliveryPartner) {
          setDeliveryPartner(data.deliveryPartner);
        }
        if (data.seller) {
          setSellerInfo(data.seller);
        }
        if (data.liveTracking?.riderLocation) {
          setRiderLocation(data.liveTracking.riderLocation);
          setLastLocationPing(data.liveTracking.lastUpdatedAt || new Date());
        }
        if (data.liveTracking?.distanceRemainingKm !== undefined) {
          setDistanceKm(data.liveTracking.distanceRemainingKm);
        }
        if (data.liveTracking?.estimatedMinutesRemaining !== undefined) {
          setEtaMins(data.liveTracking.estimatedMinutesRemaining);
        }
        if (data.liveTracking?.pickupLocation) {
          setPickupCoord(data.liveTracking.pickupLocation);
        }
        if (data.liveTracking?.destinationLocation) {
          setDestCoord(data.liveTracking.destinationLocation);
        }
      }
    } catch (e) {
      console.warn('[TrackOrder] Error fetching tracking details:', e);
      const fallback = orderService._enrichOrderWithLiveTracking(passedOrder || { orderId: activeTargetId });
      setOrder(fallback);
    } finally {
      setLoading(false);
    }
  }, [targetOrderId, initialOrderId]);

  loadOrderRef.current = loadOrder;

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Real-Time Socket.IO Live Synchronization + Polling Fallback
  useEffect(() => {
    if (!targetOrderId) return;

    let unsubscribeConn = null;

    const setupLiveTrackingSocket = async () => {
      try {
        await socketService.connect();
        unsubscribeConn = socketService.onConnectionChange((connected) => {
          setIsSocketConnected(connected);
          if (connected) {
            loadOrderRef.current?.();
          }
        });

        // Subscribe to live order room
        socketService.subscribeToOrder(targetOrderId, {
          onLocation: (locData) => {
            if (locData?.latitude && locData?.longitude) {
              setRiderLocation({
                latitude: Number(locData.latitude),
                longitude: Number(locData.longitude),
                heading: Number(locData.heading || 0),
                speed: Number(locData.speed || 0),
              });
              setLastLocationPing(new Date());

              if (locData.distanceRemainingKm !== undefined) {
                setDistanceKm(locData.distanceRemainingKm);
              }
              if (locData.etaMinutes !== undefined) {
                setEtaMins(locData.etaMinutes);
              }
            }
          },
          onEta: (etaData) => {
            if (etaData?.etaMinutes !== undefined) {
              setEtaMins(etaData.etaMinutes);
            }
            if (etaData?.distanceRemainingKm !== undefined) {
              setDistanceKm(etaData.distanceRemainingKm);
            }
          },
          onStatus: (statusData) => {
            if (statusData?.status || statusData?.orderStatus) {
              const newStatus = statusData.orderStatus || statusData.status;
              setOrder((prev) => ({
                ...(prev || {}),
                orderStatus: newStatus,
                status: newStatus,
                ...(statusData.deliveryPartner ? { deliveryPartner: statusData.deliveryPartner } : {}),
                ...(statusData.timeline ? { timeline: statusData.timeline } : {}),
                ...(statusData.trackingTimeline ? { trackingTimeline: statusData.trackingTimeline } : {}),
              }));
              loadOrderRef.current?.();
            }
          },
          onPartner: (partnerData) => {
            if (partnerData?.partner || partnerData?.deliveryPartner) {
              setDeliveryPartner(partnerData.partner || partnerData.deliveryPartner);
              loadOrderRef.current?.();
            }
          },
        });
      } catch (err) {
        console.warn('[TrackOrder] Socket initialization warning:', err?.message);
      }
    };

    setupLiveTrackingSocket();

    // 10-second polling fallback interval while active
    const pollInterval = setInterval(() => {
      loadOrderRef.current?.();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      socketService.unsubscribeFromOrder(targetOrderId);
      if (unsubscribeConn) unsubscribeConn();
    };
  }, [targetOrderId]);

  const handleCallPartner = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Call Delivery Partner', `Dial: ${phone}`);
      });
    } else {
      Alert.alert('Contact Delivery Partner', 'Phone number not available.');
    }
  };

  const handleCallSeller = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Call Merchant', `Dial: ${phone}`);
      });
    } else {
      Alert.alert('Contact Merchant', 'Phone number not available.');
    }
  };

  const handleOpenGoogleMaps = () => {
    try {
      const lat = riderLocation?.latitude || pickupCoord?.latitude || 26.9124;
      const lng = riderLocation?.longitude || pickupCoord?.longitude || 75.7873;
      const dLat = destCoord?.latitude || 26.9015;
      const dLng = destCoord?.longitude || 75.7421;
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${dLat},${dLng}&travelmode=driving`;
      Linking.canOpenURL(webUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(webUrl);
          } else {
            Linking.openURL(`geo:${lat},${lng}?q=${dLat},${dLng}`);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl).catch(() => {
            Alert.alert('Google Maps Navigation', `Destination coordinates: ${dLat}, ${dLng}`);
          });
        });
    } catch (e) {
      console.warn('Google Maps launch error', e);
    }
  };

  // Sign in prompt if unauthenticated
  if (!isAuthenticated && !order && !passedOrder && !targetOrderId) {
    return (
      <View style={styles.container}>
        <Header title="Live Order Tracking" showBack onBack={handleBack} navigation={navigation} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AppIcon name="shield-outline" size={64} color="#BDBDBD" />
          <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8, color: '#212121' }}>
            Sign In to Track Shipment
          </Text>
          <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
            Log in to view live GPS tracking, delivery partner movement, and ETA.
          </Text>
          <CustomButton
            title="Sign In / Register"
            size="large"
            onPress={() => navigation.navigate('Login', { redirectTo: 'TrackOrder', redirectParams: { orderId: targetOrderId } })}
            style={{ width: 200 }}
          />
        </View>
      </View>
    );
  }

  // Loading state
  if (loading && !order) {
    return (
      <View style={styles.container}>
        <Header title="Live Order Tracking" showBack onBack={handleBack} navigation={navigation} />
        <Loading fullScreen message="Connecting to live GPS fleet navigation..." />
      </View>
    );
  }

  // Fallback not found state
  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Live Order Tracking" showBack onBack={handleBack} navigation={navigation} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AppIcon name="cube-outline" size={64} color="#BDBDBD" />
          <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8, color: '#212121' }}>
            Shipment Not Found
          </Text>
          <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Could not find active shipment details for this order.
          </Text>
          <CustomButton
            title="Continue Shopping"
            size="large"
            onPress={handleContinueShopping}
            style={{ width: 220 }}
          />
        </View>
      </View>
    );
  }

  const orderIdDisplay = order.orderId || order.orderNumber || targetOrderId || 'BBIN-782194';
  const courierPartnerDisplay = order.courierPartner || 'Bharat Bazaar Fleet Express';
  const trackingNumberDisplay = order.trackingNumber || 'BBIN-' + Math.floor(100000000 + Math.random() * 900000000);
  const currentStatusNorm = (order.orderStatus || order.status || 'placed').toLowerCase();
  const currentRank = STATUS_RANK[currentStatusNorm] || 1;

  // Build canonical 8-milestone journey
  const trackingSteps = CANONICAL_STEPS.map((step) => {
    // Look up milestone in backend payload if provided
    const backendTimeline = Array.isArray(order?.timeline)
      ? order.timeline
      : Array.isArray(order?.trackingTimeline)
      ? order.trackingTimeline
      : null;

    const backendStep = backendTimeline
      ? backendTimeline.find(
          (t) =>
            t.rank === step.rank ||
            (t.title && t.title.toLowerCase() === step.title.toLowerCase()) ||
            (t.status && t.status.toLowerCase() === step.status.toLowerCase())
        )
      : null;

    const completed = currentRank >= step.rank;
    const isCurrent = currentRank === step.rank;

    let timeText = 'Pending';
    if (backendStep?.time && backendStep.time !== 'Pending') {
      timeText = backendStep.time;
    } else if (backendStep?.description && completed) {
      timeText = backendStep.description;
    } else if (completed) {
      timeText = step.defaultDesc;
    }

    return {
      title: step.title,
      status: step.status,
      time: timeText,
      completed,
      isCurrent,
      rank: step.rank,
    };
  });

  return (
    <View style={styles.container}>
      <Header title="Live Order Tracking" showBack onBack={handleBack} navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}>

        {/* Live Socket Sync Banner */}
        <View style={styles.liveSyncBanner}>
          <View style={styles.liveSyncLeft}>
            <View style={[styles.livePulseDot, !isSocketConnected && { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.liveSyncText}>
              {isSocketConnected ? 'LIVE FLEET SYNC' : 'RECONNECTING...'}
            </Text>
          </View>
          <Text style={styles.liveSyncTime}>
            {lastLocationPing
              ? `GPS Ping: ${new Date(lastLocationPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Streaming live'}
          </Text>
        </View>

        {/* Tracking in Progress Banner */}
        {currentRank >= 4 && currentRank < 7 && (
          <View style={styles.activeTrackingCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTrackingText}>
                {currentRank === 4
                  ? 'Handed Over to Courier Partner'
                  : currentRank === 5
                  ? 'Package In Transit'
                  : 'Out for Doorstep Delivery'}
              </Text>
              <Text style={styles.activeTrackingSub}>
                Live fleet tracking in progress. Map coordinates synchronized.
              </Text>
            </View>
            <AppIcon name="navigate-circle" size={24} color="#166534" />
          </View>
        )}

        {/* Interactive Real-Time Map */}
        <LiveTrackingMap
          pickupLocation={pickupCoord}
          destinationLocation={destCoord}
          riderLocation={riderLocation}
          partnerInfo={deliveryPartner}
          orderStatus={currentStatusNorm}
          distanceRemainingKm={distanceKm}
          estimatedMinutesRemaining={etaMins}
          lastUpdatedAt={lastLocationPing}
          height={270}
        />

        {/* Quick Google Maps External Launch Option */}
        <TouchableOpacity
          style={styles.googleMapsBanner}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.85}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcon name="map" size={18} color="#1D4ED8" />
            <Text style={styles.googleMapsBannerText}>Open Turn-by-Turn in Google Maps</Text>
          </View>
          <AppIcon name="chevron-forward" size={16} color="#1D4ED8" />
        </TouchableOpacity>

        {/* Delivery Partner Contact Card (if assigned) */}
        {deliveryPartner ? (
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactLeft}>
                <View style={styles.contactAvatar}>
                  {deliveryPartner.profilePhoto ? (
                    <Image source={{ uri: deliveryPartner.profilePhoto }} style={styles.contactAvatarImage} />
                  ) : (
                    <AppIcon name="bicycle" size={22} color="#059669" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>
                    {deliveryPartner.name || 'Fleet Delivery Executive'}
                  </Text>
                  <Text style={styles.contactSub}>
                    ★ {deliveryPartner.rating || 4.85} • {deliveryPartner.vehicleType || 'Bike'} ({deliveryPartner.vehicleNumber || 'DL-Reg'})
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.contactCallBtn}
                onPress={() => handleCallPartner(deliveryPartner.phone || '9876543212')}
                activeOpacity={0.8}>
                <AppIcon name="call" size={14} color="#FFFFFF" />
                <Text style={styles.contactCallBtnText}>Call Rider</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Merchant / Seller Contact Card */}
        {sellerInfo ? (
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactLeft}>
                <View style={[styles.contactAvatar, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <AppIcon name="storefront" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>
                    {sellerInfo.storeName || 'Jaipur Heritage Handlooms'}
                  </Text>
                  <Text style={styles.contactSub}>
                    Merchant Hub • {sellerInfo.city || 'Jaipur'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.contactCallBtn, styles.sellerCallBtn]}
                onPress={() => handleCallSeller(sellerInfo.phone || '9829012345')}
                activeOpacity={0.8}>
                <AppIcon name="call" size={14} color="#0F172A" />
                <Text style={styles.sellerCallBtnText}>Contact Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Security Delivery OTP Box */}
        {order.deliveryOtp && currentStatusNorm !== 'delivered' && currentStatusNorm !== 'cancelled' && (
          <View style={styles.otpSecurityCard}>
            <View style={styles.otpCardHeader}>
              <AppIcon name="shield-checkmark" size={18} color="#1E40AF" />
              <Text style={styles.otpCardTitle}>Handover Security Code</Text>
            </View>
            <View style={styles.otpBadgeContainer}>
              <Text style={styles.otpLargeText}>{order.deliveryOtp}</Text>
            </View>
            <Text style={styles.otpHelpNotice}>
              Please share this 4-digit code with your delivery executive upon parcel arrival.
            </Text>
          </View>
        )}

        {/* Order Details & Summary Card */}
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Order Number</Text>
            <Text style={styles.value}>#{orderIdDisplay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Courier Fleet</Text>
            <Text style={styles.value}>{courierPartnerDisplay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tracking AWB</Text>
            <Text style={styles.value}>{trackingNumberDisplay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated Delivery</Text>
            <Text style={[styles.value, { color: '#059669' }]}>
              {etaMins ? `Within ${etaMins} mins` : 'Expected today'}
            </Text>
          </View>
        </View>

        {/* 8-Milestone Progress Journey */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Live Order Journey Milestones</Text>
          {trackingSteps.map((step, idx) => {
            const isLast = idx === trackingSteps.length - 1;
            return (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.indicatorCol}>
                  <View
                    style={[
                      styles.circle,
                      step.completed && styles.circleCompleted,
                      step.isCurrent && !step.completed && styles.circleCurrent,
                      step.isCurrent && step.completed && { borderWidth: 3, borderColor: '#1E40AF' },
                    ]}>
                    {step.completed ? (
                      <AppIcon name="checkmark" size={12} color="#FFF" />
                    ) : step.isCurrent ? (
                      <View style={styles.pulseInnerDot} />
                    ) : null}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.line,
                        step.completed && styles.lineCompleted,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={[
                        styles.stepStatus,
                        step.completed && styles.stepStatusCompleted,
                        step.isCurrent && styles.stepStatusCurrent,
                      ]}>
                      {step.title}
                    </Text>
                    {step.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Buttons: Continue Shopping & View Orders */}
        <View style={styles.actionButtonsContainer}>
          <CustomButton
            title="Continue Shopping"
            size="large"
            onPress={handleContinueShopping}
            style={styles.continueShoppingBtn}
          />
          <CustomButton
            title="View All My Orders"
            variant="outline"
            size="large"
            onPress={() => navigation.navigate('MyOrders')}
            style={styles.viewOrdersBtn}
          />
          <CustomButton
            title="Contact Support (24x7 Helpline)"
            variant="ghost"
            size="large"
            iconLeft="call-outline"
            onPress={() => {
              Linking.openURL('tel:18001234567').catch(() => {
                Alert.alert('Support Helpline', 'Toll-free 24x7 Helpline: 1800-123-4567');
              });
            }}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default TrackOrderScreen;
