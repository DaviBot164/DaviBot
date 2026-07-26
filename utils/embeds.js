const {
    EmbedBuilder
} = require('discord.js');

const embedConfig =
    require('../config/embed');

/**
 * Create a standard Umbra embed.
 *
 * This function is used as the foundation
 * for Umbra's information, moderation,
 * warning, success and error embeds.
 *
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.description]
 * @param {string} [options.color]
 * @param {Array} [options.fields]
 * @param {string} [options.thumbnail]
 * @returns {EmbedBuilder}
 */
function createEmbed({
    title,
    description = null,
    color = embedConfig.colors.primary,
    fields = [],
    thumbnail = null
}) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setFooter({
            text: embedConfig.footer.text
        })
        .setTimestamp();

    if (description) {
        embed.setDescription(description);
    }

    if (
        Array.isArray(fields) &&
        fields.length > 0
    ) {
        embed.addFields(fields);
    }

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
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
        color: embedConfig.colors.success
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
        color: embedConfig.colors.error
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
        color: embedConfig.colors.warning
    });
}

/**
 * Create an Umbra moderation action embed.
 *
 * Used for actions such as:
 * warn, kick, ban, timeout and untimeout.
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
    const executedAt = Math.floor(
        Date.now() / 1_000
    );

    const fields = [
        {
            name: '🌑 Soul',
            value:
                `${user.tag}\n` +
                `\`${user.id}\``,
            inline: true
        },
        {
            name: '🛡️ Shadow Warden',
            value:
                `${moderator.tag}\n` +
                `\`${moderator.id}\``,
            inline: true
        },
        {
            name: '📜 Reason',
            value:
                reason ||
                'No reason was provided.',
            inline: false
        },
        {
            name: '🕒 Executed At',
            value:
                `<t:${executedAt}:F>\n` +
                `(<t:${executedAt}:R>)`,
            inline: false
        }
    ];

    if (duration) {
        fields.splice(
            2,
            0,
            {
                name: '⏳ Duration',
                value: duration,
                inline: true
            }
        );
    }

    return createEmbed({
        title: action,
        color:
            embedConfig.colors.moderation,

        thumbnail:
            user.displayAvatarURL({
                extension: 'png',
                size: 256
            }),

        fields
    });
}

/**
 * Create an Umbra channel moderation embed.
 *
 * Used for actions such as:
 * lock, unlock and slowmode.
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
    const executedAt = Math.floor(
        Date.now() / 1_000
    );

    return createEmbed({
        title: action,

        color:
            embedConfig.colors.moderation,

        description:
            [
                `The Order has updated ${channel}.`,
                '',
                'Umbra has recorded this action beneath the crimson moon.'
            ].join('\n'),

        fields: [
            {
                name: '🌑 Channel',
                value:
                    `${channel}\n` +
                    `\`${channel.id}\``,
                inline: true
            },
            {
                name: '🛡️ Shadow Warden',
                value:
                    `${moderator}\n` +
                    `\`${moderator.id}\``,
                inline: true
            },
            {
                name: '🏰 Order',
                value:
                    `${channel.guild.name}\n` +
                    `\`${channel.guild.id}\``,
                inline: false
            },
            {
                name: '📜 Reason',
                value:
                    reason ||
                    'No reason was provided.',
                inline: false
            },
            {
                name: '🕒 Executed At',
                value:
                    `<t:${executedAt}:F>\n` +
                    `(<t:${executedAt}:R>)`,
                inline: false
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