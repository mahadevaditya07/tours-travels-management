import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLocationSearchQueries, buildRoutePoints, ensureStop, pickBestGeocodeMatch } from '../src/pages/mapPlannerUtils.js';

test('known locations use real coordinates', () => {
  const route = buildRoutePoints('Hubli', 'Gokarna', ['Mysore', 'Om Beach']);
  assert.deepEqual(route[0], [15.3647, 75.124]);
  assert.deepEqual(route[1], [12.2958, 76.6394]);
  assert.equal(route.length, 4);
});

test('custom stop names get generated coordinates instead of being dropped', () => {
  const stop = ensureStop('Kudle View', 0, { start: 'Hubli', destination: 'Gokarna' });
  assert.equal(stop.name, 'Kudle View');
  assert.ok(Array.isArray(stop.coords));
  assert.equal(stop.coords.length, 2);
});

test('route-aware stop queries prefer local context for ambiguous places', () => {
  const queries = buildLocationSearchQueries('Bhandiwad', { start: 'Mantur', destination: 'Hubli' });
  assert.ok(queries.some((query) => query.toLowerCase().includes('bhandiwad') && query.toLowerCase().includes('hubli')));
  assert.ok(queries.some((query) => query.toLowerCase().includes('karnataka')));
});

test('the best geocode result prefers the exact place name and nearby route match', () => {
  const bestMatch = pickBestGeocodeMatch([
    { display_name: 'Navalgund, Karnataka, India', lat: '15.53', lon: '75.31' },
    { display_name: 'Bhandiwad, Hubli, Karnataka, India', lat: '15.38', lon: '75.12' }
  ], 'Bhandiwad', {
    start: { coords: [15.35, 75.12] },
    destination: { coords: [15.36, 75.12] }
  });

  assert.match(bestMatch.display_name, /Bhandiwad/i);
});
