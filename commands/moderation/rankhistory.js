const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    getRankHistory
} = require('../../database/rankHistory');

const {
    getRank
} = require('../../handlers/factionHandler');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

function formatRank(
    faction,
    rankId
) {
    if (!rankId) {
        return 'None';
    }

    return getRank(
        faction,
        rankId
    )?.name ?? rankId;
}

function formatEntry(entry) {
    const previous =
        formatRank(
            entry.faction,
            entry.previousRank
        );

    const current =
        formatRank(
            entry.faction,
            entry.newRank
        );

    const moderator =
        entry.changedBy
            ? `<@${entry.changedBy}>`
            : 'Akane';

    const timestamp = Math.floor(
        new Date(
            entry.createdAt
        ).getTime() / 1000
    );

    return [
        `**${previous} → ${current}**`,
        `By: ${moderator}`,
        `Reason: ${entry.reason ?? 'No reason provided'}`,
        `<t:${timestamp}:R>`
    ].join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rankhistory')
        .setDescription(
            'View a member’s progression rank history.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription(
                    'Member whose rank history you want to view.'
                )
                .setRequired(true)
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

        const member =
            await interaction.guild.members
                .fetch(selected.id)
                .catch(() => null);

        if (!member) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Member Not Found',
                        'That member could not be found in this server.'
                    )
                ]
            });

            return;
        }

        const history =
            await getRankHistory(
                interaction.guild.id,
                member.id,
                10
            );

        if (!history.length) {
            await interaction.editReply({
                embeds: [
                    createEmbed(
                        'Rank History',
                        `${member} has no recorded rank changes.`
                    )
                ]
            });

            return;
        }

        const embed = createEmbed(
            'Rank History',
            [
                `${member} • Last **${history.length}** changes`,
                '',
                history
                    .map(formatEntry)
                    .join('\n\n')
            ].join('\n')
        )
            .setThumbnail(
                member.user.displayAvatarURL({
                    size: 256
                })
            )
            .setFooter({
                text: 'AKANE • BLOOD MOON'
            });

        await interaction.editReply({
            embeds: [embed]
        });
    }
};