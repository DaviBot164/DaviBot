const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    souls: soulDatabase
} = require('../../database');

/**
 * A long divider helps the embed preserve
 * a wider appearance on Discord desktop.
 */
const WIDE_DIVIDER =
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

/**
 * Hollow Evolution roles ordered
 * from the strongest to the weakest.
 */
const HOLLOW_EVOLUTION_ROLES = [
    '⚔️ Arrancar',
    '👑 Vasto Lorde',
    '🐺 Adjuchas',
    '⚪ Gillian',
    '🦴 Menos Grande',
    '👁️ Hollow'
];

/**
 * Manual Arrancar ranks ordered
 * from the strongest to the weakest.
 */
const ARRANCAR_RANK_ROLES = [
    '👑 Espada 0',
    'Ⅰ Espada',
    'Ⅱ Espada',
    'Ⅲ Espada',
    'Ⅳ Espada',
    'Ⅴ Espada',
    'Ⅵ Espada',
    'Ⅶ Espada',
    'Ⅷ Espada',
    'Ⅸ Espada',
    'Ⅹ Espada',
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

/**
 * Format a numeric value using separators.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(value) {
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
 * Format a Discord timestamp.
 *
 * @param {number|Date|null|undefined} value
 * @returns {string}
 */
function formatDiscordDate(value) {
    if (!value) {
        return 'Unknown';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return [
        `<t:${unixTimestamp}:F>`,
        `-# <t:${unixTimestamp}:R>`
    ].join('\n');
}

/**
 * Create Umbra's visual progress bar.
 *
 * @param {number} percentage
 * @param {number} length
 * @returns {string}
 */
function createProgressBar(
    percentage,
    length = 14
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
 * Find the first member role matching
 * one of the supplied role names.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {string[]} roleNames
 * @returns {import('discord.js').Role|null}
 */
function findMemberRole(
    member,
    roleNames
) {
    for (
        const roleName
        of roleNames
    ) {
        const role =
            member.roles.cache.find(
                cachedRole =>
                    cachedRole.name ===
                    roleName
            );

        if (role) {
            return role;
        }
    }

    return null;
}

/**
 * Get the member's current Hollow
 * Evolution stage.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getHollowEvolution(member) {
    const evolutionRole =
        findMemberRole(
            member,
            HOLLOW_EVOLUTION_ROLES
        );

    if (!evolutionRole) {
        return '👁️ Hollow';
    }

    return evolutionRole.name;
}

/**
 * Get the member's manually assigned
 * Arrancar rank.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function getArrancarRank(member) {
    const rankRole =
        findMemberRole(
            member,
            ARRANCAR_RANK_ROLES
        );

    if (!rankRole) {
        return '⚪ Unranked Arrancar';
    }

    return rankRole.name;
}

/**
 * Get the member's Las Noches
 * administrative standing.
 *
 * This is separate from Hollow Evolution
 * and the manual Arrancar rank.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function getLasNochesStanding(
    member,
    guild
) {
    if (
        member.id ===
        guild.ownerId
    ) {
        return '👑 Ruler of Las Noches';
    }

    const namedStaffRoles = [
        '⚜️ Head Captain',
        '🛡️ Captain',
        '⚔️ Lieutenant'
    ];

    const namedStaffRole =
        findMemberRole(
            member,
            namedStaffRoles
        );

    if (namedStaffRole) {
        return namedStaffRole.name;
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return '🛡️ Captain';
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
        return '⚔️ Lieutenant';
    }

    if (member.user.bot) {
        return '🌑 Guardian of Las Noches';
    }

    return '🌙 Resident of Las Noches';
}

/**
 * Get the highest visible Discord role.
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
 * Build the Spiritual Progression section.
 *
 * @param {Object} progression
 * @returns {string}
 */
function buildProgressionDisplay(
    progression
) {
    const safeProgression =
        progression || {};

    const progress =
        safeProgression.progress || {};

    const level =
        Number(
            safeProgression.level || 0
        );

    const xp =
        Number(
            safeProgression.xp || 0
        );

    const progressXp =
        Number(
            progress.progressXp || 0
        );

    const requiredForNextLevel =
        Number(
            progress.requiredForNextLevel || 0
        );

    const nextLevelXp =
        Number(
            progress.nextLevelXp || 0
        );

    const progressPercent =
        Number(
            progress.progressPercent || 0
        );

    const serverRankDisplay =
        safeProgression.serverRank
            ? `#${safeProgression.serverRank}`
            : 'Unranked';

    const remainingXp =
        Math.max(
            0,
            nextLevelXp - xp
        );

    const progressBar =
        createProgressBar(
            progressPercent
        );

    return [
        `⭐ **Soul Level:** \`${level}\``,
        `✨ **Total Spiritual Power:** \`${formatNumber(xp)} XP\``,
        `🏆 **Las Noches Ranking:** \`${serverRankDisplay}\``,
        '',
        `**Spiritual Progress • Level ${level} → ${level + 1}**`,
        `\`${progressBar}\` **${progressPercent}%**`,
        '',
        `🌙 **Current Power:** \`${formatNumber(progressXp)} / ${formatNumber(requiredForNextLevel)} XP\``,
        `-# ${formatNumber(remainingXp)} additional XP is required to reach the next Soul Level.`
    ].join('\n');
}

/**
 * Format one unlocked Achievement.
 *
 * @param {Object} achievement
 * @returns {string}
 */
function formatAchievement(
    achievement
) {
    const icon =
        achievement?.icon ||
        '🏆';

    const name =
        achievement?.name ||
        'Unknown Chronicle';

    const description =
        achievement?.description ||
        'No description available.';

    let unlockedDisplay =
        'Unknown';

    if (
        achievement?.unlockedAt
    ) {
        const unlockedDate =
            new Date(
                achievement.unlockedAt
            );

        if (
            !Number.isNaN(
                unlockedDate.getTime()
            )
        ) {
            const unlockedTimestamp =
                Math.floor(
                    unlockedDate.getTime() /
                    1000
                );

            unlockedDisplay =
                `<t:${unlockedTimestamp}:R>`;
        }
    }

    return [
        `${icon} **${name}**`,
        `-# ${description}`,
        `-# Recorded within the Soul Archives ${unlockedDisplay}`
    ].join('\n');
}

/**
 * Build the Achievement section.
 *
 * @param {Object} achievementData
 * @returns {string}
 */
function buildAchievementDisplay(
    achievementData
) {
    const safeAchievementData =
        achievementData || {};

    const unlocked =
        Number(
            safeAchievementData.unlocked || 0
        );

    const total =
        Number(
            safeAchievementData.total || 0
        );

    const recent =
        Array.isArray(
            safeAchievementData.recent
        )
            ? safeAchievementData.recent
            : [];

    const progressPercent =
        total > 0
            ? Math.min(
                100,
                Math.floor(
                    (
                        unlocked /
                        total
                    ) *
                    100
                )
            )
            : 0;

    const progressBar =
        createProgressBar(
            progressPercent,
            12
        );

    const lines = [
        `🏆 **Chronicles Recorded:** \`${formatNumber(unlocked)} / ${formatNumber(total)}\``,
        `\`${progressBar}\` **${progressPercent}%**`
    ];

    if (
        recent.length === 0
    ) {
        lines.push(
            '',
            '📖 No Soul Chronicles have been recorded within the archives yet.',
            '-# Continue your evolution and journey through Las Noches.'
        );

        return lines.join('\n');
    }

    lines.push(
        '',
        '**Latest Chronicle Recorded**',
        ''
    );

    lines.push(
        formatAchievement(
            recent[0]
        )
    );

    return lines.join('\n');
}

/**
 * Build the Hollow Evolution section.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function buildEvolutionDisplay(member) {
    const currentEvolution =
        getHollowEvolution(
            member
        );

    const currentIndex =
        HOLLOW_EVOLUTION_ROLES.indexOf(
            currentEvolution
        );

    const nextEvolution =
        currentIndex > 0
            ? HOLLOW_EVOLUTION_ROLES[
                currentIndex - 1
            ]
            : null;

    const lines = [
        `**Current Hollow Evolution:** ${currentEvolution}`
    ];

    if (nextEvolution) {
        lines.push(
            `**Next Evolution Stage:** ${nextEvolution}`,
            '',
            '-# Hollow Evolution advances automatically through Soul Levels, activity and spiritual growth.'
        );
    } else {
        lines.push(
            '',
            '🌙 This Soul has reached the final stage of Hollow Evolution.'
        );
    }

    return lines.join('\n');
}

/**
 * Build the manual Arrancar Rank section.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function buildArrancarRankDisplay(member) {
    const arrancarRank =
        getArrancarRank(
            member
        );

    return [
        `**Current Arrancar Rank:** ${arrancarRank}`,
        '',
        '-# Arrancar ranks are granted manually by the Ruler and High Command of Las Noches.'
    ].join('\n');
}

/**
 * Build the Las Noches activity section.
 *
 * @param {Object} soulRecord
 * @returns {string}
 */
function buildActivityDisplay(
    soulRecord
) {
    const progression =
        soulRecord?.progression || {};

    const tickets =
        soulRecord?.tickets || {};

    const events =
        soulRecord?.events || {};

    const voice =
        soulRecord?.voice || {};

    const messageCount =
        Number(
            progression.messageCount || 0
        );

    const voiceMinutes =
        Number(
            voice.totalMinutes || 0
        );

    const eventsJoined =
        Number(
            events.joined || 0
        );

    const eventsCompleted =
        Number(
            events.completed || 0
        );

    const ticketsCreated =
        Number(
            tickets.created || 0
        );

    const ticketsClosed =
        Number(
            tickets.closed || 0
        );

    return [
        `💬 **Messages Recorded:** \`${formatNumber(messageCount)}\``,
        `🎙️ **Time Within Voice Realms:** \`${formatNumber(voiceMinutes)} minutes\``,
        `🎮 **Las Noches Events:** \`${formatNumber(eventsJoined)} joined • ${formatNumber(eventsCompleted)} completed\``,
        `🎫 **Support Records:** \`${formatNumber(ticketsCreated)} created • ${formatNumber(ticketsClosed)} closed\``
    ].join('\n');
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'soul'
            )
            .setDescription(
                'Open a Soul Record from the archives of Las Noches.'
            )
            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select the Soul whose record you want to open'
                    )
                    .setRequired(
                        false
                    )
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /soul command.
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

            const [
                fullUser,
                member,
                soulRecord
            ] =
                await Promise.all([
                    selectedUser.fetch(
                        true
                    ),

                    interaction.guild.members.fetch(
                        selectedUser.id
                    ),

                    soulDatabase.ensureSoulRecord(
                        interaction.guild.id,
                        selectedUser.id
                    )
                ]);

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

            const titleDisplay =
                soulRecord?.title?.displayName ||
                '🌑 Nameless Soul';

            const progressionDisplay =
                buildProgressionDisplay(
                    soulRecord?.progression
                );

            const evolutionDisplay =
                buildEvolutionDisplay(
                    member
                );

            const arrancarRankDisplay =
                buildArrancarRankDisplay(
                    member
                );

            const lasNochesStanding =
                getLasNochesStanding(
                    member,
                    interaction.guild
                );

            const highestRole =
                getHighestRole(
                    member
                );

            const achievementDisplay =
                buildAchievementDisplay(
                    soulRecord?.achievements
                );

            const activityDisplay =
                buildActivityDisplay(
                    soulRecord
                );

            const soulEmbed =
                createEmbed({
                    title:
                        `📖 ${fullUser.username}'s Soul Record`,

                    description:
                        [
                            `Umbra has opened the official Soul Record of ${fullUser} from the eternal archives of Las Noches.`,
                            '',
                            WIDE_DIVIDER,
                            '',
                            '🌙 *Every evolution, battle, rank and achievement is preserved beneath the eternal moon of Las Noches.*'
                        ].join('\n'),

                    thumbnail:
                        avatarURL,

                    image:
                        profileImageURL,

                    fields: [
                        {
                            name:
                                '📜 Soul Identity',

                            value:
                                [
                                    `**Soul Name:** ${fullUser.username}`,
                                    `**Display Name:** ${member.displayName}`,
                                    `**Soul Identification Number:** \`${fullUser.id}\``,
                                    `**Current Chronicle Title:** ${titleDisplay}`
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '⭐ Spiritual Progression',

                            value:
                                progressionDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '👁️ Hollow Evolution',

                            value:
                                evolutionDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '⚔️ Arrancar Rank',

                            value:
                                arrancarRankDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '👑 Las Noches Standing',

                            value:
                                [
                                    `**Administrative Standing:** ${lasNochesStanding}`,
                                    `**Highest Recognized Role:** ${highestRole}`
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '🏆 Soul Chronicles',

                            value:
                                achievementDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '📊 Las Noches Activity',

                            value:
                                activityDisplay,

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Journey Through Las Noches',

                            value:
                                [
                                    '**This Soul Entered Las Noches On**',
                                    formatDiscordDate(
                                        member.joinedTimestamp
                                    )
                                ].join('\n'),

                            inline:
                                false
                        }
                    ]
                });

            soulEmbed.setAuthor({
                name:
                    `${fullUser.username} • Las Noches Soul Archives`,

                iconURL:
                    avatarURL
            });

            soulEmbed.setFooter({
                text:
                    `🌙 Umbra • Guardian of Las Noches • Soul Record opened by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            soulEmbed.setTimestamp();

            await interaction.editReply({
                embeds:
                    [soulEmbed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra soul command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Record Unavailable',
                    [
                        'Umbra could not open the requested Soul Record.',
                        '',
                        'Please verify that the selected Soul is still inside Las Noches and try again.'
                    ].join('\n')
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed]
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