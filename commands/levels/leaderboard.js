const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    levels: levelDatabase
} = require('../../database');

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
 * Return a placement medal.
 *
 * @param {number} position
 * @returns {string}
 */
function getRankMedal(
    position
) {
    if (position === 1) {
        return '🥇';
    }

    if (position === 2) {
        return '🥈';
    }

    if (position === 3) {
        return '🥉';
    }

    return '▫️';
}

module.exports = {
    category:
        'levels',

    data:
        new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription(
                'View the strongest Souls within the Crimson Eclipse Order.'
            )
            .setDMPermission(false),

    /**
     * Execute the /leaderboard command.
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
                            'The Leaderboard can only be viewed inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const leaderboard =
                await levelDatabase
                    .getLeaderboard(
                        interaction.guild.id,
                        10
                    );

            if (
                leaderboard.length === 0
            ) {
                await interaction.editReply({
                    embeds: [
                        createEmbed({
                            title:
                                '🏆 Crimson Eclipse Leaderboard',

                            description:
                                [
                                    'No Souls have earned XP yet.',
                                    '',
                                    'Begin speaking within the Order to start your ascent beneath the crimson moon.'
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

            const leaderboardLines = [];

            for (
                const entry
                of leaderboard
            ) {
                const user =
                    await interaction.client.users
                        .fetch(
                            entry.userId
                        )
                        .catch(
                            () => null
                        );

                const displayName =
                    user
                        ? user.username
                        : `Unknown Soul (${entry.userId})`;

                const medal =
                    getRankMedal(
                        entry.rank
                    );

                leaderboardLines.push(
                    [
                        `${medal} **#${entry.rank} • ${displayName}**`,
                        `🌑 Level \`${entry.level}\` • ⭐ \`${formatNumber(entry.xp)} XP\``,
                        `💬 \`${formatNumber(entry.messageCount)} messages\``
                    ].join('\n')
                );
            }

            const leaderboardEmbed =
                createEmbed({
                    title:
                        '🏆 Crimson Eclipse Leaderboard',

                    description:
                        [
                            'The strongest Souls currently standing beneath the crimson moon.',
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            leaderboardLines.join(
                                '\n\n'
                            ),
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '*Strength is earned through loyalty, activity and determination.*'
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
                });

            await interaction.editReply({
                embeds:
                    [leaderboardEmbed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /leaderboard command error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Leaderboard Failed',
                    [
                        'Umbra could not retrieve the Crimson Eclipse leaderboard.',
                        '',
                        'Please try again after the PostgreSQL connection is available.'
                    ].join('\n')
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds:
                            [errorEmbed],

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
                    embeds:
                        [errorEmbed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};