/**
 * Geospatial, Distance & ETA Calculations for Live Order Tracking
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate Great-Circle Distance between two coordinates in kilometers (Haversine formula)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null
  ) {
    return 0;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  return Number(distance.toFixed(2));
}

/**
 * Calculate realistic Estimated Time of Arrival (ETA) in minutes
 * Assumes average city vehicle speed:
 * Bike: 24 km/h with 1.3 urban traffic multiplier + 2 min buffer
 */
function calculateEtaMinutes(distanceKm, vehicleType = 'Bike') {
  if (!distanceKm || distanceKm <= 0) return 3;

  let avgSpeedKmh = 24;
  if (vehicleType.toLowerCase() === 'scooter' || vehicleType.toLowerCase() === 'electric') {
    avgSpeedKmh = 22;
  } else if (vehicleType.toLowerCase() === 'van') {
    avgSpeedKmh = 20;
  }

  const urbanTrafficFactor = 1.35;
  const transitTimeMinutes = (distanceKm * urbanTrafficFactor) / (avgSpeedKmh / 60);
  const totalEta = Math.ceil(transitTimeMinutes) + 2; // 2 min buffer for parking/traffic lights
  return Math.max(2, Math.min(180, totalEta));
}

/**
 * Generate sensible default coordinates for city centers (Fallback for addresses lacking geocoding)
 */
const CITY_COORDINATES = {
  jaipur: { latitude: 26.9124, longitude: 75.7873 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  'new delhi': { latitude: 28.6139, longitude: 77.209 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
};

function getCityCoordinates(cityName = 'Jaipur') {
  const key = (cityName || '').trim().toLowerCase();
  return CITY_COORDINATES[key] || { latitude: 26.9124, longitude: 75.7873 };
}

module.exports = {
  calculateDistanceKm,
  calculateEtaMinutes,
  getCityCoordinates,
  EARTH_RADIUS_KM,
};

