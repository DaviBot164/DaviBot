const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

/**
 * Title rarity colors.
 */
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

/**
 * Title rarity icons.
 */
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

/**
 * Default Las Noches Title color.
 */
const DEFAULT_TITLE_COLOR =
    '#D4AF37';

/**
 * Maximum number of Titles displayed
 * inside one notification.
 */
const MAX_DISPLAYED_TITLES =
    10;

/**
 * Return a valid Title rarity color.
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
 * Return a readable rarity icon.
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
        '🏷️'
    );
}

/**
 * Safely format one unlocked Title.
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
        'Unknown Chronicle Title';

    const rarity =
        title?.rarity ||
        'Unknown';

    const category =
        title?.category ||
        'Unknown';

    const description =
        title?.description ||
        'No Chronicle description is available.';

    return [
        `${getTitleRarityIcon(rarity)} **${displayName}**`,
        `-# ${rarity} • ${category}`,
        `-# ${description}`
    ].join('\n');
}

/**
 * Determine the notification color.
 *
 * When multiple Titles unlock together,
 * the rarest Title determines the color.
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
        const matchingTitle =
            titles.find(
                title =>
                    title?.rarity ===
                    rarity
            );

        if (matchingTitle) {
            return getTitleRarityColor(
                rarity
            );
        }
    }

    return DEFAULT_TITLE_COLOR;
}

/**
 * Create a Chronicle Title unlock Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {Object[]} options.titles
 * @param {string} [options.source]
 * @returns {EmbedBuilder|null}
 */
function createTitleUnlockEmbed({
    member,
    titles,
    source = 'Soul progression'
}) {
    if (
        !member ||
        !Array.isArray(
            titles
        ) ||
        titles.length === 0
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
                '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
            );

    const titleWord =
        titles.length === 1
            ? 'Title'
            : 'Titles';

    const embed =
        new EmbedBuilder()
            .setColor(
                getNotificationColor(
                    titles
                )
            )
            .setAuthor({
                name:
                    `${member.displayName} • Soul Archives`,

                iconURL:
                    member.user
                        .displayAvatarURL({
                            size:
                                256,

                            forceStatic:
                                false
                        })
            })
            .setTitle(
                titles.length === 1
                    ? '🏷️ New Chronicle Title Unlocked'
                    : `🏷️ ${titles.length} Chronicle Titles Unlocked`
            )
            .setDescription(
                [
                    `${member} has earned new recognition within Las Noches.`,
                    '',
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                    '',
                    '*Umbra has permanently preserved this designation inside the Soul Archives.*'
                ].join('\n')
            )
            .addFields(
                {
                    name:
                        `📖 Unlocked ${titleWord}`,

                    value:
                        [
                            titleList,

                            hiddenTitleCount > 0
                                ? `\n-# +${hiddenTitleCount} additional Titles were recorded.`
                                : null
                        ]
                            .filter(
                                Boolean
                            )
                            .join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌙 Unlock Source',

                    value:
                        source,

                    inline:
                        true
                },
                {
                    name:
                        '⚔️ Activation',

                    value:
                        [
                            'Use `/settitle` to select one of your unlocked Titles.',
                            '',
                            '-# Unlocking a Title does not automatically replace the currently active Title.'
                        ].join('\n'),

                    inline:
                        false
                }
            )
            .setThumbnail(
                member.user
                    .displayAvatarURL({
                        size:
                            1024,

                        forceStatic:
                            false
                    })
            )
            .setFooter({
                text:
                    '🌙 Umbra • Guardian of Las Noches'
            })
            .setTimestamp();

    return embed;
}

/**
 * Check whether Umbra may send messages
 * and embeds in a channel.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').GuildMember} botMember
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

    if (!permissions) {
        return false;
    }

    return (
        permissions.has(
            PermissionFlagsBits.ViewChannel
        ) &&
        permissions.has(
            PermissionFlagsBits.SendMessages
        ) &&
        permissions.has(
            PermissionFlagsBits.EmbedLinks
        )
    );
}

/**
 * Send a Chronicle Title notification.
 *
 * The notification is intentionally
 * non-fatal. A failed notification must
 * never interrupt XP, Achievement,
 * Rank or Title database operations.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').GuildTextBasedChannel} options.channel
 * @param {Object[]} options.titles
 * @param {string} [options.source]
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function sendTitleUnlockNotification({
    member,
    channel,
    titles,
    source = 'Soul progression'
}) {
    if (
        !member ||
        !channel ||
        !Array.isArray(
            titles
        ) ||
        titles.length === 0
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
            `⚠️ Umbra cannot send a Title notification in channel ${channel.id}.`
        );

        return null;
    }

    const embed =
        createTitleUnlockEmbed({
            member,
            titles,
            source
        });

    if (!embed) {
        return null;
    }

    try {
        return await channel.send({
            content:
                `${member}`,

            embeds: [
                embed
            ],

            allowedMentions: {
                users: [
                    member.id
                ]
            }
        });
    } catch (error) {
        console.error(
            `⚠️ Umbra could not send a Title notification for ${member.user.tag}:`
        );

        console.error(
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