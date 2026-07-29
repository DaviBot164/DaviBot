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

const {
    levels:
        levelDatabase
} = require('../../database');

/**
 * Format a timestamp using Discord's
 * native date system.
 *
 * @param {number|null} timestamp
 * @returns {string}
 */
function formatDiscordDate(
    timestamp
) {
    if (!timestamp) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            timestamp /
            1000
        );

    return [
        `<t:${unixTimestamp}:F>`,
        `-# <t:${unixTimestamp}:R>`
    ].join('\n');
}

/**
 * Format a number using separators.
 *
 * @param {number|string|null} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const numericValue =
        Number(value);

    if (
        !Number.isFinite(
            numericValue
        )
    ) {
        return '0';
    }

    return numericValue.toLocaleString(
        'en-US'
    );
}

/**
 * Create Umbra's visual XP bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 12
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filledBlocks =
        Math.round(
            (
                safePercentage /
                100
            ) *
            length
        );

    const emptyBlocks =
        length -
        filledBlocks;

    return (
        '▰'.repeat(
            filledBlocks
        ) +
        '▱'.repeat(
            emptyBlocks
        )
    );
}

/**
 * Get a readable timeout status.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getTimeoutStatus(
    member
) {
    if (
        !member
            .isCommunicationDisabled()
    ) {
        return '🟢 Clear';
    }

    const timeoutTimestamp =
        member
            .communicationDisabledUntilTimestamp;

    if (!timeoutTimestamp) {
        return '🔇 Active';
    }

    const unixTimestamp =
        Math.floor(
            timeoutTimestamp /
            1000
        );

    return (
        `🔇 Active until ` +
        `<t:${unixTimestamp}:R>`
    );
}

/**
 * Format the warning count.
 *
 * @param {number|string} warningCount
 * @returns {string}
 */
function formatWarningCount(
    warningCount
) {
    if (
        typeof warningCount !==
        'number'
    ) {
        return '⚠️ Unavailable';
    }

    if (warningCount === 0) {
        return '🟢 Clear';
    }

    if (warningCount === 1) {
        return '⚠️ 1 Warning';
    }

    return (
        `⚠️ ${warningCount} Warnings`
    );
}

/**
 * Get the account type.
 *
 * @param {import('discord.js').User} user
 * @returns {string}
 */
function getAccountType(
    user
) {
    if (user.bot) {
        return '🤖 Bot Account';
    }

    if (user.system) {
        return '⚙️ System Account';
    }

    return '🌑 Soul Account';
}

/**
 * Get an Order badge based on ownership
 * and server permissions.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getMemberBadge(
    member,
    guild
) {
    if (
        member.id ===
        guild.ownerId
    ) {
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
function getHighestRole(
    member
) {
    if (
        member.roles.highest.id ===
        member.guild.id
    ) {
        return 'None';
    }

    return member
        .roles
        .highest
        .toString();
}

/**
 * Count roles without @everyone.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {number}
 */
function getRoleCount(
    member
) {
    return member.roles.cache.filter(
        role =>
            role.id !==
            member.guild.id
    ).size;
}

/**
 * Safely get the member's warnings.
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
        return await warningDatabase
            .countWarnings(
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

/**
 * Safely get a Soul's Level record.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getLevelRecord(
    guildId,
    userId
) {
    try {
        const levelRecord =
            await levelDatabase
                .getUserLevel(
                    guildId,
                    userId
                );

        if (levelRecord) {
            return levelRecord;
        }
    } catch (error) {
        console.warn(
            `⚠️ Profile Level record unavailable: ${error.message}`
        );
    }

    return {
        xp:
            0,

        level:
            0,

        messageCount:
            0,

        progress:
            levelDatabase
                .calculateLevelProgress(
                    0
                )
    };
}

/**
 * Safely get a Soul's server Rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|null>}
 */
async function getServerRank(
    guildId,
    userId
) {
    try {
        return await levelDatabase
            .getUserRank(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Profile server Rank unavailable: ${error.message}`
        );

        return null;
    }
}

/**
 * Get the highest progression role currently
 * owned by the member.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 * @returns {Promise<string>}
 */
async function getProgressionRole(
    member,
    level
) {
    try {
        const earnedRewards =
            await levelDatabase
                .getEarnedLevelRewards(
                    member.guild.id,
                    level
                );

        const sortedRewards =
            [...earnedRewards].sort(
                (
                    firstReward,
                    secondReward
                ) =>
                    secondReward.level -
                    firstReward.level
            );

        for (
            const reward
            of sortedRewards
        ) {
            const role =
                member.guild.roles.cache.get(
                    reward.roleId
                );

            if (
                role &&
                member.roles.cache.has(
                    role.id
                )
            ) {
                return (
                    `${role} ` +
                    `• Level ${reward.level}`
                );
            }
        }

        return '🌑 None Unlocked';
    } catch (error) {
        console.warn(
            `⚠️ Profile progression role unavailable: ${error.message}`
        );

        return '⚠️ Unavailable';
    }
}

/**
 * Build the redesigned progression block.
 *
 * @param {Object} levelRecord
 * @param {number|null} serverRank
 * @returns {string}
 */
function buildProgressionDisplay(
    levelRecord,
    serverRank
) {
    const progress =
        levelRecord.progress ??
        levelDatabase
            .calculateLevelProgress(
                levelRecord.xp
            );

    const progressBar =
        createProgressBar(
            progress.progressPercent
        );

    const remainingXp =
        Math.max(
            0,
            progress.nextLevelXp -
            levelRecord.xp
        );

    const rankDisplay =
        serverRank
            ? `#${serverRank}`
            : 'Unranked';

    return [
        `⭐ **Level ${levelRecord.level}**`,
        `🏆 **Server Rank:** \`${rankDisplay}\``,
        `✨ **Total XP:** \`${formatNumber(levelRecord.xp)}\``,
        `💬 **Messages Counted:** \`${formatNumber(levelRecord.messageCount)}\``,
        '',
        `**Level ${levelRecord.level} → ${levelRecord.level + 1}**`,
        `\`${progressBar}\` **${progress.progressPercent}%**`,
        '',
        `⭐ \`${formatNumber(progress.progressXp)} / ${formatNumber(progress.requiredForNextLevel)} XP\``,
        `🌙 **Remaining:** \`${formatNumber(remainingXp)} XP\``
    ].join('\n');
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'profile'
            )
            .setDescription(
                'View the complete RPG-style profile of a server member.'
            )
            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose profile you want to view'
                    )
                    .setRequired(
                        false
                    )
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /profile command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ??
                interaction.user;

            const [
                fullUser,
                member
            ] =
                await Promise.all([
                    selectedUser.fetch(
                        true
                    ),

                    interaction.guild.members.fetch(
                        selectedUser.id
                    )
                ]);

            const [
                warningCount,
                levelRecord,
                serverRank
            ] =
                await Promise.all([
                    getWarningCount(
                        interaction.guild.id,
                        selectedUser.id
                    ),

                    getLevelRecord(
                        interaction.guild.id,
                        selectedUser.id
                    ),

                    getServerRank(
                        interaction.guild.id,
                        selectedUser.id
                    )
                ]);

            const progressionRole =
                await getProgressionRole(
                    member,
                    levelRecord.level
                );

            const avatarURL =
                fullUser.displayAvatarURL({
                    size:
                        4096,

                    forceStatic:
                        false
                });

            const bannerURL =
                fullUser.bannerURL({
                    size:
                        4096,

                    forceStatic:
                        false
                });

            const profileImageURL =
                bannerURL ??
                avatarURL;

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

            const bannerStatus =
                bannerURL
                    ? '🌌 Profile Banner Available'
                    : '🌑 No Profile Banner';

            const progressionDisplay =
                buildProgressionDisplay(
                    levelRecord,
                    serverRank
                );

            const profileEmbed =
                createEmbed({
                    title:
                        `🌑 ${fullUser.username}'s Soul Profile`,

                    description:
                        [
                            `Umbra has opened the complete Order record of ${fullUser}.`,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
                        ].join(
                            '\n'
                        ),

                    thumbnail:
                        avatarURL,

                    image:
                        profileImageURL,

                    fields: [
                        {
                            name:
                                '👤 Soul Identity',

                            value:
                                [
                                    `**Username:** ${fullUser.username}`,
                                    `**Display Name:** ${member.displayName}`,
                                    `**Account Type:** ${accountType}`,
                                    `**Soul ID:** \`${fullUser.id}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '⭐ Soul Progression',

                            value:
                                progressionDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '🎖️ Order Standing',

                            value:
                                [
                                    `**Order Badge:** ${memberBadge}`,
                                    `**Progression Rank:** ${progressionRole}`,
                                    `**Highest Role:** ${highestRole}`,
                                    `**Total Roles:** \`${roleCount}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🛡️ Guardian Record',

                            value:
                                [
                                    `**Warnings:** ${warningDisplay}`,
                                    `**Timeout:** ${getTimeoutStatus(member)}`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🌌 Profile Appearance',

                            value:
                                [
                                    `**Banner:** ${bannerStatus}`,
                                    `**Avatar:** 🖼️ Available`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Soul History',

                            value:
                                [
                                    '**Account Created**',
                                    formatDiscordDate(
                                        fullUser.createdTimestamp
                                    ),
                                    '',
                                    '**Entered the Order**',
                                    formatDiscordDate(
                                        member.joinedTimestamp
                                    )
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        }
                    ]
                });

            profileEmbed.setAuthor({
                name:
                    `${fullUser.username} • Soul Profile`,

                iconURL:
                    avatarURL
            });

            profileEmbed.setFooter({
                text:
                    `🌑 Umbra Profile System • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            profileEmbed.setTimestamp();

            profileEmbed.setImage(
                profileImageURL
            );

            const buttons =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(
                                'Open Avatar'
                            )
                            .setEmoji(
                                '🖼️'
                            )
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
                        .setEmoji(
                            '🌌'
                        )
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(
                            bannerURL
                        )
                );
            }

            await interaction.editReply({
                embeds:
                    [profileEmbed],

                components:
                    [buttons]
            });
        } catch (error) {
            console.error(
                '❌ Umbra profile command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Profile Unavailable',
                    [
                        'Umbra could not open the requested Soul profile.',
                        '',
                        'Please verify that the selected user is still a member of this server and try again.'
                    ].join(
                        '\n'
                    )
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed],

                        components:
                            []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp({
                        embeds:
                            [errorEmbed],

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
                    embeds:
                        [errorEmbed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};