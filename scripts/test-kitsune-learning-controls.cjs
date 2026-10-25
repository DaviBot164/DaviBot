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
 const config=require(path.join(root,'config/kitsuneLearning'));
 eq(Object.keys(config.intents).length,25);
 const aliases=new Map([['go ahead',config.intents.continue],['halt moonfox',config.intents.stop],['reset moonfox',config.intents.restart],['new moonfox topic',config.intents.change_topic]]);
 session=null;let req=parse(msg('kitsune go ahead'),100,aliases);eq(req.category,'learned_continue');
 let out=respond({guildId:'g',channelId:'c',author:{id:'member'}},req);assert.match(out.payload.content,/What would you like to continue/);count++;
 eq(parse(msg('go ahead'),100,aliases),null,'no ambient activation');
 session={category:'music_chat',topicCategory:'music_chat',messageId:'last',implicitUntil:200,thread:{kind:'music'}};
 req=parse(msg('go ahead'),100,aliases);eq(req.category,'flow_resume');eq(req.understanding.source,'learned');
 out=respond({guildId:'g',channelId:'c',author:{id:'member'}},req);assert.ok(out.payload.content);count++;
 eq(parse(msg('go ahead',{messageId:'other'}),100,aliases),null);eq(parse(msg('go ahead'),201,aliases),null);
 req=parse(msg('kitsune halt moonfox'),100,aliases);eq(req.category,'stop');out=respond({guildId:'g',channelId:'c',author:{id:'member'}},req);eq(out.session,false);
 eq(parse(msg('kitsune reset moonfox'),100,aliases).category,'restart_chat');eq(parse(msg('kitsune new moonfox topic'),100,aliases).category,'topic_change');
 eq(parse(msg('kitsune hello'),100,new Map([['hello','stop']])).category,'hi','built-in priority');
 // Owner-only autocomplete and teaching via real command with mocked repository.
 const cmdPath=path.join(root,'commands/information/kitsune.js');let enabled=true,db=0,fail=false,saved=[],invalidated=0;
 class Builder{constructor(){this.json={options:[]};}setName(v){this.json.name=v;return this;}setDescription(){return this;}setDefaultMemberPermissions(){return this;}setDMPermission(){return this;}setRequired(){return this;}setMinLength(){return this;}setMaxLength(){return this;}setAutocomplete(v){this.json.autocomplete=v;return this;}setMinValue(){return this;}setMaxValue(){return this;}addChoices(...v){this.json.choices=v;return this;}addSubcommand(fn){const b=new Builder();fn(b);this.json.options.push(b.json);return this;}addStringOption(fn){return this.addSubcommand(fn);}addIntegerOption(fn){return this.addSubcommand(fn);}toJSON(){return this.json;}}
 const repo={async suggestPhrases(...args){db++;saved=args;if(fail)throw Error('private');return[{phrase:'go ahead'},{phrase:'x'.repeat(101)}];},async teachPhrase(...args){db++;saved=args;}};
 let command;Module._load=function(request,parent){if(parent?.filename===cmdPath){if(request==='discord.js')return{SlashCommandBuilder:Builder,PermissionFlagsBits:{Administrator:8n},MessageFlags:{Ephemeral:64},escapeMarkdown:x=>x};if(request==='../../handlers/kitsune/settings')return{OWNER_ID:'owner'};if(request==='../../handlers/kitsune/learningRuntime')return{enabled:()=>enabled,invalidateAliases(){invalidated++;}};if(request==='../../database/kitsuneLearning')return repo;}return original.apply(this,arguments);};
 try{command=require(cmdPath);}finally{Module._load=original;}
 const teach=command.data.toJSON().options.find(x=>x.name==='teach');eq(teach.options.find(x=>x.name==='meaning').choices.length,25);eq(teach.options.find(x=>x.name==='phrase').autocomplete,true);
 function interaction(user='owner',sub='teach',phrase='go ahead'){const sent=[];return{user:{id:user},guildId:'g',options:{getFocused:()=>({name:'phrase',value:phrase}),getSubcommand:()=>sub,getString:key=>key==='meaning'?'continue':phrase},sent,respond:async v=>sent.push(v),reply:async v=>sent.push(v),deferReply:async()=>{},editReply:async v=>sent.push(v)};}
 let i=interaction('member');await command.autocomplete(i);eq(db,0);eq(i.sent[0],[]);
 i=interaction();await command.autocomplete(i);eq(saved,['g','go ahead','both']);eq(i.sent[0],[{name:'go ahead',value:'go ahead'}]);
 i=interaction('owner','forget');await command.autocomplete(i);eq(saved[2],'learned');
 i=interaction('owner','dismiss');await command.autocomplete(i);eq(saved[2],'unknown');
 fail=true;i=interaction();await command.autocomplete(i);eq(i.sent[0],[]);fail=false;
 i=interaction();await command.execute(i);eq(saved,['g','go ahead','continue','owner']);eq(invalidated,1);assert.match(i.sent[0].content,/Learned: go ahead/);count++;
 i=interaction('owner','teach','hello');const before=db;await command.execute(i);eq(db,before);assert.match(i.sent[0].content,/built-in meaning/);count++;
 enabled=false;i=interaction();await command.autocomplete(i);eq(i.sent[0],[]);
 console.log(count+' learned continuation, context boundaries, controls, 25-choice schema, owner autocomplete and teaching checks passed. No database or Discord calls.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
