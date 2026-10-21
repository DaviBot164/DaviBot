'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const original=Module._load;let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const channelKeys=['sacredLaws','moonGuide','verification','roles','factionProgression','slayers2','supportGuide','openTicket','training'];
const channels=Object.fromEntries(channelKeys.map((key,i)=>[key,String(i+1)]));
class Embed{constructor(title,description){this.data={title,description,fields:[]};}addFields(...f){this.data.fields.push(...f);return this;}setColor(v){this.data.color=v;return this;}setThumbnail(v){this.data.thumbnail={url:v};return this;}setFooter(v){this.data.footer=v;return this;}}
class Builder{constructor(){this.data={};this.components=[];}setName(x){this.data.name=x;return this;}setDescription(x){this.data.description=x;return this;}setDefaultMemberPermissions(x){this.data.default_member_permissions=x;return this;}setCustomId(x){this.data.custom_id=x;return this;}setLabel(x){this.data.label=x;return this;}setEmoji(x){this.data.emoji=x;return this;}setStyle(x){return this;}setPlaceholder(x){return this;}addOptions(x){this.data.options=x;return this;}addComponents(...x){this.components.push(...x);return this;}}
const dc={SlashCommandBuilder:Builder,ActionRowBuilder:Builder,ButtonBuilder:Builder,StringSelectMenuBuilder:Builder,PermissionFlagsBits:{ManageGuild:32},MessageFlags:{Ephemeral:64},ButtonStyle:{Primary:1,Danger:4,Secondary:2,Success:3}};
Module._load=function(request,parent){
 if(parent?.filename?.startsWith(root)){
  if(request==='discord.js')return dc;
  if(request.endsWith('/config/channels')||request==='./channels')return channels;
  if(request.endsWith('/config/brand'))return{footer:'Blood Moon'};
  if(request==='./progression')return{getRanks:f=>f==='slayer'?[{name:'Slayer',level:1,automatic:true},{name:'Hashira',level:50,automatic:false}]:[{name:'Demon',level:1,automatic:true},{name:'Upper Moon',level:50,automatic:false}]};
  if(request.endsWith('/embeds'))return{createEmbed:(t,d)=>new Embed(t,d),successEmbed:(t,d)=>new Embed(t,d),errorEmbed:(t,d)=>new Embed(t,d)};
  if(request.endsWith('/database/connection'))return{pool:{connect:async()=>{throw Error('Database should not be called in setup tests');}}};
  if(request==='../ticketComponents')return{buildTicketPanelComponents:()=>[new Builder().addComponents(new Builder().setCustomId('existing-ticket-id'))]};
 }
 return original.apply(this,arguments);
};
let specs,presentation,modules={},training,command,handler;
try{
 specs=require(path.join(root,'config/setupGuides'));
 presentation=require(path.join(root,'utils/setup/guidePresentation'));
 for(const name of ['SacredLaws','MoonGuide','VerificationGuide','RoleGuide','GameGuide','SupportGuide','ProgressionGuides','PathSelection','TicketPanel'])modules[name]=require(path.join(root,'utils/setup/publish'+name));
 training=require(path.join(root,'utils/setup/publishTrainingGrounds'));
 command=require(path.join(root,'commands/information/setup'));
 handler=require(path.join(root,'handlers/setupHandler'));
}finally{Module._load=original;}
function validate(embed){
 const d=embed.data;assert.ok(d.title.length<=256);checks++;
 assert.ok(d.description.length<=4096);checks++;
 let total=d.title.length+d.description.length;
 for(const f of d.fields){assert.ok(f.name.length<=256&&f.value.length<=1024);checks++;total+=f.name.length+f.value.length;}
 assert.ok(total<6000);checks++;
 assert.ok(!JSON.stringify(d).includes('<#undefined>'));checks++;
}
(async()=>{
 let sends=0,edits=0;
 const store=new Map();
 const guild={iconURL:()=> 'https://example.com/icon.png',channels:{fetch:async id=>store.get(id)}};
 for(const id of Object.values(channels)){
  const messages=[];const ch={id,client:{user:{id:'bot'}},isTextBased:()=>true,messages:{fetch:async()=>({find:fn=>messages.find(fn)})},send:async payload=>{
   sends++;const msg={author:{id:'bot'},embeds:payload.embeds.map(x=>x.data),channel:ch,edit:async p=>{edits++;msg.embeds=p.embeds.map(x=>x.data);msg.last=p;return msg;},last:payload};messages.push(msg);return msg;
  }};store.set(id,ch);
 }
 for(const key of ['sacred_laws','moon_guide','verification_guide','role_guide','game_guide','support_guide'])validate(presentation.buildGuide(guild,specs.guide(key)));
 for(const faction of ['slayer','demon'])validate(presentation.buildGuide(guild,specs.pathGuide(faction)));
 for(const name of ['SacredLaws','MoonGuide','VerificationGuide','RoleGuide','GameGuide','SupportGuide','PathSelection','TicketPanel']){
  const publish=modules[name]['publish'+name];const first=await publish(guild);const second=await publish(guild);eq(first,second);validate(second.last.embeds[0]);eq(second.last.allowedMentions,{parse:[]});
 }
 eq(sends,8);eq(edits,8);
 const paths=modules.PathSelection.buildPathComponents();eq(paths[0].components.map(x=>x.data.custom_id),['akane:path:slayer','akane:path:demon']);
 const panel=training.buildTrainingPanel(guild);validate(panel.embeds[0]);eq(panel.components.flatMap(r=>r.components).map(b=>b.data.custom_id),['akane:training:daily','akane:training:profile','akane:training:achievements','akane:training:quests']);
 let denied;
 await command.execute({inGuild:()=>true,memberPermissions:{has:()=>false},reply:async x=>denied=x});eq(denied.flags,64);
 const handled=await handler.handleSetupSelect({isStringSelectMenu:()=>true,customId:'akane:setup',inGuild:()=>true,memberPermissions:{has:()=>false},reply:async x=>denied=x});eq(handled,true);eq(denied.flags,64);
 let menu;
 await command.execute({inGuild:()=>true,memberPermissions:{has:()=>true},guild,reply:async x=>menu=x});validate(menu.embeds[0]);eq(menu.components[0].components[0].data.custom_id,'akane:setup');eq(menu.components[0].components[0].data.options.length,9);
 const moon=presentation.buildGuide(guild,specs.guide('moon_guide'));const text=JSON.stringify(moon.data);for(const word of ['Vortex','Nova','Daily Drop','15 / 30','+50 XP']){assert.ok(text.includes(word));checks++;}
 // Missing destination fails before publishing.
 await assert.rejects(()=>presentation.publishGuide({...guild,channels:{fetch:async()=>null}},'missing',specs.guide('sacred_laws')));checks++;
 const fullPath=path.join(root,'utils/setup/publishFullSetup.js');
 delete require.cache[fullPath];
 const calls=[];
 Module._load=function(request,parent){
  if(parent?.filename===fullPath&&request.startsWith('./publish')){
   const fn=request.slice(2);
   return {[fn]:async()=>{calls.push(fn);return fn==='publishProgressionGuides'?{slayer:{},demon:{}}:{};}};
  }
  return original.apply(this,arguments);
 };
 let full;try{full=require(fullPath);}finally{Module._load=original;}
 const results=await full.publishFullSetup(guild);eq(results.length,11);eq(calls.filter(x=>x==='publishTrainingGrounds').length,1);
 console.log(`${checks} offline setup checks passed. Discord and database calls are mocked.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
