import assert from 'node:assert/strict';
import test from 'node:test';
import {brandStyle, defaultBrandColors} from '../src/retail/brandColors.js';

const luminance = hex => hex.slice(1).match(/.{2}/g)
  .map(channel => parseInt(channel, 16) / 255)
  .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (first, second) => {
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
};

test('retail light mode keeps brand colors while using readable surfaces', () => {
  const saved = {...defaultBrandColors, primary:'#FFFF00', secondary:'#00FFFF'};
  const before = structuredClone(saved);
  const dark = brandStyle(saved);
  const light = brandStyle(saved, 'light');
  assert.deepEqual(saved, before);
  assert.equal(dark['--color-bg'], saved.background);
  assert.equal(dark['--retail-brand-primary'], saved.primary);
  assert.equal(light['--retail-brand-primary'], saved.primary);
  assert.equal(light['--retail-brand-secondary'], saved.secondary);
  assert.equal(light['--color-card'], '#FFFFFF');
  assert.ok(contrast(light['--retail-accent'], '#FFFFFF') >= 4.5);
  assert.ok(contrast(light['--color-muted'], light['--color-card']) >= 4.5);
});

test('light accents and button labels stay legible with extreme store colors', () => {
  for (const primary of ['#FFFFFF', '#FFFF00', '#FF0000', '#000000', '#82ADE1']) {
    const colors = {...defaultBrandColors, primary, buttonEnd:primary, buttonGradient:false};
    const style = brandStyle(colors, 'light');
    assert.ok(contrast(style['--retail-accent'], '#FFFFFF') >= 4.5, `accent ${primary}`);
    assert.ok(contrast(style['--retail-brand-ink'], primary) >= 4.5, `button ${primary}`);
  }
});

test('light mode avoids a gradient with incompatible label contrast', () => {
  const style = brandStyle({...defaultBrandColors, primary:'#000000', buttonEnd:'#FFFFFF', buttonGradient:true}, 'light');
  assert.equal(style['--retail-button-paint'], '#000000');
  assert.ok(contrast(style['--retail-brand-ink'], '#000000') >= 4.5);
});
