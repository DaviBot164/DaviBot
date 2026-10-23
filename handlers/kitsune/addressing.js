const {names} = require('../../config/kitsuneAddressing');
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alternatives = [...names].sort((a,b)=>b.length-a.length).map(escape).join('|');
// Whole aliases at the start only. Never match names inside ordinary words.
const addressed = new RegExp('^(?:(?:yo|hey|hi|hello)[\\s,:;.!?…]+)?(?:'+alternatives+')(?=$|[\\s,:;.!?…🦊])[\\s,:;.!?…🦊]*(.*)$','isu');
function namedAddress(value) {
    return String(value ?? '').trim().match(addressed);
}
module.exports = {namedAddress};
