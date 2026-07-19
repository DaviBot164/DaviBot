const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const ticketConfig = require('../config/tickets');

const TICKET_OWNER_PATTERN =
    /DaviBot Ticket \| Owner: (\d+) \| Status: (open|closed)/;

/**
 * Convert configured permission names into
 * Discord PermissionFlagsBits values.
 *
 * @param {string[]} permissionNames
 * @returns {bigint[]}
 */
function resolvePermissions(permissionNames) {
    return permissionNames
        .map(permissionName =>
            PermissionFlagsBits[permissionName]
        )
        .filter(permission => permission !== undefined);
}

/**
 * Create a safe Discord channel name.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function createTicketChannelName(user) {
    const safeUsername = user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 70);

    const username =
        safeUsername || `user-${user.id.slice(-6)}`;

    return `${ticketConfig.channelPrefix}-${username}`;
}

/**
 * Create the topic stored inside a ticket channel.
 *
 * @param {string} ownerId
 * @param {'open'|'closed'} status
 * @returns {string}
 */
function createTicketTopic(ownerId, status = 'open') {
    return (
        `DaviBot Ticket | Owner: ${ownerId} | ` +
        `Status: ${status}`
    );
}

/**
 * Read ticket information from a channel topic.
 *
 * @param {string|null} topic
 * @returns {{ownerId: string, status: string}|null}
 */
function parseTicketTopic(topic) {
    if (!topic) {
        return null;
    }

    const match = topic.match(TICKET_OWNER_PATTERN);

    if (!match) {
        return null;
    }

    return {
        ownerId: match[1],
        status: match[2]
    };
}

/**
 * Find an existing open ticket belonging to a user.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findOpenTicket(guild, userId) {
    return (
        guild.channels.cache.find(channel => {
            if (channel.type !== ChannelType.GuildText) {
                return false;
            }

            const ticketData =
                parseTicketTopic(channel.topic);

            return (
                ticketData?.ownerId === userId &&
                ticketData.status === 'open'
            );
        }) || null
    );
}

/**
 * Create the ticket panel button.
 *
 * Category and staff role IDs are stored in the custom ID,
 * allowing the button to continue working after bot restarts.
 *
 * @param {string} categoryId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createTicketPanelButtons(
    categoryId,
    staffRoleId
) {
    const createButton = new ButtonBuilder()
        .setCustomId(
            `ticket:create:${categoryId}:${staffRoleId}`
        )
        .setLabel(ticketConfig.panel.buttonLabel)
        .setEmoji(ticketConfig.panel.buttonEmoji)
        .setStyle(ButtonStyle.Primary);

    return new ActionRowBuilder().addComponents(
        createButton
    );
}

/**
 * Create the buttons shown inside a ticket channel.
 *
 * @param {string} ownerId
 * @returns {ActionRowBuilder}
 */
function createTicketControlButtons(ownerId) {
    const closeButton = new ButtonBuilder()
        .setCustomId(`ticket:close:${ownerId}`)
        .setLabel(ticketConfig.ticket.closeButtonLabel)
        .setEmoji(ticketConfig.ticket.closeButtonEmoji)
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder().addComponents(
        closeButton
    );
}

/**
 * Create permission overwrites for a ticket channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @param {string} botId
 * @returns {import('discord.js').OverwriteResolvable[]}
 */
function createTicketPermissionOverwrites(
    guild,
    ownerId,
    staffRoleId,
    botId
) {
    return [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        },
        {
            id: ownerId,
            allow: resolvePermissions(
                ticketConfig.permissions.user
            )
        },
        {
            id: staffRoleId,
            allow: resolvePermissions(
                ticketConfig.permissions.staff
            )
        },
        {
            id: botId,
            allow: resolvePermissions(
                ticketConfig.permissions.bot
            )
        }
    ];
}

module.exports = {
    createTicketChannelName,
    createTicketTopic,
    parseTicketTopic,
    findOpenTicket,
    createTicketPanelButtons,
    createTicketControlButtons,
    createTicketPermissionOverwrites
};