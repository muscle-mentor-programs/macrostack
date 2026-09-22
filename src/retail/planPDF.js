import { jsPDF } from 'jspdf';
import { storeBranding, brandLogoURL } from './api';
import { brandColors } from './brandColors';

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
  const brand = await storeBranding(locationId);
  if (!brand?.name) throw new Error('Could not load store branding. Please retry.');
  const [font, headingFont, logo] = await Promise.all([
    base64File('/fonts/SpaceGrotesk.ttf'),
    base64File('/fonts/BarlowCondensed-Black.ttf'),
    brand.logo_path ? base64File(brandLogoURL(brand.logo_path)) : null,
  ]);
  return {...brand, colors:brandColors(brand.brand_colors), font, headingFont, logo};
}
const rgb = hex => hex.slice(1).match(/../g).map(v=>parseInt(v,16));
const mix = (a,b,weight) => a.map((v,i)=>Math.round(v*weight+b[i]*(1-weight)));

export function generateRetailPlanPDF(plan, client, brand) {
  const doc = new jsPDF({unit:'pt',format:'letter'});
  doc.addFileToVFS('SpaceGrotesk.ttf',brand.font);
  doc.addFont('SpaceGrotesk.ttf','Space','normal');
  doc.addFileToVFS('BarlowCondensed-Black.ttf',brand.headingFont);
  doc.addFont('BarlowCondensed-Black.ttf','Barlow','normal');
  doc.setProperties({title:plan.planName || 'Nutrition plan',author:brand.name,creator:'MacroStack'});
  const W=612,H=792,P=40,INNER=W-P*2;
  const bg=[8,11,18],text=[216,230,244],muted=[164,179,197];
  const primary=rgb(brand.colors.primary),secondary=rgb(brand.colors.secondary);
  let y=0;
  function label(value,x,baseline,size=10,color=text,font='Space',options={}) {
    doc.setFont(font,'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(Array.isArray(value) ? value : String(value),x,baseline,options);
  }
  function page() {
    doc.setFillColor(...bg);doc.rect(0,0,W,H,'F');
    doc.setFillColor(...primary);doc.rect(P,28,INNER,3,'F');
    let nameX=P;
    if(brand.logo){
      const image=doc.getImageProperties(brand.logo);
      const scale=Math.min(116/image.width,54/image.height);
      const width=image.width*scale,height=image.height*scale;
      doc.addImage(brand.logo,image.fileType,P,44+(54-height)/2,width,height);
      nameX=P+132;
    }
    doc.setFont('Space','normal');doc.setFontSize(15);
    const nameLines=doc.splitTextToSize(brand.name,W-P-nameX);
    label(nameLines,nameX,brand.logo?62:58,15);
    // Keep the store name unrestricted while giving long names room to wrap.
    const nameBottom=(brand.logo?62:58)+(nameLines.length-1)*18;
    label('Powered by',nameX,nameBottom+19,8,muted);
    label('MACRO',nameX+52,nameBottom+20,11,text,'Barlow');
    doc.setFont('Barlow','normal');doc.setFontSize(11);
    label('STACK',nameX+52+doc.getTextWidth('MACRO'),nameBottom+20,11,[130,173,225],'Barlow');
    y=Math.max(112,nameBottom+38);
    doc.setDrawColor(...mix(secondary,bg,.45));doc.line(P,y, W-P,y);y+=24;
  }
  function newPage(){doc.addPage();page();}
  function room(height){if(y+height>H-54)newPage();}
  function wrapped(value,size,width){doc.setFont('Space','normal');doc.setFontSize(size);return doc.splitTextToSize(String(value),width);}
  page();
  const title=wrapped(plan.planName || 'Nutrition plan',21,INNER);
  label(title,P,y,21);y+=title.length*25+12;
  if(client){const lines=wrapped(`Prepared for ${client.name || 'Customer'}`,10,INNER);label(lines,P,y,10,muted);y+=lines.length*13+10;}
  if(client?.goals){const g=client.goals;label(`${g.calories ?? '-'} kcal  |  ${g.protein ?? '-'}g protein  |  ${g.carbs ?? '-'}g carbs  |  ${g.fat ?? '-'}g fat`,P,y,9,muted);y+=24;}
  for(const [index,day] of (plan.days || []).entries()){
    room(80);
    doc.setFillColor(...mix(secondary,bg,.13));doc.roundedRect(P,y,INNER,36,5,5,'F');
    doc.setFillColor(...secondary);doc.rect(P,y,3,36,'F');
    const dayName=wrapped(day.label || `Day ${index+1}`,12,220);
    label(dayName,P+13,y+22,12);y+=48;
    for(const meal of ['Breakfast','Lunch','Dinner','Snack']){
      const items=day.meals?.[meal] || [];if(!items.length)continue;
      room(48);label(meal.toUpperCase(),P+8,y,9,mix(primary,text,.45));y+=18;
      for(const item of items){
        const name=`${item.name || 'Food'}${item.brand ? `, ${item.brand}` : ''}`;
        const lines=wrapped(name,10,INNER-160);const height=Math.max(36,lines.length*14+24);room(height);
        label(lines,P+8,y,10);
        const quantity=Number(item.quantity)||1;
        const serving=['g','oz','ml','lb','fl oz','L'].includes(item.servingUnit)&&item.servingSize ? `${Math.round(quantity*Number(item.servingSize)*100)/100} ${item.servingUnit}` : `${quantity} x ${item.servingUnit || 'serving'}`;
        label(serving,P+8,y+lines.length*14,8,muted);
        label(`${Math.round(item.calories || 0)} kcal`,W-P-8,y,10,text,'Space',{align:'right'});
        label(`${Math.round(item.protein || 0)}P  ${Math.round(item.carbs || 0)}C  ${Math.round(item.fat || 0)}F`,W-P-8,y+13,8,muted,'Space',{align:'right'});
        y+=height;
      }
      y+=8;
    }
    const totals=Object.values(day.meals || {}).flat().reduce((a,i)=>{for(const key of Object.keys(a))a[key]+=Number(i[key])||0;return a;},{calories:0,protein:0,carbs:0,fat:0});
    room(35);doc.setDrawColor(...mix(secondary,bg,.35));doc.line(P,y, W-P,y);y+=17;
    label(`Daily total: ${Math.round(totals.calories)} kcal  |  ${Math.round(totals.protein)}g protein  |  ${Math.round(totals.carbs)}g carbs  |  ${Math.round(totals.fat)}g fat`,P+8,y,9,muted);y+=28;
  }
  const pages=doc.getNumberOfPages();
  for(let n=1;n<=pages;n++){doc.setPage(n);doc.setDrawColor(...mix(primary,bg,.35));doc.line(P,H-38,W-P,H-38);label(`Powered by MacroStack  |  ${new Date().toLocaleDateString()}`,P,H-23,8,muted);label(`${n} / ${pages}`,W-P,H-23,8,muted,'Space',{align:'right'});}
  return doc;
}
