import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('frontend scaffold files exist', () => {
  assert.equal(fs.existsSync('src/index.html'), true);
  assert.equal(fs.existsSync('src/app.js'), true);
  assert.equal(fs.existsSync('scripts/build.mjs'), true);
});
