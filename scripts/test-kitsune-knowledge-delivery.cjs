'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/kitsune/language'));
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
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
async function main(){
 const mainPath=path.join(root,'handlers/kitsuneReplyHandler.js');let reads=0,collected=0;
 const {inputForLearning}=require(path.join(root,'handlers/kitsune/learningRuntime'));
 Module._load=function(request,parent){if(parent?.filename===mainPath){
  if(request==='discord.js')return{PermissionFlagsBits:{ViewChannel:1,ReadMessageHistory:2,SendMessages:4,SendMessagesInThreads:8,EmbedLinks:16}};
  if(request==='./kitsune/settings')return{...settings,USER_COOLDOWN:3000,CHANNEL_COOLDOWN:2000,SESSION_TTL:120000};
  if(request==='./kitsune/learningRuntime')return{inputForLearning,enabled:()=>true,getAliases:async()=>new Map(),collectUnknown:async()=>{collected++;}};
  if(request==='./kitsune/knowledgeRuntime')return{inputForKnowledge:require(path.join(root,'handlers/kitsune/knowledgeRuntime')).inputForKnowledge,findKnowledge:async(g,text)=>{reads++;return g==='g'&&require(path.join(root,'handlers/kitsune/knowledge')).lookupKey(text)==='tomy'?{name:'tomy',kind:'member',target_id:'123456789012345678',explanation:'A friend in this server.'}:null;}};
  if(request==='./kitsune/help')return{plainHelp:()=> 'Help'};
 }return original.apply(this,arguments);};
 let handler;try{handler=require(mainPath).handleKitsuneReply;}finally{Module._load=original;}
 const sent=[],incoming=(text,id,g='g')=>({guildId:g,guild:{id:g,members:{me:{id:'bot'}}},channelId:id,author:{id:'sender-'+id,bot:false},content:text,client:{user:{id:'bot'}},inGuild:()=>true,channel:{isThread:()=>false,permissionsFor:()=>({has:()=>true})},reply:async p=>{sent.push(p);return{id:'response-'+id};}});
 session=null;eq(await handler(incoming('kitsune who is tomy?','one')),true);assert.match(sent.at(-1).content,/tomy.*server member/i);count++;assert.match(sent.at(-1).content,/<@123456789012345678>/);count++;eq(sent.at(-1).allowedMentions,{parse:[],repliedUser:false});eq(collected,0);
 eq(await handler(incoming('tomy','ambient')),false);eq(reads,1,'no ambient knowledge activation');
 eq(await handler(incoming('kitsune who is tomy?','other','other')),true);assert.ok(!sent.at(-1).content.includes('A friend in this server'));count++;
 const before=reads;eq(await handler(incoming('kitsune hello','builtin')),true);eq(reads,before,'built-in meanings keep priority');
 const failed=incoming('kitsune tomy','failed');failed.reply=async()=>{throw Error('mock delivery failure');};const savedLog=console.error;console.error=()=>{};
 try{eq(await handler(failed),false);}finally{console.error=savedLog;}
 const store=require(statePath);eq(store.sessions.has(store.sessionKey(failed)),false);
 console.log(count+' real knowledge lookup delivery, server boundary, no ambient response, built-in priority and mention safety checks passed. No database, Discord or AI calls.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
