import opentype from 'opentype.js';
import {Resvg} from '@resvg/resvg-js';
import {readFileSync,writeFileSync} from 'node:fs';
const bytes=readFileSync('public/fonts/BarlowCondensed-Black.ttf');
const font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
let x=4;const size=110;let paths='';
for(const [word,color] of [['MACRO','#d8e6f4'],['STACK','#82ade1']]){
 for(const ch of word){const p=font.getPath(ch,x,110,size);p.fill=color;paths+=p.toSVG();x+=font.getAdvanceWidth(ch,size)-size*.025;}
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(x+4)}" height="132" viewBox="0 0 ${Math.ceil(x+4)} 132">${paths}</svg>`;
writeFileSync('public/email/macrostack-wordmark.png',new Resvg(svg,{fitTo:{mode:'width',value:1200}}).render().asPng());
