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
            .setName('ban')
            .setDescription(
                'Ban a member from the server.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.BanMembers
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Member to ban.'
                    )
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for the ban.'
                    )
                    .setRequired(true)
                    .setMaxLength(500)
            )
            .addIntegerOption(option =>
                option
                    .setName('delete_messages')
                    .setDescription(
                        'Delete recent messages from the member.'
                    )
                    .addChoices(
                        {
                            name: 'None',
                            value: 0
                        },
                        {
                            name: 'Last Hour',
                            value: 3600
                        },
                        {
                            name: 'Last 6 Hours',
                            value: 21600
                        },
                        {
                            name: 'Last 12 Hours',
                            value: 43200
                        },
                        {
                            name: 'Last 24 Hours',
                            value: 86400
                        },
                        {
                            name: 'Last 3 Days',
                            value: 259200
                        },
                        {
                            name: 'Last 7 Days',
                            value: 604800
                        }
                    )
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

        const deleteMessageSeconds =
            interaction.options.getInteger(
                'delete_messages'
            ) ?? 0;

        if (!target) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Ban Failed',
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
                        'Ban Failed',
                        check.reason
                    )
                ]
            });

            return;
        }

        if (!target.bannable) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Ban Failed',
                        'Akane cannot ban this member.'
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
            const moderationCase =
                await recordModerationAction({
                    guild:
                        interaction.guild,

                    userId:
                        target.id,

                    moderatorId:
                        interaction.user.id,

                    action:
                        'ban',

                    reason,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        username:
                            target.user.username,

                        deleteMessageSeconds
                    },

                    active:
                        true,

                    target
                });

            try {
                await target.send({
                    embeds: [
                        errorEmbed(
                            'Banned from Server',
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

            await target.ban({
                deleteMessageSeconds,

                reason:
                    `${reason} | Case #${moderationCase.id}`
            });

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Member Banned',
                        [
                            `**${target.user.username}** was banned.`,
                            `Case: **#${moderationCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Ban command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Ban Failed',
                        'Akane could not ban this member.'
                    )
                ]
            });
        }
    }
};