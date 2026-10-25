// Owner-approved server glossary, not permissions or arbitrary executable instructions.
const kinds=Object.freeze({member:'Member / nickname',term:'Word / term',phrase:'Phrase explanation',role:'Server role',channel:'Server channel',command:'Command explanation',fact:'Server fact',reply:'Custom reply'});
const reserved=new Set(['kitsune','kit','kits','kitsu','davi','daviti','mae','ash']);
function nameKey(value){const key=String(value??'').normalize('NFKC').toLowerCase().replace(/^\//u,'').replace(/\s+/gu,' ').trim();return key.length>=2&&key.length<=80&&/^[\p{L}\p{N} '\-]+$/u.test(key)&&!/^\d+$/u.test(key)?key:null;}
function validate({name,kind,explanation=''}){
 const key=nameKey(name);if(!key||reserved.has(key))throw Error('Use a distinct 2–80 character name or term. Built-in names cannot be replaced.');
 if(!Object.hasOwn(kinds,kind))throw Error('Choose a supported knowledge type.');
 const detail=String(explanation).trim();
 if(detail.length>500||/[<>`]|https?:\/\/|(?:gsk_|sk-)[\w-]{12,}|(?:token|password|api[_ ]?key)\s*[:=]/iu.test(detail))throw Error('Use a short explanation without mentions, code, links or credentials.');
 if(kind!=='member'&&kind!=='role'&&kind!=='channel'&&!detail)throw Error('This knowledge type needs an explanation.');
 return{key,kind,explanation:detail};
}
function lookupKey(text){
 const raw=String(text??'').trim().replace(/[?!.]+$/u,'');
 const request=raw.replace(/^(?:who is|who's|what is|what's|what does|what do you know about|tell me about|explain|define)\s+/iu,'').replace(/\s+mean$/iu,'');
 return nameKey(request);
}
const escape=text=>String(text).replace(/[\\`*_~|<>]/gu,'\\$&');
function render(row){
 const label=escape(row.name),detail=escape(row.explanation);
 const id=/^\d{16,22}$/u.test(row.target_id??'')?row.target_id:null;
 const target=id?(row.kind==='member'?`<@${id}>`:row.kind==='role'?`<@&${id}>`:row.kind==='channel'?`<#${id}>`:''):'';
 if(row.kind==='reply')return detail;
 if(target)return `${label} — ${target}.${detail?' '+detail:''}`;
 return detail?`${label}: ${detail}`:`${label}.`;
}

module.exports={kinds,nameKey,validate,lookupKey,render};
