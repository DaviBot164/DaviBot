const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    getUserCases
} = require('../../database/moderationCases');

function formatWarning(
    moderationCase
) {
    const status =
        moderationCase.active
            ? 'Active'
            : 'Removed';

    const timestamp =
        Math.floor(
            new Date(
                moderationCase.createdAt
            ).getTime() / 1000
        );

    return [
        `**#${moderationCase.id} • ${status}**`,
        `Reason: ${
            moderationCase.reason ||
            'No reason provided.'
        }`,
        moderationCase.moderatorId
            ? `Moderator: <@${moderationCase.moderatorId}>`
            : 'Moderator: Akane',
        `Date: <t:${timestamp}:R>`
    ].join('\n');
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('warnings')
            .setDescription(
                'View a member’s warning history.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member whose warnings you want to view.'
                    )
                    .setRequired(true)
            ),

    async execute(interaction) {
        const target =
            interaction.options.getUser(
                'member',
                true
            );

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            const cases =
                await getUserCases(
                    interaction.guild.id,
                    target.id,
                    50
                );

            const warnings =
                cases.filter(
                    moderationCase =>
                        moderationCase.action ===
                        'warn'
                );

            if (!warnings.length) {
                await interaction.editReply({
                    embeds: [
                        createEmbed(
                            'Warning History',
                            `${target} has no recorded warnings.`
                        )
                    ]
                });

                return;
            }

            const activeCount =
                warnings.filter(
                    moderationCase =>
                        moderationCase.active
                ).length;

            const recentWarnings =
                warnings.slice(
                    0,
                    10
                );

            const description = [
                `Member: ${target}`,
                `Active Warnings: **${activeCount}**`,
                `Total Recorded: **${warnings.length}**`,
                '',
                recentWarnings
                    .map(formatWarning)
                    .join('\n\n')
            ].join('\n');

            await interaction.editReply({
                embeds: [
                    createEmbed(
                        '⚠️ Warning History',
                        description
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Warnings command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Warning History Failed',
                        'Akane could not load the warning history.'
                    )
                ]
            });
        }
    }
};