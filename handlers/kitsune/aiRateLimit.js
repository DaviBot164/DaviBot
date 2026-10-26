// Only bounded numeric header values are displayed; never provider response bodies.
function rateWait(headers){
 const get=name=>{try{const value=headers?.get?.(name);return typeof value==='string'&&value.length<=80?value.trim():null;}catch{return null;}};
 const seconds=value=>value!==null&&/^\d+(?:\.\d+)?$/u.test(value)&&Number(value)>0&&Number(value)<=604800?Math.ceil(Number(value)):null;
 const direct=seconds(get('retry-after'));if(direct)return direct;
 const waits=[];
 for(const kind of ['requests','tokens']){
  if(get('x-ratelimit-remaining-'+kind)!=='0')continue;
  const value=get('x-ratelimit-reset-'+kind);
  if(!value||!/^(?:\d+(?:\.\d+)?h)?(?:\d+(?:\.\d+)?m)?(?:\d+(?:\.\d+)?s)?$/u.test(value))continue;
  let sum=0;for(const m of value.matchAll(/(\d+(?:\.\d+)?)(h|m|s)/gu))sum+=Number(m[1])*({h:3600,m:60,s:1}[m[2]]);
  const wait=seconds(String(sum));if(wait)waits.push(wait);
 }
 return waits.length?Math.max(...waits):null;
}
function rateMessage(wait){return 'Groq rate limit reached. '+(wait?'Try again in about '+wait+' seconds.':'Groq did not provide a usable wait time. Wait before trying again.')+' No automatic retry. Remaining turns were not sent. To continue this scenario later, submit only the remaining lines without a seed.';}
module.exports={rateWait,rateMessage};
