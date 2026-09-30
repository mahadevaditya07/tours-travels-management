import test from 'node:test';
import assert from 'node:assert/strict';
import { HUBLI_COORDS, buildRoutePoints } from '../src/pages/mapPlannerUtils.js';

test('Hubli is automatically appended as the final stop in route points', () => {
  // Test case 1: Dharwad -> Gokarna -> Hubli
  const route1 = buildRoutePoints(
    { name: 'Dharwad', coords: [15.4589, 75.0078] },
    { name: 'Gokarna', coords: [14.5479, 74.3188] },
    []
  );

  assert.equal(route1.length, 3);
  assert.deepEqual(route1[0], [15.4589, 75.0078]); // Dharwad
  assert.deepEqual(route1[1], [14.5479, 74.3188]); // Gokarna
  assert.deepEqual(route1[2], HUBLI_COORDS);        // Hubli (Final)

  // Test case 2: Hubli -> Gokarna -> Hubli
  const route2 = buildRoutePoints(
    { name: 'Hubli', coords: HUBLI_COORDS },
    { name: 'Gokarna', coords: [14.5479, 74.3188] },
    []
  );

  assert.equal(route2.length, 3);
  assert.deepEqual(route2[0], HUBLI_COORDS);        // Hubli (Start)
  assert.deepEqual(route2[1], [14.5479, 74.3188]); // Gokarna
  assert.deepEqual(route2[2], HUBLI_COORDS);        // Hubli (Final)
});

test('Days and Nights calculation formula: Nights = Days - 1', () => {
  const calculateNights = (days) => Math.max(0, days - 1);

  assert.equal(calculateNights(1), 0);
  assert.equal(calculateNights(2), 1);
  assert.equal(calculateNights(3), 2);
  assert.equal(calculateNights(4), 3);
  assert.equal(calculateNights(7), 6);
});

test('Final price calculation: Travel Cost + Additional Day Charge', () => {
  const calculateFinalPrice = (distance, vehicleRate, dayCharge) => {
    const travelCost = Math.round(distance * vehicleRate);
    return travelCost + dayCharge;
  };

  // Example from requirements:
  // Route: Dharwad -> Gokarna -> Hubli (310 km)
  // Vehicle rate: ₹20/km
  // Travel cost: 310 * 20 = ₹6,200
  // 2 Days / 1 Night additional charge: ₹1,000
  // Total Price: ₹6,200 + ₹1,000 = ₹7,200
  const finalPrice = calculateFinalPrice(310, 20, 1000);
  assert.equal(finalPrice, 7200);
});
