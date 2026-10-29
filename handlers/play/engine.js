'use strict';
const content=require('./content.json'),games=require('./games.json');
const text=(v,lang)=>v[lang]??v.en;
function allowed(s,c){if(!c.need)return true;if(c.need==='secret')return ['name','trust','witness'].every(f=>s.flags.includes(f)||s.items.includes(f));return s.flags.includes(c.need)||s.items.includes(c.need);}
function choices(s){return content.stories[s.story]?.nodes[s.node]?.choices.map((c,index)=>({...c,index})).filter(c=>allowed(s,c))??[];}
function transition(s,action){
 if(action==='en'||action==='ka'){s.lang=action;return s;}
 if(action==='library'){s.mode='library';return s;}
 if(action==='resume'){if(s.story&&s.node)s.mode=s.node.startsWith('end:')?'ending':'story';return s;}
 if(action==='restart'){if(s.story)s.mode='confirm';return s;}
 if(action==='cancel'){s.mode=s.node?.startsWith('end:')?'ending':s.node?'story':'library';return s;}
 if(action==='confirm'){if(s.mode!=='confirm')throw Error('No restart pending');return start(s,s.story);}
 if(action.startsWith('start-')){const id=action.slice(6);if(!content.stories[id])throw Error('Invalid story');if(s.story&&s.node&&!s.node.startsWith('end:')){s.pending=id;s.mode='switch';return s;}return start(s,id);}
 if(action==='switch'){if(s.mode!=='switch'||!content.stories[s.pending])throw Error('No switch pending');return start(s,s.pending);}
 if(action==='normal'||action==='strong'){s.intensity=action;return s;}
 if(['talk','hint','journal','bag','collection'].includes(action)){s.mode=action;return s;}
 if(action.startsWith('choose-')){if(s.mode!=='story')throw Error('No active scene');const index=Number(action.slice(7)),choice=choices(s).find(c=>c.index===index);if(!choice)throw Error('Choice unavailable');s.journal.push({story:s.story,node:s.node,index});s.journal=s.journal.slice(-40);if(choice.flag&&!s.flags.includes(choice.flag))s.flags.push(choice.flag);if(choice.item&&!s.items.includes(choice.item))s.items.push(choice.item);s.node=choice.to;s.mode=s.node.startsWith('end:')?'ending':'story';if(s.mode==='ending'){const key=s.story+':'+s.node.slice(4);if(!s.endings.includes(key))s.endings.push(key);}return s;}
 if(action==='riddle'||action==='lie'){s.game=action;s.mode='game';s.last=null;s.round=s.round??0;s.order=order(s.round);return s;}
 if(action==='gamehint'){if(s.mode==='game')s.mode='gamehint';return s;}
 if(action==='gameback'){s.mode='game';return s;}
 if(action==='next'){if(s.mode!=='result')throw Error('Answer first');s.round++;s.order=order(s.round);s.last=null;s.mode='game';return s;}
 if(action.startsWith('answer-')){if(s.mode!=='game'&&s.mode!=='gamehint')throw Error('Round unavailable');const i=Number(action.slice(7));if(![0,1,2].includes(i))throw Error('Invalid answer');const q=question(s);s.last=s.order[i]===q.correct;if(s.last)s.score=Math.min(1000000,(s.score??0)+1);s.mode='result';return s;}
 throw Error('Unknown action');
}
function start(s,id){s.story=id;s.pending=null;s.node='gate';s.flags=[];s.items=[];s.journal=[];s.mode='story';return s;}
function order(round){const n=round%3;return [n,(n+1)%3,(n+2)%3];}
function question(s){const bank=games.filter(q=>q.kind===s.game);return bank[s.round%bank.length];}
module.exports={content,games,text,choices,transition,question};
