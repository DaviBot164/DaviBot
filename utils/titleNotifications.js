const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const TITLE_RARITY_COLORS = {
    Common:
        '#B8B8B8',

    Uncommon:
        '#57F287',

    Rare:
        '#5865F2',

    Epic:
        '#9B59B6',

    Legendary:
        '#D4AF37',

    Mythic:
        '#ED4245'
};

const TITLE_RARITY_ICONS = {
    Common:
        '⚪',

    Uncommon:
        '🟢',

    Rare:
        '🔵',

    Epic:
        '🟣',

    Legendary:
        '🟡',

    Mythic:
        '🔴'
};

const DEFAULT_TITLE_COLOR =
    '#5B3A78';

const MAX_DISPLAYED_TITLES =
    5;

/**
 * Get a Title rarity color.
 *
 * @param {string|null|undefined} rarity
 * @returns {string}
 */
function getTitleRarityColor(
    rarity
) {
    return (
        TITLE_RARITY_COLORS[
            rarity
        ] ||
        DEFAULT_TITLE_COLOR
    );
}

/**
 * Get a Title rarity icon.
 *
 * @param {string|null|undefined} rarity
 * @returns {string}
 */
function getTitleRarityIcon(
    rarity
) {
    return (
        TITLE_RARITY_ICONS[
            rarity
        ] ||
        '◆'
    );
}

/**
 * Format one unlocked Title.
 *
 * @param {Object} title
 * @returns {string}
 */
function formatUnlockedTitle(
    title
) {
    const displayName =
        title?.displayName ||
        title?.name ||
        'Unknown Title';

    const rarity =
        title?.rarity ||
        'Common';

    return (
        `${getTitleRarityIcon(
            rarity
        )} **${displayName}**\n` +
        `-# ${rarity}`
    );
}

/**
 * Use the rarest unlocked Title
 * as the notification color.
 *
 * @param {Object[]} titles
 * @returns {string}
 */
function getNotificationColor(
    titles
) {
    const rarityPriority = [
        'Mythic',
        'Legendary',
        'Epic',
        'Rare',
        'Uncommon',
        'Common'
    ];

    for (
        const rarity
        of rarityPriority
    ) {
        if (
            titles.some(
                title =>
                    title?.rarity ===
                    rarity
            )
        ) {
            return getTitleRarityColor(
                rarity
            );
        }
    }

    return DEFAULT_TITLE_COLOR;
}

/**
 * Create a compact Title
 * unlock notification.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {Object[]} options.titles
 * @returns {EmbedBuilder|null}
 */
function createTitleUnlockEmbed({
    member,
    titles
}) {
    if (
        !member ||
        !Array.isArray(
            titles
        ) ||
        titles.length ===
            0
    ) {
        return null;
    }

    const visibleTitles =
        titles.slice(
            0,
            MAX_DISPLAYED_TITLES
        );

    const hiddenTitleCount =
        Math.max(
            0,
            titles.length -
            visibleTitles.length
        );

    const titleList =
        visibleTitles
            .map(
                formatUnlockedTitle
            )
            .join(
                '\n\n'
            );

    const extraText =
        hiddenTitleCount > 0
            ? `\n\n-# +${hiddenTitleCount} more`
            : '';

    return new EmbedBuilder()
        .setColor(
            getNotificationColor(
                titles
            )
        )
        .setAuthor({
            name:
                'Evelynn • Title Unlocked',

            iconURL:
                member.user
                    .displayAvatarURL({
                        size:
                            128,

                        forceStatic:
                            false
                    })
        })
        .setTitle(
            titles.length ===
                1
                ? '♜・NEW TITLE'
                : `♜・${titles.length} NEW TITLES`
        )
        .setDescription(
            `${member} earned new recognition.\n\n${titleList}${extraText}`
        )
        .setThumbnail(
            member.user
                .displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
        )
        .setFooter({
            text:
                'TTS • Titles'
        })
        .setTimestamp();
}

/**
 * Check whether the bot can
 * send a Title notification.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').GuildMember|null} botMember
 * @returns {boolean}
 */
function canSendTitleNotification(
    channel,
    botMember
) {
    if (
        !channel ||
        !channel.isTextBased() ||
        !botMember
    ) {
        return false;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    return Boolean(
        permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    );
}

/**
 * Send a Title unlock notification.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').GuildTextBasedChannel} options.channel
 * @param {Object[]} options.titles
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function sendTitleUnlockNotification({
    member,
    channel,
    titles
}) {
    if (
        !member ||
        !channel ||
        !Array.isArray(
            titles
        ) ||
        titles.length ===
            0
    ) {
        return null;
    }

    const botMember =
        member.guild.members.me;

    if (
        !canSendTitleNotification(
            channel,
            botMember
        )
    ) {
        console.warn(
            `⚠️ Evelynn cannot send a Title notification in channel ${channel.id}.`
        );

        return null;
    }

    const embed =
        createTitleUnlockEmbed({
            member,
            titles
        });

    if (!embed) {
        return null;
    }

    try {
        return await channel.send({
            embeds: [
                embed
            ],

            allowedMentions: {
                parse:
                    []
            }
        });
    } catch (error) {
        console.error(
            `❌ Title notification failed for ${member.user.tag}:`,
            error
        );

        return null;
    }
}

module.exports = {
    TITLE_RARITY_COLORS,
    TITLE_RARITY_ICONS,

    getTitleRarityColor,
    getTitleRarityIcon,
    formatUnlockedTitle,
    getNotificationColor,

    createTitleUnlockEmbed,
    canSendTitleNotification,
    sendTitleUnlockNotification
};