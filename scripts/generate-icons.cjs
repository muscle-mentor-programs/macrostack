// scripts/generate-icons.cjs
// Run: node scripts/generate-icons.cjs
// Rasterizes public/favicon.svg into the PWA / apple-touch PNG icons.

const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const publicDir = path.resolve(__dirname, '..', 'public')
const svg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8')

const fontDirs = ['C:\\Windows\\Fonts']

const targets = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png',         size: 192 },
  { file: 'icon-512.png',         size: 512 },
]

for (const { file, size } of targets) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { fontDirs, defaultFontFamily: 'Arial Black', loadSystemFonts: true },
  })
  const buffer = resvg.render().asPng()
  fs.writeFileSync(path.join(publicDir, file), buffer)
  console.log(`✓ ${file} (${size}×${size})`)
}
