const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const rankDatabase =
    require('../../database/ranks');

/**
 * Format a Discord timestamp.
 *
 * @param {Date|string|number|null} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    if (!value) {
        return 'Unknown';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return [
        `<t:${unixTimestamp}:F>`,
        `-# <t:${unixTimestamp}:R>`
    ].join('\n');
}

/**
 * Format one hierarchy history entry.
 *
 * @param {Object} entry
 * @param {number} position
 * @returns {string}
 */
function formatHistoryEntry(
    entry,
    position
) {
    const action =
        entry.action === 'REMOVE'
            ? '🌑 Rank Revoked'
            : '🏅 Rank Changed';

    const oldRank =
        entry.old_rank ||
        'No previous Rank';

    const newRank =
        entry.new_rank ||
        'No active Rank';

    const moderatorMention =
        entry.moderator_id
            ? `<@${entry.moderator_id}>`
            : 'Unknown High Command';

    const reason =
        entry.reason ||
        'No reason was provided.';

    const createdAt =
        formatDiscordDate(
            entry.created_at
        );

    return [
        `### ${position}. ${action}`,
        `**Previous Rank:** ${oldRank}`,
        `**New Rank:** ${newRank}`,
        `**High Command:** ${moderatorMention}`,
        `**Reason:** ${reason}`,
        `**Recorded:**`,
        createdAt
    ].join('\n');
}

/**
 * Build the complete rank history display.
 *
 * @param {Object[]} history
 * @returns {string}
 */
function buildHistoryDisplay(
    history
) {
    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        return [
            '📖 No Arrancar Rank changes have been recorded for this Soul.',
            '',
            '-# The hierarchy archives will update after the first promotion, demotion or removal.'
        ].join('\n');
    }

    return history
        .map(
            (
                entry,
                index
            ) =>
                formatHistoryEntry(
                    entry,
                    index + 1
                )
        )
        .join(
            '\n\n━━━━━━━━━━━━━━━━━━━━\n\n'
        );
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'rankhistory'
            )
            .setDescription(
                'Open a Soul’s Arrancar hierarchy records.'
            )

            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose Rank history you want to view'
                    )
                    .setRequired(
                        false
                    )
            )

            .addIntegerOption(option =>
                option
                    .setName(
                        'limit'
                    )
                    .setDescription(
                        'Number of hierarchy records to display'
                    )
                    .setMinValue(
                        1
                    )
                    .setMaxValue(
                        10
                    )
                    .setRequired(
                        false
                    )
            )

            .setDMPermission(
                false
            ),

    /**
     * Execute the /rankhistory command.
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

            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ??
                interaction.user;

            const limit =
                interaction.options.getInteger(
                    'limit'
                ) ??
                5;

            const member =
                await interaction.guild.members
                    .fetch(
                        selectedUser.id
                    )
                    .catch(
                        () => null
                    );

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'The selected Soul is not currently inside Las Noches.'
                        )
                    ]
                });

                return;
            }

            const [
                currentRank,
                rankHistory,
                totalHistoryCount
            ] =
                await Promise.all([
                    rankDatabase.getCurrentRank(
                        interaction.guild.id,
                        member.id
                    ),

                    rankDatabase.getRankHistory(
                        interaction.guild.id,
                        member.id,
                        limit
                    ),

                    rankDatabase.countRankHistory(
                        interaction.guild.id,
                        member.id
                    )
                ]);

            const currentRankDisplay =
                currentRank?.rank_name ||
                '⚪ No manually assigned Arrancar Rank';

            const assignedByDisplay =
                currentRank?.assigned_by
                    ? `<@${currentRank.assigned_by}>`
                    : 'Not recorded';

            const assignedAtDisplay =
                currentRank?.assigned_at
                    ? formatDiscordDate(
                        currentRank.assigned_at
                    )
                    : 'Not recorded';

            const currentReasonDisplay =
                currentRank?.reason ||
                'No active Rank assignment is recorded.';

            const historyDisplay =
                buildHistoryDisplay(
                    rankHistory
                );

            const rankHistoryEmbed =
                createEmbed({
                    title:
                        `📖 ${selectedUser.username}'s Hierarchy Records`,

                    description:
                        [
                            `Umbra has opened the Arrancar Rank archives of ${member}.`,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '*Every promotion, demotion and revocation is preserved beneath the eternal moon of Las Noches.*'
                        ].join('\n'),

                    thumbnail:
                        selectedUser.displayAvatarURL({
                            size:
                                1024,

                            forceStatic:
                                false
                        }),

                    fields: [
                        {
                            name:
                                '⚔️ Current Arrancar Rank',

                            value:
                                [
                                    `**Rank:** ${currentRankDisplay}`,
                                    `**Assigned By:** ${assignedByDisplay}`,
                                    `**Reason:** ${currentReasonDisplay}`,
                                    '',
                                    '**Assigned At:**',
                                    assignedAtDisplay
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '📚 Hierarchy Archive',

                            value:
                                [
                                    `**Total Records:** \`${totalHistoryCount}\``,
                                    `**Showing:** \`${rankHistory.length}\``,
                                    '',
                                    historyDisplay
                                ].join('\n'),

                            inline:
                                false
                        }
                    ],

                    footer: {
                        text:
                            `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

                        iconURL:
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        128,

                                    forceStatic:
                                        false
                                })
                    }
                });

            await interaction.editReply({
                embeds: [
                    rankHistoryEmbed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /rankhistory command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Hierarchy Records Unavailable',
                    [
                        'Umbra could not open the requested Arrancar Rank history.',
                        '',
                        'Please inspect the database connection and Northflank logs before trying again.'
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