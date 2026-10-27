const crypto=require('node:crypto');
const model=require('../../config/serverSettings');
const context=require('../../utils/guildContext');
const repository=require('../../database/guildSettings');
const sections=Object.freeze({sacred_laws:{channel:'sacredLaws',module:null},moon_guide:{channel:'moonGuide',module:null},verification_guide:{channel:'verification',module:null},role_guide:{channel:'roles',module:null},game_guide:{channel:'slayers2',module:null},support_guide:{channel:'supportGuide',module:'tickets'},progression_guides:{channel:'factionProgression',module:'progression'},path_selection:{channel:'slayers2',module:'progression'},ticket_panel:{channel:'openTicket',module:'tickets'},training_grounds:{channel:'training',module:'progression'}});
function createManagement({client,repo=repository,clock=Date.now,publishers=null}){
 const previews=new Map();
 async function resources(guild){const [channels,roles]=await Promise.all([guild.channels.fetch(),guild.roles.fetch()]);return {channels:[...channels.values()].filter(c=>c?.isTextBased?.()&&typeof c.send==='function').map(c=>({id:c.id,name:c.name,canPublish:!!guild.members.me&&!!c.permissionsFor(guild.members.me)?.has(['ViewChannel','SendMessages','EmbedLinks','ReadMessageHistory'])})),roles:[...roles.values()].filter(Boolean).filter(r=>r.id!==guild.id).map(r=>({id:r.id,name:r.name,managed:r.managed,position:r.position}))};}
 async function checkIds(guild,value){const r=await resources(guild);const channels=new Set(r.channels.map(c=>c.id)),roles=new Set(r.roles.map(r=>r.id));for(const key of model.channelKeys)if(value.channels[key]&&!channels.has(value.channels[key]))throw Error('A selected text channel is unavailable in this guild: '+key);for(const key of model.roleKeys)if(value.roles[key]&&!roles.has(value.roles[key]))throw Error('A selected role is unavailable in this guild: '+key);return r;}
 function chosen(body){if(!Array.isArray(body.sections)||!body.sections.length||body.sections.length>10||body.sections.some(k=>!Object.hasOwn(sections,k)))throw Error('Choose valid setup sections.');return [...new Set(body.sections)];}
 function specs(guild,key){
  const guides=require('../../config/setupGuides');
  if(model.pageKeys.includes(key))return [guides.guide(key)];
  if(key==='progression_guides')return ['slayer','demon'].map(guides.pathGuide);
  if(key==='path_selection')return [require('../../utils/setup/publishPathSelection').pathSpec()];
  if(key==='ticket_panel')return [require('../../utils/setup/publishTicketPanel').ticketSpec()];
  if(key==='training_grounds'){const data=require('../../utils/setup/publishTrainingGrounds').buildTrainingPanel(guild).embeds[0].toJSON();return [{title:data.title,intro:data.description,fields:data.fields}];}
  return [];
 }
 async function plan(guild,row,keys){const resources=await checkIds(guild,row.value);return context.run(guild,row.value,async()=>keys.map(key=>{const section=sections[key],channelId=row.value.channels[section.channel],enabled=!section.module||row.value.modules[section.module],channel=resources.channels.find(c=>c.id===channelId),posts=specs(guild,key);return {key,channelId,title:posts.map(p=>p.title).join(' / '),description:posts.map(p=>p.intro).join('\n\n'),fields:posts.flatMap(p=>p.fields??[]),ready:!!(enabled&&channel?.canPublish),issue:!enabled?'System disabled':!channelId?'Choose a channel for '+section.channel:!channel?'Channel unavailable':!channel.canPublish?'Missing View Channel, Send Messages, Embed Links or Read History permission':null};}));}

 function publishersFor(){return publishers??{sacred_laws:g=>require('../../utils/setup/publishSacredLaws').publishSacredLaws(g),moon_guide:g=>require('../../utils/setup/publishMoonGuide').publishMoonGuide(g),verification_guide:g=>require('../../utils/setup/publishVerificationGuide').publishVerificationGuide(g),role_guide:g=>require('../../utils/setup/publishRoleGuide').publishRoleGuide(g),game_guide:g=>require('../../utils/setup/publishGameGuide').publishGameGuide(g),support_guide:g=>require('../../utils/setup/publishSupportGuide').publishSupportGuide(g),progression_guides:g=>require('../../utils/setup/publishProgressionGuides').publishProgressionGuides(g),path_selection:g=>require('../../utils/setup/publishPathSelection').publishPathSelection(g),ticket_panel:g=>require('../../utils/setup/publishTicketPanel').publishTicketPanel(g),training_grounds:g=>require('../../utils/setup/publishTrainingGrounds').publishTrainingGrounds(g)};}
 async function handle(path,method,guild,body){
  const row=await repo.getSettings(guild);
  if(path==='/v1/settings'&&method==='GET')return {settings:row.value,revision:row.revision,...await resources(guild)};
  if(path==='/v1/settings'&&method==='POST'){const value=model.validate(body.settings,guild.name);await checkIds(guild,value);const saved=await repo.saveSettings(guild,value,body.revision);return {settings:saved.value,revision:saved.revision,...await resources(guild)};}
  if(path==='/v1/setup/preview'&&method==='POST'){
   const keys=chosen(body),rows=await plan(guild,row,keys);for(const[k,v]of previews)if(v.expires<=clock())previews.delete(k);if(previews.size>=50)previews.delete(previews.keys().next().value);
   const token=crypto.randomBytes(24).toString('hex');previews.set(token,{guildId:guild.id,revision:row.revision,keys,expires:clock()+120000,used:false});return {token,revision:row.revision,rows,ready:rows.every(r=>r.ready)};
  }
  if(path==='/v1/setup/publish'&&method==='POST'){
   const preview=previews.get(body.token);if(!preview||preview.guildId!==guild.id||preview.expires<=clock()||preview.revision!==row.revision)throw Error('Preview expired or settings changed. Preview again.');if(preview.used)throw Error('This preview was already used.');
   const rows=await plan(guild,row,preview.keys);if(rows.some(r=>!r.ready))throw Error('Finish configuring the selected sections.');preview.used=true;
   const results=[];await context.run(guild,row.value,async()=>{for(const key of preview.keys){try{await publishersFor()[key](guild);results.push({key,ok:true});}catch(error){results.push({key,ok:false,error:'Could not publish. Check channel permissions and configuration.'});}}});return {results,complete:results.every(r=>r.ok)};
  }
  if(path==='/v1/welcome/preview'&&method==='POST'){
   // Rendering only; never sends a Discord message or fetches an arbitrary image URL.
   const value=body.settings?model.validate(body.settings,guild.name):row.value;const sample=guild.members.cache.get(require('../kitsune/settings').OWNER_ID)??guild.members.me;if(!sample)throw Error('Preview member unavailable.');const png=await context.run(guild,value,()=>require('../../utils/welcomeEmbed').bannerPng(sample));return {image:'data:image/png;base64,'+png.toString('base64'),revision:row.revision};
  }
  throw Error('Unknown management request');
 }
 return {handle};
}
module.exports={createManagement,sections};
