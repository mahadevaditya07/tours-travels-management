import { locations } from "../data/mockData.js";

export const distanceBetween = (a, b) => {
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
    return { id: `stop-${stop.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`, name: stop.trim() };
  }

  return {
    id: stop.id || `stop-${(stop.name || "custom").toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name: stop.name?.trim() || "Custom stop",
    coords: stop.coords || null
  };
};

export const buildLocationSearchQueries = (placeName, routeContext = {}) => {
  const { start, destination } = routeContext;
  const baseName = (placeName || "").trim();
  if (!baseName) return [];

  const routeHints = [];
  const startName = typeof start === "string" ? start : start?.name;
  const destinationName = typeof destination === "string" ? destination : destination?.name;

  if (startName) routeHints.push(startName);
  if (destinationName) routeHints.push(destinationName);
  const regionHints = ["Karnataka", "India"];
  const queries = new Set();

  queries.add(baseName);
  queries.add(`${baseName}, ${startName || "Karnataka"}`);
  queries.add(`${baseName}, ${destinationName || "Karnataka"}`);
  queries.add(`${baseName}, ${startName || destinationName || "Karnataka"}, Karnataka, India`);
  queries.add(`${baseName}, ${destinationName || startName || "Karnataka"}, Karnataka, India`);
  queries.add(`${baseName}, ${routeHints.join(" to ")}, Karnataka, India`);

  routeHints.forEach((hint) => {
    queries.add(`${baseName}, ${hint}`);
    queries.add(`${baseName}, ${hint}, Karnataka`);
    queries.add(`${baseName}, ${hint}, India`);
  });

  regionHints.forEach((region) => {
    queries.add(`${baseName}, ${region}`);
    queries.add(`${baseName}, Karnataka, India`);
  });

  return [...queries].filter(Boolean);
};

export const pickBestGeocodeMatch = (candidates = [], placeName, routeContext = {}) => {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const normalizedName = (placeName || "").toLowerCase();
  const routeStart = routeContext.start?.coords || locations[(typeof routeContext.start === "string" ? routeContext.start : routeContext.start?.name)] || [15.3647, 75.124];
  const routeDest = routeContext.destination?.coords || locations[(typeof routeContext.destination === "string" ? routeContext.destination : routeContext.destination?.name)] || [14.5479, 74.3188];

  const bestCandidate = candidates
    .map((candidate) => {
      const display = candidate?.display_name || "";
      const text = display.toLowerCase();
      const exactNameScore = text.includes(normalizedName) ? 40 : 0;
      const routeNearbyScore = (() => {
        const lat = Number(candidate?.lat ?? 0);
        const lon = Number(candidate?.lon ?? 0);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 0;
        const startDistance = Math.hypot(lat - routeStart[0], lon - routeStart[1]);
        const destDistance = Math.hypot(lat - routeDest[0], lon - routeDest[1]);
        return Math.max(0, 25 - Math.min(startDistance, destDistance) * 120);
      })();
      const localityScore = text.includes("karnataka") ? 10 : 0;
      const regionScore = text.includes("hubli") || text.includes("dharwad") || text.includes("mantur") ? 15 : 0;
      const score = exactNameScore + routeNearbyScore + localityScore + regionScore;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  return bestCandidate?.candidate || candidates[0];
};

export const inferCoordsFromRoute = (name, index, totalStops, start, destination) => {
  const resolveCoord = (v, fallback) => {
    if (!v) return fallback;
    if (Array.isArray(v)) return v;
    if (typeof v === 'object' && v.coords) return v.coords;
    return locations[v] || fallback;
  };
  const startCoord = resolveCoord(start, [15.3647, 75.124]);
  const destinationCoord = resolveCoord(destination, [14.5479, 74.3188]);
  const baseOffset = totalStops === 0 ? 0.09 : 0.12 + (index + 1) * 0.025;
  const ratio = (index + 1) / (totalStops + 2);
  const lat = startCoord[0] + (destinationCoord[0] - startCoord[0]) * ratio + (index % 2 === 0 ? 1 : -1) * baseOffset;
  const lng = startCoord[1] + (destinationCoord[1] - startCoord[1]) * ratio + (index % 2 === 0 ? 1 : -1) * baseOffset * 0.8;
  return [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
};

export const ensureStop = (place, index, routeContext = {}) => {
  const { start = "Hubli", destination = "Gokarna" } = routeContext;
  const stopName = typeof place === "string" ? place.trim() : place?.name?.trim();
  if (!stopName) return null;

  const normalized = normalizeStop(place || stopName);
  if (normalized.coords) return normalized;

  const coords = locations[stopName] || inferCoordsFromRoute(stopName, index, 1, start, destination);
  return { ...normalized, coords };
};

export const buildRoutePoints = (start, destination, stops = []) => {
  const resolveCoord = (v, fallback) => {
    if (!v) return fallback;
    if (Array.isArray(v)) return v;
    if (typeof v === 'object' && v.coords) return v.coords;
    return locations[v] || fallback;
  };
  const startPoint = resolveCoord(start, [15.3647, 75.124]);
  const destinationPoint = resolveCoord(destination, [14.5479, 74.3188]);
  const route = [startPoint];

  const normalizedStops = (stops || []).map((stop, index) => {
    if (typeof stop === "string") {
      return ensureStop(stop, index, { start, destination });
    }
    if (stop?.coords) {
      return stop;
    }
    return ensureStop(stop, index, { start, destination });
  }).filter(Boolean);

  normalizedStops.forEach((stop) => {
    route.push(stop.coords || inferCoordsFromRoute(stop.name, normalizedStops.indexOf(stop), normalizedStops.length, start, destination));
  });

  route.push(destinationPoint);
  return route;
};

export const getRouteDistance = (routePoints = []) => routePoints.slice(1).reduce((sum, point, index) => {
  const previous = routePoints[index];
  if (!previous) return sum;
  return sum + distanceBetween(previous, point);
}, 0);
