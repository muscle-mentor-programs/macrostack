// Regenerate MacroStack's platform icons from the approved master artwork.
// Run: node scripts/generate-icons.cjs

const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const sourcePath = path.join(rootDir, 'public', 'macrostack-logo.jpg')

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Missing approved logo source: ${sourcePath}`)
}

const source = fs.readFileSync(sourcePath).toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <image href="data:image/jpeg;base64,${source}" width="512" height="512" preserveAspectRatio="xMidYMid slice" />
</svg>`

const outputs = [
  ['public/favicon.png', 96],
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024],
  ['ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png', 2732],
  ['ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png', 2732],
  ['ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png', 2732],
]

for (const [relativePath, size] of outputs) {
  const outputPath = path.join(rootDir, relativePath)
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  fs.writeFileSync(outputPath, png)
  console.log(`✓ ${relativePath} (${size}×${size})`)
}
