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
 * Create a visual XP progress bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 12
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filledBlocks =
        Math.round(
            (
                safePercentage /
                100
            ) *
            length
        );

    const emptyBlocks =
        length -
        filledBlocks;

    return (
        '█'.repeat(filledBlocks) +
        '░'.repeat(emptyBlocks)
    );
}

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

module.exports = {
    category:
        'levels',

    data:
        new SlashCommandBuilder()
            .setName('rank')
            .setDescription(
                'View a Soul’s Level, XP and position within the Order.'
            )
            .setDMPermission(false)

            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription(
                        'The Soul whose rank you want to view'
                    )
                    .setRequired(false)
            ),

    /**
     * Execute the /rank command.
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
                            'The Rank System can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const targetUser =
                interaction.options
                    .getUser(
                        'user'
                    ) ||
                interaction.user;

            if (targetUser.bot) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Soul',
                            'Bots do not participate in the Crimson Eclipse Level System.'
                        )
                    ]
                });

                return;
            }

            let levelData =
                await levelDatabase
                    .getUserLevel(
                        interaction.guild.id,
                        targetUser.id
                    );

            if (!levelData) {
                levelData =
                    await levelDatabase
                        .ensureUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );
            }

            const rankPosition =
                await levelDatabase
                    .getUserRank(
                        interaction.guild.id,
                        targetUser.id
                    );

            const progress =
                levelData.progress;

            const progressBar =
                createProgressBar(
                    progress.progressPercent
                );

            const xpUntilNextLevel =
                Math.max(
                    0,
                    progress.nextLevelXp -
                    levelData.xp
                );

            const rankEmbed =
                createEmbed({
                    title:
                        `🌑 Soul Rank • ${targetUser.username}`,

                    description:
                        [
                            `${targetUser}, your journey beneath the crimson moon has been recorded.`,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            `🏆 **Server Rank:** \`#${rankPosition || 1}\``,
                            `🌑 **Level:** \`${levelData.level}\``,
                            `⭐ **Total XP:** \`${formatNumber(levelData.xp)}\``,
                            `💬 **Messages Recorded:** \`${formatNumber(levelData.messageCount)}\``,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            `📈 **Progress to Level ${levelData.level + 1}**`,
                            `\`${progressBar}\` **${progress.progressPercent}%**`,
                            '',
                            `⭐ \`${formatNumber(progress.progressXp)} / ${formatNumber(progress.requiredForNextLevel)} XP\``,
                            `🌙 \`${formatNumber(xpUntilNextLevel)} XP\` remaining`,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '*Continue your ascent and conquer the path beneath the crimson moon.*'
                        ].join('\n'),

                    thumbnail:
                        targetUser
                            .displayAvatarURL({
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
                    [rankEmbed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /rank command error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Rank System Failed',
                    [
                        'Umbra could not retrieve this Soul’s Level record.',
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