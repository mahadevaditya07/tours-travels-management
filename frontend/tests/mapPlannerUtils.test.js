import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRoutePoints, ensureStop } from '../src/pages/mapPlannerUtils.js';

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
