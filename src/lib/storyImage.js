// Local-only export: no account identifiers, remote rendering, links or tracking.
export const STORY_SIZE = { width: 1080, height: 1920 }
const colors = { bg: '#080B12', ink: '#D8E6F4', muted: '#99ABC0', line: '#27354A', blue: '#79A6DF', protein: '#A4B781', fat: '#A0AEC1' }
const keys = ['calories', 'protein', 'carbs', 'fat']
const values = source => Object.fromEntries(keys.map(key => [key, Number.isFinite(source?.[key]) ? source[key] : null]))

export function storySnapshot({ kind, date, totals, goals, meal, items = [] }) {
  if (!['meal', 'daily'].includes(kind) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(date))) throw new Error('Choose a valid logged date.')
  if (!totals || keys.some(key => !Number.isFinite(totals[key]) || totals[key] < 0)) throw new Error('Nutrition totals are unavailable. Please reload and try again.')
  if (kind === 'meal' && !items.length) throw new Error('Log food in this meal before sharing it.')
  return { kind, date, totals: values(totals), goals: values(goals), meal: String(meal || 'Meal'), items: items.map(item => ({ name: String(item.name || 'Food item') })) }
}

export function canShareImage(file, nav = navigator) {
  try { return Boolean(file && nav.share && nav.canShare?.({ files: [file] })) } catch { return false }
}

let assets
function loadAssets() {
  if (!assets) assets = Promise.all([
    new FontFace('StoryDisplay', 'url(/fonts/BarlowCondensed-Black.ttf)', { weight: '900' }).load(),
    new FontFace('StoryBody', 'url(/fonts/SpaceGrotesk.ttf)').load(),
    new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Logo could not load.'))
      image.src = '/macrostack-mark-light-shadow.png'
    }),
  ]).then(([display, body, logo]) => { document.fonts.add(display); document.fonts.add(body); return logo })
    .catch(error => { assets = null; throw error })
  return assets
}

function fit(ctx, text, size, width, family = 'StoryDisplay') {
  while (size > 18) {
    ctx.font = `${family === 'StoryDisplay' ? '900 ' : ''}${size}px ${family}`
    if (ctx.measureText(text).width <= width) break
    size -= 2
  }
}
function short(ctx, text, width) {
  const letters = Array.from(text)
  if (ctx.measureText(text).width <= width) return text
  while (letters.length && ctx.measureText(`${letters.join('')}…`).width > width) letters.pop()
  return `${letters.join('')}…`
}
function text(ctx, value, x, y, size, color = colors.ink, width = 900, family = 'StoryDisplay') {
  value = String(value)
  ctx.fillStyle = color; fit(ctx, value, size, width, family)
  ctx.fillText(short(ctx, value, width), x, y)
}
const number = value => value == null ? '—' : Math.round(value).toLocaleString('en-US')
function line(ctx, y) { ctx.fillStyle = colors.line; ctx.fillRect(90, y, 900, 2) }

export async function readStoryPhoto(file) {
  if (!file || file.size > 20 * 1024 * 1024) throw new Error('Choose a food photo smaller than 20 MB.')
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw new Error('Choose a JPG, PNG, WebP, or supported HEIC photo.')
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const photo = new Image()
      const timer = setTimeout(() => reject(new Error('Photo loading timed out. Please choose it again.')), 15000)
      photo.onload = () => { clearTimeout(timer); resolve(photo) }
      photo.onerror = () => { clearTimeout(timer); reject(new Error('This photo could not be opened. Try a JPG or PNG instead.')) }
      photo.src = url
    })
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Choose a valid food photo.')
    // Bound repeated export memory and strip camera metadata. Browser decoding
    // applies photo orientation; the original file is never uploaded or shared.
    const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Photo processing is unavailable in this browser.')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally { URL.revokeObjectURL(url) }
}

export function photoCrop(width, height, position = { x: 50, y: 50 }) {
  if (!(width > 0 && height > 0)) throw new Error('Add a food photo before sharing.')
  const scale = Math.max(1080 / width, 1920 / height)
  const cropWidth = 1080 / scale, cropHeight = 1920 / scale
  return { x: (width - cropWidth) * Math.max(0, Math.min(100, position.x)) / 100,
    y: (height - cropHeight) * Math.max(0, Math.min(100, position.y)) / 100, width: cropWidth, height: cropHeight }
}

export async function renderStoryCanvas(story, photo, position) {
  if (story.kind === 'meal' && !photo) throw new Error('Add a food photo before sharing.')
  // Generation happens before the user's final Share tap to preserve iOS activation.
  let timeout
  const logo = await Promise.race([loadAssets(), new Promise((_, reject) => {
    timeout = setTimeout(() => { assets = null; reject(new Error('The share assets took too long to load. Please retry.')) }, 15000)
  })]).finally(() => clearTimeout(timeout))
  const canvas = document.createElement('canvas')
  canvas.width = STORY_SIZE.width; canvas.height = STORY_SIZE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Image export is not available in this browser.')
  ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, 1080, 1920)
  if (story.kind === 'daily') {
    ctx.textBaseline = 'top'
    ctx.strokeStyle = '#101824'; ctx.lineWidth = 1
    for (let x = 0; x < 1080; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke() }
    for (let y = 0; y < 1920; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke() }
    const date = new Date(`${story.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
    text(ctx, date, 90, 240, 26, colors.muted, 900, 'StoryBody')
    ctx.fillStyle = colors.blue; ctx.fillRect(90, 306, 70, 6)
    text(ctx, 'THE DAILY', 90, 355, 118)
    text(ctx, 'STACK.', 90, 474, 118, colors.blue)
    line(ctx, 645)
    text(ctx, number(story.totals.calories), 90, 685, 174, colors.ink, 620)
    text(ctx, 'KCAL', 750, 770, 42, colors.muted, 240)
    text(ctx, `${number(story.goals.calories)} KCAL GOAL`, 90, 875, 30, colors.muted, 900, 'StoryBody')
    ;[['protein', 'PROTEIN', colors.protein], ['carbs', 'CARBS', colors.blue], ['fat', 'FAT', colors.fat]].forEach(([key, label, color], index) => {
      const y = 990 + index * 184
      text(ctx, label, 90, y, 34, color)
      ctx.textAlign = 'right'; text(ctx, `${number(story.totals[key])} / ${number(story.goals[key])} g`, 990, y, 38, colors.ink, 570, 'StoryBody'); ctx.textAlign = 'left'
      ctx.fillStyle = colors.line; ctx.fillRect(90, y + 75, 900, 9)
      if (story.goals[key] > 0) { ctx.fillStyle = color; ctx.fillRect(90, y + 75, 900 * Math.min(1, story.totals[key] / story.goals[key]), 9) }
    })
    line(ctx, 1600)
  } else {
  const crop = photoCrop(photo.width || photo.naturalWidth, photo.height || photo.naturalHeight, position)
  ctx.drawImage(photo, crop.x, crop.y, crop.width, crop.height, 0, 0, 1080, 1920)
  ctx.textBaseline = 'top'
  // Text lives above/below the food. The center (y=540–1180) is untouched.
  const top = ctx.createLinearGradient(0, 0, 0, 540)
  top.addColorStop(0, 'rgba(8,11,18,.94)'); top.addColorStop(.7, 'rgba(8,11,18,.8)'); top.addColorStop(1, 'rgba(8,11,18,0)')
  ctx.fillStyle = top; ctx.fillRect(0, 0, 1080, 540)
  const bottom = ctx.createLinearGradient(0, 1180, 0, 1920)
  bottom.addColorStop(0, 'rgba(8,11,18,0)'); bottom.addColorStop(.28, 'rgba(8,11,18,.88)'); bottom.addColorStop(1, 'rgba(8,11,18,.98)')
  ctx.fillStyle = bottom; ctx.fillRect(0, 1180, 1080, 740)
  const date = new Date(`${story.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  text(ctx, date, 90, 220, 26, colors.ink, 900, 'StoryBody')
  text(ctx, story.kind === 'daily' ? 'DAILY TOTALS' : story.meal.toUpperCase(), 90, 285, 104, colors.ink, 900)
  ctx.fillStyle = colors.blue; ctx.fillRect(90, 420, 70, 6)
  text(ctx, number(story.totals.calories), 90, 1270, 112, colors.ink, 620)
  const calorieWidth = ctx.measureText(number(story.totals.calories)).width
  text(ctx, 'KCAL', 90 + calorieWidth + 24, 1330, 38, colors.ink, 220)
  if (story.kind === 'daily') {
    text(ctx, `${number(story.goals.calories)} KCAL GOAL`, 90, 1390, 26, colors.muted, 900, 'StoryBody')
  }
  ;[['protein', 'PROTEIN', colors.protein], ['carbs', 'CARBS', colors.blue], ['fat', 'FAT', colors.fat]].forEach(([key, label, color], index) => {
    const x = 90 + index * 310
    text(ctx, `${number(story.totals[key])}g`, x, 1460, 65, color, 280)
    text(ctx, label, x, 1540, 25, colors.ink, 280, 'StoryBody')
    if (story.kind === 'daily') text(ctx, `/ ${number(story.goals[key])}g goal`, x, 1580, 23, colors.muted, 280, 'StoryBody')
  })
  line(ctx, 1630)
  }
  ctx.drawImage(logo, 75, 1630, 100, 100)
  text(ctx, 'MACROSTACK', 184, 1660, 37, colors.muted)
  return canvas
}

export async function generateStoryImage(story, photo, position) {
  const canvas = await renderStoryCanvas(story, photo, position)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the image. Please retry.')), 'image/png'))
}
