import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLocationSearchQueries,
  buildRoutePoints,
  normalizeStop,
  pickBestGeocodeMatch,
} from "../src/pages/mapPlannerUtils.js";


test("known coordinate objects are used to build route points with Hubli final stop", () => {
  const route = buildRoutePoints(
    {
      name: "Dharwad",
      coords: [15.4589, 75.0078],
    },
    {
      name: "Gokarna",
      coords: [14.5479, 74.3188],
    },
    [
      {
        name: "Mysore",
        coords: [12.2958, 76.6394],
      },
      {
        name: "Om Beach",
        coords: [14.5446, 74.3189],
      },
    ]
  );

  assert.deepEqual(
    route[0],
    [15.4589, 75.0078]
  );

  assert.deepEqual(
    route[1],
    [12.2958, 76.6394]
  );

  assert.deepEqual(
    route[2],
    [14.5446, 74.3189]
  );

  assert.deepEqual(
    route[3],
    [14.5479, 74.3188]
  );

  assert.deepEqual(
    route[4],
    [15.3647, 75.124]
  );

  assert.equal(
    route.length,
    5
  );
});


test("custom stop names start without coordinates", () => {
  const stop =
    normalizeStop(
      "Bhandiwad"
    );

  assert.equal(
    stop.name,
    "Bhandiwad"
  );

  assert.equal(
    stop.coords,
    null
  );
});


test("route-aware search queries contain local context", () => {
  const queries =
    buildLocationSearchQueries(
      "Bhandiwad",
      {
        start: "Mantur",
        destination: "Hubli",
      }
    );

  assert.ok(
    queries.some(
      (query) =>
        query
          .toLowerCase()
          .includes("bhandiwad") &&
        query
          .toLowerCase()
          .includes("hubli")
    )
  );

  assert.ok(
    queries.some(
      (query) =>
        query
          .toLowerCase()
          .includes("karnataka")
    )
  );
});


test("best geocode result prefers exact place name", () => {
  const bestMatch =
    pickBestGeocodeMatch(
      [
        {
          display_name:
            "Navalgund, Karnataka, India",
          lat: "15.53",
          lon: "75.31",
        },

        {
          display_name:
            "Bhandiwad, Hubli, Karnataka, India",
          lat: "15.38",
          lon: "75.12",
        },
      ],

      "Bhandiwad",

      {
        start: {
          coords: [
            15.35,
            75.12,
          ],
        },

        destination: {
          coords: [
            15.36,
            75.12,
          ],
        },
      }
    );

  assert.match(
    bestMatch.display_name,
    /Bhandiwad/i
  );
});