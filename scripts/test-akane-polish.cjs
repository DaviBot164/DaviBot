'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {contextualCategory,decorate,memoryAfter}=require(path.join(root,'handlers/akane/context'));
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
for(const text of ['be nice pls','be nicer plz','be nice rn'])eq(contextualCategory(text,null),'tone_gentle');
for(const text of ['no jokes rn','be serious pls'])eq(contextualCategory(text,null),'tone_serious');
for(const text of ['something else','change the subject','new topic','სხვა თემა'])eq(contextualCategory(text,null),'topic_change');
eq(contextualCategory('not a new topic',null),null);
for(const tone of ['public','owner','mae']){
 const previous={category:'nice',pending:{kind:'mood'},mode:{name:'serious',remaining:3},question:true};
 const base={payload:{content:''},category:'repair_detail',session:true};
 const repair=decorate(base,tone,{category:'repair_detail',argument:'tone',context:'nice',conversation:previous});
 eq(repair.modeChange,'gentle');eq(repair.pending,null);
 const topic=decorate(base,tone,{category:'repair_detail',argument:'topic',context:'nice',conversation:previous});
 eq(topic.category,'general');eq(topic.pending,null);
 const request=decorate(base,tone,{category:'repair_detail',argument:'request',conversation:previous});
 eq(request.pending,null);assert.ok(request.payload.content.includes('akane pick tea / coffee'));checks++;
 const change=decorate(base,tone,{category:'topic_change',conversation:previous});
 eq(change.pending,null);eq(change.question,false);eq(change.category,'general');
 eq(memoryAfter(previous,{category:'topic_change'},change).mode.remaining,2);
 const softer=decorate(base,tone,{category:'rude',context:'nice',conversation:previous});
 eq(softer.modeChange,'gentle');eq(softer.question,true);eq(softer.pending.kind,'mood');
}
// Actual parser must pass the clarification word through to the response layer.
let session={messageId:'last',category:'nice',pending:{kind:'repair'},implicitUntil:200};
const parserPath=path.join(root,'handlers/akane/parser.js'),original=Module._load;
Module._load=function(request,parent){if(parent?.filename===parserPath){
 if(request==='./settings')return{OWNER_ID:'o',dialogue:{maeId:'m'},reactionPools:{}};
 if(request==='./state')return{getSession:()=>session};
 if(request==='../../config/akaneReactions')return{detectReaction:()=>null};
}return original.apply(this,arguments);};
let parse;try{parse=require(parserPath).parseRequest;}finally{Module._load=original;}
const message=(content,reference)=>({content,reference,mentions:{}});
eq(parse(message('tone'),100).argument,'tone');
eq(parse(message('topic'),100).category,'repair_detail');
eq(parse(message('something else'),100).category,'topic_change');
eq(parse(message('something else',{messageId:'other'}),100),null);
eq(parse(message('something else'),201),null);
session=null;eq(parse(message('something else'),100),null);
eq(parse(message('akane new topic'),100).category,'topic_change');
console.log(`${checks} conversation polish checks passed.`);
