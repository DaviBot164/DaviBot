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

const {
    levels:
        levelDatabase,

    ranks:
        rankDatabase,

    titles:
        titleDatabase
} = require('../../database');

/**
 * Format a number safely.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const number =
        Number(
            value
        );

    return Number.isFinite(
        number
    )
        ? number.toLocaleString(
            'en-US'
        )
        : '0';
}

/**
 * Load member progression.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getProgression(
    guildId,
    userId
) {
    try {
        return (
            await levelDatabase
                .getUserLevel(
                    guildId,
                    userId
                )
        ) ?? {
            level:
                0,

            xp:
                0
        };
    } catch {
        return {
            level:
                0,

            xp:
                0
        };
    }
}

/**
 * Load leaderboard position.
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
    } catch {
        return null;
    }
}

/**
 * Load the current managed rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getCurrentRank(
    guildId,
    userId
) {
    try {
        return await rankDatabase
            .getCurrentRank(
                guildId,
                userId
            );
    } catch {
        return null;
    }
}

/**
 * Load the active Title.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getActiveTitle(
    guildId,
    userId
) {
    try {

        const titles =
            await titleDatabase
                .getSoulTitles(
                    guildId,
                    userId
                );

        if (
            !Array.isArray(
                titles
            )
        ) {
            return null;
        }

        return (
            titles.find(
                title =>
                    title.isActive
            ) ??
            null
        );
    } catch {
        return null;
    }
}

/**
 * Find the highest progression role
 * currently held by the member.
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
        const rewards =
            await levelDatabase
                .getEarnedLevelRewards(
                    member.guild.id,
                    level
                );

        const sortedRewards =
            [...rewards].sort(
                (
                    first,
                    second
                ) =>
                    second.level -
                    first.level
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
                return role.toString();
            }
        }

        return 'None';
    } catch {
        return 'Unavailable';
    }
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'profile'
            )
            .setDescription(
                'View a compact member profile.'
            )
            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select a member'
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
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'This command can only be used inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ??
                interaction.user;

            const member =
                await interaction.guild.members
                    .fetch(
                        selectedUser.id
                    )
                    .catch(
                        () => null
                    );

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Member Not Found',
                            'The selected user is not currently in this server.'
                        )
                    ]
                });

                return;
            }

            const fullUser =
                await selectedUser.fetch(
                    true
                );

            const [
                progression,
                serverRank,
                currentRank,
                activeTitle
            ] = await Promise.all([
                getProgression(
                    interaction.guild.id,
                    fullUser.id
                ),

                getServerRank(
                    interaction.guild.id,
                    fullUser.id
                ),

                getCurrentRank(
                    interaction.guild.id,
                    fullUser.id
                ),

                getActiveTitle(
                    interaction.guild.id,
                    fullUser.id
                )
            ]);

            const level =
                Number(
                    progression.level ||
                    0
                );

            const xp =
                Number(
                    progression.xp ||
                    0
                );

            const progressionRole =
                await getProgressionRole(
                    member,
                    level
                );

            const avatarURL =
                fullUser.displayAvatarURL({
                    extension:
                        'png',

                    size:
                        2048,

                    forceStatic:
                        false
                });

            const bannerURL =
                fullUser.bannerURL({
                    extension:
                        'png',

                    size:
                        2048,

                    forceStatic:
                        false
                });

            const botAvatar =
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            256,

                        forceStatic:
                            false
                    });

            const rankName =
                currentRank
                    ?.rank_name ??
                'Unranked';

            const titleName =
                activeTitle
                    ?.displayName ??
                'None';

            const embed =
                createEmbed({
                    title:
                        `Ⅹ・${fullUser.username}`,

                    description:
                        [
                            `**${member.displayName}**`,
                            '',
                            `⚔️ **Rank:** ${rankName}`,
                            `♜ **Title:** ${titleName}`
                        ].join('\n'),

                    color:
                        '#5B3A78',

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '◆・PROGRESSION',

                            value:
                                [
                                    `**Level:** \`${formatNumber(level)}\``,
                                    `**XP:** \`${formatNumber(xp)}\``,
                                    `**Server Rank:** \`${
                                        serverRank
                                            ? `#${serverRank}`
                                            : 'Unranked'
                                    }\``
                                ].join('\n'),

                            inline:
                                true
                        },

                        {
                            name:
                                '♜・STANDING',

                            value:
                                [
                                    `**Progression Role:** ${progressionRole}`,
                                    `**Highest Role:** ${
                                        member.roles.highest.id ===
                                        interaction.guild.id
                                            ? 'None'
                                            : member.roles.highest
                                    }`
                                ].join('\n'),

                            inline:
                                true
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    botAvatar
            });

            embed.setFooter({
                text:
                    `TTS • Requested by ${interaction.user.username}`,

                iconURL:
                    botAvatar
            });

            if (
                bannerURL
            ) {
                embed.setImage(
                    bannerURL
                );
            }

            const mediaRow =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(
                                'Avatar'
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

            if (
                bannerURL
            ) {
                mediaRow.addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            'Banner'
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
                embeds: [
                    embed
                ],

                components: [
                    mediaRow
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /profile command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Profile Unavailable',
                    'Evelynn could not open this profile.'
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

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