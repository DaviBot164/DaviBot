const {ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder}=require('discord.js');
const {TICKET_CATEGORIES}=require('../config/tickets');
// Keep existing public component IDs so already-published panels still work.
const TICKET_COMPONENT_IDS=Object.freeze({open:'kitsune:ticket:open',category:'kitsune:ticket:category',close:'kitsune:ticket:close',reopen:'kitsune:ticket:reopen',delete:'kitsune:ticket:delete',confirm:'kitsune:ticket:confirm:',cancel:'kitsune:ticket:cancel:'});
const button=(id,label,style,emoji)=>new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setEmoji(emoji);
function buildTicketPanelComponents(){return[new ActionRowBuilder().addComponents(button(TICKET_COMPONENT_IDS.open,'Get support',ButtonStyle.Primary,'🎫'))];}
function buildTicketCategoryComponents(){return[new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(TICKET_COMPONENT_IDS.category).setPlaceholder('What do you need help with?').addOptions(Object.values(TICKET_CATEGORIES).map(c=>({label:c.name,value:c.id,description:c.description,emoji:c.emoji}))))];}
function buildOpenTicketComponents(){return[new ActionRowBuilder().addComponents(button(TICKET_COMPONENT_IDS.close,'Close ticket',ButtonStyle.Secondary,'🔒'))];}
function buildClosedTicketComponents(){return[new ActionRowBuilder().addComponents(button(TICKET_COMPONENT_IDS.reopen,'Reopen ticket',ButtonStyle.Success,'🔓'),button(TICKET_COMPONENT_IDS.delete,'Delete channel',ButtonStyle.Danger,'🗑️'))];}
function buildTicketConfirmationComponents(action,token){return[new ActionRowBuilder().addComponents(button(TICKET_COMPONENT_IDS.confirm+token,action==='delete'?'Yes, delete channel':'Yes, close ticket',ButtonStyle.Danger,action==='delete'?'🗑️':'🔒'),button(TICKET_COMPONENT_IDS.cancel+token,'Keep ticket',ButtonStyle.Secondary,'↩️'))];}
function buildTicketLinkComponents(channel){return[new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Open your ticket').setURL(`https://discord.com/channels/${channel.guild.id}/${channel.id}`))];}
module.exports={TICKET_COMPONENT_IDS,buildTicketPanelComponents,buildTicketCategoryComponents,buildOpenTicketComponents,buildClosedTicketComponents,buildTicketConfirmationComponents,buildTicketLinkComponents};
