const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    levels: levelDatabase,
    ranks: rankDatabase
} = require('../../database');

const brand =
    require('../../config/brand');

function formatNumber(value) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString('en-US')
        : '0';
}

function createProgressBar(
    percentage,
    length = 10
) {
    const progress =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filled =
        Math.round(
            progress /
            100 *
            length
        );

    return (
        '█'.repeat(filled) +
        '░'.repeat(
            length -
            filled
        )
    );
}

function findCurrentReward(
    rewards,
    level
) {
    return rewards
        .filter(
            reward =>
                reward.level <=
                level
        )
        .sort(
            (first, second) =>
                second.level -
                first.level
        )[0] ??
        null;
}

function findNextReward(
    rewards,
    level
) {
    return rewards
        .filter(
            reward =>
                reward.level >
                level
        )
        .sort(
            (first, second) =>
                first.level -
                second.level
        )[0] ??
        null;
}

function resolveRewardRole(
    guild,
    reward
) {
    return reward
        ? guild.roles.cache.get(
            reward.roleId
        ) ?? null
        : null;
}

function formatRewardRole(
    role,
    reward,
    fallback
) {
    if (role) {
        return role.toString();
    }

    if (reward) {
        return `Deleted Role \`${reward.roleId}\``;
    }

    return fallback;
}

async function sendRankError(
    interaction,
    title,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ]
    };

    if (interaction.deferred) {
        return interaction
            .editReply(
                payload
            )
            .catch(
                () => null
            );
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                ...payload,
                flags:
                    MessageFlags.Ephemeral
            })
            .catch(
                () => null
            );
    }

    return interaction
        .reply({
            ...payload,
            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}

module.exports = {
    category:
        'levels',

    data:
        new SlashCommandBuilder()
            .setName(
                'rank'
            )
            .setDescription(
                'View a member’s Soul Progression.'
            )
            .addUserOption(
                option =>
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
            ),    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await sendRankError(
                    interaction,
                    '❌ Server Only Command',
                    `This command can only be used inside ${brand.serverName}.`
                );

                return;
            }

            await interaction
                .deferReply();

            const targetUser =
                interaction.options
                    .getUser(
                        'user'
                    ) ??
                interaction.user;

            if (targetUser.bot) {
                await sendRankError(
                    interaction,
                    '❌ Invalid Soul',
                    'Bots cannot participate in the Level System.'
                );

                return;
            }

            let levelData =
                await levelDatabase
                    .getUserLevel(
                        interaction.guild.id,
                        targetUser.id
                    );

            if (!levelData) {
                levelData =
                    await levelDatabase
                        .ensureUserLevel(
                            interaction.guild.id,
                            targetUser.id
                        );
            }

            const [
                rankPosition,
                rewards,
                captainRank
            ] =
                await Promise.all([
                    levelDatabase
                        .getUserRank(
                            interaction.guild.id,
                            targetUser.id
                        ),

                    levelDatabase
                        .getLevelRewards(
                            interaction.guild.id
                        ),

                    rankDatabase
                        .getCurrentRank(
                            interaction.guild.id,
                            targetUser.id
                        )
                ]);

            const progress =
                levelData.progress;

            const currentReward =
                findCurrentReward(
                    rewards,
                    levelData.level
                );

            const nextReward =
                findNextReward(
                    rewards,
                    levelData.level
                );

            const currentRewardRole =
                resolveRewardRole(
                    interaction.guild,
                    currentReward
                );

            const nextRewardRole =
                resolveRewardRole(
                    interaction.guild,
                    nextReward
                );

            const currentRewardDisplay =
                formatRewardRole(
                    currentRewardRole,
                    currentReward,
                    'None'
                );

            const serverRankDisplay =
                rankPosition
                    ? `#${formatNumber(rankPosition)}`
                    : 'Unranked';

            const xpUntilNextLevel =
                Math.max(
                    0,
                    progress.nextLevelXp -
                    levelData.xp
                );

            let nextRewardDisplay;

            if (nextReward) {
                const requiredXp =
                    levelDatabase
                        .getTotalXpForLevel(
                            nextReward.level
                        );

                const remainingXp =
                    Math.max(
                        0,
                        requiredXp -
                        levelData.xp
                    );

                nextRewardDisplay = [
                    `**Role:** ${formatRewardRole(
                        nextRewardRole,
                        nextReward,
                        'None'
                    )}`,
                    `**Required Level:** \`${formatNumber(nextReward.level)}\``,
                    `**XP Remaining:** \`${formatNumber(remainingXp)}\``
                ].join(
                    '\n'
                );
            } else if (currentReward) {
                nextRewardDisplay =
                    '🏆 Highest configured Level Reward reached.';
            } else {
                nextRewardDisplay =
                    'No Level Rewards are currently configured.';
            }

            const avatarURL =
                targetUser
                    .displayAvatarURL({
                        extension:
                            'png',
                        size:
                            512,
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

            const rankEmbed =
                createEmbed({
                    title:
                        '☾・SOUL PROGRESSION',

                    description: [
                        `## ${
                            targetUser.globalName ??
                            targetUser.username
                        }`,
                        `${targetUser}`,
                        `*${brand.motto}*`
                    ].join(
                        '\n'
                    ),

                    color:
                        brand.themeColor,

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '✦・CURRENT STANDING',

                            value: [
                                `**Captain Rank:** ${captainRank?.rank_name ?? 'Unranked'}`,
                                `**Level Rank:** \`${serverRankDisplay}\``,
                                `**Level:** \`${formatNumber(levelData.level)}\``,
                                `**Total XP:** \`${formatNumber(levelData.xp)}\``,
                                `**Messages:** \`${formatNumber(levelData.messageCount)}\``,
                                `**Level Reward:** ${currentRewardDisplay}`
                            ].join(
                                '\n'
                            ),

                            inline:
                                true
                        },
                        {
                            name:
                                `☾・NEXT LEVEL — ${formatNumber(levelData.level + 1)}`,

                            value: [
                                `\`${createProgressBar(
                                    progress.progressPercent
                                )}\` **${progress.progressPercent}%**`,
                                `**Progress:** \`${formatNumber(progress.progressXp)} / ${formatNumber(progress.requiredForNextLevel)} XP\``,
                                `**Remaining:** \`${formatNumber(xpUntilNextLevel)} XP\``
                            ].join(
                                '\n'
                            ),

                            inline:
                                true
                        },
                        {
                            name:
                                '⚔・NEXT LEVEL REWARD',

                            value:
                                nextRewardDisplay,

                            inline:
                                false
                        }
                    ],

                    author: {
                        name:
                            `${brand.botName} • ${brand.botTitle}`,
                        iconURL:
                            botAvatar
                    },

                    footer: {
                        text:
                            `${brand.serverName} • Requested by ${interaction.user.username}`,
                        iconURL:
                            botAvatar
                    }
                });

            await interaction
                .editReply({
                    embeds: [
                        rankEmbed
                    ]
                });
        } catch (error) {
            console.error(
                '❌ Evelynn /rank command error:',
                error
            );

            await sendRankError(
                interaction,
                '❌ Soul Progression Unavailable',
                `${brand.botName} could not retrieve this Level record.`
            );
        }
    }
};