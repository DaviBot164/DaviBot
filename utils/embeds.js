const {
    EmbedBuilder
} = require('discord.js');

const embedConfig =
    require('../config/embed');

/**
 * Create a standard shared embed.
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

    if (
        timestamp
    ) {
        embed.setTimestamp();
    }

    if (
        description
    ) {
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

    if (
        thumbnail
    ) {
        embed.setThumbnail(
            thumbnail
        );
    }

    if (
        image
    ) {
        embed.setImage(
            image
        );
    }

    if (
        author
    ) {
        embed.setAuthor(
            author
        );
    }

    return embed;
}

/**
 * Create a success embed.
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
 * Create a moderation action embed.
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
    const fields = [
        {
            name:
                '✦・MEMBER',

            value:
                `${user}\n\`${user.id}\``,

            inline:
                true
        },

        {
            name:
                '🛡️・MODERATOR',

            value:
                `${moderator}\n\`${moderator.id}\``,

            inline:
                true
        }
    ];

    if (
        duration
    ) {
        fields.push({
            name:
                '⏳・DURATION',

            value:
                duration,

            inline:
                true
        });
    }

    fields.push({
        name:
            '📜・REASON',

        value:
            reason ||
            'No reason provided.',

        inline:
            false
    });

    return createEmbed({
        title:
            action,

        color:
            embedConfig
                .colors
                .moderation,

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
 * Create a channel moderation embed.
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
    return createEmbed({
        title:
            action,

        color:
            embedConfig
                .colors
                .moderation,

        fields: [
            {
                name:
                    '📺・CHANNEL',

                value:
                    `${channel}\n\`${channel.id}\``,

                inline:
                    true
            },

            {
                name:
                    '🛡️・MODERATOR',

                value:
                    `${moderator}\n\`${moderator.id}\``,

                inline:
                    true
            },

            {
                name:
                    '📜・REASON',

                value:
                    reason ||
                    'No reason provided.',

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

    createModerationEmbed,
    createChannelModerationEmbed
};