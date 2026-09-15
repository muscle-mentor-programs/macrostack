// Local-only export: no account identifiers, remote rendering, links or tracking.
export const STORY_SIZE = { width: 1080, height: 1920 }
export const FOODS_PER_STORY = 6
export const storyPageCount = story => story.kind === 'meal' ? Math.max(1, Math.ceil(story.items.length / FOODS_PER_STORY)) : 1

export function storyServing(item) {
  const positive = value => Number.isFinite(value) && value > 0
  const quantity = value => Number(value.toFixed(2)).toLocaleString('en-US')
  if (positive(item.quantity) && item.servingUnit) {
    if (['g', 'ml', 'oz', 'fl oz', 'L'].includes(item.servingUnit) && positive(item.servingSize)) {
      return `${quantity(item.quantity * item.servingSize)} ${item.servingUnit}`
    }
    return item.quantity === 1 && /^\d/.test(item.servingUnit) ? item.servingUnit : `${quantity(item.quantity)}${/^\d/.test(item.servingUnit) ? ' ×' : ''} ${item.servingUnit}`
  }
  if (positive(item.amount)) return `${quantity(item.amount)} g`
  if (positive(item.quantity) && positive(item.servingSize)) return `${quantity(item.quantity * item.servingSize)} g`
  return ''
}
const colors = { bg: '#080B12', ink: '#D8E6F4', muted: '#99ABC0', line: '#27354A', blue: '#79A6DF', protein: '#A4B781', fat: '#A0AEC1' }
const keys = ['calories', 'protein', 'carbs', 'fat']
const values = source => Object.fromEntries(keys.map(key => [key, Number.isFinite(source?.[key]) ? source[key] : null]))

export function storySnapshot({ kind, date, totals, goals, meal, items = [] }) {
  if (!['meal', 'daily'].includes(kind) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(date))) throw new Error('Choose a valid logged date.')
  if (!totals || keys.some(key => !Number.isFinite(totals[key]) || totals[key] < 0)) throw new Error('Nutrition totals are unavailable. Please reload and try again.')
  if (kind === 'meal' && !items.length) throw new Error('Log food in this meal before sharing it.')
  return { kind, date, totals: values(totals), goals: values(goals), meal: String(meal || 'Meal'), items: items.map(item => ({ name: String(item.name || 'Food item'), serving: storyServing(item) })) }
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

export function photoCrop(width, height, position = { x: 50, y: 50 }, frame = STORY_SIZE) {
  if (!(width > 0 && height > 0)) throw new Error('Add a food photo before sharing.')
  const scale = Math.max(frame.width / width, frame.height / height)
  const cropWidth = frame.width / scale, cropHeight = frame.height / scale
  return { x: (width - cropWidth) * Math.max(0, Math.min(100, position.x)) / 100,
    y: (height - cropHeight) * Math.max(0, Math.min(100, position.y)) / 100, width: cropWidth, height: cropHeight }
}

export async function renderStoryCanvas(story, photo, position, page = 0) {
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
    const pageCount = storyPageCount(story)
    const pageIndex = Math.max(0, Math.min(pageCount - 1, Math.floor(page) || 0))
    const foods = story.items.slice(pageIndex * FOODS_PER_STORY, (pageIndex + 1) * FOODS_PER_STORY)
    ctx.font = '32px StoryBody'
    const foodLines = foods.map(item => {
      const lines = []
      let current = ''
      for (const word of item.name.replace(/\s+/g, ' ').trim().split(' ')) {
        const next = current ? `${current} ${word}` : word
        if (ctx.measureText(next).width > 360 && current) { lines.push(current); current = word }
        else current = next
      }
      if (current) lines.push(current)
      return lines
    })
    // Anchor only the occupied rows above the macros so smaller meals reveal more photo.
    const rowHeights = Array.from({ length: Math.ceil(foods.length / 2) }, (_, row) => Math.max(86,
      ...foodLines.slice(row * 2, row * 2 + 2).map(lines => Math.min(3, lines.length) * 32 + 42)))
    const ingredientTop = 1538 - 18 - rowHeights.reduce((sum, height) => sum + height, 0) - 72
    const photoHeight = ingredientTop + 8
    const crop = photoCrop(photo.width || photo.naturalWidth, photo.height || photo.naturalHeight, position, { width: 1080, height: photoHeight })
    ctx.drawImage(photo, crop.x, crop.y, crop.width, crop.height, 0, 0, 1080, photoHeight)
    ctx.textBaseline = 'top'
    const top = ctx.createLinearGradient(0, 0, 0, 520)
    top.addColorStop(0, 'rgba(8,11,18,.88)'); top.addColorStop(1, 'rgba(8,11,18,0)')
    ctx.fillStyle = top; ctx.fillRect(0, 0, 1080, 520)
    const bottom = ctx.createLinearGradient(0, photoHeight - 210, 0, photoHeight)
    bottom.addColorStop(0, 'rgba(8,11,18,0)'); bottom.addColorStop(1, colors.bg)
    ctx.fillStyle = bottom; ctx.fillRect(0, photoHeight - 210, 1080, 220)
    const date = new Date(`${story.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    ctx.textAlign = 'right'; text(ctx, date, 990, 170, 23, colors.ink, 360, 'StoryBody'); ctx.textAlign = 'left'
    text(ctx, story.meal.toUpperCase(), 86, 222, 126, colors.ink, 908)
    ctx.fillStyle = colors.blue; ctx.fillRect(90, 370, 64, 5)

    text(ctx, 'THE INGREDIENT STACK', 90, ingredientTop, 35, colors.ink, 700)
    ctx.textAlign = 'right'
    text(ctx, pageCount > 1 ? `${pageIndex + 1} / ${pageCount}` : `${story.items.length} FOODS`, 990, ingredientTop + 7, 23, colors.muted, 220, 'StoryBody')
    ctx.textAlign = 'left'
    line(ctx, ingredientTop + 50)
    foods.forEach((item, index) => {
      const x = 90 + (index % 2) * 470
      const y = ingredientTop + 72 + rowHeights.slice(0, Math.floor(index / 2)).reduce((sum, height) => sum + height, 0)
      text(ctx, String(pageIndex * FOODS_PER_STORY + index + 1).padStart(2, '0'), x, y + 2, 21, colors.blue, 38, 'StoryBody')
      const lines = foodLines[index]
      lines.slice(0, 3).forEach((value, row) => {
        ctx.font = '32px StoryBody'; ctx.fillStyle = colors.ink
        ctx.fillText(short(ctx, row === 2 && lines.length > 3 ? `${value}…` : value, 360), x + 52, y + row * 32)
      })
      text(ctx, item.serving, x + 52, y + Math.min(3, lines.length) * 32 + 5, 24, colors.muted, 360, 'StoryBody')
    })
    line(ctx, 1538)
    // Align the calorie and macro values on one baseline despite their different sizes.
    ctx.textBaseline = 'alphabetic'
    text(ctx, number(story.totals.calories), 90, 1670, 110, colors.ink, 290)
    ;[['protein', 'PROTEIN', colors.protein], ['carbs', 'CARBS', colors.blue], ['fat', 'FAT', colors.fat]].forEach(([key, , color], index) => {
      const x = 450 + index * 185
      ctx.fillStyle = colors.line; ctx.fillRect(x - 24, 1590, 1, 118)
      text(ctx, `${number(story.totals[key])}g`, x, 1670, 60, color, 160)
    })
    ctx.textBaseline = 'top'
    text(ctx, 'KCAL', 90, 1690, 20, colors.muted, 305, 'StoryBody')
    ;['PROTEIN', 'CARBS', 'FAT'].forEach((label, index) => {
      text(ctx, label, 450 + index * 185, 1690, 20, colors.muted, 160, 'StoryBody')
    })
    line(ctx, 1750)
    ctx.drawImage(logo, 75, 1774, 70, 70)
    text(ctx, 'MACROSTACK', 150, 1797, 32, colors.muted, 420)
  }
  if (story.kind === 'daily') {
    ctx.drawImage(logo, 75, 1630, 100, 100)
    text(ctx, 'MACROSTACK', 184, 1660, 37, colors.muted)
  }
  return canvas
}

export async function generateStoryImage(story, photo, position, page = 0) {
  const canvas = await renderStoryCanvas(story, photo, position, page)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the image. Please retry.')), 'image/png'))
}
