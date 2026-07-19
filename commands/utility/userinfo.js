/**
 * Seraphiel
 * Command: /userinfo
 * Version: 2.0.0
 */

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

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
        try {
            const selectedUser =
                interaction.options.getUser('user') ||
                interaction.user;

            const member = await interaction.guild.members.fetch(
                selectedUser.id
            );

            const user = await selectedUser.fetch(true);

            const avatarURL = user.displayAvatarURL({
                size: 4096,
                forceStatic: false
            });

            const accountCreatedTimestamp = Math.floor(
                user.createdTimestamp / 1000
            );

            const joinedServerTimestamp = member.joinedTimestamp
                ? Math.floor(member.joinedTimestamp / 1000)
                : null;

            const embed = createEmbed({
                title: '👤 User Information',
                thumbnail: avatarURL,
                fields: [
                    {
                        name: '🪽 Profile',
                        value:
                            `**Username:** ${user.username}\n` +
                            `**Display Name:** ${member.displayName}\n` +
                            `**Mention:** ${user}\n` +
                            `**Account Type:** ${user.bot ? 'Bot' : 'Human'}\n` +
                            `**User ID:** \`${user.id}\``,
                        inline: false
                    },
                    {
                        name: '📅 Account Information',
                        value:
                            `**Account Created:** <t:${accountCreatedTimestamp}:F>\n` +
                            `**Account Age:** <t:${accountCreatedTimestamp}:R>\n` +
                            (
                                joinedServerTimestamp
                                    ? `**Joined Server:** <t:${joinedServerTimestamp}:F>\n` +
                                      `**Time in Server:** <t:${joinedServerTimestamp}:R>`
                                    : '**Joined Server:** Unknown'
                            ),
                        inline: false
                    },
                    {
                        name: '🎭 Server Information',
                        value:
                            `**Highest Role:** ${member.roles.highest}\n` +
                            `**Role Count:** ${Math.max(
                                member.roles.cache.size - 1,
                                0
                            )}`,
                        inline: false
                    }
                ]
            });

            embed.setAuthor({
                name: `${user.username}'s Information`,
                iconURL: avatarURL
            });

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
        } catch (error) {
            console.error('❌ Error executing /userinfo:', error);

            const errorEmbed = createErrorEmbed(
                '❌ User Information Error',
                'I could not retrieve information about this user.'
            );

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                embeds: [errorEmbed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};