const {
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const channels =
    require('../config/channels');

const roles =
    require('../config/roles');

const {
    STAFF_ROLE_KEYS,
    TICKET_ACTIONS,
    getTicketCategory
} = require('../config/tickets');

const {
    createTicket,
    getTicketByChannel,
    getOpenTicket,
    setTicketChannel,
    closeTicket,
    reopenTicket,
    detachTicketChannel,
    addTicketAction
} = require('../database/tickets');

const STAFF_ROLE_IDS =
    STAFF_ROLE_KEYS
        .map(key => roles[key])
        .filter(Boolean);

function isTicketStaff(member) {
    return Boolean(
        member &&
        STAFF_ROLE_IDS.some(
            roleId =>
                member.roles.cache.has(roleId)
        )
    );
}

function cleanChannelName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'member';
}

function buildPermissionOverwrites(
    guild,
    member,
    botId
) {
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
                PermissionFlagsBits.ManageMessages
            ]
        }
    ];

    for (const roleId of STAFF_ROLE_IDS) {
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

async function createMemberTicket(
    member,
    categoryId
) {
    const category =
        getTicketCategory(categoryId);

    if (!category) {
        throw new Error(
            'Invalid ticket category.'
        );
    }

    const existing =
        await getOpenTicket(
            member.guild.id,
            member.id
        );

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
                guildId:
                    member.guild.id,

                userId:
                    member.id,

                category:
                    category.id
            });
    } catch (error) {
        if (error.code === '23505') {
            const openTicket =
                await getOpenTicket(
                    member.guild.id,
                    member.id
                );

            return {
                status: 'exists',
                ticket: openTicket
            };
        }

        throw error;
    }

    const panelChannel =
        member.guild.channels.cache.get(
            channels.openTicket
        );

    const parentId =
        panelChannel?.parentId ?? null;

    let channel;

    try {
        channel =
            await member.guild.channels.create({
                name:
                    `ticket-${ticket.id}-${cleanChannelName(
                        member.user.username
                    )}`,

                type:
                    ChannelType.GuildText,

                parent:
                    parentId,

                topic:
                    `Blood Moon Ticket #${ticket.id} • ${member.id}`,

                permissionOverwrites:
                    buildPermissionOverwrites(
                        member.guild,
                        member,
                        member.client.user.id
                    )
            });

        ticket =
            await setTicketChannel(
                ticket.id,
                channel.id
            );

        await addTicketAction({
            ticketId:
                ticket.id,

            guildId:
                member.guild.id,

            action:
                TICKET_ACTIONS.CREATED,

            actorId:
                member.id
        });

        return {
            status: 'created',
            ticket,
            channel,
            category
        };
    } catch (error) {
        if (channel) {
            await channel.delete(
                'Ticket creation failed.'
            ).catch(() => null);
        }

        await closeTicket(
            ticket.id,
            member.client.user.id
        ).catch(() => null);

        throw error;
    }
}

async function closeMemberTicket(
    channel,
    actor
) {
    const ticket =
        await getTicketByChannel(
            channel.guild.id,
            channel.id
        );

    if (
        !ticket ||
        ticket.status !== 'open'
    ) {
        return null;
    }

    const updated =
        await closeTicket(
            ticket.id,
            actor.id
        );

    if (!updated) {
        return null;
    }

    await channel.permissionOverwrites.edit(
        ticket.userId,
        {
            SendMessages: false
        }
    );

    await addTicketAction({
        ticketId:
            ticket.id,

        guildId:
            channel.guild.id,

        action:
            TICKET_ACTIONS.CLOSED,

        actorId:
            actor.id
    });

    return updated;
}

async function reopenMemberTicket(
    channel,
    actor
) {
    const ticket =
        await getTicketByChannel(
            channel.guild.id,
            channel.id
        );

    if (
        !ticket ||
        ticket.status !== 'closed'
    ) {
        return null;
    }

    const existing =
        await getOpenTicket(
            channel.guild.id,
            ticket.userId
        );

    if (
        existing &&
        existing.id !== ticket.id
    ) {
        return {
            conflict: true,
            ticket: existing
        };
    }

    let updated;

    try {
        updated =
            await reopenTicket(
                ticket.id,
                actor.id
            );
    } catch (error) {
        if (error.code === '23505') {
            return {
                conflict: true
            };
        }

        throw error;
    }

    if (!updated) {
        return null;
    }

    await channel.permissionOverwrites.edit(
        ticket.userId,
        {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        }
    );

    await addTicketAction({
        ticketId:
            ticket.id,

        guildId:
            channel.guild.id,

        action:
            TICKET_ACTIONS.REOPENED,

        actorId:
            actor.id
    });

    return {
        conflict: false,
        ticket: updated
    };
}

async function prepareTicketDeletion(
    channel,
    actor
) {
    const ticket =
        await getTicketByChannel(
            channel.guild.id,
            channel.id
        );

    if (!ticket) {
        return null;
    }

    await addTicketAction({
        ticketId:
            ticket.id,

        guildId:
            channel.guild.id,

        action:
            TICKET_ACTIONS.DELETED,

        actorId:
            actor.id
    });

    await detachTicketChannel(
        ticket.id
    );

    return ticket;
}

module.exports = {
    isTicketStaff,
    createMemberTicket,
    closeMemberTicket,
    reopenMemberTicket,
    prepareTicketDeletion
};