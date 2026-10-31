'use strict';
// Compatibility view for existing hub links. Authored content has one source.
const {nodes}=require('./talk-content.json');
const pages=Object.freeze(Object.fromEntries(Object.entries(nodes).map(([id,n])=>[id,{label:n.label.en,emoji:n.emoji,lines:n.lines.en,choices:n.choices}])));
function response(page,variant=0){const p=pages[page];return p?p.lines[Math.max(0,Math.trunc(Number(variant)||0))%p.lines.length]:null;}
module.exports={pages,response};
