export const themeColorFields = {
 primary:'Primary brand color', secondary:'Secondary brand color', buttonEnd:'Button gradient end', buttonText:'Button text',
 background:'Background color', backgroundEnd:'Background gradient end', card:'Card color', cardEnd:'Card gradient end',
 text:'Body text', muted:'Secondary text', heading:'Headings', border:'Borders & dividers', input:'Input background', inputText:'Input text',
 nav:'Navigation color', navEnd:'Navigation gradient end', navText:'Navigation text', header:'Header color', headerEnd:'Header gradient end', headerText:'Header text',
};
export const gradientLayers = {background:'Page background',card:'Cards & panels',nav:'Navigation bar',header:'Headers',button:'Primary buttons'};
export const defaultBrandColors = {
 primary:'#82ADE1',secondary:'#91B8AD',buttonEnd:'#91B8AD',buttonText:'#080D16',
 background:'#080B12',backgroundEnd:'#101925',card:'#0B101A',cardEnd:'#141B2B',
 text:'#D8E6F4',muted:'#8A9DB4',heading:'#D8E6F4',border:'#263347',input:'#0E1421',inputText:'#D8E6F4',
 nav:'#0A0E17',navEnd:'#080B12',navText:'#8A9DB4',header:'#121C24',headerEnd:'#080B12',headerText:'#D8E6F4',
 backgroundGradient:false,backgroundAngle:135,cardGradient:false,cardAngle:135,navGradient:true,navAngle:100,headerGradient:true,headerAngle:115,buttonGradient:false,buttonAngle:90,
};
export const validBrandColor = value => /^#[0-9a-f]{6}$/i.test(value || '');
export function validBrandColors(colors){return Object.entries(defaultBrandColors).every(([key,value])=>typeof value==='string'?validBrandColor(colors[key]):typeof value==='boolean'?typeof colors[key]==='boolean':Number.isInteger(Number(colors[key]))&&Number(colors[key])>=0&&Number(colors[key])<=360);}
export function brandColors(colors) {
 return Object.fromEntries(Object.entries(defaultBrandColors).map(([key,fallback])=>[key,typeof fallback==='string'?(validBrandColor(colors?.[key])?colors[key].toUpperCase():fallback):typeof fallback==='boolean'?(typeof colors?.[key]==='boolean'?colors[key]:fallback):(Number.isInteger(colors?.[key])&&colors[key]>=0&&colors[key]<=360?colors[key]:fallback)]));
}
export function themeBackground(colors,layer){const c=brandColors(colors);const start=layer==='button'?c.primary:c[layer];return c[`${layer}Gradient`]?`linear-gradient(${c[`${layer}Angle`]}deg, ${start}, ${c[`${layer}End`]})`:start;}
function contrastRatio(first, second) {
 const luminance = hex => {
  const channels = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255);
  return channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
   .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
 };
 const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
 return (lighter + 0.05) / (darker + 0.05);
}
function readableAccent(hex) {
 const channels = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16));
 const ink = [18, 43, 69];
 for (let amount = 0; amount <= 1; amount += 0.05) {
  const candidate = `#${channels.map((channel, index) => Math.round(channel * (1 - amount) + ink[index] * amount).toString(16).padStart(2, '0')).join('')}`;
  // A little headroom keeps small labels readable on lightly tinted surfaces.
  if (contrastRatio(candidate, '#FFFFFF') >= 5.5) return candidate;
 }
 return '#122B45';
}
export function brandStyle(colors, mode = 'dark') {
 const c=brandColors(colors);
 const dark = {
 '--retail-brand-primary':c.primary,'--retail-brand-secondary':c.secondary,'--retail-accent':c.primary,'--retail-brand-ink':c.buttonText,
 '--color-bg':c.background,'--color-surface':c.card,'--color-card':c.card,'--color-dim':c.border,'--color-cream':c.text,'--color-muted':c.muted,'--color-border':c.border,'--color-accent':c.primary,'--color-brown':c.primary,'--color-brown-light':c.primary,'--color-olive':c.secondary,
 '--retail-heading':c.heading,'--retail-input':c.input,'--retail-input-text':c.inputText,'--retail-nav-text':c.navText,'--retail-header-text':c.headerText,
 '--retail-nav-glass-start':c.nav,'--retail-nav-glass-end':c.navGradient?c.navEnd:c.nav,
 ...Object.fromEntries(Object.keys(gradientLayers).map(key=>[`--retail-${key}-paint`,themeBackground(c,key)])),
 };
 if (mode !== 'light') return dark;
 const accent = readableAccent(c.primary);
 const buttonEnd = c.buttonGradient ? c.buttonEnd : c.primary;
 const candidates = ['#102139', '#FFFFFF'];
 const bestInk = candidates.sort((first, second) =>
  Math.min(contrastRatio(second, c.primary), contrastRatio(second, buttonEnd)) -
  Math.min(contrastRatio(first, c.primary), contrastRatio(first, buttonEnd)))[0];
 const buttonInk = [c.primary, buttonEnd].every(color => contrastRatio(c.buttonText, color) >= 4.5)
  ? c.buttonText
  : bestInk;
 const buttonGradientReadable = [c.primary, buttonEnd].every(color => contrastRatio(buttonInk, color) >= 4.5);
 return {
  ...dark,
  '--retail-accent':accent,
  '--retail-brand-ink':buttonGradientReadable ? buttonInk : candidates.sort((first, second) => contrastRatio(second, c.primary) - contrastRatio(first, c.primary))[0],
  '--color-bg':'#F2F6FB','--color-surface':'#F8FBFE','--color-card':'#FFFFFF','--color-dim':'#CAD9E9',
  '--color-cream':'#17283F','--color-muted':'#52677E','--color-border':'#D5E1ED','--color-accent':accent,
  '--color-brown':accent,'--color-brown-light':accent,'--color-olive':readableAccent(c.secondary),
  '--retail-heading':'#102139','--retail-input':'#F7FAFD','--retail-input-text':'#17283F',
  '--retail-nav-text':'#38536D','--retail-header-text':'#17283F',
  '--retail-nav-glass-start':'#FFFFFF','--retail-nav-glass-end':'#EDF4FB',
  '--retail-background-paint':`linear-gradient(145deg, color-mix(in srgb, ${c.primary} 4%, #F2F6FB), #F2F6FB 48%, #ECF3FA)`,
  '--retail-card-paint':`linear-gradient(155deg, #FFFFFF, color-mix(in srgb, ${c.primary} 3%, #FFFFFF))`,
  '--retail-nav-paint':`linear-gradient(105deg, #FFFFFF, color-mix(in srgb, ${c.primary} 5%, #F8FBFE))`,
  '--retail-header-paint':`linear-gradient(115deg, #FFFFFF, color-mix(in srgb, ${c.primary} 8%, #F8FBFE))`,
  '--retail-button-paint':buttonGradientReadable ? themeBackground(c, 'button') : c.primary,
 };
}
