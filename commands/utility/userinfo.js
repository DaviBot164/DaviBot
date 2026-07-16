/**
 * Empire Bot
 * Command: /userinfo
 * Version: 1.0.0
 * Status: Empire Standard
 */

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('View information about a user.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select a user')
                .setRequired(false)
        ),

    async execute(interaction) {

        const member =
            interaction.options.getMember('user') ||
            interaction.member;

        const user = await member.user.fetch(true);

        const avatarURL = user.displayAvatarURL({
            size: 4096,
            forceStatic: false
        });

        const embed = createEmbed(interaction)
            .setAuthor({
                name: `${user.username}'s Information`,
                iconURL: avatarURL
            })
            .setThumbnail(avatarURL)
            .addFields(
                {
                    name: '👤 User Information',
                    value:
                        `**Username:** ${user.username}\n` +
                        `**Display Name:** ${member.displayName}\n` +
                        `**Mention:** ${user}\n` +
                        `**Account Type:** ${user.bot ? 'Bot' : 'Human'}\n` +
                        `**User ID:** \`${user.id}\``
                },
                {
                    name: '📅 Account Information',
                    value:
                        `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n` +
                        `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
                }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Open Avatar')
                .setEmoji('🖼️')
                .setStyle(ButtonStyle.Link)
                .setURL(avatarURL)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

    }
};