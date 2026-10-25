// Bounded scene edits share one active set across user details and accepted proposals.
const suggestions=require('../../config/kitsuneSceneSuggestions');
const base={waves:'waves',breeze:'a cool breeze',moonlight:'moonlight',silence:'silence',stars:'a few stars'};
const labels={...base};
for(const pool of Object.values(suggestions))for(const row of pool)labels[row.key]=row.label;
function key(text){
 const t=text.replace(/^(?:the|a|an|one) /u,'').replace(/^(?:small|distant|cool|few) /u,'');
 return Object.hasOwn(labels,t)?t:null;
}
function recognizeSceneEdit(text,memory){
 let m=text.match(/^(?:a |the )?(forest|seaside)(?: instead)(?: keep (?:the )?(.+))?$/u);
 if(m){const keep=m[2]?key(m[2]):null;if(m[2]&&!keep)return null;return {mode:'switch',selected:m[1],keep};}
 m=text.match(/^replace (.+?) with (.+)$/u);
 if(m&&key(m[1])&&key(m[2]))return {mode:'replace',remove:key(m[1]),add:key(m[2])};
 m=text.match(/^remove everything except (.+)$/u);
 if(m&&key(m[1]))return {mode:'only',keep:key(m[1])};
 m=text.match(/^remove (.+?)(?: keep (.+))?$/u);
 if(m){const remove=m[1]==='it'?memory.lastSceneDetail:key(m[1]);const keep=m[2]?key(m[2]):null;if(m[2]&&!keep)return null;return remove?{mode:'remove',remove,keep}:{mode:'clarify'};}
 m=text.match(/^add (.+?) back$/u);
 if(m){const add=m[1]==='it'?memory.lastSceneDetail:key(m[1]);return add?{mode:'restore',add}:{mode:'clarify'};}
 if(/^keep both$/u.test(text)&&memory.sceneReplacement)return {mode:'both',...memory.sceneReplacement};
 return null;
}
function sceneEditResponse(data,memory){
 const active=[...new Set([...(memory.sceneDetails??[]),...(memory.acceptedSuggestions??[])])];
 const core={...memory};
 if(data.mode==='clarify')return {core,content:'Which scene detail do you mean?'};
 if(data.mode==='switch'){
  const retained=data.keep&&active.includes(data.keep)?[data.keep]:[];
  Object.assign(core,{selected:data.selected,sceneDetails:retained.filter(k=>Object.hasOwn(base,k)),acceptedSuggestions:retained.filter(k=>!Object.hasOwn(base,k)),excludedDetails:[],rejectedSuggestions:[],suggestion:null,lastSceneDetail:retained[0]??null,sceneReplacement:null,crowdLimit:null,noCrowds:false,reason:null});
  return {core,content:'A '+data.selected+' scene instead.'+(retained.length?' Keeping '+labels[retained[0]]+'.':' Starting with no carried-over details.')};
 }
 let next=active;
 const removed=[];
 if(data.mode==='only'){next=active.filter(k=>k===data.keep);removed.push(...active.filter(k=>k!==data.keep));}
 if(data.mode==='remove'||data.mode==='replace'){next=active.filter(k=>k!==data.remove);removed.push(data.remove);core.lastSceneDetail=data.remove;}
 if(data.mode==='replace'||data.mode==='restore'||data.mode==='both'){
  next=[...new Set([...next,...(data.mode==='both'?[data.remove,data.add]:[data.add])])];core.lastSceneDetail=data.add;
 }
 if(data.mode==='replace')core.sceneReplacement={remove:data.remove,add:data.add};
 else if(data.mode!=='both')core.sceneReplacement=null;
 const restored=data.mode==='both'?[data.remove,data.add]:data.add?[data.add]:[];
 core.sceneDetails=next.filter(k=>Object.hasOwn(base,k));core.acceptedSuggestions=next.filter(k=>!Object.hasOwn(base,k));
 core.excludedDetails=[...new Set([...(memory.excludedDetails??[]),...removed.filter(k=>Object.hasOwn(base,k))])].filter(k=>!restored.includes(k));
 core.rejectedSuggestions=[...new Set([...(memory.rejectedSuggestions??[]),...removed.filter(k=>!Object.hasOwn(base,k))])].filter(k=>!restored.includes(k));
 if(removed.includes(core.suggestion))core.suggestion=null;
 return {core,content:'For the '+(memory.selected??'current')+' scene: '+(next.map(k=>labels[k]).join(' and ')||'no specific details')+'.'};
}
module.exports={recognizeSceneEdit,sceneEditResponse};
