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

export async function generateStoryImage(story) {
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
  ctx.textBaseline = 'top'
  // Subtle technical grid, with all meaningful content inside Story UI safe areas.
  ctx.strokeStyle = '#101824'; ctx.lineWidth = 1
  for (let x = 0; x < 1080; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke() }
  for (let y = 0; y < 1920; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke() }
  const date = new Date(`${story.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  text(ctx, date, 90, 240, 26, colors.muted, 900, 'StoryBody')
  ctx.fillStyle = colors.blue; ctx.fillRect(90, 306, 70, 6)
  if (story.kind === 'daily') {
    text(ctx, 'THE DAILY', 90, 355, 118)
    text(ctx, 'STACK.', 90, 474, 118, colors.blue)
    line(ctx, 645)
    text(ctx, number(story.totals.calories), 90, 685, 174, colors.ink, 620)
    text(ctx, 'KCAL', 750, 770, 42, colors.muted, 240)
    text(ctx, `${number(story.goals.calories)} KCAL GOAL`, 90, 875, 30, colors.muted, 900, 'StoryBody')
    const macros = [['protein', 'PROTEIN', colors.protein], ['carbs', 'CARBS', colors.blue], ['fat', 'FAT', colors.fat]]
    macros.forEach(([key, label, color], index) => {
      const y = 990 + index * 184
      text(ctx, label, 90, y, 34, color)
      const value = `${number(story.totals[key])} / ${number(story.goals[key])} g`
      ctx.textAlign = 'right'; text(ctx, value, 990, y, 38, colors.ink, 570, 'StoryBody'); ctx.textAlign = 'left'
      ctx.fillStyle = colors.line; ctx.fillRect(90, y + 75, 900, 9)
      if (story.goals[key] > 0) {
        ctx.fillStyle = color; ctx.fillRect(90, y + 75, 900 * Math.min(1, story.totals[key] / story.goals[key]), 9)
      }
    })
  } else {
    text(ctx, 'ON THE MENU', 90, 355, 30, colors.blue, 900, 'StoryBody')
    text(ctx, story.meal.toUpperCase(), 90, 425, 118, colors.ink, 900)
    line(ctx, 610)
    text(ctx, number(story.totals.calories), 90, 660, 176, colors.ink, 660)
    text(ctx, 'KCAL', 775, 750, 42, colors.muted, 210)
    ;[['protein', 'PROTEIN', colors.protein], ['carbs', 'CARBS', colors.blue], ['fat', 'FAT', colors.fat]].forEach(([key, label, color], index) => {
      const x = 90 + index * 310
      text(ctx, `${number(story.totals[key])}g`, x, 920, 78, color, 280)
      text(ctx, label, x, 1015, 27, colors.muted, 280, 'StoryBody')
    })
    line(ctx, 1110)
    text(ctx, 'THE INGREDIENTS', 90, 1155, 27, colors.muted, 900, 'StoryBody')
    story.items.slice(0, 4).forEach((item, index) => {
      ctx.font = '36px StoryBody'; ctx.fillStyle = colors.ink
      ctx.fillText(short(ctx, item.name, 900), 90, 1220 + index * 64)
    })
    if (story.items.length > 4) text(ctx, `+ ${story.items.length - 4} more items`, 90, 1490, 26, colors.muted, 900, 'StoryBody')
  }
  line(ctx, 1600)
  ctx.drawImage(logo, 75, 1630, 100, 100)
  text(ctx, 'MACROSTACK', 184, 1660, 37, colors.muted)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the image. Please retry.')), 'image/png'))
}
