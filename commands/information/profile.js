const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

/**
 * Format a timestamp using Discord's date system.
 *
 * @param {number|null} timestamp
 * @returns {string}
 */
function formatDiscordDate(timestamp) {
    if (!timestamp) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(timestamp / 1000);

    return (
        `<t:${unixTimestamp}:F>\n` +
        `-# <t:${unixTimestamp}:R>`
    );
}

/**
 * Get a readable timeout status.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getTimeoutStatus(member) {
    if (!member.isCommunicationDisabled()) {
        return '✅ Not Timed Out';
    }

    const timeoutTimestamp =
        member.communicationDisabledUntilTimestamp;

    if (!timeoutTimestamp) {
        return '🔇 Active';
    }

    const unixTimestamp =
        Math.floor(timeoutTimestamp / 1000);

    return (
        `🔇 Active\n` +
        `Ends <t:${unixTimestamp}:R>`
    );
}

/**
 * Safely get the number of warnings.
 *
 * The profile command will continue working even when
 * PostgreSQL is unavailable in the local environment.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|string>}
 */
async function getWarningCount(guildId, userId) {
    try {
        return await warningDatabase.countWarnings(
            guildId,
            userId
        );
    } catch (error) {
        console.warn(
            `⚠️ Profile warning count unavailable: ${error.message}`
        );

        return 'Unavailable';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription(
            'View detailed information about a server member.'
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the member whose profile you want to view'
                )
                .setRequired(false)
        )
        .setDMPermission(false),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser('user') ??
                interaction.user;

            const [fullUser, member] =
                await Promise.all([
                    selectedUser.fetch(),
                    interaction.guild.members.fetch(
                        selectedUser.id
                    )
                ]);

            const warningCount =
                await getWarningCount(
                    interaction.guild.id,
                    selectedUser.id
                );

            const avatarURL =
                fullUser.displayAvatarURL({
                    size: 4096,
                    forceStatic: false
                });

            const bannerURL =
                fullUser.bannerURL({
                    size: 4096,
                    forceStatic: false
                });

            const roleCount =
                member.roles.cache.filter(
                    role =>
                        role.id !== interaction.guild.id
                ).size;

            const highestRole =
                member.roles.highest.id ===
                interaction.guild.id
                    ? 'None'
                    : member.roles.highest.toString();

            const accountType =
                fullUser.bot
                    ? '🤖 Bot'
                    : '👤 Human';

            const warningDisplay =
                typeof warningCount === 'number'
                    ? String(warningCount)
                    : `⚠️ ${warningCount}`;

            const embed = createEmbed({
                title:
                    `👤 ${fullUser.username}'s Profile`,
                description:
                    `Detailed profile information for ${fullUser}.`,
                thumbnail: avatarURL,
                fields: [
                    {
                        name: '👤 User Information',
                        value:
                            `**Username:** ${fullUser.username}\n` +
                            `**Display Name:** ${member.displayName}\n` +
                            `**Account Type:** ${accountType}\n` +
                            `**User ID:** \`${fullUser.id}\``,
                        inline: false
                    },
                    {
                        name: '🏰 Server Information',
                        value:
                            `**Nickname:** ${member.nickname ?? 'None'}\n` +
                            `**Highest Role:** ${highestRole}\n` +
                            `**Roles:** ${roleCount}`,
                        inline: true
                    },
                    {
                        name: '🛡️ Moderation Information',
                        value:
                            `**Warnings:** ${warningDisplay}\n` +
                            `**Timeout:** ${getTimeoutStatus(member)}`,
                        inline: true
                    },
                    {
                        name: '📅 Account Created',
                        value: formatDiscordDate(
                            fullUser.createdTimestamp
                        ),
                        inline: true
                    },
                    {
                        name: '📥 Joined Server',
                        value: formatDiscordDate(
                            member.joinedTimestamp
                        ),
                        inline: true
                    }
                ]
            });

            embed.setAuthor({
                name: fullUser.tag,
                iconURL: avatarURL
            });

            embed.setFooter({
                text:
                    `DaviBot Profile System • Requested by ${interaction.user.username}`,
                iconURL:
                    interaction.user.displayAvatarURL({
                        forceStatic: false
                    })
            });

            if (bannerURL) {
                embed.setImage(bannerURL);
            }

            const buttons =
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Open Avatar')
                        .setEmoji('🖼️')
                        .setStyle(ButtonStyle.Link)
                        .setURL(avatarURL)
                );

            if (bannerURL) {
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel('Open Banner')
                        .setEmoji('🌌')
                        .setStyle(ButtonStyle.Link)
                        .setURL(bannerURL)
                );
            }

            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            console.error(
                'Profile command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Profile Unavailable',
                    'The requested profile could not be loaded. Please try again later.'
                );

            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [errorEmbed],
                    components: []
                }).catch(() => null);

                return;
            }

            if (interaction.replied) {
                await interaction.followUp({
                    embeds: [errorEmbed]
                }).catch(() => null);

                return;
            }

            await interaction.reply({
                embeds: [errorEmbed]
            }).catch(() => null);
        }
    }
};