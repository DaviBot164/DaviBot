const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    getUser
} = require('../../database/users');

const {
    getRankForLevel
} = require('../../config/progression');

const {
    changeRank
} = require('../../handlers/rankService');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerank')
        .setDescription(
            'Return a member to their automatic progression rank.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription(
                    'Member whose special rank will be removed.'
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for removing the rank.'
                )
                .setMaxLength(200)
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const selected =
            interaction.options.getUser(
                'member',
                true
            );

        const reason =
            interaction.options.getString(
                'reason'
            ) ?? 'Staff rank removal';

        const member =
            await interaction.guild.members
                .fetch(selected.id)
                .catch(() => null);

        if (!member || member.user.bot) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Invalid Member',
                        'That member does not have a valid progression profile.'
                    )
                ]
            });

            return;
        }

        const user = await getUser(
            interaction.guild.id,
            member.id
        );

        if (!user?.faction) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Path Required',
                        `${member} has not chosen a progression path.`
                    )
                ]
            });

            return;
        }

        const targetRank =
            getRankForLevel(
                user.faction,
                user.level
            );

        if (!targetRank) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'No Automatic Rank',
                        'Akane could not determine the correct progression rank.'
                    )
                ]
            });

            return;
        }

        if (user.rank === targetRank.id) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Rank Unchanged',
                        `${member} already holds their correct automatic rank: **${targetRank.name}**.`
                    )
                ]
            });

            return;
        }

        const previousRank =
            user.rank;

        const result = await changeRank(
            member,
            targetRank.id,
            {
                changedBy:
                    interaction.user.id,

                reason,

                announce: false
            }
        );

        if (!result.changed) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Rank Unchanged',
                        'No rank change was required.'
                    )
                ]
            });

            return;
        }

        await interaction.editReply({
            embeds: [
                createEmbed(
                    'Rank Removed',
                    [
                        `${member}'s special rank has been removed.`,
                        '',
                        `Previous: **${previousRank ?? 'Unranked'}**`,
                        `Current: **${targetRank.name}**`,
                        `Reason: **${reason}**`
                    ].join('\n')
                )
                    .setFooter({
                        text: 'AKANE • BLOOD MOON'
                    })
            ]
        });
    }
};