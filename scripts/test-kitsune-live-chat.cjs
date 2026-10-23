'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const cases=[];
for(const phrase of ['just listen','please listen to me','let me vent','hear me out','i just need to vent','can i vent','i need to get this off my chest','not looking for solutions','im not looking for solutions','i dont want advice just listen','just listen i dont need tips','i dont want suggestions but hear me out'])cases.push([phrase,'decline_advice']);
for(const [text,want]of cases)eq(recognize(text),want,text);
for(const phrase of ['my friend needs to vent','do not listen to me','i need advice','i am looking for solutions','listen to music'])assert.notEqual(recognize(phrase),'decline_advice');
const original=Module._load;let session;
const parserPath=path.join(root,'handlers/kitsune/parser.js'),responsePath=path.join(root,'handlers/kitsune/responses.js'),statePath=path.join(root,'handlers/kitsune/state.js');
const pools={};
Object.assign(pools,require(path.join(root,'config/kitsuneReplies')));
for(const [category,pool] of Object.entries(require(path.join(root,'config/kitsunePersonality')).ownerReplies)) pools['owner_'+category]=pool;
for(const [category,pool] of Object.entries(require(path.join(root,'config/kitsuneDialogue')).pools)) pools['dialogue_'+category]=pool;
const settings={OWNER_ID:'1357721282061533311',dialogue:{maeId:'1380278195961729084'},replies:pools,STATE_TTL:1800000};
Module._load=function(request,parent){
 if([parserPath,responsePath,statePath].includes(parent?.filename)&&request==='./settings')return settings;
 if(parent?.filename===parserPath&&request==='./state')return{getSession:()=>session};
 if(parent?.filename===responsePath&&request==='discord.js')return{escapeMarkdown:x=>x};
 if(parent?.filename===responsePath&&request==='./help')return{buildHelp:()=>({})};
 return original.apply(this,arguments);
};
let parse,respond,context;
try{parse=require(parserPath).parseRequest;respond=require(responsePath).buildResponse;context=require(path.join(root,'handlers/kitsune/context'));}finally{Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});
const extra=[
 ['that answer wasnt helpful but im not blaming u','answer_feedback'],
 ['your reply is not useful and im not attacking u','answer_feedback'],
 ['can u try explaining it differently','explain_fresh'],
 ['could u say that differently please','explain_fresh'],
 ['talk','chat_open'],['can u chat with me','chat_open'],
 ['ru cute','appearance_question'],['are u pretty','appearance_question'],
 ['if sm1 bullied u wat u gonna say','bullying_hypothetical'],
 ['if someone bullies you how would you respond','bullying_hypothetical'],
 ['tell him stfu mf ass hoe','directed_taunt_request'],
 ['if he kept bullying tell him kos omak','directed_taunt_request'],
 ['if he bullied u more tell him kos omak 2x','directed_taunt_request'],
 ['say davi n tanya is gay','personal_label_request']
];
for(const [text,category]of extra)eq(recognize(text),category,text);
for(const id of ['member',settings.OWNER_ID,settings.dialogue.maeId]){
 const m={guildId:'g',channelId:'c',author:{id}};
 const send=text=>{const req=parse(msg(text),100);assert.ok(req,text);count++;const out=respond(m,req);assert.ok(out.payload.content?.length,text);count++;session={...context.memoryAfter(session,req,out),category:out.category,messageId:'last',implicitUntil:200,question:out.question};return {req,out};};
 session=null;
 send('kitsune just wanna talk no advice rn');eq(send('today was okay actually').req.category,'day_okay');
 eq(send('nothing special happened').req.category,'day_ordinary');
 send('kitsune change the subject');eq(parse(msg('nothing special happened'),100),null);
 for(const [text,category]of extra){const item=send('kitsune '+text);eq(item.req.category,category,text);assert.ok(!/main request|did not follow|did not find/.test(item.out.payload.content));count++;}
 eq(parse(msg('',{messageId:'last'}),100),null);
 eq(parse(msg('https://example.com/a.gif',{messageId:'last'}),100),null);
 eq(parse(msg('can u try explaining it differently',{messageId:'someone-else'}),100),null);
 session=null;eq(parse(msg('nothing special happened'),100),null);
}
for(const text of ['my friend is cute','i am not cute','i was bullied at school','someone said tell him stfu','i am gay','is davi gay','do not tell him stfu']){
 const category=recognize(text);assert.ok(!['appearance_question','bullying_hypothetical','directed_taunt_request','personal_label_request'].includes(category),text);count++;
}
const config=require(path.join(root,'config/kitsuneBoundaries')).pools;
for(const [tone,categories]of Object.entries(config))for(const category of ['appearance_question','bullying_hypothetical','directed_taunt_request','personal_label_request']){
 const m={guildId:'variants',channelId:'variants',author:{id:tone==='owner'?settings.OWNER_ID:tone==='mae'?settings.dialogue.maeId:'member'}};
 for(let i=0;i<categories[category].length*2;i++){const out=respond(m,{category,conversation:{}});assert.ok(out.payload.content?.length>15);count++;assert.ok(!/kos omak|motherfucker|stfu/i.test(out.payload.content));count++;}
}
console.log(count+' live-chat shorthand, criticism, third-party boundaries and attachment checks passed.');
