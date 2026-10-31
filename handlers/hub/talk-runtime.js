'use strict';
const {randomBytes}=require('node:crypto');
const {ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder,MessageFlags}=require('discord.js');
const engine=require('./talk-engine'),{current,enabled}=require('../../utils/guildContext');
function createRuntime({clock=Date.now}={}){
 const sessions=new Map(),ttl=30*60_000;
 const id=(row,action)=>`kitsune:talk:${row.guild}:${row.user}:${row.id}:${row.revision}:${action}`;
 function render(row){
  const v=engine.view(row.state),s=current(),components=[];
  const make=c=>{const b=new ButtonBuilder().setCustomId(id(row,c.id)).setLabel(c.label).setStyle(ButtonStyle.Secondary);if(c.emoji)b.setEmoji(c.emoji);return b;};
  for(let i=0;i<v.choices.length;i+=2)components.push(new ActionRowBuilder().addComponents(...v.choices.slice(i,i+2).map(make)));
  components.push(new ActionRowBuilder().addComponents(...v.activities.map(c=>new ButtonBuilder().setCustomId(`kitsune:hub:${row.guild}:${row.user}:${c.id}:0`).setLabel(c.label).setEmoji(c.emoji).setStyle(ButtonStyle.Secondary))));
  // Close is always the last button; at most three choice rows plus these two.
  components.push(new ActionRowBuilder().addComponents(...v.navigation.map(make)));
  return {content:'',embeds:[new EmbedBuilder().setColor(s.brand.color).setTitle('🦊 '+s.brand.name).setDescription(v.reply).setFooter({text:s.brand.footer})],components,allowedMentions:{parse:[]}};
 }
 async function handle(i){
  const custom=String(i.customId??''),match=custom.match(/^kitsune:talk:(\d{16,22}):(\d{16,22}):([a-f0-9]{12}):(\d{1,3}):([a-z]+)$/u);
  const old=custom.match(/^kitsune:hub:(\d{16,22}):(public|\d{16,22}):([a-z]+):\d{1,2}$/u);
  const entry=old&&(Object.hasOwn(engine.nodes,old[3])||old[3]==='nav'&&i.values?.[0]==='talk');
  if(!custom.startsWith('kitsune:talk:')&&!entry)return false;
  const deny=content=>i.reply({content,flags:MessageFlags.Ephemeral,allowedMentions:{parse:[]}});
  if(!enabled('conversation')){await deny('Kitsune chat is disabled on this server.');return true;}
  const now=clock();for(const [key,row]of sessions)if(now>=row.expires&&!row.busy)sessions.delete(key);
  if(entry){
   if(old[1]!==i.guildId||old[2]!=='public'&&old[2]!==i.user.id){await deny('Open your own chat with kit.');return true;}
   const row={id:randomBytes(6).toString('hex'),guild:i.guildId,user:i.user.id,revision:0,expires:now+ttl,state:engine.start('en',old[3]==='nav'?'talk':old[3]),busy:false};
   while(sessions.size>=1000){const removable=[...sessions].find(([,s])=>!s.busy);if(!removable){await deny('Chat is busy. Try again shortly.');return true;}sessions.delete(removable[0]);}
   sessions.set(row.id,row);
   try{if(old[2]==='public')await i.deferReply({flags:MessageFlags.Ephemeral});else await i.deferUpdate();await i.editReply(render(row));}catch(error){sessions.delete(row.id);throw error;}return true;
  }
  if(!match||match[1]!==i.guildId||match[2]!==i.user.id){await deny('These buttons belong to another conversation. Open your own chat with kit.');return true;}
  const row=sessions.get(match[3]);
  if(!row||row.guild!==i.guildId||row.user!==i.user.id){await deny('This chat has expired. / საუბარი დასრულებულია. Type kit to start again.');return true;}
  const ka=row.state.lang==='ka';
  if(row.busy||row.revision!==Number(match[4])){await deny(ka?'გამოიყენე საუბრის ბოლო ღილაკები.':'Use the latest buttons in this chat.');return true;}
  let next;try{next=engine.change(row.state,match[5]);}catch(error){await deny(row.state.steps>=120?(ka?'დაიწყე ახალი საუბარი: kit.':'Start a fresh conversation with kit.'):(ka?'ეს არჩევანი აღარ არის ხელმისაწვდომი.':'That choice is unavailable.'));return true;}
  row.busy=true;
  try{
   await i.deferUpdate();
   if(next.closed){sessions.delete(row.id);try{await i.deleteReply();}catch{await i.editReply({content:engine.view(next).reply,embeds:[],components:[],allowedMentions:{parse:[]}});}return true;}
   const updated={...row,state:next,revision:row.revision+1};
   await i.editReply(render(updated));Object.assign(row,updated);
  }finally{row.busy=false;}
  return true;
 }
 return {handle,render};
}
module.exports={createRuntime,...createRuntime()};
