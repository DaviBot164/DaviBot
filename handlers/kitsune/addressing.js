const {names} = require('../../config/kitsuneAddressing');
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alternatives = [...names].sort((a,b)=>b.length-a.length).map(name=>name==='kitsune'?'kitsune{1,6}':escape(name)).join('|');
const named = new RegExp('(^|[^\\p{L}\\p{N}_\u0027\u2019-])('+alternatives+')(?=$|[^\\p{L}\\p{N}_\u0027\u2019-])','giu');
const salutation = /(?:^|[\s,:;.!?…])((?:hey|hi|hello|yo)[\s,:;.!?…]+(?:(?:my\s+)?(?:lady|miss|ms|mrs|queen|princess|dear)[\s,:;.!?…]+)?|(?:my\s+)?(?:lady|miss|ms|mrs|queen|princess|dear)[\s,:;.!?…]+)$/iu;
function namedAddress(value) {
    const raw=String(value??'').trim();
    if(!raw || raw.length>4096)return null;
    // Names inside quotes, code, links or e-mail are not direct calls.
    const protectedSpans=[...raw.matchAll(/```[\s\S]*?```|`[^`\n]*`|"[^"\n]*"|“[^”\n]*”|(?:^|\s)'[^'\n]+'(?=\s|$)|https?:\/\/\S+|\S+@\S+\.\S+/gu)].map(m=>[m.index,m.index+m[0].length]);
    const spans=[];
    let greeting=false;
    for(const match of raw.matchAll(named)){
        let start=match.index+match[1].length;
        const end=start+match[2].length;
        if(protectedSpans.some(([a,b])=>start>=a && start<b))continue;
        const before=raw.slice(0,start);
        if(spans.length && /\b(?:name(?: is)?|named|called)\s*$/iu.test(before))continue;
        if(/(?:^|\n)\s*>[^\n]*$/u.test(before))continue;
        // Keep reported mentions distinct from a call, while still allowing
        // "Kitsune, someone said ..." when the call is at the beginning.
        if(!spans.length && /\b(?:said|says|told|called|mentioned|talked about)\b/iu.test(before))continue;
        // "kit" is also an ordinary English noun. Keep its established prefix
        // use; middle/end use needs a salutation or explicit textual @address.
        const title=before.match(salutation);
        const at=before.endsWith('@') && (start===1 || /\s/u.test(raw[start-2]));
        const nicknameCall=/^(?:nice|good) mommy\s*[,;:]\s*$/iu.test(before)&&/^[.!?…]*$/u.test(raw.slice(end));
        if(match[2].toLowerCase()==='kit' && before.trim() && !title && !at && !nicknameCall)continue;
        if(title){
            greeting ||= /\b(?:hey|hi|hello|yo)\b/iu.test(title[1]);
            start-=title[1].length;
        }
        if(at)start--;
        spans.push([start,end]);
    }
    if(!spans.length)return null;
    let request=raw;
    for(const [start,end]of spans.reverse())request=request.slice(0,start)+' '+request.slice(end);
    request=request.replace(/^[\s,:;.!?…🦊]+/u,'').replace(/\s+/gu,' ').trim();
    if(!/[\p{L}\p{N}]/u.test(request) && greeting)request='hi';
    // Same contract for the parser and approved-learning extraction.
    return [raw,request];
}
module.exports={namedAddress};
