'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..'),original=Module._load;
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
class Builder{constructor(){this.json={options:[]};}setName(v){this.json.name=v;return this;}setDescription(){return this;}setDefaultMemberPermissions(){return this;}setDMPermission(){return this;}setRequired(){return this;}setMinLength(){return this;}setMaxLength(){return this;}setMinValue(){return this;}setMaxValue(){return this;}addChoices(){return this;}addSubcommand(fn){const b=new Builder();fn(b);this.json.options.push(b.json);return this;}addStringOption(fn){return this.addSubcommand(fn);}addIntegerOption(fn){return this.addSubcommand(fn);}toJSON(){return this.json;}}
const cmdPath=path.join(root,'commands/information/kitsune.js');let database=0,runs=0,resets=0,long=false;
Module._load=function(request,parent){if(parent?.filename===cmdPath){
 if(request==='../../handlers/kitsune/aiTestLab')return{resetAiLab:()=>0};
 if(request==='discord.js')return{SlashCommandBuilder:Builder,PermissionFlagsBits:{Administrator:8n},MessageFlags:{Ephemeral:64},escapeMarkdown:x=>x};
 if(request==='../../handlers/kitsune/settings')return{OWNER_ID:'owner'};
 if(request==='../../handlers/kitsune/learningRuntime')return{enabled(){database++;throw Error('Do not call learning runtime in test mode');}};
 if(request==='../../database/kitsuneLearning')return new Proxy({},{get(){database++;throw Error('No database method should be used');}});
 if(request==='../../handlers/kitsune/testLab')return{runLab(input){runs++;eq(input.userId,'owner');return{turns:[{}],limitations:'Built-in rules only.'};},resetLab(){resets++;return 2;},formatReport(){return long?'x'.repeat(3000):'Private result';}};
 }return original.apply(this,arguments);};
let command;try{command=require(cmdPath);}finally{Module._load=original;}
const schema=command.data.toJSON();eq(schema.options.length,8);for(const name of ['unknown','clearunknown','learned','teach','forget','dismiss','test','testreset']){assert.ok(schema.options.find(x=>x.name===name));checks++;}
function interaction(user='owner',sub='test',guildId='g'){const sent=[];return{user:{id:user},guildId,channelId:'c',client:{user:{id:'bot'}},options:{getSubcommand:()=>sub,getString:key=>key==='text'?'kitsune hi':null,getInteger:()=>null},sent,reply:async p=>sent.push(p),deferReply:async p=>sent.push(p),editReply:async p=>sent.push(p)};}
// Keep the lazy lab import intercepted during execution.
(async()=>{
 const prior=Module._load;
 Module._load=function(request,parent){if(parent?.filename===cmdPath&&request==='../../handlers/kitsune/aiTestLab')return{resetAiLab:()=>0};if(parent?.filename===cmdPath&&request==='../../handlers/kitsune/testLab')return{runLab(input){runs++;eq(input.userId,'owner');return{turns:[{}],limitations:'Built-in rules only.'};},resetLab(){resets++;return 2;},formatReport(){return long?'x'.repeat(3000):'Private result';}};return prior.apply(this,arguments);};
 try{
  let i=interaction('admin');await command.execute(i);eq(runs,0);eq(i.sent[0].flags,64);
  i=interaction('owner','test',null);await command.execute(i);eq(runs,0);eq(i.sent[0].flags,64);
  i=interaction();await command.execute(i);eq(runs,1);eq(i.sent[0].flags,64);eq(i.sent[1].content,'Private result');eq(i.sent[1].allowedMentions,{parse:[]});eq(i.sent[1].files[0].attachment.toString(),'Private result');
  long=true;i=interaction();await command.execute(i);assert.ok(i.sent[1].content.length<1850);checks++;eq(i.sent[1].files[0].attachment.length,3000);
  i=interaction('owner','testreset');await command.execute(i);eq(resets,1);assert.ok(/2 private/.test(i.sent[1].content));checks++;
  eq(database,0,'test lab never calls learning or database');
 }finally{Module._load=prior;}
 console.log(checks+' slash schema, owner authorization, ephemeral reports and database-isolation checks passed. No real database or Discord calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
