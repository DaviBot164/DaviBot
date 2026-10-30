'use strict';
const {MessageFlags}=require('discord.js');
const {render}=require('./ui'),{transition}=require('./engine');
async function handle(i){const prefix=String(i.customId??'');const open=prefix.startsWith('kitsune:hub:')&&(['play','stories','games'].includes(prefix.split(':')[4])||prefix.split(':')[4]==='nav'&&['play','stories','games'].includes(i.values?.[0]));if(!open&&!prefix.startsWith('kitsune:play:'))return false;
 const deny=content=>i.reply({content,flags:MessageFlags.Ephemeral,allowedMentions:{parse:[]}});if(!require('../../utils/guildContext').enabled('conversation')){await deny('Kitsune activities are disabled.');return true;}
 const parts=prefix.split(':');if(!i.guildId||parts[2]!==i.guildId||parts[3]!=='public'&&parts[3]!==i.user.id){await deny('Open your own menu with /kitsune open.');return true;}
 const match=prefix.match(/^kitsune:play:(\d{16,22}):(\d{16,22}):(\d{1,10}):([a-z]+(?:-[a-z0-9]+)?)$/);if(!open&&!match){await deny('This activity button is unavailable.');return true;}
 if(open)await i.deferReply({flags:MessageFlags.Ephemeral});else await i.deferUpdate();try{const repo=require('../../database/kitsunePlay');let row=await repo.read(i.guildId,i.user.id);
 if(!open&&match[4]==='close'){
  if(row.revision!==Number(match[3])){await i.editReply({...render(i.guildId,i.user.id,row),content:row.value.lang==='ka'?'ეს ღილაკი მოძველებულია. გამოიყენე მიმდინარე პანელი.':'That button is out of date. Use the current panel.'});return true;}
  try{await i.deleteReply();}catch{await i.editReply({content:row.value.lang==='ka'?'დახურულია. პროგრესი შენახულია.':'Closed. Your progress is saved.',embeds:[],components:[],allowedMentions:{parse:[]}});}return true;
 }
 if(open){const section=parts[4]==='nav'?i.values?.[0]:parts[4];if(['stories','games'].includes(section))row=await repo.change(i.guildId,i.user.id,row.revision,s=>transition(s,section));}
 if(!open)row=await repo.change(i.guildId,i.user.id,Number(match[3]),s=>transition(s,match[4]));const payload=render(i.guildId,i.user.id,row);if(row.stale)payload.content=row.value.lang==='ka'?'ეს არჩევანი უკვე შეიცვალა. ქვემოთ მიმდინარე მდგომარეობაა.':'That button is out of date. Here is your current checkpoint.';await i.editReply(payload);}catch{await i.editReply({content:'Activities could not load. Your last saved checkpoint is kept. /kitsune open',allowedMentions:{parse:[]}});}return true;
}
module.exports={handle};
