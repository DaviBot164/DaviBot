const brand=require('../../config/brand');
function accent(){return '#'+Number(brand.color).toString(16).padStart(6,'0');}
function shade(hex,factor=.18){return '#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*factor).toString(16).padStart(2,'0')).join('');}
function fit(ctx,value,width,size=36,min=16,weight=600){let text=String(value??'').replace(/[\r\n\t]+/gu,' ');while(size>min){ctx.font=`${weight} ${size}px sans-serif`;if(ctx.measureText(text).width<=width)return text;size-=2;}ctx.font=`${weight} ${min}px sans-serif`;let chars=Array.from(text);while(chars.length&&ctx.measureText(chars.join('')+'…').width>width)chars.pop();return chars.length?chars.join('')+'…':'';}
module.exports={accent,shade,fit};
