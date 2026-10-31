'use strict';
// Pure authored dialogue engine shared by Discord and the Studio replay lab.
const {version,nodes}=require('./talk-content.json');
const ui={en:{back:'Back',menu:'Change topic',close:'Goodbye / Close',another:'Another one',stories:'Stories',games:'Games',closed:'Conversation closed.',limit:'This test has reached 120 actions. Start a new conversation.'},ka:{back:'უკან',menu:'თემის შეცვლა',close:'დამშვიდობება / დახურვა',another:'კიდევ ერთი',stories:'ისტორიები',games:'თამაშები',closed:'საუბარი დასრულდა.',limit:'ტესტმა 120 მოქმედებას მიაღწია. დაიწყე ახალი საუბარი.'}};
function start(lang='en',node='talk'){
 if(!['en','ka'].includes(lang)||!Object.hasOwn(nodes,node))throw Error('Invalid conversation');
 return {lang,node,index:0,seen:{[node]:1},stack:[],steps:0,closed:false};
}
function view(state){
 const text=ui[state.lang],entry=nodes[state.node];
 return {version,lang:state.lang,node:state.node,closed:state.closed,reply:state.closed?text.closed:entry.lines[state.lang][state.index],choices:state.closed?[]:entry.choices.map(id=>({id,label:id===state.node?text.another:nodes[id].label[state.lang],emoji:nodes[id].emoji})),navigation:state.closed?[]:[...(state.stack.length?[{id:'back',label:text.back}]:[]),...(state.node!=='talk'?[{id:'menu',label:text.menu}]:[]),{id:state.lang==='en'?'ka':'en',label:state.lang==='en'?'ქართული':'English'},{id:'close',label:text.close}],activities:state.closed?[]:[{id:'stories',label:text.stories,emoji:'📖'},{id:'games',label:text.games,emoji:'🎮'}]};
}
function change(previous,action){
 if(previous.closed)throw Error('Conversation closed');
 if(previous.steps>=120&&action!=='close')throw Error(ui[previous.lang].limit);
 const state=structuredClone(previous);state.steps++;
 if(['en','ka'].includes(action)){state.lang=action;return state;}
 if(action==='close'){state.closed=true;return state;}
 if(action==='back'){
  const last=state.stack.pop();if(!last)throw Error('No previous reply');
  state.node=last.node;state.index=last.index;return state;
 }
 const next=action==='menu'?'talk':action;
 if(action!=='menu'&&!nodes[state.node].choices.includes(next))throw Error('Choice unavailable');
 if(!Object.hasOwn(nodes,next))throw Error('Choice unavailable');
 state.stack.push({node:state.node,index:state.index});state.stack=state.stack.slice(-40);
 state.node=next;state.index=(state.seen[next]||0)%nodes[next].lines.en.length;state.seen[next]=(state.seen[next]||0)+1;
 return state;
}
function replay({language='en',actions=[]}={}){
 if(!Array.isArray(actions)||actions.length>120||actions.some(a=>typeof a!=='string'||a.length>24))throw Error('Invalid test actions');
 let state=start(language);const transcript=[{action:null,label:null,...view(state)}];
 for(const action of actions){const current=view(state),choice=[...current.choices,...current.navigation].find(c=>c.id===action);if(!choice)throw Error('Choice unavailable');state=change(state,action);transcript.push({action,label:choice.label,...view(state)});}
 return {version,state:view(state),transcript,actions:actions.length,remaining:120-actions.length};
}
module.exports={version,nodes,start,view,change,replay};
