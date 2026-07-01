// scripts/generate-icons.cjs
// Run: node scripts/generate-icons.cjs
//
// Builds the MacroStack app icon (MACRO stacked over STACK) using the EXACT
// landing-page wordmark styling — Barlow Condensed Black, tracking-widest,
// cream over accent-blue on the dark app background. The glyphs are converted
// to vector paths so the icon is pixel-identical everywhere with no font
// dependency at render time. Writes public/favicon.svg and rasterizes the PWA
// / apple-touch PNGs from it.

const opentype = require('opentype.js')
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

// ── Exact landing-page tokens (html.ocean-dark) ──────────────────────────────
const BG      = '#08090F'   // --color-bg
const CREAM   = '#D8E6F4'   // --color-cream  → "MACRO"
const ACCENT  = '#4878B0'   // --color-accent → "STACK"
const TRACKING = 0.1        // tracking-widest = 0.1em
const CANVAS   = 512
const RADIUS   = 116        // ~22.6% rounded square
const TARGET_W = 430        // widest line fills this (≈84% → ~9% side padding)

const publicDir = path.resolve(__dirname, '..', 'public')
const fontBuf = fs.readFileSync(path.join(__dirname, 'fonts', 'BarlowCondensed-Black.ttf'))
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength))
const upm = font.unitsPerEm
const capH = (font.tables.os2 && font.tables.os2.sCapHeight) || 0.7 * upm

// Advance width of a line in em (glyph advances + letter-spacing between chars)
function lineEm(text) {
  let adv = 0
  for (const ch of text) adv += font.charToGlyph(ch).advanceWidth / upm
  return adv + TRACKING * (text.length - 1)
}

// Build combined SVG path data for a line, left edge at x0, baseline at y
function linePath(text, fontSize, x0, y) {
  const scale = fontSize / upm
  let x = x0
  let d = ''
  for (const ch of text) {
    const glyph = font.charToGlyph(ch)
    d += glyph.getPath(x, y, fontSize).toPathData(3) + ' '
    x += (glyph.advanceWidth / upm) * fontSize + TRACKING * fontSize
  }
  return d.trim()
}

const LINES = ['MACRO', 'STACK']

// One shared font size so the wider line just fits TARGET_W (both are 5 chars)
const fontSize = Math.min(...LINES.map((t) => TARGET_W / lineEm(t)))

// Vertical stack, centered
const capPx = (capH / upm) * fontSize
const gap = 0.06 * fontSize
const blockH = capPx * 2 + gap
const top = (CANVAS - blockH) / 2
const baselines = [top + capPx, top + capPx + gap + capPx]

const colors = [CREAM, ACCENT]
const paths = LINES.map((text, i) => {
  const w = lineEm(text) * fontSize
  const x0 = (CANVAS - w) / 2
  return `  <path fill="${colors[i]}" d="${linePath(text, fontSize, x0, baselines[i])}"/>`
}).join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
  <rect width="${CANVAS}" height="${CANVAS}" rx="${RADIUS}" ry="${RADIUS}" fill="${BG}"/>
${paths}
</svg>
`

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg)
console.log('✓ favicon.svg')

for (const { file, size } of [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]) {
  const buffer = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  fs.writeFileSync(path.join(publicDir, file), buffer)
  console.log(`✓ ${file} (${size}×${size})`)
}
