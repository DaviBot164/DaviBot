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
    sendRankFeed
} = require('../../utils/kingdomFeed');

/**
 * Every manually assignable Arrancar Rank.
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
 * Las Noches roles allowed to manage
 * the manual Arrancar hierarchy.
 *
 * Lieutenants are intentionally excluded.
 */
const RANK_MANAGER_ROLES = [
    '👑 Ruler of Las Noches',
    '⚜️ Head Captain',
    '🛡️ Captain'
];

/**
 * Official promotion and hierarchy
 * announcement channel.
 */
const PROMOTION_CHANNEL_NAME =
    '🏅・hall-of-promotions';

/**
 * Check whether a member may manage
 * manually assigned Arrancar Ranks.
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
 * Find the official Hall of Promotions
 * text channel.
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

    return channel || null;
}

/**
 * Create the official Rank removal
 * announcement embed.
 *
 * @param {Object} options
 * @param {import('discord.js').GuildMember} options.member
 * @param {import('discord.js').User} options.moderator
 * @param {string} options.removedRank
 * @param {string} options.reason
 * @param {number|string|null} options.historyId
 * @returns {import('discord.js').EmbedBuilder}
 */
function createRankRemovalEmbed({
    member,
    moderator,
    removedRank,
    reason,
    historyId
}) {
    const removedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    const historyDisplay =
        historyId
            ? `#${historyId}`
            : 'Pending Archive';

    return createEmbed({
        title:
            '🌑 Arrancar Rank Revoked',

        description:
            [
                `${member} no longer holds a manually assigned position within the Arrancar hierarchy of Las Noches.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Umbra has preserved this decision within the eternal Soul Archives.*'
            ].join('\n'),

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
                    '📜 Revoked Rank',

                value:
                    removedRank,

                inline:
                    true
            },
            {
                name:
                    '⚪ Current Rank',

                value:
                    'No manually assigned Arrancar Rank',

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
                    '🕒 Revoked At',

                value:
                    `<t:${removedAt}:F>\n` +
                    `(<t:${removedAt}:R>)`,

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
                '🌙 Umbra • Guardian of Las Noches'
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
                'Remove a Soul’s manually assigned Arrancar Rank.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose Rank should be removed'
                    )
                    .setRequired(
                        true
                    )
            )

            .addStringOption(option =>
                option
                    .setName(
                        'reason'
                    )
                    .setDescription(
                        'Reason for removing this Arrancar Rank'
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
     * Execute the /removerank command.
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
                                'Only the Las Noches High Command may remove Arrancar Ranks.',
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
                            'Arrancar Ranks cannot be removed from Discord bots.'
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
                            'Umbra requires the **Manage Roles** permission to remove Arrancar Ranks.'
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
                await rankDatabase
                    .getCurrentRank(
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
                            `${member} does not currently hold a manually assigned Arrancar Rank.`
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
                        role.position >=
                        botMember.roles.highest.position
                );

            if (
                unmanageableRole
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Hierarchy Error',
                            [
                                `Umbra cannot remove ${unmanageableRole}.`,
                                '',
                                'Move Umbra’s Discord role above every manually assignable Arrancar Rank and try again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const roleRankNames =
                currentRankRoles.map(
                    role =>
                        role.name
                );

            const removedRankDisplay =
                databaseRank?.rank_name ||
                roleRankNames[0] ||
                'Unknown Arrancar Rank';

            await interaction.deferReply();            try {
                if (
                    currentRankRoles.size >
                    0
                ) {
                    await member.roles.remove(
                        currentRankRoles,
                        `Arrancar Rank removed by ${interaction.user.tag}: ${reason}`
                    );
                }
            } catch (roleError) {
                console.error(
                    '❌ Umbra could not remove the Arrancar Rank roles:',
                    roleError
                );

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Rank Removal Failed',
                            [
                                'Umbra could not remove the selected Soul’s Arrancar Rank role.',
                                '',
                                'Verify the following:',
                                '• Umbra has **Manage Roles**',
                                '• Umbra is above all Arrancar Rank roles',
                                '• The Rank role is not controlled by another integration'
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
                    '❌ Umbra could not save the Rank removal:',
                    databaseError
                );

                /*
                 * PostgreSQL failed after the
                 * Discord Rank roles were removed.
                 *
                 * Restore the previous roles
                 * wherever possible.
                 */
                if (
                    currentRankRoles.size >
                    0
                ) {
                    await member.roles
                        .add(
                            currentRankRoles,
                            'Rank database removal failed; restoring previous roles.'
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
                                'Umbra could not save this Rank removal inside PostgreSQL.',
                                '',
                                'The previous Discord Rank was restored where possible.',
                                '',
                                'Check the Northflank database logs before trying again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            /*
             * If Discord contained a Rank role
             * but PostgreSQL had no active record,
             * removeRank() returns null.
             *
             * The Discord cleanup is still treated
             * as a successful Rank removal.
             */
            const historyId =
                removedRecord?.history_id ??
                null;

            const archivedRemovedRank =
                removedRecord
                    ?.removed_rank_name ||
                null;

            const finalRemovedRankDisplay =
                archivedRemovedRank ||
                removedRankDisplay;

            const removalEmbed =
                createRankRemovalEmbed({
                    member,

                    moderator:
                        interaction.user,

                    removedRank:
                        finalRemovedRankDisplay,

                    reason,

                    historyId
                });

            await interaction.editReply({
                embeds: [
                    removalEmbed
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
                            removalEmbed
                        ],

                        allowedMentions: {
                            users: [
                                member.id
                            ]
                        }
                    })
                    .catch(error => {
                        console.error(
                            '⚠️ Umbra could not publish the Rank removal announcement:',
                            error
                        );
                    });
            }            /*
             * Publish the Rank revocation
             * into the public Kingdom Feed.
             */
            await sendRankFeed({
                member,

                moderator:
                    interaction.user,

                oldRank:
                    finalRemovedRankDisplay,

                newRank:
                    null,

                reason,

                historyId,

                revoked:
                    true
            }).catch(error => {
                console.error(
                    '⚠️ Umbra could not publish the Rank Kingdom Feed:',
                    error
                );
            });

            console.log(
                '======================================'
            );

            console.log(
                '🌑 Arrancar Rank Revoked'
            );

            console.log(
                `🌙 Soul: ${member.user.tag}`
            );

            console.log(
                `📜 Removed Rank: ${finalRemovedRankDisplay}`
            );

            console.log(
                `👑 High Command: ${interaction.user.tag}`
            );

            console.log(
                `🆔 History Record: ${historyId ?? 'Unknown'}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Umbra /removerank command failed:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Arrancar Rank Removal Failed',
                    [
                        'Umbra could not complete the requested Arrancar Rank removal.',
                        '',
                        'No additional changes were applied.',
                        '',
                        'Inspect the Northflank logs for more information.'
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