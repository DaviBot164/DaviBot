const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const rankDatabase =
    require('../../database/ranks');

const {
    checkMemberTitles
} = require('../../handlers/titleHandler');

const {
    sendTitleUnlockNotification
} = require('../../utils/titleNotifications');

/**
 * All manually assignable Arrancar Ranks.
 *
 * These names must match the Discord
 * role names exactly.
 */
const ARRANCAR_RANKS = [
    '👑 Espada 0',
    'Ⅰ Espada',
    'Ⅱ Espada',
    'Ⅲ Espada',
    'Ⅳ Espada',
    'Ⅴ Espada',
    'Ⅵ Espada',
    'Ⅶ Espada',
    'Ⅷ Espada',
    'Ⅸ Espada',
    'Ⅹ Espada',
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

/**
 * Roles that may manage the manual
 * Arrancar Rank System.
 *
 * Lieutenants are intentionally excluded.
 */
const RANK_MANAGER_ROLES = [
    '👑 Ruler of Las Noches',
    '⚜️ Head Captain',
    '🛡️ Captain'
];

/**
 * Channel used for official promotions
 * and Rank Title notifications.
 */
const PROMOTION_CHANNEL_NAME =
    '🏅・hall-of-promotions';

/**
 * Check whether the command executor
 * belongs to the Las Noches High Command.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function canManageArrancarRanks(
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
            RANK_MANAGER_ROLES.includes(
                role.name
            )
    );
}

/**
 * Find a Discord role using its
 * exact configured name.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleName
 * @returns {import('discord.js').Role|null}
 */
function findGuildRole(
    guild,
    roleName
) {
    return (
        guild.roles.cache.find(
            role =>
                role.name ===
                roleName
        ) ||
        null
    );
}

/**
 * Get every manually managed Arrancar
 * Rank role currently held by a member.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {import('discord.js').Collection<string, import('discord.js').Role>}
 */
function getMemberRankRoles(
    member
) {
    return member.roles.cache
        .filter(
            role =>
                ARRANCAR_RANKS.includes(
                    role.name
                )
        )
        .sort(
            (
                firstRole,
                secondRole
            ) =>
                secondRole.position -
                firstRole.position
        );
}

/**
 * Find the official Hall of Promotions.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findPromotionChannel(
    guild
) {
    const channel =
        guild.channels.cache.find(
            cachedChannel =>
                cachedChannel.name ===
                    PROMOTION_CHANNEL_NAME &&
                cachedChannel.isTextBased()
        );

    return (
        channel ||
        null
    );
}

/**
 * Find a safe channel for the special
 * Title Unlock notification.
 *
 * Priority:
 * 1. Hall of Promotions
 * 2. Current command channel
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findTitleNotificationChannel(
    interaction
) {
    const promotionChannel =
        findPromotionChannel(
            interaction.guild
        );

    if (promotionChannel) {
        return promotionChannel;
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
 * Format newly unlocked Chronicle Titles.
 *
 * @param {Object[]} unlockedTitles
 * @returns {string|null}
 */
function formatUnlockedTitles(
    unlockedTitles
) {
    if (
        !Array.isArray(
            unlockedTitles
        ) ||
        unlockedTitles.length === 0
    ) {
        return null;
    }

    return unlockedTitles
        .map(
            title =>
                `• ${title.displayName}`
        )
        .join('\n');
}

/**
 * Create the official Las Noches
 * promotion announcement.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').User} options.moderator
 * @param {string|null} options.oldRank
 * @param {string} options.newRank
 * @param {string} options.reason
 * @param {number|string|null} options.historyId
 * @param {Object[]} options.unlockedTitles
 * @returns {import('discord.js').EmbedBuilder}
 */
function createPromotionEmbed({
    member,
    moderator,
    oldRank,
    newRank,
    reason,
    historyId,
    unlockedTitles = []
}) {
    const promotedAt =
        Math.floor(
            Date.now() /
            1000
        );

    const previousRankDisplay =
        oldRank ||
        'No previous Rank';

    const historyDisplay =
        historyId
            ? `#${historyId}`
            : 'Pending Archive';

    const fields = [
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
                '📜 Previous Rank',

            value:
                previousRankDisplay,

            inline:
                true
        },
        {
            name:
                '⚔️ New Arrancar Rank',

            value:
                newRank,

            inline:
                true
        },
        {
            name:
                '🆔 Hierarchy Record',

            value:
                `\`${historyDisplay}\``,

            inline:
                true
        },
        {
            name:
                '🕒 Proclaimed At',

            value:
                `<t:${promotedAt}:F>\n` +
                `(<t:${promotedAt}:R>)`,

            inline:
                true
        },
        {
            name:
                '📖 Reason',

            value:
                reason,

            inline:
                false
        }
    ];

    const unlockedTitleDisplay =
        formatUnlockedTitles(
            unlockedTitles
        );

    if (unlockedTitleDisplay) {
        fields.push({
            name:
                '🏷️ New Chronicle Titles',

            value:
                [
                    unlockedTitleDisplay,
                    '',
                    '-# These Titles are now available through `/settitle`.'
                ].join('\n'),

            inline:
                false
        });
    }

    return createEmbed({
        title:
            '🏅 Arrancar Rank Proclamation',

        description:
            [
                `${member} has received a new position within the hierarchy of Las Noches.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Umbra has preserved this proclamation within the eternal Soul Archives.*'
            ].join('\n'),

        color:
            '#D4AF37',

        thumbnail:
            member.user.displayAvatarURL({
                size:
                    1024,

                forceStatic:
                    false
            }),

        fields,

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
                'setrank'
            )
            .setDescription(
                'Assign an official Arrancar Rank to a Soul.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul receiving the Rank'
                    )
                    .setRequired(
                        true
                    )
            )

            .addStringOption(option =>
                option
                    .setName(
                        'rank'
                    )
                    .setDescription(
                        'Select the new Arrancar Rank'
                    )
                    .setRequired(
                        true
                    )
                    .addChoices(
                        {
                            name:
                                '👑 Espada 0',

                            value:
                                '👑 Espada 0'
                        },
                        {
                            name:
                                'Ⅰ Espada',

                            value:
                                'Ⅰ Espada'
                        },
                        {
                            name:
                                'Ⅱ Espada',

                            value:
                                'Ⅱ Espada'
                        },
                        {
                            name:
                                'Ⅲ Espada',

                            value:
                                'Ⅲ Espada'
                        },
                        {
                            name:
                                'Ⅳ Espada',

                            value:
                                'Ⅳ Espada'
                        },
                        {
                            name:
                                'Ⅴ Espada',

                            value:
                                'Ⅴ Espada'
                        },
                        {
                            name:
                                'Ⅵ Espada',

                            value:
                                'Ⅵ Espada'
                        },
                        {
                            name:
                                'Ⅶ Espada',

                            value:
                                'Ⅶ Espada'
                        },
                        {
                            name:
                                'Ⅷ Espada',

                            value:
                                'Ⅷ Espada'
                        },
                        {
                            name:
                                'Ⅸ Espada',

                            value:
                                'Ⅸ Espada'
                        },
                        {
                            name:
                                'Ⅹ Espada',

                            value:
                                'Ⅹ Espada'
                        },
                        {
                            name:
                                '🌘 Privaron Espada',

                            value:
                                '🌘 Privaron Espada'
                        },
                        {
                            name:
                                '⚔️ Fracción',

                            value:
                                '⚔️ Fracción'
                        },
                        {
                            name:
                                '🦴 Numeros',

                            value:
                                '🦴 Numeros'
                        },
                        {
                            name:
                                '⚪ Unranked Arrancar',

                            value:
                                '⚪ Unranked Arrancar'
                        }
                    )
            )

            .addStringOption(option =>
                option
                    .setName(
                        'reason'
                    )
                    .setDescription(
                        'Reason for this promotion or Rank change'
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
     * Execute the /setrank command.
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
                !canManageArrancarRanks(
                    executor
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ High Command Required',
                            [
                                'Only the Las Noches High Command may assign Arrancar Ranks.',
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

            const rankName =
                interaction.options.getString(
                    'rank',
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
                            'Arrancar Ranks cannot be assigned to Discord bots.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !rankDatabase.isValidRank(
                    rankName
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Arrancar Rank',
                            'The selected Rank is not recognized by the Las Noches hierarchy.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const selectedRole =
                findGuildRole(
                    interaction.guild,
                    rankName
                );

            if (!selectedRole) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Role Missing',
                            [
                                `Umbra could not find the Discord role **${rankName}**.`,
                                '',
                                'Verify that the role exists and that its name matches the selected Rank exactly.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Umbra Unavailable',
                            'Umbra could not access its server member information.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Manage Roles Required',
                            'Umbra requires the **Manage Roles** permission to assign Arrancar Ranks.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                selectedRole.position >=
                botMember.roles.highest.position
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Hierarchy Error',
                            [
                                `Umbra cannot manage the **${rankName}** role.`,
                                '',
                                'Move Umbra’s Discord role above every manually assignable Arrancar Rank.'
                            ].join('\n')
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
                            'Only the server owner may change the owner’s Arrancar Rank.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const currentRankRoles =
                getMemberRankRoles(
                    member
                );

            const currentRankRole =
                currentRankRoles.first() ||
                null;

            if (
                currentRankRoles.size === 1 &&
                currentRankRole?.id ===
                    selectedRole.id
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Already Assigned',
                            `${member} already holds the **${rankName}** Rank.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const unmanageableOldRole =
                currentRankRoles.find(
                    role =>
                        role.position >=
                        botMember.roles.highest.position
                );

            if (unmanageableOldRole) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Existing Rank Unmanageable',
                            [
                                `Umbra cannot remove ${unmanageableOldRole}.`,
                                '',
                                'Move Umbra’s role above every Arrancar Rank role and try again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const oldRankNames =
                currentRankRoles.map(
                    role =>
                        role.name
                );

            const oldRankDisplay =
                oldRankNames.length > 0
                    ? oldRankNames.join(', ')
                    : null;

            try {
                if (
                    currentRankRoles.size > 0
                ) {
                    await member.roles.remove(
                        currentRankRoles,
                        `Arrancar Rank updated by ${interaction.user.tag}: ${reason}`
                    );
                }

                await member.roles.add(
                    selectedRole,
                    `Arrancar Rank assigned by ${interaction.user.tag}: ${reason}`
                );
            } catch (roleError) {
                console.error(
                    '❌ Umbra could not update Arrancar Rank roles:',
                    roleError
                );

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Assignment Failed',
                            [
                                'Umbra could not update the selected Soul’s Discord roles.',
                                '',
                                'Verify the following:',
                                '• Umbra has Manage Roles',
                                '• Umbra is above all Arrancar Rank roles',
                                '• The selected Rank role is not managed by another integration'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            let rankRecord;

            try {
                rankRecord =
                    await rankDatabase.setRank({
                        guildId:
                            interaction.guild.id,

                        userId:
                            member.id,

                        moderatorId:
                            interaction.user.id,

                        rankName,

                        reason
                    });
            } catch (databaseError) {
                console.error(
                    '❌ Umbra could not save the Arrancar Rank:',
                    databaseError
                );

                /*
                 * Attempt to restore the previous
                 * Discord Rank roles if the database
                 * operation fails.
                 */
                await member.roles
                    .remove(
                        selectedRole,
                        'Rank database save failed; restoring previous roles.'
                    )
                    .catch(
                        () => null
                    );

                if (
                    currentRankRoles.size > 0
                ) {
                    await member.roles
                        .add(
                            currentRankRoles,
                            'Rank database save failed; restoring previous roles.'
                        )
                        .catch(
                            () => null
                        );
                }

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Archive Failed',
                            [
                                'Umbra could not save this Rank change inside PostgreSQL.',
                                '',
                                'The previous Discord Rank was restored where possible. Check the Northflank database logs before trying again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            let unlockedTitles =
                [];

            try {
                const titleResult =
                    await checkMemberTitles(
                        member
                    );

                if (
                    titleResult &&
                    Array.isArray(
                        titleResult.newlyUnlocked
                    )
                ) {
                    unlockedTitles =
                        titleResult.newlyUnlocked;
                }
            } catch (titleError) {
                console.error(
                    '⚠️ Umbra Title unlock failed after Rank promotion:',
                    titleError
                );
            }            const promotionEmbed =
                createPromotionEmbed({
                    member,

                    moderator:
                        interaction.user,

                    oldRank:
                        oldRankDisplay,

                    newRank:
                        rankName,

                    reason,

                    historyId:
                        rankRecord.history_id,

                    unlockedTitles
                });

            await interaction.editReply({
                embeds: [
                    promotionEmbed
                ]
            });

            const promotionChannel =
                findPromotionChannel(
                    interaction.guild
                );

            if (
                promotionChannel &&
                promotionChannel.id !==
                    interaction.channelId
            ) {
                await promotionChannel
                    .send({
                        content:
                            `${member}`,

                        embeds: [
                            promotionEmbed
                        ],

                        allowedMentions: {
                            users: [
                                member.id
                            ]
                        }
                    })
                    .catch(error => {
                        console.error(
                            '⚠️ Umbra could not publish the promotion announcement:',
                            error
                        );
                    });
            }

            /*
             * Send a dedicated Chronicle Title
             * unlock notification when the new
             * Rank immediately unlocks Titles.
             *
             * This notification is non-fatal:
             * Rank assignment remains successful
             * even when the notification fails.
             */
            if (
                unlockedTitles.length >
                0
            ) {
                const notificationChannel =
                    findTitleNotificationChannel(
                        interaction
                    );

                if (notificationChannel) {
                    await sendTitleUnlockNotification({
                        member,

                        channel:
                            notificationChannel,

                        titles:
                            unlockedTitles,

                        source:
                            `Arrancar Rank promotion: ${rankName}`
                    });
                } else {
                    console.warn(
                        `⚠️ Umbra could not find a Title notification channel for ${member.user.tag}.`
                    );
                }
            }
        } catch (error) {
            console.error(
                '❌ Umbra /setrank command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Rank Proclamation Failed',
                    [
                        'Umbra could not complete this Arrancar Rank assignment.',
                        '',
                        'Please inspect the Northflank logs and try again.'
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