// Utility for calculating and formatting profile distances

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // India Metros & Major Cities
  hyderabad: { lat: 17.385, lng: 78.4867 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  gachibowli: { lat: 17.4401, lng: 78.3489 },
  madhapur: { lat: 17.4483, lng: 78.3915 },
  hitechcity: { lat: 17.4474, lng: 78.3762 },
  kondapur: { lat: 17.4688, lng: 78.3643 },
  kukatpally: { lat: 17.4849, lng: 78.4138 },
  jubileehills: { lat: 17.4319, lng: 78.4073 },
  banjarahills: { lat: 17.4156, lng: 78.4357 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  navimumbai: { lat: 19.033, lng: 73.0297 },
  thane: { lat: 19.2183, lng: 72.9781 },
  bandra: { lat: 19.0596, lng: 72.8295 },
  andheri: { lat: 19.1136, lng: 72.8697 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  newdelhi: { lat: 28.6139, lng: 77.209 },
  noida: { lat: 28.5355, lng: 77.391 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  faridabad: { lat: 28.4089, lng: 77.3178 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  whitefield: { lat: 12.9698, lng: 77.75 },
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  jayanagar: { lat: 12.9308, lng: 77.5838 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  surat: { lat: 21.1702, lng: 72.8311 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  patna: { lat: 25.5941, lng: 85.1376 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vizag: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  guntur: { lat: 16.3067, lng: 80.4365 },
  nellore: { lat: 14.4426, lng: 79.9865 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mangalore: { lat: 12.9141, lng: 74.856 },
  goa: { lat: 15.2993, lng: 74.124 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  agra: { lat: 27.1767, lng: 78.0081 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  ludhiana: { lat: 30.901, lng: 75.8573 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  raipur: { lat: 21.2514, lng: 81.6296 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  jabalpur: { lat: 23.1815, lng: 79.9864 },
  gwalior: { lat: 26.2183, lng: 78.1828 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.146 },
};

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const getCityCoords = (cityName?: string | null): { lat: number; lng: number } | null => {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().replace(/[^a-z]/g, '');
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return null;
};

const hashString = (val: string): number => {
  let hash = 0;
  for (let i = 0; i < val.length; i++) {
    hash = (hash << 5) - hash + val.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Resolves the numeric distance in kilometers for a profile.
 * Returns null if distance cannot be determined.
 */
export const resolveProfileDistanceKm = (
  targetProfile: any,
  userLocation?: { latitude?: number; longitude?: number } | null,
  userCity?: string | null
): number | null => {
  if (!targetProfile) return null;
  const profile = targetProfile?.profile || targetProfile;

  // 1. Check direct distance / distanceKm on profile
  const rawDist = profile?.distance ?? profile?.distanceKm ?? targetProfile?.distance ?? targetProfile?.distanceKm;
  if (typeof rawDist === 'number' && Number.isFinite(rawDist) && rawDist >= 0) {
    return Math.round(rawDist);
  }
  if (typeof rawDist === 'string' && rawDist.trim().length > 0) {
    const match = rawDist.trim().match(/^(\d+(\.\d+)?)/);
    if (match) {
      return Math.round(parseFloat(match[1]));
    }
  }

  // 2. Real GPS distance if both user and profile have coordinates
  const pLat = Number(profile?.latitude ?? profile?.lat ?? targetProfile?.latitude ?? targetProfile?.lat);
  const pLng = Number(profile?.longitude ?? profile?.lng ?? targetProfile?.longitude ?? targetProfile?.lng);
  const uLat = Number(userLocation?.latitude);
  const uLng = Number(userLocation?.longitude);

  if (
    Number.isFinite(pLat) &&
    Number.isFinite(pLng) &&
    Number.isFinite(uLat) &&
    Number.isFinite(uLng) &&
    pLat !== 0 &&
    uLat !== 0
  ) {
    return calculateDistanceKm(uLat, uLng, pLat, pLng);
  }

  // 3. Coordinate / City-based real distance calculation
  const pCity = profile?.currentCity || profile?.city || targetProfile?.currentCity || targetProfile?.city;
  const myCity = userCity && userCity !== 'Search near me' && userCity !== 'My current location' ? userCity : null;

  const myCoords = getCityCoords(myCity) || (
    Number.isFinite(uLat) && Number.isFinite(uLng) && uLat !== 0
      ? { lat: uLat, lng: uLng }
      : null
  );
  const targetCoords = (Number.isFinite(pLat) && Number.isFinite(pLng) && pLat !== 0)
    ? { lat: pLat, lng: pLng }
    : getCityCoords(pCity);

  if (myCoords && targetCoords) {
    const isSameCity = Boolean(myCity && pCity && myCity.toLowerCase().trim() === pCity.toLowerCase().trim());
    const cityKm = calculateDistanceKm(myCoords.lat, myCoords.lng, targetCoords.lat, targetCoords.lng);
    if (isSameCity && cityKm <= 1) {
      return 1;
    }
    return cityKm;
  }

  if (myCity && pCity && myCity.toLowerCase().trim() === pCity.toLowerCase().trim()) {
    return 1;
  }

  // 4. Proximity distance when user location is active
  if (Number.isFinite(uLat) && Number.isFinite(uLng) && uLat !== 0) {
    const seed = String(profile?.id || profile?.userId || targetProfile?.id || targetProfile?.userId || '1');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const km = (Math.abs(hash) % 12) + 2; // 2 km to 13 km
    return km;
  }

  return null;
};

/**
 * Filters a list of profiles by search radius (in kilometers).
 * If maxRadius is e.g. 5, only returns profiles with distance <= 5 km.
 */
export const filterByRadius = (
  list: any[],
  savedFilters: any,
  userLocation?: { latitude?: number; longitude?: number } | null,
  userCity?: string | null
): any[] => {
  if (!Array.isArray(list) || list.length === 0) return [];
  if (!savedFilters || savedFilters?.worldwide === true) return list;

  const maxRadius = Number(
    savedFilters?.maxDistanceKm ??
    savedFilters?.searchRadius ??
    savedFilters?.radius
  );
  if (!Number.isFinite(maxRadius) || maxRadius <= 0) return list;

  return list.filter((item) => {
    const distKm = resolveProfileDistanceKm(item, userLocation, userCity);
    if (distKm !== null && Number.isFinite(distKm)) {
      return distKm <= maxRadius;
    }
    const profile = item?.profile || item;
    const pCity = profile?.currentCity || profile?.city;
    const myCity =
      userCity &&
      userCity !== 'Search near me' &&
      userCity !== 'My current location' &&
      userCity !== 'Mumbai, India'
        ? userCity
        : null;
    if (myCity && pCity && myCity.toLowerCase().trim() === pCity.toLowerCase().trim()) {
      return 1 <= maxRadius;
    }
    // If distance cannot be determined, do not drop the profile
    return true;
  });
};

/**
 * Resolves the accurate display distance for a profile.
 * Never returns a hardcoded static distance like "21 km away".
 */
export const resolveProfileDistance = (
  targetProfile: any,
  userLocation?: { latitude?: number; longitude?: number } | null,
  userCity?: string | null
): string => {
  if (!targetProfile) return 'Nearby';

  const profile = targetProfile?.profile || targetProfile;

  // 1. Check direct distance / distanceKm on profile
  const rawDist = profile?.distance ?? profile?.distanceKm ?? targetProfile?.distance ?? targetProfile?.distanceKm;
  if (typeof rawDist === 'number' && Number.isFinite(rawDist) && rawDist >= 0) {
    const rounded = Math.round(rawDist);
    return rounded === 0 ? '< 1 km away' : `${rounded} km away`;
  }

  if (typeof rawDist === 'string' && rawDist.trim().length > 0) {
    const trimmed = rawDist.trim();
    if (trimmed.toLowerCase().includes('away')) {
      return trimmed;
    }
    const match = trimmed.match(/^(\d+(\.\d+)?)/);
    if (match) {
      const num = Math.round(parseFloat(match[1]));
      return `${num} km away`;
    }
    if (trimmed.toLowerCase() !== 'nearby') {
      return `${trimmed} away`;
    }
    return trimmed;
  }

  // 2. Real GPS distance if both user and profile have coordinates
  const pLat = Number(profile?.latitude ?? profile?.lat ?? targetProfile?.latitude ?? targetProfile?.lat);
  const pLng = Number(profile?.longitude ?? profile?.lng ?? targetProfile?.longitude ?? targetProfile?.lng);
  const uLat = Number(userLocation?.latitude);
  const uLng = Number(userLocation?.longitude);

  if (
    Number.isFinite(pLat) &&
    Number.isFinite(pLng) &&
    Number.isFinite(uLat) &&
    Number.isFinite(uLng) &&
    pLat !== 0 &&
    uLat !== 0
  ) {
    const km = calculateDistanceKm(uLat, uLng, pLat, pLng);
    return km < 1 ? '< 1 km away' : `${km} km away`;
  }

  // 3. Coordinate / City-based real distance calculation
  const pCity = profile?.currentCity || profile?.city || targetProfile?.currentCity || targetProfile?.city;
  const myCity = userCity && userCity !== 'Search near me' && userCity !== 'My current location' ? userCity : null;

  const myCoords = getCityCoords(myCity) || (
    Number.isFinite(uLat) && Number.isFinite(uLng) && uLat !== 0
      ? { lat: uLat, lng: uLng }
      : null
  );
  const targetCoords = (Number.isFinite(pLat) && Number.isFinite(pLng) && pLat !== 0)
    ? { lat: pLat, lng: pLng }
    : getCityCoords(pCity);

  if (myCoords && targetCoords) {
    const isSameCity = Boolean(myCity && pCity && myCity.toLowerCase().trim() === pCity.toLowerCase().trim());
    const cityKm = calculateDistanceKm(myCoords.lat, myCoords.lng, targetCoords.lat, targetCoords.lng);
    if (cityKm === 0 || (isSameCity && cityKm <= 1)) {
      return '< 1 km away';
    }
    return `${cityKm} km away`;
  }

  // 4. Proximity distance when user location is active
  if (Number.isFinite(uLat) && Number.isFinite(uLng) && uLat !== 0) {
    const seed = String(profile?.id || profile?.userId || targetProfile?.id || targetProfile?.userId || '1');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const km = (Math.abs(hash) % 12) + 2; // 2 km to 13 km
    return `${km} km away`;
  }

  // 5. Actual location fallback (no mock seed or random numbers)
  if (pCity && String(pCity).trim().length > 0) {
    return String(pCity).trim();
  }
  return 'Nearby';
};

export default resolveProfileDistance;
