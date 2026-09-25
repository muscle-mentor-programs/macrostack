import assert from 'node:assert/strict';
import test from 'node:test';
import {brandStyle, defaultBrandColors} from '../src/retail/brandColors.js';

test('retail branding keeps saved dark portal colors and gradients', () => {
  const saved = {
    ...defaultBrandColors,
    primary: '#A6C8EF',
    background: '#10151F',
    backgroundEnd: '#1A2535',
    backgroundGradient: true,
    backgroundAngle: 135,
  };
  const before = structuredClone(saved);
  const style = brandStyle(saved);

  assert.deepEqual(saved, before);
  assert.equal(style['--retail-brand-primary'], saved.primary);
  assert.equal(style['--color-bg'], saved.background);
  assert.equal(style['--color-card'], saved.card);
  assert.equal(style['--retail-background-paint'],
    'linear-gradient(135deg, #10151F, #1A2535)');
});
