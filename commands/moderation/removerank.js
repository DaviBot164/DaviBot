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
    sendRankFeed
} = require('../../utils/kingdomFeed');

/**
 * Check whether a member can manage
 * LUNAR SEIREITEI Rank system.
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
 * Get all configured Captain Rank roles.
 *
 * Dominion is included here because it is a
 * managed hierarchy role and must be removed
 * if a member somehow holds it.
 *
 * @returns {string[]}
 */
function getRankRoleIds() {
    return Object.values(
        rankConfig.hierarchy
    )
        .map(
            rank =>
                rank.id
        )
        .filter(Boolean);
}

/**
 * Get every configured Rank role currently
 * held by a member.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {import('discord.js').Collection}
 */
function getMemberRankRoles(
    member
) {
    const rankIds =
        new Set(
            getRankRoleIds()
        );

    return member.roles.cache
        .filter(
            role =>
                rankIds.has(
                    role.id
                )
        );
}

/**
 * Find a configured Rank by Discord role ID.
 *
 * @param {string} roleId
 * @returns {Object|null}
 */
function getRankByRoleId(
    roleId
) {
    return (
        Object.values(
            rankConfig.hierarchy
        ).find(
            rank =>
                rank.id ===
                roleId
        ) ??
        null
    );
}

/**
 * Get the best display name for the
 * Rank being removed.
 *
 * @param {Object|null} databaseRank
 * @param {import('discord.js').Collection} roles
 * @returns {string}
 */
function getRemovedRankName(
    databaseRank,
    roles
) {
    if (
        databaseRank?.rank_name
    ) {
        return databaseRank.rank_name;
    }

    const role =
        roles.first();

    if (!role) {
        return 'Unknown Captain Rank';
    }

    return (
        getRankByRoleId(
            role.id
        )?.name ??
        role.name
    );
}

/**
 * Build the official Rank removal embed.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function createRankRemovalEmbed({
    member,
    moderator,
    removedRank,
    reason,
    historyId
}) {
    const timestamp =
        Math.floor(
            Date.now() / 1000
        );

    return createEmbed({
        title:
            '⚔️ Captain Rank Removed',

        description:
            [
                `${member} no longer holds a manually assigned Captain Rank.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Evelynn has preserved this decision within the Soul Archives.*'
            ].join('\n'),

        color:
            '#6F42C1',

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
                    '📜 Removed Rank',

                value:
                    removedRank,

                inline:
                    true
            },

            {
                name:
                    '◇ Current Status',

                value:
                    rankConfig.hierarchy
                        .unranked
                        .name,

                inline:
                    true
            },

            {
                name:
                    '🆔 Archive Record',

                value:
                    historyId
                        ? `\`#${historyId}\``
                        : 'Archived',

                inline:
                    true
            },

            {
                name:
                    '🕒 Removed At',

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
        ],

        footer: {
            text:
                'LUNAR SEIREITEI • Rank Archive'
        }
    });
}module.exports = {
    category:
        'moderation',

    data:
        new SlashCommandBuilder()
            .setName(
                'removerank'
            )
            .setDescription(
                'Remove a Soul’s assigned Captain Rank.'
            )

            .addUserOption(
                option =>
                    option
                        .setName(
                            'user'
                        )
                        .setDescription(
                            'Select the Soul whose Rank should be removed.'
                        )
                        .setRequired(
                            true
                        )
            )

            .addStringOption(
                option =>
                    option
                        .setName(
                            'reason'
                        )
                        .setDescription(
                            'Reason for removing the Captain Rank.'
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
     * Execute /removerank.
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
                                'Only LUNAR SEIREITEI High Command may remove Captain Ranks.',
                                '',
                                'Required standing:',
                                '• 👑 Ruler',
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
                            'Captain Ranks cannot be removed from Discord bots.'
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

            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Evelynn Unavailable',
                            'Evelynn could not access its server member information.'
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
                            'Evelynn needs **Manage Roles** to remove Captain Rank roles.'
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

            const databaseRank =
                await rankDatabase.getCurrentRank(
                    interaction.guild.id,
                    member.id
                );

            if (
                currentRankRoles.size ===
                    0 &&
                !databaseRank
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ No Rank Assigned',
                            `${member} does not currently have an assigned Captain Rank.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const unmanageableRole =
                currentRankRoles.find(
                    role =>
                        role.managed ||
                        !role.editable ||
                        role.position >=
                            botMember.roles
                                .highest
                                .position
                );

            if (
                unmanageableRole
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Hierarchy Error',

                            [
                                `Evelynn cannot remove ${unmanageableRole}.`,
                                '',
                                'Make sure Evelynn is above the Captain Rank roles and has **Manage Roles**.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const removedRank =
                getRemovedRankName(
                    databaseRank,
                    currentRankRoles
                );

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });            try {
                if (
                    currentRankRoles.size
                ) {
                    await member.roles.remove(
                        currentRankRoles,
                        `Captain Rank removed by ${interaction.user.tag}: ${reason}`
                    );
                }
            } catch (roleError) {
                console.error(
                    '❌ Captain Rank role removal failed:',
                    roleError
                );

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Removal Failed',

                            [
                                'Evelynn could not remove the Discord Captain Rank role.',
                                '',
                                'Check **Manage Roles** and make sure Evelynn is above the Captain Rank roles.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            let removedRecord;

            try {
                removedRecord =
                    await rankDatabase.removeRank({
                        guildId:
                            interaction.guild.id,

                        userId:
                            member.id,

                        moderatorId:
                            interaction.user.id,

                        reason
                    });
            } catch (databaseError) {
                console.error(
                    '❌ Captain Rank archive failed:',
                    databaseError
                );

                /*
                 * Restore the previous Discord roles
                 * if PostgreSQL failed after removal.
                 */
                if (
                    currentRankRoles.size
                ) {
                    await member.roles
                        .add(
                            currentRankRoles,
                            'Captain Rank archive failed; restoring previous role.'
                        )
                        .catch(
                            restoreError =>
                                console.error(
                                    '❌ Captain Rank role restoration failed:',
                                    restoreError
                                )
                        );
                }

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Archive Failed',

                            [
                                'Evelynn could not save the Rank removal in PostgreSQL.',
                                '',
                                'The previous Discord Rank was restored where possible.',
                                '',
                                'Check the database logs before trying again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            /*
             * The Discord role was removed successfully.
             * PostgreSQL may return null when a role existed
             * in Discord but no active database record existed.
             */
            const historyId =
                removedRecord?.history_id ??
                null;

            const finalRemovedRank =
                removedRecord?.removed_rank_name ??
                removedRank;

            const removalEmbed =
                createRankRemovalEmbed({
                    member,

                    moderator:
                        interaction.user,

                    removedRank:
                        finalRemovedRank,

                    reason,

                    historyId
                });

            await interaction.editReply({
                embeds: [
                    removalEmbed
                ]
            });

            /*
             * Publish the official Rank Feed.
             *
             * A failed feed must not turn a successful
             * Rank removal into a failed command.
             */
            try {
                await sendRankFeed({
                    member,

                    moderator:
                        interaction.user,

                    oldRank:
                        finalRemovedRank,

                    newRank:
                        null,

                    reason,

                    historyId,

                    revoked:
                        true
                });
            } catch (feedError) {
                console.error(
                    '⚠️ Captain Rank Feed publication failed:',
                    feedError
                );
            }

            console.log(
                [
                    '⚔️ Captain Rank removed:',
                    member.user.tag,
                    '→',
                    finalRemovedRank,
                    `by ${interaction.user.tag}`
                ].join(' ')
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /removerank command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Rank Removal Failed',

                    [
                        'Evelynn could not complete the Captain Rank removal.',
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