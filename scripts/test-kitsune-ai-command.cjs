'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..'),cmdPath=path.join(root,'commands/information/kitsune.js');
let checks=0,aiCalls=0,builtinCalls=0,dbCalls=0,fail=false;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
class Builder{constructor(){this.json={options:[]};}setName(v){this.json.name=v;return this;}setDescription(){return this;}setDefaultMemberPermissions(){return this;}setDMPermission(){return this;}setRequired(){return this;}setMinLength(){return this;}setMaxLength(){return this;}setAutocomplete(){return this;}setMinValue(){return this;}setMaxValue(){return this;}addChoices(...v){this.json.choices=v;return this;}addSubcommand(fn){const b=new Builder();fn(b);this.json.options.push(b.json);return this;}addStringOption(fn){return this.addSubcommand(fn);}addIntegerOption(fn){return this.addSubcommand(fn);}toJSON(){return this.json;}}
const ai={async runAiLab(input){aiCalls++;eq(input.userId,'owner');if(fail)throw Error('Private AI lab is disabled.');return{turns:[{}],limitations:'External Groq private trial'};},formatAiReport:()=> 'Private AI report',resetAiLab:()=>1};
const builtin={runLab(){builtinCalls++;return{turns:[{}],limitations:'Built-in'};},formatReport:()=> 'Built-in report',resetLab:()=>2};
const original=Module._load;
Module._load=function(request,parent){if(parent?.filename===cmdPath){
 if(request==='discord.js')return{SlashCommandBuilder:Builder,PermissionFlagsBits:{Administrator:8n},MessageFlags:{Ephemeral:64},escapeMarkdown:x=>x};
 if(request==='../../handlers/kitsune/settings')return{OWNER_ID:'owner'};
 if(request==='../../handlers/kitsune/aiTestLab')return ai;
 if(request==='../../handlers/kitsune/testLab')return builtin;
 if(request==='../../handlers/kitsune/learningRuntime')return{enabled(){dbCalls++;throw Error('No database in private tests');}};
 if(request==='../../database/kitsuneLearning')return{};
 }return original.apply(this,arguments);};
const command=require(cmdPath);
function interaction(user='owner',engine='groq',sub='test'){
 const sent=[];return {user:{id:user},guildId:'g',channelId:'c',options:{getSubcommand:()=>sub,getString:key=>key==='engine'?engine:key==='text'?'kitsune hi':null,getInteger:()=>17},sent,reply:async p=>sent.push(p),deferReply:async p=>sent.push(p),editReply:async p=>sent.push(p)};
}
(async()=>{try{
 const test=command.data.toJSON().options.find(o=>o.name==='test');eq(test.options.find(o=>o.name==='engine').choices.map(c=>c.value),['builtin','groq']);
 let i=interaction('admin');await command.execute(i);eq(aiCalls,0);eq(i.sent[0].flags,64);
 i=interaction();await command.execute(i);eq(aiCalls,1);eq(builtinCalls,0);eq(i.sent[0].flags,64);eq(i.sent[1].content,'Private AI report');eq(i.sent[1].allowedMentions,{parse:[]});eq(i.sent[1].files[0].attachment.toString(),'Private AI report');
 i=interaction('owner',null);await command.execute(i);eq(builtinCalls,1);eq(aiCalls,1);eq(i.sent[1].content,'Built-in report');
 fail=true;i=interaction();await command.execute(i);eq(i.sent[1].content.includes('disabled'),true);fail=false;
 i=interaction('owner','groq','testreset');await command.execute(i);eq(i.sent[1].content.includes('1 private AI'),true);
 eq(dbCalls,0);
 }finally{Module._load=original;}
 console.log(checks+' private AI slash routing, authorization, ephemeral report, reset and built-in-default checks passed. No external HTTP, Discord or database calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
