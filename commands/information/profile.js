const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
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
        return '🟢 No Active Timeout';
    }

    const timeoutTimestamp =
        member.communicationDisabledUntilTimestamp;

    if (!timeoutTimestamp) {
        return '🔇 Timeout Active';
    }

    const unixTimestamp =
        Math.floor(timeoutTimestamp / 1000);

    return (
        '🔇 Timeout Active\n' +
        `Ends <t:${unixTimestamp}:R>`
    );
}

/**
 * Format the warning count.
 *
 * @param {number|string} warningCount
 * @returns {string}
 */
function formatWarningCount(warningCount) {
    if (typeof warningCount !== 'number') {
        return '⚠️ Unavailable';
    }

    if (warningCount === 0) {
        return '🟢 No Warnings';
    }

    if (warningCount === 1) {
        return '⚠️ 1 Warning';
    }

    return `⚠️ ${warningCount} Warnings`;
}

/**
 * Get the Soul's account type.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function getAccountType(user) {
    if (user.bot) {
        return '🤖 Bot Account';
    }

    if (user.system) {
        return '⚙️ System Account';
    }

    return '🌑 Soul Account';
}

/**
 * Get an Order badge based on server permissions.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getMemberBadge(member, guild) {
    if (member.id === guild.ownerId) {
        return '👑 Crimson Lord';
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return '⚜️ Eclipse Keeper';
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.ModerateMembers
        ) ||
        member.permissions.has(
            PermissionFlagsBits.KickMembers
        ) ||
        member.permissions.has(
            PermissionFlagsBits.BanMembers
        )
    ) {
        return '🛡️ Shadow Warden';
    }

    if (member.user.bot) {
        return '🤖 Order Guardian';
    }

    return '🌑 Soul of the Order';
}

/**
 * Get the member's highest visible role.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getHighestRole(member) {
    if (
        member.roles.highest.id ===
        member.guild.id
    ) {
        return 'None';
    }

    return member.roles.highest.toString();
}

/**
 * Get the member's role count without @everyone.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {number}
 */
function getRoleCount(member) {
    return member.roles.cache.filter(
        role =>
            role.id !==
            member.guild.id
    ).size;
}

/**
 * Safely get the number of warnings.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|string>}
 */
async function getWarningCount(
    guildId,
    userId
) {
    try {
        return await warningDatabase.countWarnings(
            guildId,
            userId
        );
    } catch (error) {
        console.warn(
            `⚠️ Umbra profile warning count unavailable: ${error.message}`
        );

        return 'Unavailable';
    }
}

module.exports = {
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription(
            'View the Order profile of a server member.'
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul whose profile you want to view'
                )
                .setRequired(false)
        )
        .setDMPermission(false),

    /**
     * Execute the /profile command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ??
                interaction.user;

            const [fullUser, member] =
                await Promise.all([
                    selectedUser.fetch(true),

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

            const warningDisplay =
                formatWarningCount(
                    warningCount
                );

            const accountType =
                getAccountType(
                    fullUser
                );

            const memberBadge =
                getMemberBadge(
                    member,
                    interaction.guild
                );

            const highestRole =
                getHighestRole(
                    member
                );

            const roleCount =
                getRoleCount(
                    member
                );

            const embed =
                createEmbed({
                    title:
                        `🌑 ${fullUser.username}'s Soul Record`,

                    description:
                        [
                            `Umbra has opened the Order record of ${fullUser}.`,
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
                        ].join('\n'),

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '🌑 Soul Information',

                            value:
                                `**Username:** ${fullUser.username}\n` +
                                `**Display Name:** ${member.displayName}\n` +
                                `**Account Type:** ${accountType}\n` +
                                `**Soul ID:** \`${fullUser.id}\``,

                            inline:
                                false
                        },
                        {
                            name:
                                '🎖️ Order Status',

                            value:
                                `**Rank:** ${memberBadge}\n` +
                                `**Highest Role:** ${highestRole}\n` +
                                `**Total Roles:** \`${roleCount}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🛡️ Guardian Record',

                            value:
                                `**Warnings:** ${warningDisplay}\n` +
                                `**Timeout:** ${getTimeoutStatus(member)}`,

                            inline:
                                true
                        },
                        {
                            name:
                                '📅 Soul Created',

                            value:
                                formatDiscordDate(
                                    fullUser.createdTimestamp
                                ),

                            inline:
                                true
                        },
                        {
                            name:
                                '📥 Entered the Order',

                            value:
                                formatDiscordDate(
                                    member.joinedTimestamp
                                ),

                            inline:
                                true
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${fullUser.username} • Soul Record`,

                iconURL:
                    avatarURL
            });

            embed.setFooter({
                text:
                    `🌑 Umbra Profile System • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user.displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
            });

            if (bannerURL) {
                embed.setImage(
                    bannerURL
                );
            }

            const buttons =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(
                                'Open Avatar'
                            )
                            .setEmoji('🖼️')
                            .setStyle(
                                ButtonStyle.Link
                            )
                            .setURL(
                                avatarURL
                            )
                    );

            if (bannerURL) {
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            'Open Banner'
                        )
                        .setEmoji('🌌')
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(
                            bannerURL
                        )
                );
            }

            await interaction.editReply({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            console.error(
                '❌ Umbra profile command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Record Unavailable',

                    'Umbra could not open the requested Soul record. Please try again later.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

                        components: []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};