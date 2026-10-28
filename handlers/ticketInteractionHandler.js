const crypto=require('node:crypto');
const {MessageFlags}=require('discord.js');
const {TICKET_COMPONENT_IDS:IDS,buildTicketCategoryComponents,buildOpenTicketComponents,buildClosedTicketComponents,buildTicketConfirmationComponents,buildTicketLinkComponents}=require('../utils/ticketComponents');
const service=require('./ticketService');
const view=require('../utils/ticketPresentation');
const {errorEmbed,successEmbed}=require('../utils/embeds');
const {sendTicketLog}=require('../utils/ticketLogs');
const confirmations=new Map(),TTL=120000,MAX=2000;
const safe={parse:[]};
const privateReply=(interaction,title,message)=>interaction.reply({flags:MessageFlags.Ephemeral,embeds:[errorEmbed(title,message)],allowedMentions:safe});
function errorMessage(error){if(error?.code==='TICKET_FORBIDDEN')return 'Only the ticket creator or staff can close it. Reopening and deletion are staff-only.';if(error?.code==='TICKET_STATE')return 'Close the ticket before deleting its channel.';return 'Check the bot’s channel permissions and try again.';}
async function log(guild,ticket,actor,title,description){await sendTicketLog(guild,{ticket,actor,title,description}).catch(()=>console.error('Ticket notification log could not be sent.'));}
async function controls(channel,messageId,open){if(!messageId)return;try{const message=await channel.messages.fetch(messageId);if(message?.author.id===channel.client.user.id)await message.edit({components:open?buildOpenTicketComponents():buildClosedTicketComponents()});}catch{console.error('Ticket controls could not be refreshed.');}}
async function open(interaction){await interaction.reply({flags:MessageFlags.Ephemeral,embeds:[view.categoryPrompt()],components:buildTicketCategoryComponents(),allowedMentions:safe});}
async function category(interaction){
 await interaction.deferReply({flags:MessageFlags.Ephemeral});let result;
 try{result=await service.createMemberTicket(interaction.member,interaction.values[0]);}catch(error){console.error('Ticket creation failed:',error?.code??'operation failed');await interaction.editReply({embeds:[errorEmbed('Could not open ticket',errorMessage(error))],components:[],allowedMentions:safe});return;}
 const channel=result.channel??(result.ticket?.channelId?interaction.guild.channels.cache.get(result.ticket.channelId):null);
 if(result.status==='exists'){
  await interaction.editReply({embeds:[channel?view.ready(result.ticket,channel,true):errorEmbed('A ticket is already opening','You already have an open ticket. Wait a moment, then try again or ask staff to locate it.')],components:channel?buildTicketLinkComponents(channel):[],allowedMentions:safe});return;
 }
 let introFailed=false;try{await channel.send({content:`<@${result.ticket.userId}>`,embeds:[view.ticketWelcome(result.ticket)],components:buildOpenTicketComponents(),allowedMentions:{parse:[],users:[result.ticket.userId]}});}catch{introFailed=true;console.error('Ticket opened, but its introduction could not be sent.');}
 await log(interaction.guild,result.ticket,interaction.user,'Ticket opened',`Opened <#${channel.id}>.`);
 const receipt=view.ready(result.ticket,channel);if(introFailed)receipt.addFields({name:'Staff attention needed',value:'The channel was created, but its welcome controls could not be sent. Please ask staff to check the bot’s channel permissions.'});
 await interaction.editReply({embeds:[receipt],components:buildTicketLinkComponents(channel),allowedMentions:safe});
}
async function requestConfirmation(interaction,action){
 await interaction.deferReply({flags:MessageFlags.Ephemeral});let ticket;
 try{ticket=await service.getTicketForAction(interaction.channel,interaction.member,action);}catch(error){await interaction.editReply({embeds:[errorEmbed('Action unavailable',errorMessage(error))],allowedMentions:safe});return;}
 if(!ticket){await interaction.editReply({embeds:[errorEmbed('Ticket changed','This ticket is no longer available for that action.')],allowedMentions:safe});return;}
 const now=Date.now();for(const[k,v]of confirmations)if(v.expires<=now)confirmations.delete(k);
 if(confirmations.size>=MAX){await interaction.editReply({embeds:[errorEmbed('Try again shortly','Too many confirmations are waiting. No ticket was changed.')],allowedMentions:safe});return;}
 const token=crypto.randomBytes(12).toString('hex');confirmations.set(token,{guildId:interaction.guild.id,channelId:interaction.channel.id,userId:interaction.user.id,ticketId:ticket.id,action,messageId:interaction.message.id,expires:now+TTL});
 await interaction.editReply({embeds:[view.confirmation(ticket,action)],components:buildTicketConfirmationComponents(action,token),allowedMentions:safe});
}
async function confirm(interaction,token,cancel){
 const entry=confirmations.get(token);
 if(!entry||entry.expires<=Date.now()){confirmations.delete(token);await privateReply(interaction,'Confirmation expired','Use the ticket’s Close or Delete button again. Nothing was changed.');return;}
 if(entry.guildId!==interaction.guild.id||entry.channelId!==interaction.channel.id||entry.userId!==interaction.user.id){await privateReply(interaction,'Not your confirmation','Start this action from the ticket’s own controls.');return;}
 confirmations.delete(token);
 if(cancel){await interaction.update({embeds:[successEmbed('Ticket kept','Nothing was changed.')],components:[],allowedMentions:safe});return;}
 await interaction.deferUpdate();let ticket;
 try{const current=await service.getTicketForAction(interaction.channel,interaction.member,entry.action);if(!current||current.id!==entry.ticketId){await interaction.editReply({embeds:[errorEmbed('Ticket changed','That action is no longer available. Nothing was changed.')],components:[],allowedMentions:safe});return;}
 ticket=entry.action==='delete'?await service.deleteMemberTicket(interaction.channel,interaction.member):await service.closeMemberTicket(interaction.channel,interaction.member);
 }catch(error){console.error('Ticket action failed:',error?.code??'operation failed');await interaction.editReply({embeds:[errorEmbed('Action failed',errorMessage(error))],components:[],allowedMentions:safe}).catch(()=>null);return;}
 if(!ticket){await interaction.editReply({embeds:[errorEmbed('Ticket changed','The ticket was already changed. Refresh its controls.')],components:[],allowedMentions:safe});return;}
 if(entry.action==='close'){
  await controls(interaction.channel,entry.messageId,false);
  await interaction.channel.send({embeds:[view.statusNotice(ticket,interaction.user,false)],allowedMentions:safe}).catch(()=>console.error('Ticket close notice could not be sent.'));
 }
 await log(interaction.guild,ticket,interaction.user,entry.action==='delete'?'Ticket channel deleted':'Ticket closed',`Ticket #${ticket.id} ${entry.action==='delete'?'channel deleted':'closed'}.`);
 await interaction.editReply({embeds:[successEmbed(entry.action==='delete'?'Channel deleted':'Ticket closed',entry.action==='delete'?'The ticket channel has been deleted.':'The channel is now read-only for its creator. Staff can reopen it.')],components:[],allowedMentions:safe}).catch(()=>null);
}
async function reopen(interaction){
 await interaction.deferReply({flags:MessageFlags.Ephemeral});let result;
 try{result=await service.reopenMemberTicket(interaction.channel,interaction.member);}catch(error){await interaction.editReply({embeds:[errorEmbed('Cannot reopen ticket',errorMessage(error))],allowedMentions:safe});return;}
 if(!result||result.conflict){await interaction.editReply({embeds:[errorEmbed('Cannot reopen ticket',result?.conflict?'This member already has another open ticket.':'The ticket is already open or no longer exists.')],allowedMentions:safe});return;}
 await controls(interaction.channel,interaction.message.id,true);
 await interaction.channel.send({embeds:[view.statusNotice(result.ticket,interaction.user,true)],allowedMentions:safe}).catch(()=>console.error('Ticket reopen notice could not be sent.'));
 await log(interaction.guild,result.ticket,interaction.user,'Ticket reopened',`Ticket #${result.ticket.id} reopened.`);
 await interaction.editReply({embeds:[successEmbed('Ticket reopened','The conversation can continue.')],allowedMentions:safe});
}
async function handleTicketInteraction(interaction){
 const id=String(interaction.customId??'');
 if(!Object.values(IDS).some(value=>id===value||((value===IDS.confirm||value===IDS.cancel)&&id.startsWith(value))))return false;
 if(!interaction.guild||!interaction.member){await privateReply(interaction,'Server only','Use ticket controls inside their server.');return true;}
 if(interaction.isButton()){
  if(id.startsWith(IDS.confirm))await confirm(interaction,id.slice(IDS.confirm.length),false);
  else if(id.startsWith(IDS.cancel))await confirm(interaction,id.slice(IDS.cancel.length),true);
  else if(id===IDS.open)await open(interaction);
  else if(id===IDS.close||id===IDS.delete)await requestConfirmation(interaction,id===IDS.close?'close':'delete');
  else if(id===IDS.reopen)await reopen(interaction);
  else return false;
  return true;
 }
 if(interaction.isStringSelectMenu()&&id===IDS.category){await category(interaction);return true;}
 return false;
}
module.exports={handleTicketInteraction};
