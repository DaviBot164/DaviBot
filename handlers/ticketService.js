const brand=require('../config/brand');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const channels = require('../config/channels');
const roles = require('../config/roles');
const { STAFF_ROLE_KEYS, TICKET_ACTIONS, getTicketCategory } = require('../config/tickets');
const { createTicket, getTicketByChannel, getOpenTicket, setTicketChannel, closeTicket, reopenTicket, detachTicketChannel, addTicketAction } = require('../database/tickets');
const staffRoleIds = () => STAFF_ROLE_KEYS
    .map(key => roles[key])
    .filter(Boolean);
function isTicketStaff(member) {
    return Boolean(member &&
        (member.permissions?.has(PermissionFlagsBits.ManageGuild)||staffRoleIds().some(roleId => member.roles.cache.has(roleId))));
}
function cleanChannelName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'member';
}
function buildPermissionOverwrites(guild, member, botId) {
    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        },
        {
            id: member.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
            ]
        },
        {
            id: botId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles
            ]
        }
    ];
    for (const roleId of staffRoleIds()) {
        overwrites.push({
            id: roleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
            ]
        });
    }
    return overwrites;
}
async function createMemberTicket(member, categoryId) {
    const category = getTicketCategory(categoryId);
    if (!category) {
        throw new Error('Invalid ticket category.');
    }
    const existing = await getOpenTicket(member.guild.id, member.id);
    if (existing) {
        return {
            status: 'exists',
            ticket: existing
        };
    }
    let ticket;
    try {
        ticket =
            await createTicket({
                guildId: member.guild.id,
                userId: member.id,
                category: category.id
            });
    }
    catch (error) {
        if (error.code === '23505') {
            const openTicket = await getOpenTicket(member.guild.id, member.id);
            return {
                status: 'exists',
                ticket: openTicket
            };
        }
        throw error;
    }
    const panelChannel = member.guild.channels.cache.get(channels.openTicket);
    const parentId = panelChannel?.parentId ?? null;
    let channel;
    try {
        channel =
            await member.guild.channels.create({
                name: `ticket-${ticket.id}-${cleanChannelName(member.user.username)}`,
                type: ChannelType.GuildText,
                parent: parentId,
                topic: `${brand.name} · Ticket #${ticket.id} · ${category.name} · ${member.id}`,
                permissionOverwrites: buildPermissionOverwrites(member.guild, member, member.client.user.id)
            });
        ticket =
            await setTicketChannel(ticket.id, channel.id);
        await addTicketAction({
            ticketId: ticket.id,
            guildId: member.guild.id,
            action: TICKET_ACTIONS.CREATED,
            actorId: member.id
        });
        return {
            status: 'created',
            ticket,
            channel,
            category
        };
    }
    catch (error) {
        if (channel) {
            await channel.delete('Ticket creation failed.').catch(() => null);
        }
        await closeTicket(ticket.id, member.client.user.id).catch(() => null);
        throw error;
    }
}
const pending=new Map();
async function serial(channel,action){const key=channel.guild.id+':'+channel.id,previous=pending.get(key)??Promise.resolve();const task=previous.catch(()=>{}).then(action);pending.set(key,task);try{return await task;}finally{if(pending.get(key)===task)pending.delete(key);}}
function failure(code,message){return Object.assign(new Error(message),{code});}
async function getTicketForAction(channel,actor,action){
    if(!channel?.guild||actor?.guild?.id!==channel.guild.id)throw failure('TICKET_FORBIDDEN','This action is not available.');
    const ticket=await getTicketByChannel(channel.guild.id,channel.id);if(!ticket)return null;
    if(action==='close'?(actor.id!==ticket.userId&&!isTicketStaff(actor)):!isTicketStaff(actor))throw failure('TICKET_FORBIDDEN','Only the ticket creator or staff can close; only staff can reopen or delete.');
    if(action==='delete'&&ticket.status!=='closed')throw failure('TICKET_STATE','Close the ticket before deleting its channel.');
    if(action==='close'&&ticket.status!=='open'||action==='reopen'&&ticket.status!=='closed')return null;
    return ticket;
}
function previousPermissions(channel,userId,values){const overwrite=channel.permissionOverwrites.cache?.get(userId);return Object.fromEntries(Object.keys(values).map(key=>{const bit=PermissionFlagsBits[key];return[key,overwrite?.allow?.has(bit)?true:overwrite?.deny?.has(bit)?false:null];}));}
async function setState(channel,ticket,actor,action,values,write){
    const before=previousPermissions(channel,ticket.userId,values);await channel.permissionOverwrites.edit(ticket.userId,values);
    let updated;try{updated=await write(ticket.id,actor.id);}catch(error){await channel.permissionOverwrites.edit(ticket.userId,before).catch(()=>console.error('Ticket permission rollback failed.'));throw error;}
    if(!updated){await channel.permissionOverwrites.edit(ticket.userId,before);return null;}
    await addTicketAction({ticketId:ticket.id,guildId:channel.guild.id,action,actorId:actor.id}).catch(()=>console.error('Ticket action audit could not be recorded.'));
    return updated;
}
async function closeMemberTicket(channel,actor){return serial(channel,async()=>{const ticket=await getTicketForAction(channel,actor,'close');if(!ticket)return null;return setState(channel,ticket,actor,TICKET_ACTIONS.CLOSED,{SendMessages:false},closeTicket);});}
async function reopenMemberTicket(channel,actor){return serial(channel,async()=>{
    const ticket=await getTicketForAction(channel,actor,'reopen');if(!ticket)return null;
    const existing=await getOpenTicket(channel.guild.id,ticket.userId);if(existing&&existing.id!==ticket.id)return{conflict:true,ticket:existing};
    try{const updated=await setState(channel,ticket,actor,TICKET_ACTIONS.REOPENED,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true},reopenTicket);return updated?{conflict:false,ticket:updated}:null;}
    catch(error){if(error.code==='23505')return{conflict:true};throw error;}
});}
// Validation is read-only. Never detach the record before Discord deletes the channel.
async function prepareTicketDeletion(channel,actor){return getTicketForAction(channel,actor,'delete');}
async function deleteMemberTicket(channel,actor){return serial(channel,async()=>{
    const ticket=await prepareTicketDeletion(channel,actor);if(!ticket)return null;
    await channel.delete(`Ticket #${ticket.id} deleted by ${actor.id}`);
    await detachTicketChannel(ticket.id).catch(()=>console.error('Deleted ticket channel could not be detached from its record.'));
    await addTicketAction({ticketId:ticket.id,guildId:channel.guild.id,action:TICKET_ACTIONS.DELETED,actorId:actor.id}).catch(()=>console.error('Ticket deletion audit could not be recorded.'));
    return ticket;
});}
module.exports={isTicketStaff,createMemberTicket,getTicketForAction,closeMemberTicket,reopenMemberTicket,prepareTicketDeletion,deleteMemberTicket};
