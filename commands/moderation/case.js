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
    getCase
} = require('../../database/moderationCases');

const {
    formatDuration
} = require('../../handlers/moderationService');

const ACTION_NAMES =
    Object.freeze({
        warn: 'Warning',
        unwarn: 'Warning Removed',
        timeout: 'Timeout',
        untimeout: 'Timeout Removed',
        kick: 'Kick',
        ban: 'Ban',
        unban: 'Ban Removed',
        lock: 'Channel Locked',
        unlock: 'Channel Unlocked',
        slowmode: 'Slowmode',
        clear: 'Messages Cleared',
        guardian: 'Guardian',
        emergency: 'Emergency Control'
    });

function formatDate(date) {
    if (!date) {
        return '—';
    }

    return `<t:${Math.floor(
        new Date(date).getTime() / 1000
    )}:F>`;
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('case')
            .setDescription(
                'View a moderation case.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ModerateMembers
            )
            .addIntegerOption(option =>
                option
                    .setName('id')
                    .setDescription(
                        'Moderation case ID.'
                    )
                    .setRequired(true)
                    .setMinValue(1)
            ),

    async execute(interaction) {
        const caseId =
            interaction.options
                .getInteger(
                    'id',
                    true
                );

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            const moderationCase =
                await getCase(
                    interaction.guild.id,
                    caseId
                );

            if (!moderationCase) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Case Not Found',
                            `Moderation case **#${caseId}** does not exist.`
                        )
                    ]
                });

                return;
            }

            const action =
                ACTION_NAMES[
                    moderationCase.action
                ] ??
                moderationCase.action;

            const details = [
                `**Case:** #${moderationCase.id}`,
                `**Action:** ${action}`,
                `**Status:** ${
                    moderationCase.active
                        ? 'Active'
                        : 'Resolved'
                }`
            ];

            if (moderationCase.userId) {
                details.push(
                    `**Target:** <@${moderationCase.userId}> (\`${moderationCase.userId}\`)`
                );
            }

            if (
                moderationCase.moderatorId
            ) {
                details.push(
                    `**Moderator:** <@${moderationCase.moderatorId}>`
                );
            }

            if (
                moderationCase.channelId
            ) {
                details.push(
                    `**Channel:** <#${moderationCase.channelId}>`
                );
            }

            if (
                moderationCase.durationMs !==
                null
            ) {
                details.push(
                    `**Duration:** ${formatDuration(
                        moderationCase.durationMs
                    )}`
                );
            }

            details.push(
                `**Reason:** ${
                    moderationCase.reason ||
                    'No reason provided.'
                }`,
                `**Created:** ${formatDate(
                    moderationCase.createdAt
                )}`
            );

            if (
                moderationCase.expiresAt
            ) {
                details.push(
                    `**Expires:** ${formatDate(
                        moderationCase.expiresAt
                    )}`
                );
            }

            if (
                moderationCase.resolvedAt
            ) {
                details.push(
                    '',
                    `**Resolved:** ${formatDate(
                        moderationCase.resolvedAt
                    )}`
                );

                if (
                    moderationCase.resolvedBy
                ) {
                    details.push(
                        `**Resolved By:** <@${moderationCase.resolvedBy}>`
                    );
                }

                if (
                    moderationCase
                        .resolutionReason
                ) {
                    details.push(
                        `**Resolution:** ${moderationCase.resolutionReason}`
                    );
                }
            }

            await interaction.editReply({
                embeds: [
                    createEmbed(
                        `🛡️ Moderation Case #${moderationCase.id}`,
                        details.join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Case command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Case Failed',
                        'Akane could not load that moderation case.'
                    )
                ]
            });
        }
    }
};