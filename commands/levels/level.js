const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../../utils/embeds');

const {
    levels: levelDatabase
} = require('../../database');

/**
 * Maximum XP amount accepted by
 * one Administrator action.
 */
const MAX_XP_AMOUNT =
    10_000_000;

/**
 * Maximum Level accepted by
 * one Administrator action.
 */
const MAX_LEVEL =
    10_000;

const INVALID_LEVEL_USER_MESSAGE =
    'Bots cannot participate in the Level System.';

/**
 * Format a number using separators.
 *
 * @param {number} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    return Number(
        value || 0
    ).toLocaleString(
        'en-US'
    );
}

/**
 * Safely send a Level command response.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').EmbedBuilder} embed
 * @returns {Promise<void>}
 */
async function sendLevelResponse(
    interaction,
    embed
) {
    if (interaction.deferred) {
        await interaction.editReply({
            embeds:
                [embed]
        });

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            embeds:
                [embed],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds:
            [embed],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Ensure a selected user is a valid
 * Level System participant.
 *
 * @param {import('discord.js').User} user
 * @returns {boolean}
 */
function isValidLevelUser(
    user
) {
    return Boolean(
        user &&
        !user.bot
    );
}

module.exports = {
    category:
        'levels',

    data:
        new SlashCommandBuilder()
            .setName('level')
            .setDescription(
                'Manage the LUNAR SEIREITEI Level System.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(false)

            /*
             * /level addxp
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('addxp')
                    .setDescription(
                        'Add XP to a Soul.'
                    )

                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription(
                                'The Soul who will receive XP'
                            )
                            .setRequired(true)
                    )

                    .addIntegerOption(option =>
                        option
                            .setName('amount')
                            .setDescription(
                                'The amount of XP to add'
                            )
                            .setMinValue(1)
                            .setMaxValue(
                                MAX_XP_AMOUNT
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level removexp
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('removexp')
                    .setDescription(
                        'Remove XP from a Soul.'
                    )

                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription(
                                'The Soul whose XP will be removed'
                            )
                            .setRequired(true)
                    )

                    .addIntegerOption(option =>
                        option
                            .setName('amount')
                            .setDescription(
                                'The amount of XP to remove'
                            )
                            .setMinValue(1)
                            .setMaxValue(
                                MAX_XP_AMOUNT
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level set
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription(
                        'Set a Soul to an exact Level.'
                    )

                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription(
                                'The Soul whose Level will be changed'
                            )
                            .setRequired(true)
                    )

                    .addIntegerOption(option =>
                        option
                            .setName('level')
                            .setDescription(
                                'The exact Level to assign'
                            )
                            .setMinValue(0)
                            .setMaxValue(
                                MAX_LEVEL
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level reset
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reset')
                    .setDescription(
                        'Reset a Soul’s XP, Level and message count.'
                    )

                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription(
                                'The Soul whose Level data will be reset'
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level reward-add
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reward-add')
                    .setDescription(
                        'Connect a Discord role to a Level reward.'
                    )

                    .addIntegerOption(option =>
                        option
                            .setName('level')
                            .setDescription(
                                'The Level required for this role'
                            )
                            .setMinValue(1)
                            .setMaxValue(
                                MAX_LEVEL
                            )
                            .setRequired(true)
                    )

                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription(
                                'The role Evelynn will grant'
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level reward-remove
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reward-remove')
                    .setDescription(
                        'Remove a configured Level reward.'
                    )

                    .addIntegerOption(option =>
                        option
                            .setName('level')
                            .setDescription(
                                'The configured reward Level'
                            )
                            .setMinValue(1)
                            .setMaxValue(
                                MAX_LEVEL
                            )
                            .setRequired(true)
                    )

                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription(
                                'The reward role to remove'
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level reward-clear
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('reward-clear')
                    .setDescription(
                        'Remove every configured reward from one Level.'
                    )

                    .addIntegerOption(option =>
                        option
                            .setName('level')
                            .setDescription(
                                'The Level whose rewards will be cleared'
                            )
                            .setMinValue(1)
                            .setMaxValue(
                                MAX_LEVEL
                            )
                            .setRequired(true)
                    )
            )

            /*
             * /level rewards
             */
            .addSubcommand(subcommand =>
                subcommand
                    .setName('rewards')
                    .setDescription(
                        'View every configured Level reward.'
                    )
            ),

    /**
     * Execute the /level command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Level administration system can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Permission Denied',
                            'Only an Administrator may manage the LUNAR SEIREITEI Level System.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const subcommand =
                interaction.options
                    .getSubcommand();

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            /*
             * ADD XP
             */
            if (subcommand === 'addxp') {
                const targetUser =
                    interaction.options
                        .getUser(
                            'user',
                            true
                        );

                const amount =
                    interaction.options
                        .getInteger(
                            'amount',
                            true
                        );

                if (
                    !isValidLevelUser(
                        targetUser
                    )
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Soul',
                                INVALID_LEVEL_USER_MESSAGE
                            )
                        ]
                    });

                    return;
                }

                const previousData =
                    await levelDatabase
                        .ensureUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );

                const updatedData =
                    await levelDatabase
                        .addXpAdmin(
                            interaction.guild.id,
                            targetUser.id,
                            amount
                        );

                const levelsGained =
                    Math.max(
                        0,
                        updatedData.level -
                        previousData.level
                    );

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '⭐ XP Added',
                            [
                                `${interaction.user} added XP to ${targetUser}.`,
                                '',
                                `➕ **XP Added:** \`${formatNumber(amount)}\``,
                                `🌑 **Previous Level:** \`${previousData.level}\``,
                                `🌑 **Current Level:** \`${updatedData.level}\``,
                                `⭐ **Current XP:** \`${formatNumber(updatedData.xp)}\``,
                                '',
                                levelsGained > 0
                                    ? `🏆 **Levels Gained:** \`${levelsGained}\``
                                    : 'The Soul did not reach a new Level.'
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `⭐ ${interaction.user.tag} added ${amount} XP to ${targetUser.tag}.`
                );

                return;
            }

            /*
             * REMOVE XP
             */
            if (
                subcommand ===
                'removexp'
            ) {
                const targetUser =
                    interaction.options
                        .getUser(
                            'user',
                            true
                        );

                const amount =
                    interaction.options
                        .getInteger(
                            'amount',
                            true
                        );

                if (
                    !isValidLevelUser(
                        targetUser
                    )
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Soul',
                                INVALID_LEVEL_USER_MESSAGE
                            )
                        ]
                    });

                    return;
                }

                const previousData =
                    await levelDatabase
                        .ensureUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );

                const updatedData =
                    await levelDatabase
                        .removeXp(
                            interaction.guild.id,
                            targetUser.id,
                            amount
                        );

                const actualRemoved =
                    Math.max(
                        0,
                        previousData.xp -
                        updatedData.xp
                    );

                await interaction.editReply({
                    embeds: [
                        createWarningEmbed(
                            '➖ XP Removed',
                            [
                                `${interaction.user} removed XP from ${targetUser}.`,
                                '',
                                `➖ **XP Removed:** \`${formatNumber(actualRemoved)}\``,
                                `🌑 **Previous Level:** \`${previousData.level}\``,
                                `🌑 **Current Level:** \`${updatedData.level}\``,
                                `⭐ **Current XP:** \`${formatNumber(updatedData.xp)}\``
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `➖ ${interaction.user.tag} removed ${actualRemoved} XP from ${targetUser.tag}.`
                );

                return;
            }

            /*
             * SET LEVEL
             */
            if (subcommand === 'set') {
                const targetUser =
                    interaction.options
                        .getUser(
                            'user',
                            true
                        );

                const requestedLevel =
                    interaction.options
                        .getInteger(
                            'level',
                            true
                        );

                if (
                    !isValidLevelUser(
                        targetUser
                    )
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Soul',
                                INVALID_LEVEL_USER_MESSAGE
                            )
                        ]
                    });

                    return;
                }

                const previousData =
                    await levelDatabase
                        .ensureUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );

                const updatedData =
                    await levelDatabase
                        .setLevel(
                            interaction.guild.id,
                            targetUser.id,
                            requestedLevel
                        );

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '🌑 Level Updated',
                            [
                                `${targetUser} was assigned a new Level.`,
                                '',
                                `🌘 **Previous Level:** \`${previousData.level}\``,
                                `🌕 **New Level:** \`${updatedData.level}\``,
                                `⭐ **Total XP:** \`${formatNumber(updatedData.xp)}\``,
                                '',
                                `🛡️ **Updated By:** ${interaction.user}`
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `🌑 ${interaction.user.tag} set ${targetUser.tag} to Level ${updatedData.level}.`
                );

                return;
            }

            /*
             * RESET LEVEL DATA
             */
            if (subcommand === 'reset') {
                const targetUser =
                    interaction.options
                        .getUser(
                            'user',
                            true
                        );

                if (
                    !isValidLevelUser(
                        targetUser
                    )
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Soul',
                                INVALID_LEVEL_USER_MESSAGE
                            )
                        ]
                    });

                    return;
                }

                const previousData =
                    await levelDatabase
                        .ensureUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );

                const resetData =
                    await levelDatabase
                        .resetUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );

                await interaction.editReply({
                    embeds: [
                        createWarningEmbed(
                            '♻️ Level Data Reset',
                            [
                                `${targetUser} has been returned to the beginning of the path.`,
                                '',
                                `🌑 **Previous Level:** \`${previousData.level}\``,
                                `⭐ **Previous XP:** \`${formatNumber(previousData.xp)}\``,
                                `💬 **Previous Messages:** \`${formatNumber(previousData.messageCount)}\``,
                                '',
                                `🌑 **Current Level:** \`${resetData.level}\``,
                                `⭐ **Current XP:** \`${formatNumber(resetData.xp)}\``,
                                '',
                                `🛡️ **Reset By:** ${interaction.user}`
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `♻️ ${interaction.user.tag} reset Level data for ${targetUser.tag}.`
                );

                return;
            }

            /*
             * ADD LEVEL REWARD
             */
            if (
                subcommand ===
                'reward-add'
            ) {
                const requiredLevel =
                    interaction.options
                        .getInteger(
                            'level',
                            true
                        );

                const rewardRole =
                    interaction.options
                        .getRole(
                            'role',
                            true
                        );

                const botMember =
                    interaction.guild
                        .members.me;

                if (
                    rewardRole.id ===
                    interaction.guild.id
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Reward Role',
                                'The `@everyone` role cannot be used as a Level reward.'
                            )
                        ]
                    });

                    return;
                }

                if (rewardRole.managed) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Managed Role',
                                'Integration and bot-managed roles cannot be used as Level rewards.'
                            )
                        ]
                    });

                    return;
                }

                if (
                    !botMember ||
                    !botMember.permissions.has(
                        PermissionFlagsBits.ManageRoles
                    )
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Missing Permission',
                                'Evelynn requires the **Manage Roles** permission to grant Level rewards.'
                            )
                        ]
                    });

                    return;
                }

                if (
                    rewardRole.position >=
                    botMember.roles.highest.position
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Role Hierarchy Error',
                                [
                                    `Evelynn cannot manage ${rewardRole}.`,
                                    '',
                                    'Move the **Evelynn** role above this reward role in the server role list.'
                                ].join('\n')
                            )
                        ]
                    });

                    return;
                }

                await levelDatabase
                    .addLevelReward(
                        interaction.guild.id,
                        requiredLevel,
                        rewardRole.id,
                        interaction.user.id
                    );

                const requiredXp =
                    levelDatabase
                        .getTotalXpForLevel(
                            requiredLevel
                        );

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '🎖️ Level Reward Added',
                            [
                                `${rewardRole} is now a Level reward in LUNAR SEIREITEI.`,
                                '',
                                `🌑 **Required Level:** \`${requiredLevel}\``,
                                `⭐ **Required Total XP:** \`${formatNumber(requiredXp)}\``,
                                `🎭 **Reward Role:** ${rewardRole}`,
                                '',
                                `🛡️ **Configured By:** ${interaction.user}`
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `🎖️ Level ${requiredLevel} reward added: ${rewardRole.name}`
                );

                return;
            }

            /*
             * REMOVE LEVEL REWARD
             */
            if (
                subcommand ===
                'reward-remove'
            ) {
                const requiredLevel =
                    interaction.options
                        .getInteger(
                            'level',
                            true
                        );

                const rewardRole =
                    interaction.options
                        .getRole(
                            'role',
                            true
                        );

                const removed =
                    await levelDatabase
                        .removeLevelReward(
                            interaction.guild.id,
                            requiredLevel,
                            rewardRole.id
                        );

                if (!removed) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Reward Not Found',
                                [
                                    `${rewardRole} is not configured as a reward for Level \`${requiredLevel}\`.`,
                                    '',
                                    'Use `/level rewards` to view the current configuration.'
                                ].join('\n')
                            )
                        ]
                    });

                    return;
                }

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '🗑️ Level Reward Removed',
                            [
                                `${rewardRole} will no longer be granted at Level \`${requiredLevel}\`.`,
                                '',
                                `🛡️ **Removed By:** ${interaction.user}`
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `🗑️ Level ${requiredLevel} reward removed: ${rewardRole.name}`
                );

                return;
            }

            /*
             * CLEAR LEVEL REWARDS
             */
            if (
                subcommand ===
                'reward-clear'
            ) {
                const requiredLevel =
                    interaction.options
                        .getInteger(
                            'level',
                            true
                        );

                const removedCount =
                    await levelDatabase
                        .removeLevelRewardsAtLevel(
                            interaction.guild.id,
                            requiredLevel
                        );

                if (
                    removedCount ===
                    0
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Rewards Not Found',
                                `No rewards are configured for Level \`${requiredLevel}\`.`
                            )
                        ]
                    });

                    return;
                }

                await interaction.editReply({
                    embeds: [
                        createWarningEmbed(
                            '🗑️ Level Rewards Cleared',
                            [
                                `Removed \`${removedCount}\` reward(s) from Level \`${requiredLevel}\`.`,
                                '',
                                `🛡️ **Cleared By:** ${interaction.user}`
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `🗑️ ${interaction.user.tag} cleared ${removedCount} reward(s) from Level ${requiredLevel}.`
                );

                return;
            }

            /*
             * VIEW LEVEL REWARDS
             */
            if (
                subcommand ===
                'rewards'
            ) {
                const rewards =
                    await levelDatabase
                        .getLevelRewards(
                            interaction.guild.id
                        );

                if (
                    rewards.length === 0
                ) {
                    await interaction.editReply({
                        embeds: [
                            createEmbed({
                                title:
                                    '☾・LEVEL REWARDS',

                                description:
                                    [
                                        'No Level rewards are currently configured.',
                                        '',
                                        'Use:',
                                        '`/level reward-add`',
                                        '',
                                        'to connect an existing Discord role to a Level.'
                                    ].join('\n'),

                                thumbnail:
                                    interaction.guild
                                        .iconURL({
                                            extension:
                                                'png',

                                            size:
                                                256,

                                            forceStatic:
                                                false
                                        })
                            })
                        ]
                    });

                    return;
                }

                const rewardLines =
                    rewards.map(
                        (
                            reward,
                            index
                        ) => {
                            const role =
                                interaction.guild
                                    .roles.cache.get(
                                        reward.roleId
                                    );

                            const roleDisplay =
                                role
                                    ? `${role}`
                                    : `Deleted Role \`${reward.roleId}\``;

                            const requiredXp =
                                levelDatabase
                                    .getTotalXpForLevel(
                                        reward.level
                                    );

                            return [
                                `**${index + 1}. Level ${reward.level}**`,
                                `🎭 ${roleDisplay}`,
                                `⭐ \`${formatNumber(requiredXp)} total XP\``
                            ].join('\n');
                        }
                    );

                await interaction.editReply({
                    embeds: [
                        createEmbed({
                            title:
                                '☾・LEVEL REWARDS',

                            description:
                                [
                                    'Progression rewards earned beneath the eternal moon.',
                                    '',
                                    '━━━━━━━━━━━━━━━━━━━━',
                                    '',
                                    rewardLines.join(
                                        '\n\n'
                                    ),
                                    '',
                                    '━━━━━━━━━━━━━━━━━━━━',
                                    '',
                                    `📜 **Configured Rewards:** \`${rewards.length}\``
                                ].join('\n'),

                            thumbnail:
                                interaction.guild
                                    .iconURL({
                                        extension:
                                            'png',

                                        size:
                                            512,

                                        forceStatic:
                                            false
                                    })
                        })
                    ]
                });

                return;
            }

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Unknown Level Action',
                        'Evelynn does not recognize this Level administration action.'
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /level command error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Level Administration Failed',
                    [
                        'Evelynn could not complete this Level System action.',
                        '',
                        'Please check the PostgreSQL connection and Evelynn permissions.'
                    ].join('\n')
                );

            await sendLevelResponse(
                interaction,
                errorEmbed
            ).catch(
                () => null
            );
        }
    }
};