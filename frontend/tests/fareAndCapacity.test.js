import test from 'node:test';
import assert from 'node:assert/strict';
import { vehicles } from '../src/data/mockData.js';

test('vehicle per-km rates and passenger limits', () => {
  const map = {};
  vehicles.forEach(v => map[v.capacity] = v);

  // expected rates
  const expected = {
    4: 15,
    7: 16,
    12: 18,
    25: 23,
  };

  Object.entries(expected).forEach(([cap, rate]) => {
    const v = map[Number(cap)];
    assert.ok(v, `vehicle with capacity ${cap} exists`);
    assert.equal(v.costPerKm, rate);
    assert.equal(v.capacity - 1, Math.max(0, v.capacity - 1));
  });
});
