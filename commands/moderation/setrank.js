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
 * Return all assignable Captain ranks.
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
 * the LUNAR SEIREITEI rank system.
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
/**
 * Build a compact Captain appointment
 * announcement for Hall of Honor.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function createPromotionEmbed({
    member,
    moderator,
    oldRank,
    newRank,
    reason
}) {
    return createEmbed({
        title:
            '⚔️・CAPTAIN APPOINTMENT',

        description:
            [
                `${member} has been appointed to **${newRank}**.`,
                '',
                'Their place within the Captain hierarchy has been officially recognized.'
            ].join('\n'),

        color:
            '#D4AF37',

        thumbnail:
            member.user.displayAvatarURL({
                size:
                    512,

                forceStatic:
                    false
            }),

        fields: [
            {
                name:
                    '📜・PREVIOUS',

                value:
                    oldRank ||
                    '◇・UNRANKED',

                inline:
                    true
            },

            {
                name:
                    '⚔️・NEW RANK',

                value:
                    `**${newRank}**`,

                inline:
                    true
            },

            {
                name:
                    '📖・REASON',

                value:
                    reason ||
                    'No reason provided.',

                inline:
                    false
            }
        ],

        footer: {
            text:
                `${moderator.displayName} • High Command`,

            iconURL:
                moderator.user.displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                })
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
                'Assign an official Captain Rank to a Soul.'
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
                            'Select the Captain Rank to assign.'
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
                            'This command can only be used inside LUNAR SEIREITEI.'
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
                                'Only LUNAR SEIREITEI High Command may assign Captain Ranks.',
                                '',
                                'Required standing:',
                                '• 👑 Lunar Sovereign',
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
                            'The selected Soul is not currently inside LUNAR SEIREITEI.'
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
                            'Captain Ranks cannot be assigned to Discord bots.'
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
                            'Only the server owner may change the owner’s Captain Rank.'
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
                            '❌ Invalid Captain Rank',
                            'The selected Rank is not configured inside LUNAR SEIREITEI hierarchy.'
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
                                `Evelynn could not find the configured role for **${rankName}**.`,
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
                                'Move Evelynn’s highest role above the Captain Rank roles and try again.'
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
                                'Move Evelynn’s highest role above the Captain Rank roles and try again.'
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
                        `Captain Rank replaced by ${rankName}`
                    );
                }

                await member.roles.add(
                    selectedRole,
                    `Captain Rank assigned: ${rankName}`
                );
            } catch (roleError) {
                console.error(
                    '❌ Captain Rank role update failed:',
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
                        '❌ Captain Rank database rollback failed:',
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

                    reason
                });

            /*
             * Publish the official announcement
             * inside Hall of Honor.
             */
            try {
                const rankChannel =
                    getRankChannel(
                        interaction.guild
                    );

                if (rankChannel) {
                    await rankChannel.send({
                        embeds: [
                            promotionEmbed
                        ],

                        allowedMentions: {
                            parse:
                                []
                        }
                    });
                } else {
                    console.warn(
                        '⚠️ Hall of Honor channel is unavailable.'
                    );
                }
            } catch (
                announcementError
            ) {
                console.error(
                    '⚠️ Hall of Honor publication failed:',
                    announcementError
                );
            }

            /*
             * Publish the Captain Rank activity
             * inside Soul Progression.
             */
            try {
                const feedPublished =
                    await sendRankFeed({
                        member,

                        moderator:
                            interaction.member,

                        oldRank,

                        newRank:
                            rankName,

                        reason,

                        historyId:
                            savedRank.history_id,

                        revoked:
                            false
                    });

                if (!feedPublished) {
                    console.warn(
                        '⚠️ Captain Rank Feed was not published. Check Feed configuration and permissions.'
                    );
                }
            } catch (
                feedError
            ) {
                console.error(
                    '⚠️ Captain Rank Feed publication failed:',
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
            }

            await interaction.editReply({
                embeds: [
                    promotionEmbed
                ]
            });

            console.log(
                [
                    '⚔️ Captain Rank assigned:',
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
                        'Evelynn could not complete the Captain Rank assignment.',
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