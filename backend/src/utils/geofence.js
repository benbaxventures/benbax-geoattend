/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * Returns distance in meters.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within the geofence radius of an institution.
 */
function isWithinGeofence(userLat, userLon, institutionLat, institutionLon, radiusMeters) {
  const distance = calculateDistance(userLat, userLon, institutionLat, institutionLon);
  return {
    isWithin: distance <= radiusMeters,
    distance: Math.round(distance),
    radius: radiusMeters,
  };
}

module.exports = { calculateDistance, isWithinGeofence };
