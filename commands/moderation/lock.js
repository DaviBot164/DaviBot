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
    saveChannelLock
} = require('../../database/channelLocks');

const {
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('lock')
            .setDescription(
                'Lock a text channel for @everyone.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageChannels
            )
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription(
                        'Channel to lock. Defaults to the current channel.'
                    )
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for locking the channel.'
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
            'Channel locked by staff.';

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
                        'Lock Failed',
                        'That channel cannot be locked.'
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
                        'Lock Failed',
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
            const existingLock =
                await getChannelLock(
                    interaction.guild.id,
                    channel.id
                );

            if (existingLock) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Already Locked',
                            `${channel} is already locked by Akane.`
                        )
                    ]
                });

                return;
            }

            const everyoneRole =
                interaction.guild.roles.everyone;

            const overwrite =
                channel.permissionOverwrites
                    .cache.get(
                        everyoneRole.id
                    );

            let previousSendMessages =
                null;

            if (
                overwrite?.allow.has(
                    PermissionFlagsBits.SendMessages
                )
            ) {
                previousSendMessages =
                    true;
            } else if (
                overwrite?.deny.has(
                    PermissionFlagsBits.SendMessages
                )
            ) {
                previousSendMessages =
                    false;
            }

            await channel.permissionOverwrites.edit(
                everyoneRole,
                {
                    SendMessages:
                        false
                },
                {
                    reason
                }
            );

            let moderationCase;

            try {
                moderationCase =
                    await recordModerationAction({
                        guild:
                            interaction.guild,

                        userId:
                            null,

                        moderatorId:
                            interaction.user.id,

                        action:
                            'lock',

                        reason,

                        channelId:
                            channel.id,

                        metadata: {
                            previousSendMessages
                        },

                        active:
                            true
                    });

                await saveChannelLock({
                    guildId:
                        interaction.guild.id,

                    channelId:
                        channel.id,

                    moderatorId:
                        interaction.user.id,

                    previousSendMessages,

                    caseId:
                        moderationCase.id
                });
            } catch (error) {
                /*
                 * DB recording failed after Discord
                 * permissions changed. Restore the
                 * original overwrite immediately.
                 */
                await channel.permissionOverwrites.edit(
                    everyoneRole,
                    {
                        SendMessages:
                            previousSendMessages
                    },
                    {
                        reason:
                            'Akane lock rollback'
                    }
                );

                throw error;
            }

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Channel Locked',
                        [
                            `${channel} has been locked.`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Lock command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Lock Failed',
                        'Akane could not lock this channel.'
                    )
                ]
            });
        }
    }
};