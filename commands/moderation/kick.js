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
    canModerate,
    recordModerationAction
} = require('../../handlers/moderationService');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription(
                'Remove a member from the server.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.KickMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member to kick.'
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for the kick.'
                    )
                    .setRequired(true)
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const target =
            interaction.options.getMember(
                'member'
            );

        const reason =
            interaction.options.getString(
                'reason',
                true
            );

        if (!target) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Kick Failed',
                        'That member could not be found in this server.'
                    )
                ]
            });

            return;
        }

        const check =
            canModerate(
                interaction.member,
                target
            );

        if (!check.allowed) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Kick Failed',
                        check.reason
                    )
                ]
            });

            return;
        }

        if (!target.kickable) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Kick Failed',
                        'Akane cannot kick this member.'
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
            /*
             * Create the case before kicking so
             * the action always has an audit ID.
             */
            const moderationCase =
                await recordModerationAction({
                    guild:
                        interaction.guild,

                    userId:
                        target.id,

                    moderatorId:
                        interaction.user.id,

                    action:
                        'kick',

                    reason,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        username:
                            target.user.username
                    },

                    active:
                        false,

                    target
                });

            /*
             * Try to notify the member while
             * they are still in the server.
             */
            try {
                await target.send({
                    embeds: [
                        errorEmbed(
                            'Removed from Server',
                            [
                                `Server: **${interaction.guild.name}**`,
                                `Case: **#${moderationCase.id}**`,
                                `Reason: ${reason}`
                            ].join('\n')
                        )
                    ]
                });
            } catch {
                // Member DMs may be disabled.
            }

            await target.kick(
                `${reason} | Case #${moderationCase.id}`
            );

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Member Kicked',
                        [
                            `**${target.user.username}** was removed from the server.`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Kick command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Kick Failed',
                        'Akane could not kick this member.'
                    )
                ]
            });
        }
    }
};