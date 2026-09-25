import { jsPDF } from 'jspdf';
import { brandColors } from './brandColors.js';

async function base64File(url) {
  const response = await fetch(url, {cache:'no-cache'});
  if (!response.ok) throw new Error('Could not load PDF branding. Please retry.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function loadPlanBranding(locationId) {
  if (!locationId) throw new Error('Choose a store before downloading.');
  const { storeBranding, brandLogoURL } = await import('./api.js');
  const brand = await storeBranding(locationId);
  if (!brand?.name) throw new Error('Could not load store branding. Please retry.');
  const [font, headingFont, logo] = await Promise.all([
    base64File('/fonts/SpaceGrotesk.ttf'),
    base64File('/fonts/BarlowCondensed-Black.ttf'),
    brand.logo_path ? base64File(brandLogoURL(brand.logo_path)) : null,
  ]);
  return {...brand, colors:brandColors(brand.brand_colors), font, headingFont, logo};
}

const rgb = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16));
const mix = (a, b, weight) => a.map((v, i) => Math.round(v * weight + b[i] * (1 - weight)));
const rounded = value => Math.round(Number(value) || 0);
const totalsFor = items => items.reduce((total, item) => {
  for (const key of Object.keys(total)) total[key] += Number(item[key]) || 0;
  return total;
}, {calories:0, protein:0, carbs:0, fat:0});
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export function generateRetailPlanPDF(plan, client, brand) {
  const doc = new jsPDF({orientation:'portrait', unit:'pt', format:'letter'});
  doc.addFileToVFS('SpaceGrotesk.ttf', brand.font);
  doc.addFont('SpaceGrotesk.ttf', 'Space', 'normal');
  doc.addFileToVFS('BarlowCondensed-Black.ttf', brand.headingFont);
  doc.addFont('BarlowCondensed-Black.ttf', 'Barlow', 'normal');
  doc.setProperties({title:plan.planName || 'Nutrition plan', author:brand.name, creator:'MacroStack'});

  const W = 612, H = 792, P = 38, INNER = W - P * 2;
  const palette = brandColors(brand.colors);
  const background = rgb(palette.background), text = rgb(palette.text);
  const muted = rgb(palette.muted), heading = rgb(palette.heading);
  const headerText = rgb(palette.headerText), primary = rgb(palette.primary);
  const border = rgb(palette.border);
  const paints = new Map();

  function paint(layer, x, top, width, height, radius = 0) {
    doc.saveGraphicsState();
    if (radius) {
      doc.roundedRect(x, top, width, height, radius, radius, null);
      doc.clip(); doc.discardPath();
    }
    if (palette[`${layer}Gradient`] && typeof document !== 'undefined') {
      const key = `${layer}:${Math.ceil(width)}:${Math.ceil(height)}`;
      if (!paints.has(key)) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(width * 2));
        canvas.height = Math.max(1, Math.ceil(height * 2));
        const ctx = canvas.getContext('2d');
        const angle = palette[`${layer}Angle`] * Math.PI / 180;
        const dx = Math.sin(angle), dy = -Math.cos(angle);
        const extent = (Math.abs(dx) * canvas.width + Math.abs(dy) * canvas.height) / 2;
        const gradient = ctx.createLinearGradient(canvas.width / 2 - dx * extent, canvas.height / 2 - dy * extent, canvas.width / 2 + dx * extent, canvas.height / 2 + dy * extent);
        gradient.addColorStop(0, palette[layer]);
        gradient.addColorStop(1, palette[`${layer}End`]);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        paints.set(key, canvas.toDataURL('image/png'));
      }
      doc.addImage(paints.get(key), 'PNG', x, top, width, height);
    } else {
      doc.setFillColor(...rgb(palette[layer])); doc.rect(x, top, width, height, 'F');
    }
    doc.restoreGraphicsState();
  }
  function label(value, x, baseline, size = 9, color = text, font = 'Space', options = {}) {
    doc.setFont(font, 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(Array.isArray(value) ? value : String(value), x, baseline, options);
  }
  function wrapped(value, size, width) {
    doc.setFont('Space', 'normal'); doc.setFontSize(size);
    return doc.splitTextToSize(String(value), width);
  }
  function panel(x, y, width, height, radius = 9) {
    doc.setFillColor(4, 6, 11); doc.roundedRect(x, y + 2, width, height, radius, radius, 'F');
    paint('card', x, y, width, height, radius);
    doc.setDrawColor(...border); doc.setLineWidth(.55);
    doc.roundedRect(x, y, width, height, radius, radius, 'S');
  }

  paint('background', 0, 0, W, H);
  doc.setFillColor(...primary); doc.rect(P, 27, INNER, 3, 'F');
  paint('header', P, 39, INNER, 68, 9);
  let brandX = P + 16;
  if (brand.logo) {
    const image = doc.getImageProperties(brand.logo);
    const scale = Math.min(112 / image.width, 51 / image.height);
    const width = image.width * scale, height = image.height * scale;
    doc.addImage(brand.logo, image.fileType, brandX, 47 + (51 - height) / 2, width, height);
    brandX += 128;
  }
  const nameLines = wrapped(brand.name, 14, W - P - brandX - 14).slice(0, 2);
  label(nameLines, brandX, 63, 14, headerText);
  const poweredY = 64 + nameLines.length * 16;
  label('Powered by', brandX, poweredY, 8, headerText);
  label('MACRO', brandX + 53, poweredY + 1, 11, headerText, 'Barlow');
  doc.setFont('Barlow', 'normal'); doc.setFontSize(11);
  label('STACK', brandX + 53 + doc.getTextWidth('MACRO'), poweredY + 1, 11, primary, 'Barlow');

  const planTitle = wrapped(plan.planName || 'Nutrition plan', 19, INNER - 32).slice(0, 2);
  const prepared = client?.name ? wrapped(`Prepared for ${client.name}`, 9, INNER - 32).slice(0, 2) : [];
  const goals = client?.goals;
  const target = goals ? `Targets: ${goals.calories ?? '-'} kcal · ${goals.protein ?? '-'}g protein · ${goals.carbs ?? '-'}g carbs · ${goals.fat ?? '-'}g fat` : '';
  const targetLines = target ? wrapped(target, 8, INNER - 32).slice(0, 2) : [];
  const heroY = 119;
  const heroHeight = 46 + planTitle.length * 21 + prepared.length * 12 + targetLines.length * 11;
  panel(P, heroY, INNER, heroHeight);
  label('PERSONALIZED MEAL PLAN', P + 16, heroY + 19, 8, primary);
  label(planTitle, P + 16, heroY + 42, 19, heading);
  let heroLine = heroY + 42 + planTitle.length * 21;
  if (prepared.length) { label(prepared, P + 16, heroLine, 9, muted); heroLine += prepared.length * 12; }
  if (targetLines.length) label(targetLines, P + 16, heroLine, 8, muted);

  const contentTop = heroY + heroHeight + 15;
  const contentBottom = H - 48;
  const days = Array.isArray(plan.days) ? plan.days : [];
  const candidates = [];

  // Measure before drawing. Column count and vertical scale are chosen together,
  // so even a long imported plan remains on a single sheet with no clipped rows.
  for (let count = 1; count <= Math.min(4, Math.max(1, days.length)); count++) {
    const gap = 11;
    const width = (INNER - gap * (count - 1)) / count;
    const perColumn = Math.ceil(days.length / count);
    const columns = Array.from({length:count}, () => []);
    days.forEach((day, index) => {
      const title = wrapped(day.label || `Day ${index + 1}`, 13, width - 24);
      const meals = MEALS.map(name => {
        const items = Array.isArray(day.meals?.[name]) ? day.meals[name] : [];
        if (!items.length) return null;
        const rows = items.map(item => {
          const food = wrapped(`${item.name || 'Food'}${item.brand ? `, ${item.brand}` : ''}`, 9, width - 92);
          const quantity = Number(item.quantity) || 1;
          const serving = ['g', 'oz', 'ml', 'lb', 'fl oz', 'L'].includes(item.servingUnit) && item.servingSize
            ? `${Math.round(quantity * Number(item.servingSize) * 100) / 100} ${item.servingUnit}`
            : `${quantity} × ${item.servingUnit || 'serving'}`;
          const portion = wrapped(serving, 7.5, width - 100);
          return {item, food, portion, height:Math.max(35, food.length * 11 + portion.length * 9 + 13)};
        });
        return {name, items, rows, height:22 + rows.reduce((sum, row) => sum + row.height, 0) + 3};
      }).filter(Boolean);
      const height = 40 + title.length * 15 + 38 + meals.reduce((sum, meal) => sum + meal.height, 0) + 8;
      columns[Math.floor(index / perColumn)].push({day, index, title, meals, height});
    });
    const tallest = Math.max(0, ...columns.map(column => column.reduce((sum, day) => sum + day.height + 10, 0)));
    const scale = Math.min(1, (contentBottom - contentTop) / Math.max(tallest, 1));
    // Fewer columns win when they deliver comparable readable type.
    candidates.push({count, width, gap, columns, scale, score:(count === 1 ? 10 : count === 2 ? 9 : count === 3 ? 8 : 7) * scale});
  }
  const layout = candidates.reduce((best, candidate) => candidate.score > best.score + .1 ? candidate : best);
  const s = layout.scale;
  const Y = value => contentTop + value * s;
  const scaledLabel = (value, x, y, size, color = text, font = 'Space', options = {}) => label(value, x, Y(y), size * s, color, font, {...options, lineHeightFactor:1.22});

  layout.columns.forEach((column, columnIndex) => {
    const x = P + columnIndex * (layout.width + layout.gap);
    let cursor = 0;
    for (const block of column) {
      const {day, title, meals, height} = block;
      panel(x, Y(cursor), layout.width, height * s, 8);
      paint('header', x + 1, Y(cursor) + 1, layout.width - 2, 34 * s, 7);
      scaledLabel(title, x + 12, cursor + 19, 13, headerText, 'Space');
      const summaryTop = cursor + 34 + title.length * 15;
      const totals = totalsFor(Object.values(day.meals || {}).flat());
      const stats = [
        [`${rounded(totals.calories)}`, 'KCAL'],
        [`${rounded(totals.protein)}g`, 'PROTEIN'],
        [`${rounded(totals.carbs)}g`, 'CARBS'],
        [`${rounded(totals.fat)}g`, 'FAT'],
      ];
      stats.forEach(([value, caption], statIndex) => {
        const statX = x + 10 + statIndex * (layout.width - 20) / 4;
        scaledLabel(value, statX, summaryTop + 14, 13, heading, 'Barlow');
        scaledLabel(caption, statX, summaryTop + 26, 6.4, muted);
      });
      let mealTop = summaryTop + 38;
      for (const meal of meals) {
        doc.setDrawColor(...border); doc.setLineWidth(.5);
        doc.line(x + 10, Y(mealTop), x + layout.width - 10, Y(mealTop));
        scaledLabel(meal.name.toUpperCase(), x + 11, mealTop + 14, 8, primary);
        scaledLabel(`${rounded(totalsFor(meal.items).calories)} kcal`, x + layout.width - 11, mealTop + 14, 7.5, muted, 'Space', {align:'right'});
        let rowTop = mealTop + 22;
        for (const row of meal.rows) {
          scaledLabel(row.food, x + 11, rowTop + 11, 9);
          scaledLabel(`${rounded(row.item.calories)} kcal`, x + layout.width - 11, rowTop + 11, 7.6, text, 'Space', {align:'right'});
          const detailY = rowTop + 12 + row.food.length * 11;
          scaledLabel(row.portion, x + 11, detailY, 7.5, muted);
          scaledLabel(`${rounded(row.item.protein)}P · ${rounded(row.item.carbs)}C · ${rounded(row.item.fat)}F`, x + layout.width - 11, detailY, 7, muted, 'Space', {align:'right'});
          rowTop += row.height;
        }
        mealTop += meal.height;
      }
      cursor += height + 10;
    }
  });

  doc.setDrawColor(...mix(primary, background, .35));
  doc.line(P, H - 37, W - P, H - 37);
  label(`Powered by MacroStack  |  ${new Date().toLocaleDateString()}`, P, H - 22, 8, muted);
  label('1 / 1', W - P, H - 22, 8, muted, 'Space', {align:'right'});
  return doc;
}
