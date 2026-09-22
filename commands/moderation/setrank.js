const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    getUser
} = require('../../database/users');

const {
    getRanks
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
        .setName('setrank')
        .setDescription(
            'Set a member progression rank.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription(
                    'Member whose rank will be changed.'
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('rank')
                .setDescription(
                    'New progression rank.'
                )
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for the rank change.'
                )
                .setMaxLength(200)
                .setRequired(false)
        ),

    async autocomplete(interaction) {
        const selected =
            interaction.options.getUser(
                'member'
            );

        if (!selected) {
            await interaction.respond([]);
            return;
        }

        const user = await getUser(
            interaction.guild.id,
            selected.id
        );

        if (!user?.faction) {
            await interaction.respond([]);
            return;
        }

        const focused =
            interaction.options
                .getFocused()
                .toLowerCase();

        const choices =
            getRanks(user.faction)
                .filter(rank =>
                    rank.name
                        .toLowerCase()
                        .includes(focused)
                )
                .slice(0, 25)
                .map(rank => ({
                    name: rank.name,
                    value: rank.id
                }));

        await interaction.respond(
            choices
        );
    },

    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const selected =
            interaction.options.getUser(
                'member',
                true
            );

        const rankId =
            interaction.options.getString(
                'rank',
                true
            );

        const reason =
            interaction.options.getString(
                'reason'
            );

        const member =
            await interaction.guild.members
                .fetch(selected.id)
                .catch(() => null);

        if (!member || member.user.bot) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Invalid Member',
                        'That member cannot receive a progression rank.'
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
                        `${member} has not chosen a Slayer or Demon path.`
                    )
                ]
            });

            return;
        }

        const rank =
            getRanks(user.faction)
                .find(
                    entry =>
                        entry.id === rankId
                );

        if (!rank) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Invalid Rank',
                        'That rank does not belong to the member’s current path.'
                    )
                ]
            });

            return;
        }

        const result = await changeRank(
            member,
            rank.id,
            {
                changedBy:
                    interaction.user.id,

                reason:
                    reason ??
                    'Staff rank assignment'
            }
        );

        if (!result.changed) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Rank Unchanged',
                        `${member} already holds **${rank.name}**.`
                    )
                ]
            });

            return;
        }

        await interaction.editReply({
            embeds: [
                createEmbed(
                    'Rank Updated',
                    [
                        `${member} has been assigned **${rank.name}**.`,
                        '',
                        `Path: **${
                            user.faction === 'slayer'
                                ? 'Slayer'
                                : 'Demon'
                        }**`,
                        `Reason: **${
                            reason ??
                            'Staff rank assignment'
                        }**`
                    ].join('\n')
                )
                    .setFooter({
                        text: 'AKANE • BLOOD MOON'
                    })
            ]
        });
    }
};