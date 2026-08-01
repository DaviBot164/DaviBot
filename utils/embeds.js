const {
    EmbedBuilder
} = require('discord.js');

const embedConfig =
    require('../config/embed');

/**
 * Create a standard Umbra embed.
 *
 * This is the shared foundation for:
 *
 * - Information
 * - Success
 * - Error
 * - Warning
 * - Moderation
 * - Soul Archives
 * - Arrancar Ranks
 * - Chronicle Titles
 * - Guardian
 * - Events
 * - Support
 *
 * @param {Object} options
 * @param {string} options.title
 * @param {string|null} [options.description]
 * @param {string} [options.color]
 * @param {Array<Object>} [options.fields]
 * @param {string|null} [options.thumbnail]
 * @param {string|null} [options.image]
 * @param {Object|null} [options.author]
 * @param {Object|null} [options.footer]
 * @param {boolean} [options.timestamp]
 * @returns {EmbedBuilder}
 */
function createEmbed({
    title,
    description = null,
    color = embedConfig.colors.primary,
    fields = [],
    thumbnail = null,
    image = null,
    author = null,
    footer = null,
    timestamp = true
}) {
    const embed =
        new EmbedBuilder()
            .setColor(
                color
            )
            .setTitle(
                title
            )
            .setFooter(
                footer || {
                    text:
                        embedConfig
                            .footer
                            .text
                }
            );

    if (timestamp) {
        embed.setTimestamp();
    }

    if (description) {
        embed.setDescription(
            description
        );
    }

    if (
        Array.isArray(
            fields
        ) &&
        fields.length > 0
    ) {
        embed.addFields(
            fields
        );
    }

    if (thumbnail) {
        embed.setThumbnail(
            thumbnail
        );
    }

    if (image) {
        embed.setImage(
            image
        );
    }

    if (author) {
        embed.setAuthor(
            author
        );
    }

    return embed;
}

/**
 * Create a successful action embed.
 *
 * @param {string} title
 * @param {string} description
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(
    title,
    description
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .success
    });
}

/**
 * Create an error embed.
 *
 * @param {string} title
 * @param {string} description
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(
    title,
    description
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .error
    });
}

/**
 * Create a warning embed.
 *
 * @param {string} title
 * @param {string} description
 * @returns {EmbedBuilder}
 */
function createWarningEmbed(
    title,
    description
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .warning
    });
}

/**
 * Create a Soul Archive embed.
 *
 * @param {string} title
 * @param {string} description
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createArchiveEmbed(
    title,
    description,
    options = {}
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .archive,

        ...options
    });
}

/**
 * Create an Arrancar Rank embed.
 *
 * @param {string} title
 * @param {string} description
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createRankEmbed(
    title,
    description,
    options = {}
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .rank,

        ...options
    });
}

/**
 * Create a Chronicle Title embed.
 *
 * @param {string} title
 * @param {string} description
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createTitleEmbed(
    title,
    description,
    options = {}
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .title,

        ...options
    });
}

/**
 * Create a Guardian or AutoMod embed.
 *
 * @param {string} title
 * @param {string} description
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createGuardianEmbed(
    title,
    description,
    options = {}
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .guardian,

        ...options
    });
}

/**
 * Create an Event embed.
 *
 * @param {string} title
 * @param {string} description
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createEventEmbed(
    title,
    description,
    options = {}
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .event,

        ...options
    });
}

/**
 * Create a Support or Ticket embed.
 *
 * @param {string} title
 * @param {string} description
 * @param {Object} [options]
 * @returns {EmbedBuilder}
 */
function createSupportEmbed(
    title,
    description,
    options = {}
) {
    return createEmbed({
        title,
        description,

        color:
            embedConfig
                .colors
                .support,

        ...options
    });
}

/**
 * Create an Umbra moderation action embed.
 *
 * Used for actions such as:
 *
 * - Warn
 * - Kick
 * - Ban
 * - Timeout
 * - Untimeout
 *
 * @param {Object} options
 * @param {string} options.action
 * @param {import('discord.js').User} options.user
 * @param {import('discord.js').User} options.moderator
 * @param {string} options.reason
 * @param {string|null} [options.duration]
 * @returns {EmbedBuilder}
 */
function createModerationEmbed({
    action,
    user,
    moderator,
    reason,
    duration = null
}) {
    const executedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    const fields = [
        {
            name:
                '🌙 Soul',

            value:
                `${user.tag}\n` +
                `\`${user.id}\``,

            inline:
                true
        },
        {
            name:
                '🛡️ Moderator',

            value:
                `${moderator.tag}\n` +
                `\`${moderator.id}\``,

            inline:
                true
        }
    ];

    if (duration) {
        fields.push({
            name:
                '⏳ Duration',

            value:
                duration,

            inline:
                true
        });
    }

    fields.push(
        {
            name:
                '📜 Reason',

            value:
                reason ||
                'No reason was provided.',

            inline:
                false
        },
        {
            name:
                '🕒 Executed At',

            value:
                `<t:${executedAt}:F>\n` +
                `(<t:${executedAt}:R>)`,

            inline:
                false
        }
    );

    return createEmbed({
        title:
            action,

        color:
            embedConfig
                .colors
                .moderation,

        description:
            [
                'Umbra has recorded an official moderation action within Las Noches.',
                '',
                embedConfig
                    .branding
                    .divider
            ].join('\n'),

        thumbnail:
            user.displayAvatarURL({
                extension:
                    'png',

                size:
                    256,

                forceStatic:
                    false
            }),

        fields
    });
}

/**
 * Create an Umbra channel moderation embed.
 *
 * Used for actions such as:
 *
 * - Lock
 * - Unlock
 * - Slowmode
 *
 * @param {Object} options
 * @param {string} options.action
 * @param {import('discord.js').GuildChannel} options.channel
 * @param {import('discord.js').User} options.moderator
 * @param {string} options.reason
 * @returns {EmbedBuilder}
 */
function createChannelModerationEmbed({
    action,
    channel,
    moderator,
    reason
}) {
    const executedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    return createEmbed({
        title:
            action,

        color:
            embedConfig
                .colors
                .moderation,

        description:
            [
                `${channel} has been updated by the Las Noches moderation system.`,
                '',
                embedConfig
                    .branding
                    .divider,
                '',
                '*Umbra has preserved this action inside the official moderation archives.*'
            ].join('\n'),

        fields: [
            {
                name:
                    '📺 Channel',

                value:
                    `${channel}\n` +
                    `\`${channel.id}\``,

                inline:
                    true
            },
            {
                name:
                    '🛡️ Moderator',

                value:
                    `${moderator}\n` +
                    `\`${moderator.id}\``,

                inline:
                    true
            },
            {
                name:
                    '🏰 Server',

                value:
                    `${channel.guild.name}\n` +
                    `\`${channel.guild.id}\``,

                inline:
                    false
            },
            {
                name:
                    '📜 Reason',

                value:
                    reason ||
                    'No reason was provided.',

                inline:
                    false
            },
            {
                name:
                    '🕒 Executed At',

                value:
                    `<t:${executedAt}:F>\n` +
                    `(<t:${executedAt}:R>)`,

                inline:
                    false
            }
        ]
    });
}

module.exports = {
    createEmbed,

    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,

    createArchiveEmbed,
    createRankEmbed,
    createTitleEmbed,
    createGuardianEmbed,
    createEventEmbed,
    createSupportEmbed,

    createModerationEmbed,
    createChannelModerationEmbed
};