/**
 * Interactive Real-Time Live Tracking Map Component
 * Powered by Leaflet & OpenStreetMap via WebView with smooth marker interpolation,
 * custom SVG markers for Pickup/Rider/Destination, route polyline, and auto-zoom fitBounds.
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AppIcon from './AppIcon';

export const LiveTrackingMap = ({
  pickupLocation = { latitude: 26.9124, longitude: 75.7873, storeName: 'Store Hub' },
  destinationLocation = { latitude: 26.9015, longitude: 75.7421, fullName: 'Delivery Address' },
  riderLocation = null,
  partnerInfo = null,
  orderStatus = 'confirmed',
  distanceRemainingKm = 0,
  estimatedMinutesRemaining = 0,
  lastUpdatedAt = null,
  height = 280,
  showControls = true,
}) => {
  const webViewRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Auto-clear loading state after 2.5s if Leaflet CDN is slow or offline
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const pickupLat = Number(pickupLocation?.latitude) || 26.9124;
  const pickupLon = Number(pickupLocation?.longitude) || 75.7873;
  const destLat = Number(destinationLocation?.latitude) || 26.9015;
  const destLon = Number(destinationLocation?.longitude) || 75.7421;

  const currentRiderLat = Number(riderLocation?.latitude) || Number((pickupLat + 0.005).toFixed(4));
  const currentRiderLon = Number(riderLocation?.longitude) || Number((pickupLon - 0.008).toFixed(4));
  const riderHeading = Number(riderLocation?.heading) || 0;

  const safeStoreName = String(pickupLocation?.storeName || 'Store Hub').replace(/['"\\]/g, '');
  const safeCustomerName = String(destinationLocation?.fullName || 'Customer').replace(/['"\\]/g, '');

  const handleOpenGoogleMaps = () => {
    try {
      const lat = currentRiderLat || pickupLat || 26.9124;
      const lng = currentRiderLon || pickupLon || 75.7873;
      const dLat = destLat || 26.9015;
      const dLng = destLon || 75.7421;
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${dLat},${dLng}&travelmode=driving`;
      Linking.canOpenURL(webUrl).then((supported) => {
        if (supported) {
          Linking.openURL(webUrl);
        } else {
          Linking.openURL(`geo:${lat},${lng}?q=${dLat},${dLng}`);
        }
      }).catch(() => {
        Linking.openURL(webUrl).catch(() => {});
      });
    } catch (e) {
      console.warn('Could not launch Google Maps', e);
    }
  };

  // HTML/Leaflet map bundle
  const htmlContent = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #F8FAFC;
    }
    .custom-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.6s ease-out;
    }
    .rider-pin {
      width: 44px;
      height: 44px;
      background: #059669;
      border: 3px solid #FFFFFF;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
      font-size: 20px;
    }
    .store-pin {
      width: 38px;
      height: 38px;
      background: #2563EB;
      border: 2px solid #FFFFFF;
      border-radius: 19px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
      font-size: 18px;
    }
    .dest-pin {
      width: 38px;
      height: 38px;
      background: #DC2626;
      border: 2px solid #FFFFFF;
      border-radius: 19px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.35);
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var pickupCoords = [${pickupLat}, ${pickupLon}];
    var destCoords = [${destLat}, ${destLon}];
    var riderCoords = [${currentRiderLat}, ${currentRiderLon}];

    // 1. Store Marker
    var storeIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div class="store-pin">🏪</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    L.marker(pickupCoords, { icon: storeIcon }).addTo(map).bindPopup('<b>' + ${JSON.stringify(safeStoreName)} + '</b><br>Pickup Point');

    // 2. Customer Destination Marker
    var destIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div class="dest-pin">📍</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    L.marker(destCoords, { icon: destIcon }).addTo(map).bindPopup('<b>Delivery Destination</b><br>' + ${JSON.stringify(safeCustomerName)});

    // 3. Moving Delivery Partner Marker
    var riderIcon = L.divIcon({
      className: 'custom-icon',
      html: '<div id="riderMarker" class="rider-pin">🛵</div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
    var riderMarker = L.marker(riderCoords, { icon: riderIcon }).addTo(map);

    // 4. Transit Polyline Route
    var routeLine = L.polyline([pickupCoords, riderCoords, destCoords], {
      color: '#059669',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(map);

    // Initial Fit Bounds
    var group = new L.featureGroup([
      L.marker(pickupCoords),
      L.marker(destCoords),
      riderMarker
    ]);
    map.fitBounds(group.getBounds().pad(0.2));

    // Dynamic update without full page reload
    window.updateRider = function(lat, lng, heading) {
      if (!lat || !lng) return;
      var newLatLng = new L.LatLng(lat, lng);
      riderMarker.setLatLng(newLatLng);
      routeLine.setLatLngs([pickupCoords, newLatLng, destCoords]);
    };

    window.recenterMap = function() {
      map.fitBounds(group.getBounds().pad(0.2));
    };
  </script>
</body>
</html>
    `;
  }, [pickupLat, pickupLon, destLat, destLon, pickupLocation?.storeName, destinationLocation?.fullName]);

  // Inject smooth marker updates when GPS position changes
  useEffect(() => {
    if (mapLoaded && webViewRef.current && currentRiderLat && currentRiderLon) {
      const script = `if (window.updateRider) { window.updateRider(${currentRiderLat}, ${currentRiderLon}, ${riderHeading}); }`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [currentRiderLat, currentRiderLon, riderHeading, mapLoaded]);

  const handleRecenter = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('if (window.recenterMap) { window.recenterMap(); }');
    }
  };

  const statusNorm = String(orderStatus || '').toLowerCase();
  const isDelivered = statusNorm === 'delivered';
  const isOutForDelivery = ['shipped', 'in_transit', 'out_for_delivery', 'picked_up'].includes(statusNorm);
  const isPreparingOrPacked = ['processing', 'preparing', 'packed', 'packing', 'ready_for_pickup'].includes(statusNorm);
  const isLive = Boolean(isOutForDelivery && (partnerInfo || riderLocation));

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => setMapLoaded(true)}
        onError={() => setMapLoaded(true)}
        onHttpError={() => setMapLoaded(true)}
      />

      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.loadingText}>Initializing GPS Navigation...</Text>
        </View>
      )}

      {/* Floating Status & ETA Pill Overlay */}
      <View style={styles.topInfoBar}>
        <View style={styles.statusPill}>
          <View style={[styles.pulseDot, isLive && styles.pulseDotLive]} />
          <Text style={styles.statusPillText}>
            {isDelivered
              ? 'DELIVERED'
              : isLive
              ? 'LIVE GPS'
              : isPreparingOrPacked
              ? 'STORE PREPARATION'
              : 'ORDER CONFIRMED'}
          </Text>
        </View>

        <View style={styles.etaPill}>
          <Text style={styles.etaPillText}>
            {isDelivered
              ? '✓ Handed Over'
              : isLive && estimatedMinutesRemaining
              ? `⏱ ${estimatedMinutesRemaining} min (${distanceRemainingKm || 2.4} km)`
              : isPreparingOrPacked
              ? '📦 Preparing Dispatch'
              : '✓ Order Confirmed'}
          </Text>
        </View>
      </View>

      {/* Bottom Floating Card / Controls */}
      {showControls && (
        <View style={styles.bottomControlsBar}>
          <View style={styles.riderMetaBox}>
            <Text style={styles.riderNameText}>
              🛵 {partnerInfo?.name || 'Assigned Fleet Rider'}
            </Text>
            <Text style={styles.riderSubText}>
              {partnerInfo?.vehicleNumber ? `${partnerInfo.vehicleNumber} • ` : ''}
              {lastUpdatedAt
                ? `Updated ${new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Transmitting Real-Time GPS'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.googleMapsBtn}
            onPress={handleOpenGoogleMaps}
            activeOpacity={0.8}>
            <AppIcon name="navigate-outline" size={14} color="#FFFFFF" />
            <Text style={styles.googleMapsBtnText}>Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter} activeOpacity={0.8}>
            <AppIcon name="locate" size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    marginVertical: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  topInfoBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  pulseDotLive: {
    backgroundColor: '#10B981',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  etaPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  etaPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bottomControlsBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  riderMetaBox: {
    flex: 1,
  },
  riderNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  riderSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  googleMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
    gap: 4,
  },
  googleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  recenterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
});

export default LiveTrackingMap;

