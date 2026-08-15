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
 * Return all assignable Sin ranks.
 *
 * Dominion is a special position and is not
 * assignable through /setrank.
 *
 * Unranked is handled by /removerank.
 *
 * @returns {Array<{key: string, id: string, name: string}>}
 */
function getAssignableRanks() {
    return Object.entries(
        rankConfig.hierarchy
    )
        .filter(
            ([key]) =>
                key !== 'dominion' &&
                key !== 'unranked'
        )
        .map(
            ([key, rank]) => ({
                key,
                id:
                    rank.id,
                name:
                    rank.name
            })
        );
}

/**
 * Check whether a member can manage
 * the THE Ⅹ SINS rank system.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function canManageRanks(
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

    return Object.values(
        rankConfig.highCommand
    ).some(
        roleId =>
            member.roles.cache.has(
                roleId
            )
    );
}

/**
 * Find a configured rank role.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleId
 * @returns {import('discord.js').Role|null}
 */
function getRankRole(
    guild,
    roleId
) {
    return (
        guild.roles.cache.get(
            roleId
        ) ??
        null
    );
}

/**
 * Get all current Sin roles held by
 * a member.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {import('discord.js').Collection}
 */
function getMemberRankRoles(
    member
) {
    const rankIds =
        new Set(
            Object.values(
                rankConfig.hierarchy
            )
                .filter(
                    rank =>
                        rank.id
                )
                .map(
                    rank =>
                        rank.id
                )
        );

    return member.roles.cache
        .filter(
            role =>
                rankIds.has(
                    role.id
                )
        )
        .sort(
            (a, b) =>
                b.position -
                a.position
        );
}

/**
 * Find the official Rank announcement
 * channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function getRankChannel(
    guild
) {
    const channel =
        guild.channels.cache.get(
            rankConfig.channels
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
 * Format newly unlocked Titles.
 *
 * @param {Object[]} titles
 * @returns {string|null}
 */
function formatUnlockedTitles(
    titles
) {
    if (
        !Array.isArray(titles) ||
        !titles.length
    ) {
        return null;
    }

    return titles
        .map(
            title =>
                `• ${title.displayName}`
        )
        .join('\n');
}

/**
 * Build the official Sin promotion embed.
 *
 * @param {Object} options
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
    const timestamp =
        Math.floor(
            Date.now() / 1000
        );

    const titleText =
        formatUnlockedTitles(
            unlockedTitles
        );

    const fields = [
        {
            name:
                '🌙 Soul',

            value:
                `${member}\n\`${member.id}\``,

            inline:
                true
        },

        {
            name:
                '👑 High Command',

            value:
                `${moderator}\n\`${moderator.id}\``,

            inline:
                true
        },

        {
            name:
                '📜 Previous Rank',

            value:
                oldRank ||
                'No previous Rank',

            inline:
                true
        },

        {
            name:
                '⚔️ New Sin Rank',

            value:
                newRank,

            inline:
                true
        },

        {
            name:
                '🆔 Hierarchy Record',

            value:
                historyId
                    ? `\`#${historyId}\``
                    : 'Pending Archive',

            inline:
                true
        },

        {
            name:
                '🕒 Proclaimed At',

            value:
                `<t:${timestamp}:F>\n(<t:${timestamp}:R>)`,

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

    if (titleText) {
        fields.push({
            name:
                '🏷️ New Chronicle Titles',

            value:
                [
                    titleText,
                    '',
                    '-# These Titles are now available through `/settitle`.'
                ].join('\n'),

            inline:
                false
        });
    }

    return createEmbed({
        title:
            '⚔️ Sin Rank Proclamation',

        description:
            [
                `${member} has received a new position within THE Ⅹ SINS.`,

                '',

                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',

                '',

                '*Evelynn has preserved this proclamation within the Soul Archives.*'
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
                'THE Ⅹ SINS • Rank Archive'
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
                'Assign an official Sin Rank to a Soul.'
            )

            .addUserOption(
                option =>
                    option
                        .setName(
                            'user'
                        )
                        .setDescription(
                            'Select the Soul receiving the Rank.'
                        )
                        .setRequired(
                            true
                        )
            )

            .addStringOption(
                option => {
                    option
                        .setName(
                            'rank'
                        )
                        .setDescription(
                            'Select the Sin Rank to assign.'
                        )
                        .setRequired(
                            true
                        );

                    option.addChoices(
                        ...getAssignableRanks()
                            .map(
                                rank => ({
                                    name:
                                        rank.name,

                                    value:
                                        rank.key
                                })
                            )
                    );

                    return option;
                }
            )

            .addStringOption(
                option =>
                    option
                        .setName(
                            'reason'
                        )
                        .setDescription(
                            'Reason for this Rank change.'
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
     * Execute /setrank.
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
                            '❌ Server Only Command',
                            'This command can only be used inside THE Ⅹ SINS.'
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
                !canManageRanks(
                    executor
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ High Command Required',

                            [
                                'Only THE Ⅹ SINS High Command may assign Sin Ranks.',
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
                            'The selected Soul is not currently inside THE Ⅹ SINS.'
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
                            'Sin Ranks cannot be assigned to Discord bots.'
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
                            'Only the server owner may change the owner’s Sin Rank.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const configuredRank =
                rankConfig.hierarchy[
                    rankKey
                ];

            if (
                !configuredRank
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Sin Rank',
                            'The selected Rank is not configured inside THE Ⅹ SINS hierarchy.'
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
                            '❌ Rank Archive Error',

                            [
                                `The configured Rank **${rankName}** is not recognized by the Rank database.`,
                                '',
                                'Check `config/ranks.js` and `database/ranks.js`.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const selectedRole =
                getRankRole(
                    interaction.guild,
                    configuredRank.id
                );

            if (
                !selectedRole
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Role Missing',

                            [
                                `Umbra could not find the configured role for **${rankName}**.`,
                                '',
                                `Role ID: \`${configuredRank.id}\``,
                                '',
                                'Check that the role still exists and that `config/ranks.js` contains the correct ID.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }            const currentRank =
                await rankDatabase.getCurrentRank(
                    interaction.guild.id,
                    member.id
                );

            const oldRank =
                currentRank?.rank_name ??
                null;

            if (
                oldRank ===
                rankName
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '⚠️ Rank Already Assigned',

                            [
                                `${member} already holds **${rankName}**.`,
                                '',
                                'No changes were made.'
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

            const roleToRemove =
                currentRankRoles.find(
                    role =>
                        role.id !==
                        configuredRank.id
                );

            if (
                roleToRemove &&
                !roleToRemove.editable
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Role Hierarchy Error',

                            [
                                `Evelynn cannot manage the current Rank role **${roleToRemove.name}**.`,
                                '',
                                'Move Evelynn’s highest role above the Sin Rank roles and try again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !selectedRole.editable
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Role Hierarchy Error',

                            [
                                `Evelynn cannot manage **${selectedRole.name}**.`,
                                '',
                                'Move Evelynn’s highest role above the Sin Rank roles and try again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            /*
             * Save the database state first.
             *
             * The database remains the source of
             * truth for Rank history.
             */
            const savedRank =
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

            try {
                if (
                    roleToRemove
                ) {
                    await member.roles.remove(
                        roleToRemove,
                        `Sin Rank replaced by ${rankName}`
                    );
                }

                await member.roles.add(
                    selectedRole,
                    `Sin Rank assigned: ${rankName}`
                );
            } catch (roleError) {
                console.error(
                    '❌ Sin Rank role update failed:',
                    roleError
                );

                /*
                 * Restore the previous database state
                 * when Discord role assignment fails.
                 */
                try {
                    if (
                        oldRank
                    ) {
                        await rankDatabase.setRank({
                            guildId:
                                interaction.guild.id,

                            userId:
                                member.id,

                            moderatorId:
                                interaction.user.id,

                            rankName:
                                oldRank,

                            reason:
                                'Rollback after Discord role update failure.'
                        });
                    } else {
                        await rankDatabase.removeRank({
                            guildId:
                                interaction.guild.id,

                            userId:
                                member.id,

                            moderatorId:
                                interaction.user.id,

                            reason:
                                'Rollback after Discord role update failure.'
                        });
                    }
                } catch (
                    rollbackError
                ) {
                    console.error(
                        '❌ Sin Rank database rollback failed:',
                        rollbackError
                    );
                }

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Assignment Failed',

                            [
                                'Evelynn could not update the Discord Rank role.',
                                '',
                                'The database state was restored where possible.',
                                '',
                                'Please check the role hierarchy and try again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            /*
             * Check whether the new Rank unlocked
             * any Chronicle Titles.
             */
            let unlockedTitles = [];

            try {
                unlockedTitles =
                    await checkMemberTitles(
                        member,
                        {
                            source:
                                'rank',

                            rankName
                        }
                    ) ?? [];
            } catch (
                titleError
            ) {
                console.error(
                    '⚠️ Rank Title check failed:',
                    titleError
                );
            }

            const promotionEmbed =
                createPromotionEmbed({
                    member,

                    moderator:
                        interaction.member,

                    oldRank,

                    newRank:
                        rankName,

                    reason,

                    historyId:
                        savedRank.history_id,

                    unlockedTitles
                });

            /*
             * Publish the official Rank Feed.
             */
            try {
                await sendRankFeed(
                    interaction.guild,
                    promotionEmbed
                );
            } catch (
                feedError
            ) {
                console.error(
                    '⚠️ Rank Feed publication failed:',
                    feedError
                );
            }

            /*
             * Publish newly unlocked Titles.
             */
            if (
                unlockedTitles.length
            ) {
                try {
                    await sendTitleFeed(
                        interaction.guild,
                        unlockedTitles,
                        member
                    );
                } catch (
                    titleFeedError
                ) {
                    console.error(
                        '⚠️ Title Feed publication failed:',
                        titleFeedError
                    );
                }
            }

            /*
             * Send direct Title notifications.
             */
            if (
                unlockedTitles.length
            ) {
                try {
                    await sendTitleUnlockNotification(
                        member,
                        unlockedTitles
                    );
                } catch (
                    notificationError
                ) {
                    console.error(
                        '⚠️ Title notification failed:',
                        notificationError
                    );
                }
            }            await interaction.editReply({
                embeds: [
                    promotionEmbed
                ]
            });

            console.log(
                [
                    '⚔️ Sin Rank assigned:',
                    member.user.tag,
                    '→',
                    rankName,
                    `by ${interaction.user.tag}`
                ].join(' ')
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /setrank command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Rank Assignment Failed',

                    [
                        'Evelynn could not complete the Sin Rank assignment.',
                        '',
                        'No further changes were made.',
                        '',
                        'Check the Rank configuration, database connection and Discord role hierarchy.'
                    ].join('\n')
                );

            if (
                interaction.deferred ||
                interaction.replied
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

                        components:
                            []
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