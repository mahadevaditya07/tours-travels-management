// src/pages/mapPlannerUtils.js

export const distanceBetween = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;

  const R = 6371;

  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export const normalizeStop = (stop) => {
  if (!stop) return null;

  if (typeof stop === "string") {
    const name = stop.trim();

    if (!name) return null;

    return {
      id: `stop-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name,
      coords: null,
    };
  }

  const name = stop.name?.trim();

  if (!name) return null;

  return {
    id:
      stop.id ||
      `stop-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name,
    coords: stop.coords || null,
  };
};

/*
 * Build several searches because place names can be ambiguous.
 *
 * Example:
 * Bhandiwad
 * Bhandiwad, Hubli
 * Bhandiwad, Karnataka
 * Bhandiwad, Hubli, Karnataka, India
 */
export const buildLocationSearchQueries = (
  placeName,
  routeContext = {}
) => {
  const baseName = (placeName || "").trim();

  if (!baseName) return [];

  const startName =
    typeof routeContext.start === "string"
      ? routeContext.start
      : routeContext.start?.name;

  const destinationName =
    typeof routeContext.destination === "string"
      ? routeContext.destination
      : routeContext.destination?.name;

  const queries = new Set();

  queries.add(baseName);

  if (startName) {
    queries.add(`${baseName}, ${startName}`);
    queries.add(`${baseName}, ${startName}, Karnataka`);
    queries.add(`${baseName}, ${startName}, Karnataka, India`);
  }

  if (destinationName) {
    queries.add(`${baseName}, ${destinationName}`);
    queries.add(`${baseName}, ${destinationName}, Karnataka`);
    queries.add(`${baseName}, ${destinationName}, Karnataka, India`);
  }

  queries.add(`${baseName}, Karnataka`);
  queries.add(`${baseName}, Karnataka, India`);
  queries.add(`${baseName}, India`);

  return [...queries];
};

/*
 * Select the most suitable Nominatim result.
 */
export const pickBestGeocodeMatch = (
  candidates = [],
  placeName,
  routeContext = {}
) => {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const normalizedName = (placeName || "").toLowerCase().trim();

  const startCoords = routeContext.start?.coords;
  const destinationCoords = routeContext.destination?.coords;

  const scoreCandidate = (candidate) => {
    const displayName = (
      candidate?.display_name ||
      ""
    ).toLowerCase();

    let score = 0;

    // Exact place name match
    // Prefer candidates where the display name starts with
    // the requested place (more likely the exact match).
    if (displayName.startsWith(normalizedName)) {
      score += 80;
    } else if (displayName.includes(normalizedName)) {
      score += 30;
    }

    // If Nominatim returned address components, prefer
    // candidates where the city/town/village exactly matches
    // the requested place name (this helps Dharwad vs Hubli).
    const addr = candidate?.address || {};
    const addrParts = [
      addr.city,
      addr.town,
      addr.village,
      addr.county,
      addr.hamlet,
      addr.municipality,
      addr.suburb,
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());

    if (
      addrParts.some(
        (part) => part === normalizedName
      )
    ) {
      score += 120;
    }

    // Prefer Karnataka
    if (displayName.includes("karnataka")) {
      score += 20;
    }

    // Prefer India
    if (displayName.includes("india")) {
      score += 10;
    }

    const lat = Number(candidate?.lat);
    const lon = Number(candidate?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return score;
    }

    // Prefer result close to start
    if (Array.isArray(startCoords)) {
      const distance = Math.hypot(
        lat - startCoords[0],
        lon - startCoords[1]
      );

      score += Math.max(0, 20 - distance * 100);
    }

    // Prefer result close to destination
    if (Array.isArray(destinationCoords)) {
      const distance = Math.hypot(
        lat - destinationCoords[0],
        lon - destinationCoords[1]
      );

      score += Math.max(0, 20 - distance * 100);
    }

    return score;
  };

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate),
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate || candidates[0];
};

/*
 * Convert stop/start/destination into a consistent coordinate format.
 */
export const resolveCoordinates = (place) => {
  if (!place) return null;

  if (Array.isArray(place)) {
    return place;
  }

  if (Array.isArray(place.coords)) {
    return place.coords;
  }

  return null;
};

/*
 * Create the ordered list of points:
 *
 * Start
 * ↓
 * Stop 1
 * ↓
 * Stop 2
 * ↓
 * Destination
 */
export const buildRoutePoints = (
  start,
  destination,
  stops = []
) => {
  const startCoords = resolveCoordinates(start);
  const destinationCoords = resolveCoordinates(destination);

  if (!startCoords || !destinationCoords) {
    return [];
  }

  const route = [startCoords];

  stops.forEach((stop) => {
    const coords = resolveCoordinates(stop);

    if (coords) {
      route.push(coords);
    }
  });

  route.push(destinationCoords);

  return route;
};

/*
 * Fallback straight-line distance.
 *
 * The actual displayed route distance will come from OSRM.
 */
export const getRouteDistance = (routePoints = []) => {
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    return 0;
  }

  return routePoints
    .slice(1)
    .reduce((total, point, index) => {
      const previous = routePoints[index];

      return total + distanceBetween(previous, point);
    }, 0);
};

/*
 * OSRM uses:
 *
 * longitude,latitude
 *
 * Leaflet uses:
 *
 * latitude,longitude
 */
export const toOSRMCoordinate = ([lat, lon]) =>
  `${lon},${lat}`;

/*
 * Build OSRM request URL.
 */
export const buildOSRMUrl = (routePoints = []) => {
  if (routePoints.length < 2) {
    return null;
  }

  const coordinates = routePoints
    .map(toOSRMCoordinate)
    .join(";");

  return (
    `https://router.project-osrm.org/route/v1/driving/` +
    `${coordinates}` +
    `?overview=full` +
    `&geometries=geojson` +
    `&alternatives=true` +
    `&steps=true`
  );
};