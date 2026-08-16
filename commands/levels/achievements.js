const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    achievements:
        achievementDatabase
} = require('../../database');

/**
 * Check whether a selected user may
 * participate in the Achievement System.
 *
 * @param {import('discord.js').User} user
 * @returns {boolean}
 */
function isValidAchievementUser(
    user
) {
    return Boolean(
        user &&
        !user.bot
    );
}

/**
 * Format one Achievement collection
 * for the Administrator view.
 *
 * @param {Object[]} achievements
 * @returns {string}
 */
function formatAchievements(
    achievements
) {
    if (
        !Array.isArray(
            achievements
        ) ||
        achievements.length ===
            0
    ) {
        return (
            'This Soul has not unlocked any Achievements yet.'
        );
    }

    return achievements
        .map(
            achievement => {
                const icon =
                    achievement?.icon ||
                    '🏆';

                const name =
                    achievement?.name ||
                    'Unknown Achievement';

                return (
                    `${icon} **${name}**`
                );
            }
        )
        .join('\n');
}

module.exports = {
    category:
        'levels',

    data:
        new SlashCommandBuilder()
            .setName(
                'achievements'
            )
            .setDescription(
                'Manage Soul Achievement records.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(
                false
            )

            /*
             * /achievements view
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'view'
                        )
                        .setDescription(
                            'View the Achievements unlocked by a Soul.'
                        )
                        .addUserOption(
                            option =>
                                option
                                    .setName(
                                        'user'
                                    )
                                    .setDescription(
                                        'The Soul whose Achievements will be viewed'
                                    )
                                    .setRequired(
                                        true
                                    )
                        )
            )

            /*
             * /achievements reset
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'reset'
                        )
                        .setDescription(
                            'Reset all unlocked Achievements for a Soul.'
                        )
                        .addUserOption(
                            option =>
                                option
                                    .setName(
                                        'user'
                                    )
                                    .setDescription(
                                        'The Soul whose Achievement progress will be reset'
                                    )
                                    .setRequired(
                                        true
                                    )
                        )
            ),

    /**
     * Execute the /achievements command.
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
                            'The Achievement administration system can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !interaction
                    .memberPermissions
                    ?.has(
                        PermissionFlagsBits
                            .Administrator
                    )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Permission Denied',
                            'Only an Administrator may manage Achievement records.'
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

            const targetUser =
                interaction.options
                    .getUser(
                        'user',
                        true
                    );

            if (
                !isValidAchievementUser(
                    targetUser
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Soul',
                            'Bots do not participate in the Achievement System.'
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
             * VIEW ACHIEVEMENTS
             */
            if (
                subcommand ===
                'view'
            ) {
                const achievements =
                    await achievementDatabase
                        .getSoulAchievements(
                            interaction.guild.id,
                            targetUser.id
                        );

                const count =
                    achievements.length;

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '🏆 Soul Achievements',
                            [
                                `${targetUser} currently has **${count}** unlocked Achievement${count === 1 ? '' : 's'}.`,
                                '',
                                formatAchievements(
                                    achievements
                                )
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            /*
             * RESET ACHIEVEMENTS
             */
            if (
                subcommand ===
                'reset'
            ) {
                const removedCount =
                    await achievementDatabase
                        .resetSoulAchievements(
                            interaction.guild.id,
                            targetUser.id
                        );

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '♻️ Achievements Reset',
                            [
                                `${targetUser}'s Achievement progress has been reset.`,
                                '',
                                `🏆 **Records Removed:** \`${removedCount}\``,
                                '',
                                'Achievement definitions remain unchanged and may be unlocked again normally.'
                            ].join('\n')
                        )
                    ]
                });

                console.log(
                    `♻️ ${interaction.user.tag} reset ${removedCount} Achievement record(s) for ${targetUser.tag}.`
                );

                return;
            }

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Unknown Subcommand',
                        'Evelynn could not recognize that Achievement action.'
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /achievements command failed:'
            );

            console.error(
                error
            );

            const embed =
                createErrorEmbed(
                    '❌ Achievement Command Failed',
                    'Evelynn could not complete that Achievement action.'
                );

            if (
                interaction.deferred ||
                interaction.replied
            ) {
                await interaction
                    .editReply({
                        embeds:
                            [embed]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds:
                        [embed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};