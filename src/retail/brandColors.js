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
export function brandStyle(colors) {
 const c=brandColors(colors);
 return {
 '--retail-brand-primary':c.primary,'--retail-brand-secondary':c.secondary,'--retail-accent':c.primary,'--retail-brand-ink':c.buttonText,
 '--color-bg':c.background,'--color-surface':c.card,'--color-card':c.card,'--color-dim':c.border,'--color-cream':c.text,'--color-muted':c.muted,'--color-border':c.border,'--color-accent':c.primary,'--color-brown':c.primary,'--color-brown-light':c.primary,'--color-olive':c.secondary,
 '--retail-heading':c.heading,'--retail-input':c.input,'--retail-input-text':c.inputText,'--retail-nav-text':c.navText,'--retail-header-text':c.headerText,
 '--retail-nav-glass-start':c.nav,'--retail-nav-glass-end':c.navGradient?c.navEnd:c.nav,
 ...Object.fromEntries(Object.keys(gradientLayers).map(key=>[`--retail-${key}-paint`,themeBackground(c,key)])),
 };
}
