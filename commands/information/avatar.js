const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('View a member or bot avatar.')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Whose avatar would you like to view?')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.options.getUser('member')
            ?? interaction.user;

        const member = interaction.inGuild()
            ? await interaction.guild.members.fetch(user.id)
                .catch(() => null)
            : null;

        const globalAvatar = user.displayAvatarURL({
            size: 4096
        });

        const serverAvatar = member?.avatar
            ? member.displayAvatarURL({ size: 4096 })
            : null;

        const embed = createEmbed(
            '🖼️ Avatar',
            [
                `**${user.tag}**`,
                serverAvatar
                    ? 'Showing the server avatar.'
                    : 'Showing the account avatar.'
            ].join('\n')
        ).setImage(serverAvatar ?? globalAvatar);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Open Account Avatar')
                .setStyle(ButtonStyle.Link)
                .setURL(globalAvatar)
        );

        if (serverAvatar) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Open Server Avatar')
                    .setStyle(ButtonStyle.Link)
                    .setURL(serverAvatar)
            );
        }

        await interaction.editReply({
            embeds: [embed],
            components: [row],
            allowedMentions: { parse: [] }
        });
    }
};