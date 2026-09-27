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

const ACTION_NAMES =
    Object.freeze({
        warn: 'Warning',
        unwarn: 'Warning Removed',
        timeout: 'Timeout',
        untimeout: 'Timeout Removed',
        kick: 'Kick',
        ban: 'Ban',
        unban: 'Ban Removed',
        guardian: 'Guardian'
    });

function formatDate(date) {
    return `<t:${Math.floor(
        new Date(date).getTime() / 1000
    )}:d>`;
}

function trimReason(reason) {
    if (!reason) {
        return 'No reason provided.';
    }

    if (reason.length <= 80) {
        return reason;
    }

    return `${reason.slice(0, 77)}...`;
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('history')
            .setDescription(
                'View a member moderation history.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member whose history you want to view.'
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
                    20
                );

            if (!cases.length) {
                await interaction.editReply({
                    embeds: [
                        createEmbed(
                            '🛡️ Moderation History',
                            [
                                `Member: ${target}`,
                                '',
                                'No moderation cases were found.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            const entries =
                cases.map(
                    moderationCase => {
                        const action =
                            ACTION_NAMES[
                                moderationCase.action
                            ] ??
                            moderationCase.action;

                        const status =
                            moderationCase.active
                                ? 'Active'
                                : 'Resolved';

                        return [
                            `**#${moderationCase.id} • ${action}**`,
                            `${formatDate(
                                moderationCase.createdAt
                            )} • ${status}`,
                            trimReason(
                                moderationCase.reason
                            )
                        ].join('\n');
                    }
                );

            await interaction.editReply({
                embeds: [
                    createEmbed(
                        '🛡️ Moderation History',
                        [
                            `Member: ${target} (\`${target.id}\`)`,
                            `Cases: **${cases.length}**`,
                            '',
                            entries.join('\n\n')
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'History command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'History Failed',
                        'Akane could not load this member’s moderation history.'
                    )
                ]
            });
        }
    }
};