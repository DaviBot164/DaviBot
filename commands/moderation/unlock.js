const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    getChannelLock,
    deleteChannelLock
} = require('../../database/channelLocks');

const {
    resolveCase
} = require('../../database/moderationCases');

const {
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('unlock')
            .setDescription(
                'Restore a channel locked by Akane.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageChannels
            )
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription(
                        'Channel to unlock. Defaults to the current channel.'
                    )
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for unlocking the channel.'
                    )
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const channel =
            interaction.options.getChannel(
                'channel'
            ) ??
            interaction.channel;

        const reason =
            interaction.options.getString(
                'reason'
            ) ??
            'Channel unlocked by staff.';

        if (
            !channel ||
            !channel.isTextBased() ||
            !channel.permissionOverwrites
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Unlock Failed',
                        'That channel cannot be unlocked.'
                    )
                ]
            });

            return;
        }

        const botMember =
            interaction.guild.members.me;

        const botPermissions =
            channel.permissionsFor(
                botMember
            );

        if (
            !botPermissions?.has(
                PermissionFlagsBits.ManageChannels
            )
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Unlock Failed',
                        'Akane needs Manage Channels permission for that channel.'
                    )
                ]
            });

            return;
        }

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            const lock =
                await getChannelLock(
                    interaction.guild.id,
                    channel.id
                );

            if (!lock) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Not Locked',
                            `${channel} has no active Akane lock record.`
                        )
                    ]
                });

                return;
            }

            const everyoneRole =
                interaction.guild.roles.everyone;

            await channel.permissionOverwrites.edit(
                everyoneRole,
                {
                    SendMessages:
                        lock.previousSendMessages
                },
                {
                    reason
                }
            );

            try {
                if (lock.caseId) {
                    await resolveCase(
                        interaction.guild.id,
                        lock.caseId,
                        {
                            resolvedBy:
                                interaction.user.id,

                            reason
                        }
                    );
                }

                const moderationCase =
                    await recordModerationAction({
                        guild:
                            interaction.guild,

                        userId:
                            null,

                        moderatorId:
                            interaction.user.id,

                        action:
                            'unlock',

                        reason,

                        channelId:
                            channel.id,

                        metadata: {
                            lockCaseId:
                                lock.caseId,

                            restoredSendMessages:
                                lock.previousSendMessages
                        },

                        active:
                            false
                    });

                await deleteChannelLock(
                    interaction.guild.id,
                    channel.id
                );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Channel Unlocked',
                            [
                                `${channel} has been restored.`,
                                `Case: **#${moderationCase.id}**`,
                                lock.caseId
                                    ? `Lock Case: **#${lock.caseId}**`
                                    : null,
                                `Reason: ${reason}`
                            ]
                                .filter(Boolean)
                                .join('\n')
                        )
                    ]
                });
            } catch (error) {
                /*
                 * The Discord permission was restored,
                 * but database finalization failed.
                 *
                 * Re-lock the channel so Discord and
                 * Akane's stored state stay consistent.
                 */
                try {
                    await channel.permissionOverwrites.edit(
                        everyoneRole,
                        {
                            SendMessages:
                                false
                        },
                        {
                            reason:
                                'Akane unlock rollback'
                        }
                    );
                } catch (rollbackError) {
                    console.error(
                        'Unlock rollback failed:',
                        rollbackError
                    );
                }

                throw error;
            }
        } catch (error) {
            console.error(
                'Unlock command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Unlock Failed',
                        'Akane could not unlock this channel.'
                    )
                ]
            });
        }
    }
};