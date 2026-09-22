export const defaultBrandColors = { primary: '#82ADE1', secondary: '#91B8AD' };
export const validBrandColor = value => /^#[0-9a-f]{6}$/i.test(value || '');
export function brandColors(colors) {
  return Object.fromEntries(Object.entries(defaultBrandColors).map(([key, fallback]) => [key, validBrandColor(colors?.[key]) ? colors[key].toUpperCase() : fallback]));
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function brandStyle(colors) {
  const {primary, secondary} = brandColors(colors);
  return {'--retail-brand-primary': primary, '--retail-brand-secondary': secondary, '--retail-accent': luminance(primary) < .18 ? `color-mix(in srgb, ${primary} 55%, white)` : primary, '--retail-brand-ink': luminance(primary) > .179 ? '#080D16' : '#FFFFFF'};
}
