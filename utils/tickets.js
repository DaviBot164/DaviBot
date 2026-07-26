const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const ticketConfig =
    require('../config/tickets');

/**
 * Recognize both the new Umbra ticket topic
 * and the old DaviBot ticket topic.
 *
 * Keeping legacy support prevents existing
 * open or closed tickets from becoming invalid
 * after the bot rebrand.
 */
const TICKET_OWNER_PATTERN =
    /(?:Umbra|DaviBot) Ticket \| Owner: (\d+) \| Status: (open|closed)/;

/**
 * Convert configured permission names into
 * Discord permission bit values.
 *
 * @param {string[]} permissionNames
 * @returns {bigint[]}
 */
function resolvePermissions(
    permissionNames
) {
    if (!Array.isArray(permissionNames)) {
        return [];
    }

    return permissionNames
        .map(
            permissionName =>
                PermissionFlagsBits[
                    permissionName
                ]
        )
        .filter(
            permission =>
                permission !== undefined
        );
}

/**
 * Create a safe Discord ticket channel name.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function createTicketChannelName(user) {
    const safeUsername =
        user.username
            .toLowerCase()
            .replace(
                /[^a-z0-9-]/g,
                '-'
            )
            .replace(
                /-+/g,
                '-'
            )
            .replace(
                /^-|-$/g,
                ''
            )
            .slice(
                0,
                70
            );

    const username =
        safeUsername ||
        `soul-${user.id.slice(-6)}`;

    return (
        `${ticketConfig.channelPrefix}-` +
        `${username}`
    );
}

/**
 * Create a closed ticket channel name.
 *
 * @param {string} currentName
 * @returns {string}
 */
function createClosedTicketChannelName(
    currentName
) {
    const cleanName =
        currentName
            .replace(
                /^closed-/,
                ''
            )
            .slice(
                0,
                92
            );

    return `closed-${cleanName}`;
}

/**
 * Restore the original ticket channel name.
 *
 * @param {string} currentName
 * @returns {string}
 */
function createReopenedTicketChannelName(
    currentName
) {
    return currentName
        .replace(
            /^closed-/,
            ''
        )
        .slice(
            0,
            100
        );
}

/**
 * Create the topic stored inside a ticket channel.
 *
 * New tickets use the Umbra identity.
 *
 * @param {string} ownerId
 * @param {'open'|'closed'} status
 * @returns {string}
 */
function createTicketTopic(
    ownerId,
    status = 'open'
) {
    return (
        `Umbra Ticket | Owner: ${ownerId} | ` +
        `Status: ${status}`
    );
}

/**
 * Read ticket information from a channel topic.
 *
 * Both new Umbra topics and legacy DaviBot
 * topics are supported.
 *
 * @param {string|null} topic
 * @returns {{
 *   ownerId: string,
 *   status: 'open'|'closed'
 * }|null}
 */
function parseTicketTopic(topic) {
    if (!topic) {
        return null;
    }

    const match =
        topic.match(
            TICKET_OWNER_PATTERN
        );

    if (!match) {
        return null;
    }

    return {
        ownerId: match[1],
        status: match[2]
    };
}

/**
 * Find an existing open ticket belonging
 * to a Soul.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @returns {import('discord.js').TextChannel|null}
 */
function findOpenTicket(
    guild,
    userId
) {
    return (
        guild.channels.cache.find(
            channel => {
                if (
                    channel.type !==
                    ChannelType.GuildText
                ) {
                    return false;
                }

                const ticketData =
                    parseTicketTopic(
                        channel.topic
                    );

                return (
                    ticketData?.ownerId ===
                        userId &&
                    ticketData.status ===
                        'open'
                );
            }
        ) || null
    );
}

/**
 * Create the ticket panel button.
 *
 * @param {string} categoryId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createTicketPanelButtons(
    categoryId,
    staffRoleId
) {
    const createButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:create:${categoryId}:${staffRoleId}`
            )
            .setLabel(
                ticketConfig.panel
                    .buttonLabel
            )
            .setEmoji(
                ticketConfig.panel
                    .buttonEmoji
            )
            .setStyle(
                ButtonStyle.Primary
            );

    return new ActionRowBuilder()
        .addComponents(
            createButton
        );
}

/**
 * Create the button shown inside
 * an open ticket.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createOpenTicketButtons(
    ownerId,
    staffRoleId
) {
    const closeButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:close:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                ticketConfig.ticket
                    .closeButtonLabel
            )
            .setEmoji(
                ticketConfig.ticket
                    .closeButtonEmoji
            )
            .setStyle(
                ButtonStyle.Danger
            );

    return new ActionRowBuilder()
        .addComponents(
            closeButton
        );
}

/**
 * Create Close Ticket confirmation buttons.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createCloseConfirmationButtons(
    ownerId,
    staffRoleId
) {
    const confirmButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:confirm-close:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                'Confirm Close'
            )
            .setEmoji('✅')
            .setStyle(
                ButtonStyle.Danger
            );

    const cancelButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:cancel-close:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                'Cancel'
            )
            .setEmoji('❌')
            .setStyle(
                ButtonStyle.Secondary
            );

    return new ActionRowBuilder()
        .addComponents(
            confirmButton,
            cancelButton
        );
}

/**
 * Create buttons shown inside
 * a closed ticket.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createClosedTicketButtons(
    ownerId,
    staffRoleId
) {
    const reopenButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:reopen:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                'Reopen Ticket'
            )
            .setEmoji('🔓')
            .setStyle(
                ButtonStyle.Success
            );

    const deleteButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:delete:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                'Delete Ticket'
            )
            .setEmoji('🗑️')
            .setStyle(
                ButtonStyle.Danger
            );

    return new ActionRowBuilder()
        .addComponents(
            reopenButton,
            deleteButton
        );
}

/**
 * Create Delete Ticket confirmation buttons.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createDeleteConfirmationButtons(
    ownerId,
    staffRoleId
) {
    const confirmButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:confirm-delete:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                'Confirm Delete'
            )
            .setEmoji('✅')
            .setStyle(
                ButtonStyle.Danger
            );

    const cancelButton =
        new ButtonBuilder()
            .setCustomId(
                `ticket:cancel-delete:${ownerId}:${staffRoleId}`
            )
            .setLabel(
                'Cancel'
            )
            .setEmoji('❌')
            .setStyle(
                ButtonStyle.Secondary
            );

    return new ActionRowBuilder()
        .addComponents(
            confirmButton,
            cancelButton
        );
}

/**
 * Create permission overwrites
 * for a ticket channel.
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
            id:
                guild.roles.everyone.id,

            deny: [
                PermissionFlagsBits
                    .ViewChannel
            ]
        },
        {
            id:
                ownerId,

            allow:
                resolvePermissions(
                    ticketConfig
                        .permissions
                        .user
                )
        },
        {
            id:
                staffRoleId,

            allow:
                resolvePermissions(
                    ticketConfig
                        .permissions
                        .staff
                )
        },
        {
            id:
                botId,

            allow:
                resolvePermissions(
                    ticketConfig
                        .permissions
                        .bot
                )
        }
    ];
}

/**
 * Check whether a member belongs to
 * the configured Shadow Warden role.
 *
 * Administrators are also accepted.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {string} staffRoleId
 * @returns {boolean}
 */
function isTicketStaff(
    member,
    staffRoleId
) {
    if (!member) {
        return false;
    }

    return (
        member.permissions.has(
            PermissionFlagsBits
                .Administrator
        ) ||
        member.roles.cache.has(
            staffRoleId
        )
    );
}

module.exports = {
    createTicketChannelName,
    createClosedTicketChannelName,
    createReopenedTicketChannelName,
    createTicketTopic,
    parseTicketTopic,
    findOpenTicket,
    createTicketPanelButtons,
    createOpenTicketButtons,
    createCloseConfirmationButtons,
    createClosedTicketButtons,
    createDeleteConfirmationButtons,
    createTicketPermissionOverwrites,
    isTicketStaff
};