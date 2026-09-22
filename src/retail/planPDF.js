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
  function wrapped(value,size,width){doc.setFont('Space','normal');doc.setFontSize(size);return doc.splitTextToSize(String(value),width);}
  const rounded = value => Math.round(Number(value) || 0);
  const totalsFor = items => items.reduce((acc,item)=>{
    for(const key of Object.keys(acc)) acc[key]+=Number(item[key])||0;
    return acc;
  },{calories:0,protein:0,carbs:0,fat:0});
  const surface=mix(secondary,bg,.055), border=mix(secondary,bg,.22);
  function panel(top,height) {
    doc.setFillColor(4,6,11);doc.roundedRect(P,top+3,INNER,height,9,9,'F');
    doc.setFillColor(...surface);doc.setDrawColor(...border);doc.setLineWidth(.5);
    doc.roundedRect(P,top,INNER,height,9,9,'FD');
  }
  function daySummary(day,index,continued=false) {
    const dayLines=wrapped(day.label || `Day ${index+1}`,15,INNER-120);
    label(dayLines,P,y+14,15);
    label(continued?'CONTINUED':'DAILY NUTRITION',W-P,y+12,8,muted,'Space',{align:'right'});
    y+=dayLines.length*18+18;
    const totals=totalsFor(Object.values(day.meals || {}).flat());
    panel(y,66);
    const col=INNER/4;
    [['calories','Calories','kcal'],['protein','Protein','g'],['carbs','Carbs','g'],['fat','Fat','g']].forEach(([key,name,unit],i)=>{
      const x=P+i*col+16;
      if(i){doc.setDrawColor(...border);doc.line(x-16,y+14,x-16,y+52);}
      label(name,x,y+18,8,muted);
      label(String(rounded(totals[key])),x,y+45,21,text,'Barlow');
      doc.setFont('Barlow','normal');doc.setFontSize(21);
      const valueWidth=doc.getTextWidth(String(rounded(totals[key])));
      label(unit,x+valueWidth+5,y+45,8,muted);
    });
    y+=84;
  }
  page();
  const title=wrapped(plan.planName || 'Nutrition plan',20,INNER-36);
  const clientLines=client?wrapped(`Prepared for ${client.name || 'Customer'}`,9,INNER-36):[];
  const g=client?.goals;
  const targetLines=g?wrapped(`Daily targets: ${g.calories ?? '-'} kcal · ${g.protein ?? '-'}g protein · ${g.carbs ?? '-'}g carbs · ${g.fat ?? '-'}g fat`,8,INNER-36):[];
  const heroHeight=38+title.length*23+clientLines.length*12+targetLines.length*12+14;
  panel(y,heroHeight);
  label('PERSONALIZED MEAL PLAN',P+18,y+20,8,mix(primary,text,.5));
  label(title,P+18,y+44,20);
  if(clientLines.length)label(clientLines,P+18,y+44+title.length*23,9,muted);
  if(targetLines.length)label(targetLines,P+18,y+44+title.length*23+clientLines.length*12,8,muted);
  y+=heroHeight+22;
  for(const [index,day] of (plan.days || []).entries()){
    if(index)newPage();
    daySummary(day,index);
    for(const meal of ['Breakfast','Lunch','Dinner','Snack']){
      const items=Array.isArray(day.meals?.[meal])?day.meals[meal]:[];
      if(!items.length)continue;
      const rows=items.map(item=>{
        const lines=wrapped(`${item.name || 'Food'}${item.brand ? `, ${item.brand}` : ''}`,10,INNER-165);
        const quantity=Number(item.quantity)||1;
        const serving=['g','oz','ml','lb','fl oz','L'].includes(item.servingUnit)&&item.servingSize ? `${Math.round(quantity*Number(item.servingSize)*100)/100} ${item.servingUnit}` : `${quantity} x ${item.servingUnit || 'serving'}`;
        const portions=wrapped(serving,8,INNER-165);
        return {item,lines,portions,height:Math.max(46,lines.length*13+portions.length*10+21)};
      });
      let cursor=0;
      while(cursor<rows.length){
        if(y+34+rows[cursor].height>H-54){newPage();daySummary(day,index,true);}
        const top=y;
        let used=34,end=cursor;
        while(end<rows.length&&top+used+rows[end].height<=H-54){used+=rows[end].height;end++;}
        // Continue unusually long imported names on the next page without dropping text.
        if(end===cursor){
          const row=rows[cursor],available=H-54-top-34;
          const maxLines=Math.max(1,Math.floor((available-row.portions.length*10-21)/13));
          const remainder=row.lines.slice(maxLines);
          if(remainder.length)rows.splice(cursor+1,0,{...row,lines:remainder,height:Math.max(46,remainder.length*13+row.portions.length*10+21)});
          row.lines=row.lines.slice(0,maxLines);
          if(remainder.length)row.portions=[];
          row.height=available;used+=available;end++;
        }
        panel(top,used);
        doc.setFillColor(...mix(secondary,bg,.11));doc.roundedRect(P+1,top+1,INNER-2,31,8,8,'F');
        label(`${meal}${cursor?' · continued':''}`,P+16,top+21,11,text);
        label(`${rounded(totalsFor(items).calories)} kcal`,W-P-16,top+21,9,muted,'Space',{align:'right'});
        y=top+34;
        for(let r=cursor;r<end;r++){
          const {item,lines,portions,height}=rows[r];
          if(r>cursor){doc.setDrawColor(...border);doc.line(P+16,y,W-P-16,y);}
          label(lines,P+16,y+18,10);
          label(portions,P+16,y+18+lines.length*13,8,muted);
          label(`${rounded(item.calories)} kcal`,W-P-16,y+18,10,text,'Space',{align:'right'});
          label(`${rounded(item.protein)}g P · ${rounded(item.carbs)}g C · ${rounded(item.fat)}g F`,W-P-16,y+33,8,muted,'Space',{align:'right'});
          y+=height;
        }
        y+=14;cursor=end;
      }
    }
  }
  const pages=doc.getNumberOfPages();
  for(let n=1;n<=pages;n++){doc.setPage(n);doc.setDrawColor(...mix(primary,bg,.35));doc.line(P,H-38,W-P,H-38);label(`Powered by MacroStack  |  ${new Date().toLocaleDateString()}`,P,H-23,8,muted);label(`${n} / ${pages}`,W-P,H-23,8,muted,'Space',{align:'right'});}
  return doc;
}
