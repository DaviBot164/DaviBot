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

const rankConfig =
    require('../../config/ranks');

const {
    checkMemberTitles
} = require('../../handlers/titleHandler');

const {
    sendTitleUnlockNotification
} = require('../../utils/titleNotifications');

const {
    sendRankFeed,
    sendTitleFeed
} = require('../../utils/kingdomFeed');

/**
 * Return every configured Arrancar Rank.
 *
 * @returns {Array<{
 *     key: string,
 *     id: string,
 *     name: string
 * }>}
 */
function getConfiguredRanks() {
    return Object.entries(
        rankConfig.hierarchy
    ).map(
        ([
            key,
            rank
        ]) => ({
            key,
            id:
                rank.id,
            name:
                rank.name
        })
    );
}

/**
 * Return every configured Arrancar
 * Rank Role ID.
 *
 * @returns {string[]}
 */
function getConfiguredRankRoleIds() {
    return getConfiguredRanks()
        .map(
            rank =>
                rank.id
        );
}

/**
 * Find one configured Rank by its
 * stable command key.
 *
 * @param {string} rankKey
 * @returns {{
 *     key: string,
 *     id: string,
 *     name: string
 * }|null}
 */
function getConfiguredRank(
    rankKey
) {
    const rank =
        rankConfig.hierarchy[
            rankKey
        ];

    if (
        !rank ||
        !rank.id ||
        !rank.name
    ) {
        return null;
    }

    return {
        key:
            rankKey,

        id:
            rank.id,

        name:
            rank.name
    };
}

/**
 * Check whether the command executor
 * belongs to the Las Noches High Command.
 *
 * The guild owner and members with
 * Administrator always bypass Role checks.
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

    const highCommandRoleIds =
        Object.values(
            rankConfig.highCommand
        );

    return highCommandRoleIds.some(
        roleId =>
            member.roles.cache.has(
                roleId
            )
    );
}

/**
 * Find a Discord Role using its
 * configured immutable Role ID.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleId
 * @returns {import('discord.js').Role|null}
 */
function findGuildRoleById(
    guild,
    roleId
) {
    return (
        guild.roles.cache.get(
            roleId
        ) ||
        null
    );
}

/**
 * Get every manually managed Arrancar
 * Rank Role currently held by a member.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {import('discord.js').Collection<string, import('discord.js').Role>}
 */
function getMemberRankRoles(
    member
) {
    const rankRoleIds =
        new Set(
            getConfiguredRankRoleIds()
        );

    return member.roles.cache
        .filter(
            role =>
                rankRoleIds.has(
                    role.id
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
 * Find the official Hall of Honor
 * using its immutable Channel ID.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findPromotionChannel(
    guild
) {
    const channel =
        guild.channels.cache.get(
            rankConfig
                .channels
                .hallOfHonor
        );

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        return null;
    }

    return channel;
}

/**
 * Find a safe channel for a special
 * Chronicle Title unlock notification.
 *
 * Priority:
 * 1. Hall of Honor
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
 * Arrancar Rank proclamation.
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
            1_000
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
}module.exports = {
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
                                'espada0'
                        },
                        {
                            name:
                                'Ⅰ Espada',

                            value:
                                'espada1'
                        },
                        {
                            name:
                                'Ⅱ Espada',

                            value:
                                'espada2'
                        },
                        {
                            name:
                                'Ⅲ Espada',

                            value:
                                'espada3'
                        },
                        {
                            name:
                                'Ⅳ Espada',

                            value:
                                'espada4'
                        },
                        {
                            name:
                                'Ⅴ Espada',

                            value:
                                'espada5'
                        },
                        {
                            name:
                                'Ⅵ Espada',

                            value:
                                'espada6'
                        },
                        {
                            name:
                                'Ⅶ Espada',

                            value:
                                'espada7'
                        },
                        {
                            name:
                                'Ⅷ Espada',

                            value:
                                'espada8'
                        },
                        {
                            name:
                                'Ⅸ Espada',

                            value:
                                'espada9'
                        },
                        {
                            name:
                                'Ⅹ Espada',

                            value:
                                'espada10'
                        },
                        {
                            name:
                                '🌘 Privaron Espada',

                            value:
                                'privaron'
                        },
                        {
                            name:
                                '⚔️ Fracción',

                            value:
                                'fraccion'
                        },
                        {
                            name:
                                '🦴 Numeros',

                            value:
                                'numeros'
                        },
                        {
                            name:
                                '⚪ Unranked Arrancar',

                            value:
                                'unranked'
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
            ),

    /**
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

            const rankKey =
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

            const configuredRank =
                getConfiguredRank(
                    rankKey
                );

            if (!configuredRank) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Arrancar Rank',
                            'The selected Rank is not configured inside Umbra’s hierarchy.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const rankName =
                configuredRank.name;

            if (
                !rankDatabase.isValidRank(
                    rankName
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Rank Archive',
                            [
                                `The configured Rank **${rankName}** is not recognized by the PostgreSQL hierarchy.`,
                                '',
                                'Check `config/ranks.js` and `database/ranks.js` before trying again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const selectedRole =
                findGuildRoleById(
                    interaction.guild,
                    configuredRank.id
                );

            if (!selectedRole) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Role Missing',
                            [
                                `Umbra could not find the configured Discord role for **${rankName}**.`,
                                '',
                                `Configured Role ID: \`${configuredRank.id}\``,
                                '',
                                'Confirm that the role still exists and that its ID is correct inside `config/ranks.js`.'
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
                selectedRole.managed ||
                !selectedRole.editable ||
                selectedRole.position >=
                    botMember.roles.highest.position
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Hierarchy Error',
                            [
                                `Umbra cannot assign ${selectedRole}.`,
                                '',
                                'Confirm that:',
                                '• Umbra is above this Rank role',
                                '• The role is not controlled by another integration',
                                '• Umbra has **Manage Roles**'
                            ].join('\n')
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

            const unmanageableCurrentRole =
                currentRankRoles.find(
                    role =>
                        role.managed ||
                        !role.editable ||
                        role.position >=
                            botMember.roles.highest.position
                );

            if (unmanageableCurrentRole) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Existing Rank Hierarchy Error',
                            [
                                `Umbra cannot remove the current Rank role ${unmanageableCurrentRole}.`,
                                '',
                                'Move Umbra above every manually assignable Arrancar Rank and try again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }            const databaseRank =
                await rankDatabase
                    .getCurrentRank(
                        interaction.guild.id,
                        member.id
                    );

            const oldRankDisplay =
                databaseRank?.rank_name ||
                currentRankRoles.first()?.name ||
                null;

            if (
                databaseRank?.rank_name ===
                    rankName &&
                member.roles.cache.has(
                    selectedRole.id
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Already Assigned',
                            `${member} already holds the Arrancar Rank **${rankName}**.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            try {
                if (
                    currentRankRoles.size >
                    0
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

                if (
                    currentRankRoles.size >
                    0
                ) {
                    await member.roles
                        .add(
                            currentRankRoles,
                            'Rank assignment failed; restoring previous roles.'
                        )
                        .catch(
                            () => null
                        );
                }

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Assignment Failed',
                            [
                                'Umbra could not update the selected Soul’s Discord roles.',
                                '',
                                'Verify the following:',
                                '• Umbra has **Manage Roles**',
                                '• Umbra is above every Arrancar Rank role',
                                '• The selected role is not controlled by another integration'
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

                await member.roles
                    .remove(
                        selectedRole,
                        'Rank database save failed; restoring previous roles.'
                    )
                    .catch(
                        () => null
                    );

                if (
                    currentRankRoles.size >
                    0
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
                                'The previous Discord Rank was restored where possible.',
                                '',
                                'Inspect the Northflank database logs before trying again.'
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
            }

            const promotionEmbed =
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
                        rankRecord?.history_id ??
                        null,

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

            await sendRankFeed({
                member,

                moderator:
                    interaction.user,

                oldRank:
                    oldRankDisplay,

                newRank:
                    rankName,

                reason,

                historyId:
                    rankRecord?.history_id ??
                    null,

                revoked:
                    false
            }).catch(error => {
                console.error(
                    '⚠️ Umbra could not publish the Rank Kingdom Feed:',
                    error
                );
            });            if (
                unlockedTitles.length >
                0
            ) {
                const titleChannel =
                    findTitleNotificationChannel(
                        interaction
                    );

                if (
                    titleChannel
                ) {
                    await sendTitleUnlockNotification({
                        member,

                        channel:
                            titleChannel,

                        titles:
                            unlockedTitles,

                        source:
                            'Arrancar Rank Promotion'
                    }).catch(error => {
                        console.error(
                            '⚠️ Umbra could not publish the Title notification:',
                            error
                        );
                    });
                }

                await sendTitleFeed({
                    member,

                    titles:
                        unlockedTitles,

                    source:
                        'Arrancar Rank Promotion'
                }).catch(error => {
                    console.error(
                        '⚠️ Umbra could not publish the Title Kingdom Feed:',
                        error
                    );
                });
            }

            console.log(
                '======================================'
            );

            console.log(
                '👑 Arrancar Rank Assigned'
            );

            console.log(
                `🌙 Soul: ${member.user.tag}`
            );

            console.log(
                `📜 Previous Rank: ${oldRankDisplay || 'None'}`
            );

            console.log(
                `⚔️ New Rank: ${rankName}`
            );

            console.log(
                `🆔 Rank Role ID: ${selectedRole.id}`
            );

            console.log(
                `👑 High Command: ${interaction.user.tag}`
            );

            console.log(
                `🆔 History Record: ${rankRecord?.history_id ?? 'Unknown'}`
            );

            console.log(
                `🏷️ Chronicle Titles: ${unlockedTitles.length}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Umbra /setrank command failed:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Arrancar Rank Assignment Failed',
                    [
                        'Umbra could not complete the requested Arrancar Rank assignment.',
                        '',
                        'No further changes were applied.',
                        '',
                        'Inspect the Northflank logs for additional details.'
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