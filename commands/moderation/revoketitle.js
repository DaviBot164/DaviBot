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

/**
 * Las Noches High Command roles allowed
 * to revoke Manual and Event Titles.
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
 * Title proclamations and revocations.
 */
const TITLE_ANNOUNCEMENT_CHANNEL_NAME =
    '🏅・hall-of-promotions';

/**
 * Title revocation embed color.
 */
const TITLE_REVOKE_COLOR =
    '#8B0000';

/**
 * Default Title restored when a Soul's
 * active special Title is revoked.
 */
const DEFAULT_TITLE_ID =
    'nameless_soul';

/**
 * Only Manual and Event Titles may be
 * revoked through this command.
 */
const REVOKABLE_UNLOCK_TYPES = [
    TITLE_UNLOCK_TYPES.MANUAL,
    TITLE_UNLOCK_TYPES.EVENT
];

/**
 * Every configured Title that may be
 * revoked manually.
 */
const REVOKABLE_TITLES =
    TITLE_DEFINITIONS.filter(
        title =>
            REVOKABLE_UNLOCK_TYPES.includes(
                title.unlock?.type
            )
    );

/**
 * Slash command choices generated from
 * configured Manual and Event Titles.
 */
const REVOKABLE_TITLE_CHOICES =
    REVOKABLE_TITLES.map(
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
 * Find one revokable Title definition.
 *
 * @param {string} titleId
 * @returns {Object|null}
 */
function findRevokableTitle(
    titleId
) {
    return (
        REVOKABLE_TITLES.find(
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
 * Format a Discord timestamp.
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
 * Return a readable revocation source.
 *
 * @param {Object} titleDefinition
 * @returns {string}
 */
function getRevocationTypeDisplay(
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
 * Create the official Title revocation
 * proclamation embed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').User} options.moderator
 * @param {Object} options.revokedTitle
 * @param {Object|null} options.currentTitle
 * @param {string} options.reason
 * @param {boolean} options.wasActive
 * @returns {import('discord.js').EmbedBuilder}
 */
function createTitleRevocationEmbed({
    member,
    moderator,
    revokedTitle,
    currentTitle,
    reason,
    wasActive
}) {
    const revokedAt =
        new Date();

    return createEmbed({
        title:
            '🌑 Chronicle Title Revoked',

        description:
            [
                `${member} no longer holds a special Chronicle designation within Las Noches.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Umbra has permanently preserved this decision within the Soul Archives.*'
            ].join('\n'),

        color:
            TITLE_REVOKE_COLOR,

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
                    '🗑️ Revoked Title',

                value:
                    `**${revokedTitle.displayName}**`,

                inline:
                    false
            },
            {
                name:
                    '📚 Classification',

                value:
                    [
                        `**Category:** ${revokedTitle.category}`,
                        `**Rarity:** ${revokedTitle.rarity}`,
                        `**Source:** ${getRevocationTypeDisplay(revokedTitle)}`
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '⚔️ Active Title Status',

                value:
                    wasActive
                        ? [
                            'The revoked Title was active.',
                            '',
                            `Current Title: **${currentTitle?.displayName || '🌑 Nameless Soul'}**`
                        ].join('\n')
                        : [
                            'The revoked Title was not active.',
                            '',
                            `Current Title: **${currentTitle?.displayName || '🌑 Nameless Soul'}**`
                        ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '🕒 Revoked At',

                value:
                    formatDiscordDate(
                        revokedAt
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
                'revoketitle'
            )
            .setDescription(
                'Revoke a manually granted Chronicle Title from a Soul.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose special Title should be revoked'
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
                        'Select the special Chronicle Title to revoke'
                    )
                    .setRequired(
                        true
                    )
                    .addChoices(
                        ...REVOKABLE_TITLE_CHOICES
                    )
            )

            .addStringOption(option =>
                option
                    .setName(
                        'reason'
                    )
                    .setDescription(
                        'Reason for revoking this Chronicle Title'
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

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .setDMPermission(
                false
            ),    /**
     * Execute the /revoketitle command.
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
                                'Only the Las Noches High Command may revoke special Chronicle Titles.',
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
                            'Chronicle Titles cannot be revoked from Discord bots.'
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
                            'Only the server owner may revoke a special Title from the owner’s Soul Record.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const titleDefinition =
                findRevokableTitle(
                    titleId
                );

            if (!titleDefinition) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Chronicle Title',
                            [
                                'The selected Title cannot be revoked manually.',
                                '',
                                'Only Manual and Event Titles may be removed through `/revoketitle`.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            const existingTitle =
                await titleDatabase
                    .getSoulTitle(
                        interaction.guild.id,
                        member.id,
                        titleId
                    );

            if (!existingTitle) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Not Owned',
                            [
                                `${member} does not currently own **${titleDefinition.displayName}**.`,
                                '',
                                'No Chronicle Title record was changed.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            const activeTitleBefore =
                await titleDatabase
                    .getActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            const wasActive =
                activeTitleBefore?.titleId ===
                titleId;

            let revokedTitle;

            try {
                revokedTitle =
                    await titleDatabase
                        .revokeSoulTitle(
                            interaction.guild.id,
                            member.id,
                            titleId
                        );
            } catch (databaseError) {
                console.error(
                    '❌ Umbra could not revoke the Chronicle Title:',
                    databaseError
                );

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Archive Failed',
                            [
                                'Umbra could not remove this Chronicle Title from PostgreSQL.',
                                '',
                                'Please inspect the Northflank database logs before trying again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            if (!revokedTitle) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Revocation Failed',
                            'Umbra could not locate or remove the requested Chronicle Title record.'
                        )
                    ]
                });

                return;
            }

            /*
             * If the revoked Title was active,
             * revokeSoulTitle() restores the
             * default Nameless Soul Title.
             *
             * This additional check guarantees
             * that a valid active Title exists.
             */
            let currentTitle =
                await titleDatabase
                    .getActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            if (
                wasActive &&
                !currentTitle
            ) {
                await titleDatabase
                    .ensureDefaultSoulTitle(
                        interaction.guild.id,
                        member.id
                    );

                currentTitle =
                    await titleDatabase
                        .getActiveTitle(
                            interaction.guild.id,
                            member.id
                        );
            }

            if (
                wasActive &&
                (
                    !currentTitle ||
                    currentTitle.titleId !==
                        DEFAULT_TITLE_ID
                )
            ) {
                const restoredDefaultTitle =
                    await titleDatabase
                        .setActiveTitle(
                            interaction.guild.id,
                            member.id,
                            DEFAULT_TITLE_ID
                        );

                currentTitle =
                    restoredDefaultTitle ||
                    currentTitle;
            }

            const revocationEmbed =
                createTitleRevocationEmbed({
                    member,

                    moderator:
                        interaction.user,

                    revokedTitle,

                    currentTitle,

                    reason,

                    wasActive
                });

            await interaction.editReply({
                embeds: [
                    revocationEmbed
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
                            revocationEmbed
                        ],

                        allowedMentions: {
                            users: [
                                member.id
                            ]
                        }
                    })
                    .catch(error => {
                        console.error(
                            '⚠️ Umbra could not publish the Title revocation announcement:',
                            error
                        );
                    });
            }
        } catch (error) {
            console.error(
                '❌ Umbra /revoketitle command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Chronicle Title Revocation Failed',
                    [
                        'Umbra could not complete this special Title revocation.',
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