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
 * Recognize current and legacy
 * ticket channel topics.
 *
 * Legacy support keeps existing
 * tickets functional after rebrands.
 */
const TICKET_OWNER_PATTERN =
    /(?:Evelynn|Umbra|Seraphiel) Ticket \| Owner: (\d+) \| Status: (open|closed)/;

/**
 * Convert configured permission names
 * into Discord permission values.
 *
 * @param {string[]} permissionNames
 * @returns {bigint[]}
 */
function resolvePermissions(
    permissionNames
) {
    if (
        !Array.isArray(
            permissionNames
        )
    ) {
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
                permission !==
                undefined
        );
}

/**
 * Create a safe ticket channel name.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function createTicketChannelName(
    user
) {
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
        `user-${user.id.slice(-6)}`;

    return (
        `${ticketConfig.channelPrefix}-` +
        `${username}`
    );
}

/**
 * Create a closed ticket
 * channel name.
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
 * Restore an open ticket
 * channel name.
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
 * Create the internal ticket topic.
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
        `Evelynn Ticket | Owner: ${ownerId} | ` +
        `Status: ${status}`
    );
}

/**
 * Parse ticket information
 * from a channel topic.
 *
 * @param {string|null} topic
 * @returns {{
 *     ownerId: string,
 *     status: 'open'|'closed'
 * }|null}
 */
function parseTicketTopic(
    topic
) {
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
        ownerId:
            match[1],

        status:
            match[2]
    };
}

/**
 * Find an existing open ticket.
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
        ) ||
        null
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
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `ticket:create:${categoryId}:${staffRoleId}`
                )
                .setLabel(
                    ticketConfig
                        .panel
                        .buttonLabel
                )
                .setEmoji(
                    ticketConfig
                        .panel
                        .buttonEmoji
                )
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

/**
 * Create the open ticket controls.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createOpenTicketButtons(
    ownerId,
    staffRoleId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `ticket:close:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    ticketConfig
                        .ticket
                        .closeButtonLabel
                )
                .setEmoji(
                    ticketConfig
                        .ticket
                        .closeButtonEmoji
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

/**
 * Create close confirmation controls.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createCloseConfirmationButtons(
    ownerId,
    staffRoleId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `ticket:confirm-close:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    'Confirm Close'
                )
                .setEmoji(
                    '✅'
                )
                .setStyle(
                    ButtonStyle.Danger
                ),

            new ButtonBuilder()
                .setCustomId(
                    `ticket:cancel-close:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    'Cancel'
                )
                .setEmoji(
                    '❌'
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}/**
 * Create closed ticket controls.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createClosedTicketButtons(
    ownerId,
    staffRoleId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `ticket:reopen:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    'Reopen Ticket'
                )
                .setEmoji(
                    '🔓'
                )
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    `ticket:delete:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    'Delete Ticket'
                )
                .setEmoji(
                    '🗑️'
                )
                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

/**
 * Create delete confirmation controls.
 *
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {ActionRowBuilder}
 */
function createDeleteConfirmationButtons(
    ownerId,
    staffRoleId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `ticket:confirm-delete:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    'Confirm Delete'
                )
                .setEmoji(
                    '✅'
                )
                .setStyle(
                    ButtonStyle.Danger
                ),

            new ButtonBuilder()
                .setCustomId(
                    `ticket:cancel-delete:${ownerId}:${staffRoleId}`
                )
                .setLabel(
                    'Cancel'
                )
                .setEmoji(
                    '❌'
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

/**
 * Create ticket channel
 * permission overwrites.
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
 * Check ticket staff access.
 *
 * Administrators are always allowed.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {string} staffRoleId
 * @returns {boolean}
 */
function isTicketStaff(
    member,
    staffRoleId
) {
    if (
        !member
    ) {
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
    TICKET_OWNER_PATTERN,

    resolvePermissions,

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