const { EmbedBuilder } = require('discord.js');
const embedConfig = require('../config/embed');

/**
 * Create a standard DaviBot embed.
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

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
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
function createSuccessEmbed(title, description) {
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
function createErrorEmbed(title, description) {
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
function createWarningEmbed(title, description) {
    return createEmbed({
        title,
        description,
        color: embedConfig.colors.warning
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
    const executedAt = Math.floor(Date.now() / 1000);

    const fields = [
        {
            name: '👤 User',
            value: `${user.tag}\n\`${user.id}\``,
            inline: true
        },
        {
            name: '👮 Moderator',
            value: `${moderator.tag}\n\`${moderator.id}\``,
            inline: true
        },
        {
            name: '📝 Reason',
            value: reason,
            inline: false
        },
        {
            name: '🕒 Executed At',
            value: `<t:${executedAt}:F>`,
            inline: false
        }
    ];

    if (duration) {
        fields.splice(2, 0, {
            name: '⏱️ Duration',
            value: duration,
            inline: true
        });
    }

    return createEmbed({
        title: action,
        color: embedConfig.colors.moderation,
        thumbnail: user.displayAvatarURL({
            size: 256
        }),
        fields
    });
}

/**
 * Create an embed for channel moderation actions.
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
    const executedAt = Math.floor(Date.now() / 1000);

    return createEmbed({
        title: action,
        color: embedConfig.colors.moderation,

        description:
            `${channel} has been updated successfully.`,

        fields: [
            {
                name: '📺 Channel',
                value:
                    `${channel}\n\`${channel.id}\``,
                inline: true
            },
            {
                name: '👮 Moderator',
                value:
                    `${moderator}\n\`${moderator.id}\``,
                inline: true
            },
            {
                name: '🏠 Server',
                value:
                    `${channel.guild.name}\n` +
                    `\`${channel.guild.id}\``,
                inline: false
            },
            {
                name: '📝 Reason',
                value: reason,
                inline: false
            },
            {
                name: '🕒 Executed At',
                value: `<t:${executedAt}:F>`,
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