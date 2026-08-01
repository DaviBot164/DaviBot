const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    TITLE_DEFINITIONS,
    TITLE_UNLOCK_TYPES
} = require('../../config/titles');

const {
    titles:
        titleDatabase
} = require('../../database');

const {
    sendTitleUnlockNotification
} = require('../../utils/titleNotifications');

/**
 * Las Noches High Command roles allowed
 * to grant Manual and Event Titles.
 *
 * Lieutenants are intentionally excluded.
 */
const TITLE_MANAGER_ROLES = [
    '👑 Ruler of Las Noches',
    '⚜️ Head Captain',
    '🛡️ Captain'
];

/**
 * Official channel used for important
 * Title proclamations.
 */
const TITLE_ANNOUNCEMENT_CHANNEL_NAME =
    '🏅・hall-of-promotions';

/**
 * Title grant embed color.
 */
const TITLE_GRANT_COLOR =
    '#D4AF37';

/**
 * Title unlock types that may be granted
 * manually through /granttitle.
 *
 * Automatic Titles such as Level,
 * Achievement, Evolution, Staff and
 * Arrancar Rank cannot be granted here.
 */
const GRANTABLE_UNLOCK_TYPES = [
    TITLE_UNLOCK_TYPES.MANUAL,
    TITLE_UNLOCK_TYPES.EVENT
];

/**
 * Every Title that may be manually granted
 * through the /granttitle command.
 */
const GRANTABLE_TITLES =
    TITLE_DEFINITIONS.filter(
        title =>
            GRANTABLE_UNLOCK_TYPES.includes(
                title.unlock?.type
            )
    );

/**
 * Slash-command choices generated from
 * configured Manual and Event Titles.
 */
const GRANTABLE_TITLE_CHOICES =
    GRANTABLE_TITLES.map(
        title => ({
            name:
                String(
                    title.displayName ||
                    title.name
                ).slice(
                    0,
                    100
                ),

            value:
                title.id
        })
    );

/**
 * Check whether the command executor
 * belongs to the Las Noches High Command.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function canManageTitles(
    member
) {
    if (!member) {
        return false;
    }

    if (
        member.id ===
        member.guild.ownerId
    ) {
        return true;
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return true;
    }

    return member.roles.cache.some(
        role =>
            TITLE_MANAGER_ROLES.includes(
                role.name
            )
    );
}

/**
 * Find one grantable Title definition
 * using its internal Title ID.
 *
 * @param {string} titleId
 * @returns {Object|null}
 */
function findGrantableTitle(
    titleId
) {
    return (
        GRANTABLE_TITLES.find(
            title =>
                title.id ===
                titleId
        ) ||
        null
    );
}

/**
 * Find the official Title announcement
 * channel inside Las Noches.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findTitleAnnouncementChannel(
    guild
) {
    const channel =
        guild.channels.cache.find(
            cachedChannel =>
                cachedChannel.name ===
                    TITLE_ANNOUNCEMENT_CHANNEL_NAME &&
                cachedChannel.isTextBased()
        );

    return (
        channel ||
        null
    );
}

/**
 * Find a safe destination for the dedicated
 * Title Unlock notification.
 *
 * Priority:
 * 1. Hall of Promotions
 * 2. Current command channel
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findNotificationChannel(
    interaction
) {
    const announcementChannel =
        findTitleAnnouncementChannel(
            interaction.guild
        );

    if (announcementChannel) {
        return announcementChannel;
    }

    if (
        interaction.channel &&
        interaction.channel.isTextBased()
    ) {
        return interaction.channel;
    }

    return null;
}

/**
 * Format one Discord timestamp.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    const date =
        value instanceof Date
            ? value
            : new Date(
                value ||
                Date.now()
            );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Not recorded';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return [
        `<t:${unixTimestamp}:F>`,
        `-# <t:${unixTimestamp}:R>`
    ].join('\n');
}

/**
 * Return a readable source label for
 * one grantable Title definition.
 *
 * @param {Object} titleDefinition
 * @returns {string}
 */
function getGrantTypeDisplay(
    titleDefinition
) {
    if (
        titleDefinition?.unlock?.type ===
        TITLE_UNLOCK_TYPES.EVENT
    ) {
        return '🎮 Official Event Title';
    }

    return '👑 High Command Title';
}

/**
 * Create the official Title grant
 * proclamation embed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').User} options.moderator
 * @param {Object} options.title
 * @param {string} options.reason
 * @param {boolean} options.activated
 * @returns {import('discord.js').EmbedBuilder}
 */
function createTitleGrantEmbed({
    member,
    moderator,
    title,
    reason,
    activated
}) {
    const grantedAt =
        title.unlockedAt ||
        new Date();

    return createEmbed({
        title:
            '🏷️ Chronicle Title Proclamation',

        description:
            [
                `${member} has received a special designation from the High Command of Las Noches.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Umbra has permanently preserved this proclamation within the Soul Archives.*'
            ].join('\n'),

        color:
            TITLE_GRANT_COLOR,

        thumbnail:
            member.user.displayAvatarURL({
                size:
                    1024,

                forceStatic:
                    false
            }),

        fields: [
            {
                name:
                    '🌙 Soul',

                value:
                    `${member}\n` +
                    `\`${member.id}\``,

                inline:
                    true
            },
            {
                name:
                    '👑 High Command',

                value:
                    `${moderator}\n` +
                    `\`${moderator.id}\``,

                inline:
                    true
            },
            {
                name:
                    '🏷️ Granted Title',

                value:
                    `**${title.displayName}**`,

                inline:
                    false
            },
            {
                name:
                    '📚 Classification',

                value:
                    [
                        `**Category:** ${title.category}`,
                        `**Rarity:** ${title.rarity}`,
                        `**Source:** ${getGrantTypeDisplay(title)}`
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '⚔️ Activation Status',

                value:
                    activated
                        ? '👑 Activated immediately'
                        : '📖 Unlocked and available through `/settitle`',

                inline:
                    true
            },
            {
                name:
                    '🕒 Granted At',

                value:
                    formatDiscordDate(
                        grantedAt
                    ),

                inline:
                    false
            },
            {
                name:
                    '📖 Reason',

                value:
                    reason,

                inline:
                    false
            },
            {
                name:
                    '🌑 Chronicle Description',

                value:
                    title.description,

                inline:
                    false
            }
        ],

        footer: {
            text:
                '🌙 Umbra • Guardian of Las Noches'
        }
    });
}

module.exports = {
    category:
        'moderation',

    data:
        new SlashCommandBuilder()
            .setName(
                'granttitle'
            )
            .setDescription(
                'Grant a special Manual or Event Title to a Soul.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul receiving the Title'
                    )
                    .setRequired(
                        true
                    )
            )

            .addStringOption(option =>
                option
                    .setName(
                        'title'
                    )
                    .setDescription(
                        'Select the special Chronicle Title'
                    )
                    .setRequired(
                        true
                    )
                    .addChoices(
                        ...GRANTABLE_TITLE_CHOICES
                    )
            )

            .addStringOption(option =>
                option
                    .setName(
                        'reason'
                    )
                    .setDescription(
                        'Reason for granting this Chronicle Title'
                    )
                    .setMinLength(
                        2
                    )
                    .setMaxLength(
                        500
                    )
                    .setRequired(
                        true
                    )
            )

            .addBooleanOption(option =>
                option
                    .setName(
                        'activate'
                    )
                    .setDescription(
                        'Immediately set the granted Title as the Soul’s active Title'
                    )
                    .setRequired(
                        false
                    )
            )

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .setDMPermission(
                false
            ),    /**
     * Execute the /granttitle command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Las Noches Only Command',
                            'This command can only be used inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const executor =
                interaction.member;

            if (
                !canManageTitles(
                    executor
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ High Command Required',
                            [
                                'Only the Las Noches High Command may grant special Chronicle Titles.',
                                '',
                                'Required standing:',
                                '• 👑 Ruler of Las Noches',
                                '• ⚜️ Head Captain',
                                '• 🛡️ Captain'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const member =
                interaction.options.getMember(
                    'user'
                );

            const titleId =
                interaction.options.getString(
                    'title',
                    true
                );

            const reason =
                interaction.options.getString(
                    'reason',
                    true
                );

            const activate =
                interaction.options.getBoolean(
                    'activate'
                ) ??
                false;

            if (!member) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'The selected Soul is not currently inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                member.user.bot
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Soul',
                            'Chronicle Titles cannot be granted to Discord bots.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                member.id ===
                    interaction.guild.ownerId &&
                interaction.user.id !==
                    interaction.guild.ownerId
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Protected Soul',
                            'Only the server owner may grant a special Title to the owner’s Soul Record.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const titleDefinition =
                findGrantableTitle(
                    titleId
                );

            if (!titleDefinition) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Chronicle Title',
                            [
                                'The selected Title cannot be granted manually.',
                                '',
                                'Only Manual and Event Titles may be assigned through `/granttitle`.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            /*
             * Ensure the default Title exists
             * before applying a special grant.
             */
            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            const alreadyUnlocked =
                await titleDatabase
                    .hasSoulTitle(
                        interaction.guild.id,
                        member.id,
                        titleId
                    );

            if (alreadyUnlocked) {
                const existingTitle =
                    await titleDatabase
                        .getSoulTitle(
                            interaction.guild.id,
                            member.id,
                            titleId
                        );

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Already Unlocked',
                            [
                                `${member} already owns **${existingTitle?.displayName || titleDefinition.displayName}**.`,
                                '',
                                'Use `/settitle` if this Soul wants to activate it.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            let grantResult;

            try {
                grantResult =
                    await titleDatabase
                        .unlockSoulTitle({
                            guildId:
                                interaction.guild.id,

                            userId:
                                member.id,

                            titleId,

                            unlockedBy:
                                interaction.user.id,

                            unlockSource:
                                titleDefinition.unlock.type ===
                                    TITLE_UNLOCK_TYPES.EVENT
                                    ? 'EVENT_GRANT'
                                    : 'MANUAL_GRANT',

                            activate
                        });
            } catch (databaseError) {
                console.error(
                    '❌ Umbra could not grant the Chronicle Title:',
                    databaseError
                );

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Archive Failed',
                            [
                                'Umbra could not save this Chronicle Title inside PostgreSQL.',
                                '',
                                'Please inspect the Northflank database logs before trying again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            if (
                !grantResult?.title
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Grant Failed',
                            'Umbra could not create the requested Chronicle Title record.'
                        )
                    ]
                });

                return;
            }

            const grantedTitle =
                grantResult.title;

            const grantEmbed =
                createTitleGrantEmbed({
                    member,

                    moderator:
                        interaction.user,

                    title:
                        grantedTitle,

                    reason,

                    activated:
                        Boolean(
                            activate &&
                            grantedTitle.isActive
                        )
                });

            await interaction.editReply({
                embeds: [
                    grantEmbed
                ]
            });            const announcementChannel =
                findTitleAnnouncementChannel(
                    interaction.guild
                );

            if (
                announcementChannel &&
                announcementChannel.id !==
                    interaction.channelId
            ) {
                await announcementChannel
                    .send({
                        content:
                            `${member}`,

                        embeds: [
                            grantEmbed
                        ],

                        allowedMentions: {
                            users: [
                                member.id
                            ]
                        }
                    })
                    .catch(error => {
                        console.error(
                            '⚠️ Umbra could not publish the Title proclamation:',
                            error
                        );
                    });
            }

            /*
             * Send a dedicated Title unlock
             * notification after a successful
             * manual or Event grant.
             *
             * Notification failure must never
             * undo the database grant.
             */
            const notificationChannel =
                findNotificationChannel(
                    interaction
                );

            if (notificationChannel) {
                await sendTitleUnlockNotification({
                    member,

                    channel:
                        notificationChannel,

                    titles: [
                        grantedTitle
                    ],

                    source:
                        titleDefinition.unlock.type ===
                            TITLE_UNLOCK_TYPES.EVENT
                            ? 'Official Las Noches Event'
                            : 'Las Noches High Command'
                });
            } else {
                console.warn(
                    `⚠️ Umbra could not find a Title notification channel for ${member.user.tag}.`
                );
            }
        } catch (error) {
            console.error(
                '❌ Umbra /granttitle command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Chronicle Title Grant Failed',
                    [
                        'Umbra could not complete this special Title proclamation.',
                        '',
                        'Please inspect the PostgreSQL connection and Northflank logs before trying again.'
                    ].join('\n')
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};