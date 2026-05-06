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
  <!-- Background -->
  <rect width="500" height="500" fill="#0D0C0A"/>

  <!--
    "MS" as one string, centered at x=250.
    text-anchor="middle" centers the full glyph run, so both letters
    together are optically balanced on both sides.
    Baseline y=382 centres the cap-height in the 500px square.
    Exact brown: #9A7B55 (text-brown from tailwind.config.js)
  -->
  <text
    x="250"
    y="382"
    font-family="Impact, Arial Black, sans-serif"
    font-size="360"
    font-weight="900"
    text-anchor="middle"
    dominant-baseline="auto"
  ><tspan fill="#F2EDE4">M</tspan><tspan fill="#9A7B55">S</tspan></text>
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
