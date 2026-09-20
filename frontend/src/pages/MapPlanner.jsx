import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import {
  attractions,
  vehicles as mockVehicles,
} from "../data/mockData";
import { getVehicles } from "../services/api";

import {
  buildLocationSearchQueries,
  buildOSRMUrl,
  buildRoutePoints,
  getRouteDistance,
  normalizeStop,
  pickBestGeocodeMatch,
} from "./mapPlannerUtils";

import "./MapPlanner.css";


// ----------------------------------------------------
// Leaflet marker fix
// ----------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// ----------------------------------------------------
// Map auto-centering
// ----------------------------------------------------

function AutoCenterMap({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route || route.length < 2) return;

    const bounds = L.latLngBounds(route);

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 12,
    });
  }, [map, route]);

  return null;
}


// ----------------------------------------------------
// Geocode place using OpenStreetMap Nominatim
// ----------------------------------------------------

const geocodePlace = async (
  rawValue,
  routeContext = {}
) => {
  const query = (rawValue || "").trim();

  if (!query) return null;

  const startName =
    typeof routeContext.start === "string"
      ? routeContext.start
      : routeContext.start?.name || "";

  const destinationName =
    typeof routeContext.destination === "string"
      ? routeContext.destination
      : routeContext.destination?.name || "";

  /*
   * Search several ways.
   *
   * Small villages sometimes aren't returned
   * correctly when too much information is
   * included in the first query.
   */
  const queries = [
    query,

    `${query}, Karnataka`,

    `${query}, Karnataka, India`,

    `${query}, India`,

    startName
      ? `${query}, ${startName}, Karnataka`
      : null,

    destinationName
      ? `${query}, ${destinationName}, Karnataka`
      : null,

    startName && destinationName
      ? `${query}, ${startName}, ${destinationName}, Karnataka`
      : null,
  ].filter(Boolean);

  /*
   * Remove duplicate queries.
   */
  const uniqueQueries = [...new Set(queries)];

  for (const searchQuery of uniqueQueries) {
    try {
      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?format=jsonv2` +
        `&q=${encodeURIComponent(searchQuery)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=10`;

      console.log(
        "Searching location:",
        searchQuery
      );

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          "Nominatim error:",
          response.status
        );

        continue;
      }

      const results = await response.json();

      console.log(
        "Nominatim results:",
        searchQuery,
        results
      );

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {
        continue;
      }

      /*
       * Find the best result ourselves.
       */
      const place = pickBestGeocodeMatch(
        results,
        query,
        routeContext
      );

      if (!place) {
        continue;
      }

      const lat = Number(place.lat);
      const lon = Number(place.lon);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {
        continue;
      }

      /*
       * Prefer the user's requested name
       * rather than an unexpected display name.
       */
      return {
        name:
          place.name ||
          place.display_name
            ?.split(",")[0]
            ?.trim() ||
          query,

        coords: [lat, lon],

        displayName: place.display_name || query,
      };
    } catch (error) {
      console.error(
        "Geocoding failed:",
        searchQuery,
        error
      );
    }
  }

  /*
   * -----------------------------------------
   * Local fallback locations
   * -----------------------------------------
   *
   * This is useful for small/local places
   * that sometimes don't appear in Nominatim.
   *
   * Add more places here if required.
   */
  const localLocations = {
    mantur: {
      name: "Mantur",
      coords: [15.401, 75.105],
    },

    hubli: {
      name: "Hubli",
      coords: [15.3647, 75.124],
    },

    gokarna: {
      name: "Gokarna",
      coords: [14.5479, 74.3188],
    },

    "om beach": {
      name: "Om Beach",
      coords: [14.5446, 74.3189],
    },
  };

  const localMatch = localLocations[query.toLowerCase()];

  if (localMatch) {
    console.log(
      "Using local fallback:",
      localMatch
    );

    return localMatch;
  }

  return null;
};


// ----------------------------------------------------
// Fetch real road routes from OSRM
// ----------------------------------------------------

const fetchRoadRoutes = async (routePoints) => {
  if (!routePoints || routePoints.length < 2) {
    return [];
  }

  const url = buildOSRMUrl(routePoints);

  if (!url) {
    return [];
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Routing request failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error(
        data.message || "Unable to calculate route"
      );
    }

    return data.routes || [];
  } catch (error) {
    console.error(
      "OSRM routing error:",
      error
    );

    return [];
  }
};


// ----------------------------------------------------
// Convert OSRM GeoJSON coordinates
// [longitude, latitude]
// to Leaflet
// [latitude, longitude]
// ----------------------------------------------------

const convertOSRMGeometry = (route) => {
  if (
    !route?.geometry?.coordinates ||
    !Array.isArray(
      route.geometry.coordinates
    )
  ) {
    return [];
  }

  return route.geometry.coordinates.map(
    ([lon, lat]) => [lat, lon]
  );
};


// ----------------------------------------------------
// Main component
// ----------------------------------------------------

export default function MapPlanner() {
  const location = useLocation();

  const passedTour =
    location.state?.tour;

  // ----------------------------------------------
  // Location state
  // ----------------------------------------------

  const [start, setStart] =
    useState(null);

  const [destination, setDestination] =
    useState(null);

  const [startInput, setStartInput] =
    useState("");

  const [destinationInput, setDestinationInput] =
    useState("");

  const [stops, setStops] =
    useState([]);

  const [newStopName, setNewStopName] =
    useState("");


  // ----------------------------------------------
  // Travel state
  // ----------------------------------------------

  const [members, setMembers] =
    useState(2);

  const [vehicleId, setVehicleId] =
    useState("suv");

  const [vehicleList, setVehicleList] =
    useState(mockVehicles);

  useEffect(() => {
    let isMounted = true;
    getVehicles().then((data) => {
      if (isMounted && data && data.length > 0) {
        setVehicleList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (passedTour?.vehicle && vehicleList.length > 0) {
      const match = vehicleList.find(v => v.name === passedTour.vehicle || v.id === passedTour.vehicle || v._id === passedTour.vehicle);
      if (match) {
        setVehicleId(match.id || match._id);
      }
    }
  }, [passedTour?.vehicle, vehicleList]);


  // ----------------------------------------------
  // Routing state
  // ----------------------------------------------

  const [roadRoutes, setRoadRoutes] =
    useState([]);

  const [selectedRouteIndex, setSelectedRouteIndex] =
    useState(0);

  const [isFindingPlace, setIsFindingPlace] =
    useState(false);

  const [isRouting, setIsRouting] =
    useState(false);

  const [routeError, setRouteError] =
    useState("");


  // ------------------------------------------------
  // Selected route
  // ------------------------------------------------

  const selectedRoute =
    roadRoutes[selectedRouteIndex] ||
    null;


  // ------------------------------------------------
  // Waypoints
  // ------------------------------------------------

  const routePoints = useMemo(() => {
    return buildRoutePoints(
      start,
      destination,
      stops
    );
  }, [
    start,
    destination,
    stops,
  ]);


  // ------------------------------------------------
  // Selected route geometry
  // ------------------------------------------------

  const selectedRouteGeometry =
    useMemo(() => {
      if (!selectedRoute) return [];

      return convertOSRMGeometry(
        selectedRoute
      );
    }, [selectedRoute]);


  // ------------------------------------------------
  // Distance
  // ------------------------------------------------

  const totalDistance = useMemo(() => {
    if (selectedRoute?.distance) {
      return selectedRoute.distance / 1000;
    }

    return getRouteDistance(
      routePoints
    );
  }, [
    selectedRoute,
    routePoints,
  ]);


  // ------------------------------------------------
  // Vehicle
  // ------------------------------------------------

  const vehicle =
    vehicleList.find(
      (v) => v.id === vehicleId || v._id === vehicleId
    ) || vehicleList[0];


  // ------------------------------------------------
  // Fuel calculation
  // ------------------------------------------------

  // Vehicle fare (per-km pricing)
  const vehicleFare = totalDistance
    ? Math.round(totalDistance * vehicle.costPerKm)
    : 0;

  // Fuel estimation (legacy display) - kept for informational purposes
  const fuelCost = totalDistance
    ? Math.ceil(totalDistance / vehicle.mileage) * 100
    : 0;


  // ------------------------------------------------
  // Destination nearby places
  // ------------------------------------------------

  const destKey =
    typeof destination === "string"
      ? destination
      : destination?.name ||
        passedTour?.destination
          ?.split(",")[0] ||
        "Gokarna";

  const nearby =
    attractions[destKey] ||
    attractions.Gokarna ||
    [];


  // ------------------------------------------------
  // Display names
  // ------------------------------------------------

  const plannerStart =
    start?.name || "Start";

  const plannerDestination =
    destination?.name ||
    "Destination";


  // ------------------------------------------------
  // Request road routes whenever
  // start / destination / stops change
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadRoutes = async () => {
      if (routePoints.length < 2) {
        setRoadRoutes([]);
        setSelectedRouteIndex(0);
        return;
      }

      setIsRouting(true);
      setRouteError("");

      const routes =
        await fetchRoadRoutes(
          routePoints
        );

      if (cancelled) return;

      if (!routes.length) {
        setRoadRoutes([]);
        setSelectedRouteIndex(0);

        setRouteError(
          "Unable to find a road route for these locations."
        );

        setIsRouting(false);
        return;
      }

      setRoadRoutes(routes);

      // Keep current selection if possible
      setSelectedRouteIndex(
        (current) =>
          current < routes.length
            ? current
            : 0
      );

      setIsRouting(false);
    };

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [routePoints]);


  // ------------------------------------------------
  // Resolve Start / Destination
  // ------------------------------------------------

  const resolvePlace = async (
    type,
    value
  ) => {
    const query = (value || "").trim();

    if (!query) {
      if (type === "start") {
        setStart(null);
      }

      if (type === "destination") {
        setDestination(null);
      }

      return;
    }

    setIsFindingPlace(true);
    setRouteError("");

    const resolved =
      await geocodePlace(
        query,
        {
          start,
          destination,
        }
      );

    setIsFindingPlace(false);

    if (!resolved) {
      setRouteError(
        `Could not find "${query}". Try entering a more specific place name.`
      );

      return;
    }

    if (type === "start") {
      const newStart = {
        id: `start-${Date.now()}`,
        name: resolved.name,
        coords: resolved.coords,
      };

      setStart(newStart);
      setStartInput(resolved.name);
    }

    if (type === "destination") {
      const newDestination = {
        id: `destination-${Date.now()}`,
        name: resolved.name,
        coords: resolved.coords,
      };

      setDestination(
        newDestination
      );

      setDestinationInput(
        resolved.name
      );
    }
  };


  // ------------------------------------------------
  // Add Stop
  // ------------------------------------------------

  const addStop = async (place) => {
    const candidate =
      typeof place === "string"
        ? place
        : place?.name;

    const query =
      (candidate || "").trim();

    if (!query) return;

    setIsFindingPlace(true);
    setRouteError("");

    const resolved =
      await geocodePlace(
        query,
        {
          start,
          destination,
        }
      );

    setIsFindingPlace(false);

    if (!resolved) {
      setRouteError(
        `Could not find stop "${query}".`
      );

      return;
    }

    const normalized =
      normalizeStop({
        id: `stop-${Date.now()}`,
        name: resolved.name,
        coords: resolved.coords,
      });

    if (!normalized) return;

    setStops((current) => {
      const alreadyExists =
        current.some(
          (stop) =>
            stop.name.toLowerCase() ===
            normalized.name.toLowerCase()
        );

      if (alreadyExists) {
        return current;
      }

      return [
        ...current,
        normalized,
      ];
    });

    setNewStopName("");
  };


  // ------------------------------------------------
  // Enter key
  // ------------------------------------------------

  const handleRouteKeyDown = (
    type,
    event
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (type === "start") {
      resolvePlace(
        "start",
        startInput
      );
    }

    if (type === "destination") {
      resolvePlace(
        "destination",
        destinationInput
      );
    }
  };


  // ------------------------------------------------
  // Clear route
  // ------------------------------------------------

  const clearRoute = () => {
    setStart(null);
    setDestination(null);

    setStartInput("");
    setDestinationInput("");

    setStops([]);
    setNewStopName("");

    setRoadRoutes([]);
    setSelectedRouteIndex(0);

    setRouteError("");
  };


  // ------------------------------------------------
  // Reorder stop
  // ------------------------------------------------

  const moveStop = (
    index,
    direction
  ) => {
    const newIndex =
      index + direction;

    if (
      newIndex < 0 ||
      newIndex >= stops.length
    ) {
      return;
    }

    const copy = [...stops];

    [
      copy[index],
      copy[newIndex],
    ] = [
      copy[newIndex],
      copy[index],
    ];

    setStops(copy);
  };


  // ------------------------------------------------
  // Edit stop
  // ------------------------------------------------

  const editStop = async (
    index
  ) => {
    const currentStop =
      stops[index];

    const newName =
      window.prompt(
        "Enter new stop name",
        currentStop.name
      );

    if (!newName?.trim()) {
      return;
    }

    const resolved =
      await geocodePlace(
        newName,
        {
          start,
          destination,
        }
      );

    if (!resolved) {
      setRouteError(
        `Could not find "${newName}".`
      );

      return;
    }

    const copy = [...stops];

    copy[index] = {
      ...currentStop,
      name: resolved.name,
      coords: resolved.coords,
    };

    setStops(copy);
  };


  // ------------------------------------------------
  // Passed tour
  // ------------------------------------------------

  const passedTourCity =
    passedTour?.destination
      ?.split(",")[0];

  const passTour =
    passedTour &&
    passedTourCity &&
    plannerDestination &&
    plannerDestination.toLowerCase() ===
      passedTourCity.toLowerCase();


  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <div className="page planner-page">

      <div className="container page-title-wrap">
        <span className="eyebrow">
          Smart route planner
        </span>

        <h1 className="section-title">
          Build the journey your way.
        </h1>

        <p className="muted">
          Enter your start, destination
          and stops. The map will find
          real roads and alternative
          routes.
        </p>
      </div>


      <div className="container planner-grid">

        {/* ==========================================
            LEFT CONTROL PANEL
        =========================================== */}

        <aside className="planner-controls card">

          {/* ----------------------------------------
              STEP 01
          ----------------------------------------- */}

          <div className="planner-step">

            <span>01</span>

            <div>
              <h3>Route</h3>

              <div className="form-grid">

                <div className="field">
                  <label>
                    Starting location
                  </label>

                  <input
                    type="text"
                    value={startInput}
                    onChange={(e) =>
                      setStartInput(
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      resolvePlace(
                        "start",
                        startInput
                      )
                    }
                    onKeyDown={(e) =>
                      handleRouteKeyDown(
                        "start",
                        e
                      )
                    }
                    placeholder="e.g. Hubli"
                  />
                </div>


                <div className="field">
                  <label>
                    Destination
                  </label>

                  <input
                    type="text"
                    value={
                      destinationInput
                    }
                    onChange={(e) =>
                      setDestinationInput(
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      resolvePlace(
                        "destination",
                        destinationInput
                      )
                    }
                    onKeyDown={(e) =>
                      handleRouteKeyDown(
                        "destination",
                        e
                      )
                    }
                    placeholder="e.g. Gokarna"
                  />
                </div>

              </div>


              {isFindingPlace && (
                <p
                  className="muted tiny"
                  style={{
                    marginTop: 8,
                  }}
                >
                  Finding location...
                </p>
              )}

            </div>
          </div>


          {/* ----------------------------------------
              STEP 02
          ----------------------------------------- */}

          <div className="planner-step">

            <span>02</span>

            <div>
              <h3>Stops</h3>

              <div className="field stop-input-group">

                <label>
                  Add a place or stop name
                </label>

                <div className="stop-input-row">

                  <input
                    type="text"
                    value={
                      newStopName
                    }
                    onChange={(e) =>
                      setNewStopName(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        e.preventDefault();

                        addStop(
                          newStopName
                        );
                      }
                    }}
                    placeholder="e.g. Om Beach"
                  />

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      addStop(
                        newStopName
                      )
                    }
                  >
                    Add
                  </button>

                </div>
              </div>


              <div className="stop-list">

                {stops.length ? (
                  stops.map(
                    (stop, index) => (
                      <div
                        className="stop-item"
                        key={stop.id}
                      >

                        <span>
                          {index + 1}.{" "}
                          {stop.name}
                        </span>

                        <div className="stop-actions">

                          <button
                            className="btn"
                            onClick={() =>
                              moveStop(
                                index,
                                -1
                              )
                            }
                            disabled={
                              index === 0
                            }
                          >
                            ↑
                          </button>

                          <button
                            className="btn"
                            onClick={() =>
                              moveStop(
                                index,
                                1
                              )
                            }
                            disabled={
                              index ===
                              stops.length - 1
                            }
                          >
                            ↓
                          </button>

                          <button
                            className="btn"
                            onClick={() =>
                              editStop(index)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              setStops(
                                stops.filter(
                                  (_, i) =>
                                    i !==
                                    index
                                )
                              )
                            }
                          >
                            ×
                          </button>

                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="muted">
                    No extra stops yet.
                  </p>
                )}

              </div>
            </div>
          </div>


          {/* ----------------------------------------
              STEP 03
          ----------------------------------------- */}

          <div className="planner-step">

            <span>03</span>

            <div>
              <h3>
                Travelers & vehicle
              </h3>

              <div className="form-grid">

                <div className="field">
                  <label>
                    Members
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={members}
                    onChange={(e) =>
                      setMembers(
                        Number(
                          e.target.value
                        )
                      )
                    }
                  />
                </div>


                <div className="field">
                  <label>
                    Vehicle
                  </label>

                  <select
                    value={vehicleId}
                    onChange={(e) =>
                      setVehicleId(
                        e.target.value
                      )
                    }
                  >
                    {vehicleList.map(
                      (v) => (
                        <option
                          key={v.id || v._id}
                          value={v.id || v._id}
                        >
                          {v.name} ·{" "}
                          {v.capacity} seats
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>


              {members > (vehicle.capacity - 1) && (
                <div className="notice error">
                  This vehicle cannot accommodate {members} travelers. One seat is reserved for the driver; maximum passengers for this vehicle is {vehicle.capacity - 1}.
                </div>
              )}

            </div>
          </div>


          {/* =========================================
              ROUTE ALTERNATIVES
          ========================================== */}

          {roadRoutes.length > 1 && (
            <div className="planner-step">

              <span>04</span>

              <div>
                <h3>
                  Alternative routes
                </h3>

                <p className="muted tiny">
                  You can also click
                  any route directly
                  on the map.
                </p>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                  }}
                >

                  {roadRoutes.map(
                    (routeOption, index) => (
                      <button
                        key={index}
                        type="button"
                        className={
                          index ===
                          selectedRouteIndex
                            ? "btn btn-primary"
                            : "btn btn-secondary"
                        }
                        onClick={() =>
                          setSelectedRouteIndex(
                            index
                          )
                        }
                        style={{
                          textAlign:
                            "left",
                        }}
                      >
                        Route{" "}
                        {index + 1}

                        {" · "}

                        {(
                          routeOption.distance /
                          1000
                        ).toFixed(1)}{" "}
                        km

                        {" · "}

                        {Math.round(
                          routeOption.duration /
                            60
                        )}{" "}
                        min
                      </button>
                    )
                  )}

                </div>
              </div>
            </div>
          )}


          {/* =========================================
              ERROR / ROUTING STATUS
          ========================================== */}

          {isRouting && (
            <p className="muted tiny">
              Finding the best road routes...
            </p>
          )}

          {routeError && (
            <div className="notice error">
              {routeError}
            </div>
          )}


          {/* =========================================
              SUMMARY
          ========================================== */}

          <div
            className="planner-summary"
            style={{
              display: "grid",
              gap: 10,
            }}
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 8,
              }}
            >

              <div>
                <span>
                  Route
                </span>

                <strong>
                  {plannerStart} →{" "}
                  {plannerDestination}
                </strong>
              </div>

              <div>
                <span>
                  Stops
                </span>

                <strong>
                  {stops.length}
                </strong>
              </div>

            </div>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr 1fr",
                gap: 8,
              }}
            >

              <div>
                <span>
                  Distance
                </span>

                <strong>
                  {Math.round(
                    totalDistance
                  )}{" "}
                  km
                </strong>
              </div>


              <div>
                <span>
                  Time
                </span>

                <strong>
                  {selectedRoute
                    ? Math.max(
                        1,
                        Math.round(
                          selectedRoute.duration /
                            3600
                        )
                      )
                    : Math.max(
                        1,
                        Math.round(
                          totalDistance /
                            50
                        )
                      )}{" "}
                  hrs
                </strong>
              </div>


              <div>
                <span>
                  Fuel
                </span>

                <strong>
                  ₹
                  {fuelCost.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>Vehicle fare</span>
                <strong>₹{vehicleFare.toLocaleString('en-IN')}</strong>
              </div>

            </div>

          </div>


          {/* =========================================
              CLEAR
          ========================================== */}

          <button
            type="button"
            className="btn btn-secondary full"
            onClick={clearRoute}
          >
            Clear route
          </button>


          {/* =========================================
              BOOKING
          ========================================== */}

            <Link
              className={`btn btn-primary full ${
                members > (vehicle.capacity - 1) ? "disabled" : ""
              }`}
              to={members <= (vehicle.capacity - 1) ? "/booking" : "#"}
              state={{
                planner: {
                  start: plannerStart,

                  destination: plannerDestination,

                  stops,

                  members,

                  vehicleId,

                  distance: Math.round(totalDistance),

                  // pass calculated vehicle fare so booking uses per-km pricing
                  vehicleCost: vehicleFare,

                  fuelCost,

                  selectedRoute: selectedRoute
                    ? {
                        distance: selectedRoute.distance,

                        duration: selectedRoute.duration,

                        geometry: selectedRoute.geometry,
                      }
                    : null,
                },

                tour: passTour ? passedTour : undefined,
              }}
            >
              Continue to booking →
            </Link>

        </aside>


        {/* ==========================================
            MAP
        =========================================== */}

        <section className="map-area">

          <div className="map-card card">

            <MapContainer
              center={
                start?.coords ||
                [15.3647, 75.124]
              }
              zoom={7}
              scrollWheelZoom
              className="map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              <AutoCenterMap
                route={
                  selectedRouteGeometry.length
                    ? selectedRouteGeometry
                    : routePoints
                }
              />


              {/* ====================================
                  START MARKER
              ===================================== */}

              {start && (
                <Marker
                  position={
                    start.coords
                  }
                >
                  <Popup>
                    <strong>
                      Start
                    </strong>
                    <br />
                    {start.name}
                  </Popup>
                </Marker>
              )}


              {/* ====================================
                  STOP MARKERS
              ===================================== */}

              {stops.map(
                (stop, index) => (
                  <Marker
                    key={stop.id}
                    position={
                      stop.coords
                    }
                  >
                    <Popup>
                      <strong>
                        Stop{" "}
                        {index + 1}
                      </strong>
                      <br />
                      {stop.name}
                    </Popup>
                  </Marker>
                )
              )}


              {/* ====================================
                  DESTINATION MARKER
              ===================================== */}

              {destination && (
                <Marker
                  position={
                    destination.coords
                  }
                >
                  <Popup>
                    <strong>
                      Destination
                    </strong>
                    <br />
                    {destination.name}
                  </Popup>
                </Marker>
              )}


              {/* ====================================
                  ROUTE ALTERNATIVES
              ===================================== */}

              {roadRoutes.map(
                (routeOption, index) => {
                  const geometry =
                    convertOSRMGeometry(
                      routeOption
                    );

                  if (
                    !geometry.length
                  ) {
                    return null;
                  }

                  const isSelected =
                    index ===
                    selectedRouteIndex;

                  return (
                    <div
                      key={`route-${index}`}
                    >

                      {/* 
                        Outer clickable route.
                        This makes the road easier
                        to click.
                      */}

                      <Polyline
                        positions={
                          geometry
                        }
                        pathOptions={{
                          color:
                            isSelected
                              ? "#1a73e8"
                              : "#777",

                          weight:
                            isSelected
                              ? 8
                              : 6,

                          opacity:
                            isSelected
                              ? 1
                              : 0.45,

                          lineCap:
                            "round",

                          lineJoin:
                            "round",
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedRouteIndex(
                              index
                            );
                          },
                        }}
                      />

                    </div>
                  );
                }
              )}

            </MapContainer>


            {/* ======================================
                ROUTE INFORMATION
            ======================================= */}

            <div className="route-pill">

              ●{" "}

              {[
                plannerStart,

                ...stops.map(
                  (stop) =>
                    stop.name
                ),

                plannerDestination,
              ].join("  →  ")}

              {selectedRoute && (
                <>
                  {" · "}
                  Route{" "}
                  {selectedRouteIndex +
                    1}
                </>
              )}

            </div>

          </div>


          {/* ==========================================
              NEARBY PLACES
          =========================================== */}

          <div className="nearby-section">

            <div className="section-head">

              <div>

                <span className="eyebrow">
                  Around your
                  destination
                </span>

                <h2>
                  Nearby places
                </h2>

              </div>

            </div>


            <div className="nearby-grid">

              {nearby.map(
                (place) => (
                  <div
                    className="nearby-card card"
                    key={place.id}
                  >

                    <img
                      src={place.image}
                      alt={place.name}
                    />

                    <div>

                      <span>
                        {place.type} ·{" "}
                        {place.distance} km
                      </span>

                      <h3>
                        {place.name}
                      </h3>

                      <p className="muted">
                        {
                          place.description
                        }
                      </p>

                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          addStop(
                            place
                          )
                        }
                      >
                        + Add stop
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}