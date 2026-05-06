// scripts/generate-icons.js
// Run once: node scripts/generate-icons.js
// Generates public/apple-touch-icon.png (500x500) and public/icon-192.png

const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

// ── Icon SVG ─────────────────────────────────────────────────────────────────
// M (cream) + S (gold) on a dark background, filling 500×500
const makeSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="${size}" height="${size}">
  <!-- Background: cream #E8E4DC -->
  <rect width="500" height="500" fill="#E8E4DC"/>

  <!--
    "MS" at midpoint between original (360px) and halved (180px) = 270px.
    Baseline y=348 vertically centres the cap-height in the 500px square.
    Dark text on light background: M in dark (#1C1A18), S in brown (#9A7B55).
  -->
  <text
    x="250"
    y="348"
    font-family="Impact, Arial Black, sans-serif"
    font-size="270"
    font-weight="900"
    text-anchor="middle"
    dominant-baseline="auto"
  ><tspan fill="#1C1A18">M</tspan><tspan fill="#9A7B55">S</tspan></text>
</svg>
`

const fontDirs = ['C:\\Windows\\Fonts']
const outDir = path.resolve(__dirname, '..', 'public')

const targets = [
  { file: 'apple-touch-icon.png', size: 500 },
  { file: 'icon-192.png',         size: 192 },
  { file: 'icon-512.png',         size: 512 },
]

for (const { file, size } of targets) {
  const svg = makeSVG(size)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { fontDirs, defaultFontFamily: 'Impact', loadSystemFonts: true },
  })
  const rendered = resvg.render()
  const buffer   = rendered.asPng()
  const outPath  = path.join(outDir, file)
  fs.writeFileSync(outPath, buffer)
  console.log(`✓ ${file} (${size}×${size})`)
}
