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
    levels: levelDatabase,
    ranks: rankDatabase,
    titles: titleDatabase
} = require('../../database');

const PROFILE_COLOR = '#5B3A78';

function formatNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString('en-US')
        : '0';
}

async function loadSafely(loader, fallback = null) {
    try {
        return (await loader()) ?? fallback;
    } catch {
        return fallback;
    }
}

async function getActiveTitle(guildId, userId) {
    const titles = await loadSafely(
        () => titleDatabase.getSoulTitles(guildId, userId),
        []
    );

    return Array.isArray(titles)
        ? titles.find(title => title.isActive) ?? null
        : null;
}

async function getProgressionRole(member, level) {
    const rewards = await loadSafely(
        () => levelDatabase.getEarnedLevelRewards(
            member.guild.id,
            level
        ),
        []
    );

    return [...rewards]
        .sort((first, second) => second.level - first.level)
        .map(reward => member.guild.roles.cache.get(reward.roleId))
        .find(role => role && member.roles.cache.has(role.id))
        ?.toString() ?? 'None';
}

function buildMediaRow(avatarURL, bannerURL) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Avatar')
            .setEmoji('🖼️')
            .setStyle(ButtonStyle.Link)
            .setURL(avatarURL)
    );

    if (bannerURL) {
        row.addComponents(
            new ButtonBuilder()
                .setLabel('Banner')
                .setEmoji('🌌')
                .setStyle(ButtonStyle.Link)
                .setURL(bannerURL)
        );
    }

    return row;
}

async function sendProfileError(interaction, title, description) {
    const payload = {
        embeds: [createErrorEmbed(title, description)],
        components: []
    };

    if (interaction.deferred) {
        return interaction.editReply(payload).catch(() => null);
    }

    if (interaction.replied) {
        return interaction.followUp({
            ...payload,
            flags: MessageFlags.Ephemeral
        }).catch(() => null);
    }

    return interaction.reply({
        ...payload,
        flags: MessageFlags.Ephemeral
    }).catch(() => null);
}

module.exports = {
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View a compact member profile.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select a member')
                .setRequired(false)
        )
        .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendProfileError(
                    interaction,
                    '❌ Server Only Command',
                    'This command can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser('user') ?? interaction.user;

            const member = await interaction.guild.members
                .fetch(selectedUser.id)
                .catch(() => null);

            if (!member) {
                await sendProfileError(
                    interaction,
                    '❌ Member Not Found',
                    'The selected user is not currently in this server.'
                );

                return;
            }

            const user = await member.user.fetch(true);
            const guildId = interaction.guild.id;

            const [progression, serverRank, currentRank, activeTitle] =
                await Promise.all([
                    loadSafely(
                        () => levelDatabase.getUserLevel(guildId, user.id),
                        { level: 0, xp: 0 }
                    ),
                    loadSafely(
                        () => levelDatabase.getUserRank(guildId, user.id)
                    ),
                    loadSafely(
                        () => rankDatabase.getCurrentRank(guildId, user.id)
                    ),
                    getActiveTitle(guildId, user.id)
                ]);

            const level = Number(progression.level || 0);
            const xp = Number(progression.xp || 0);
            const progressionRole = await getProgressionRole(member, level);

            const avatarURL = user.displayAvatarURL({
                extension: 'png',
                size: 2048,
                forceStatic: false
            });

            const bannerURL = user.bannerURL({
                extension: 'png',
                size: 2048,
                forceStatic: false
            });

            const botAvatar = interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            });            const highestRole =
                member.roles.highest.id === guildId
                    ? 'None'
                    : member.roles.highest.toString();

            const embed = createEmbed({
                title: `Ⅹ・${user.username}`,
                description: [
                    `**${member.displayName}**`,
                    '',
                    `⚔️ **Sin Rank:** ${currentRank?.rank_name ?? 'Unranked'}`,
                    `🏷️ **Title:** ${activeTitle?.displayName ?? 'None'}`
                ].join('\n'),
                color: PROFILE_COLOR,
                thumbnail: avatarURL,
                fields: [
                    {
                        name: '◆・PROGRESSION',
                        value: [
                            `**Level:** \`${formatNumber(level)}\``,
                            `**XP:** \`${formatNumber(xp)}\``,
                            `**Server Rank:** \`${
                                serverRank
                                    ? `#${formatNumber(serverRank)}`
                                    : 'Unranked'
                            }\``
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '♜・STANDING',
                        value: [
                            `**Progression Role:** ${progressionRole}`,
                            `**Highest Role:** ${highestRole}`
                        ].join('\n'),
                        inline: true
                    }
                ],
                author: {
                    name: 'Evelynn • THE Ⅹ SINS',
                    iconURL: botAvatar
                },
                footer: {
                    text: `TTS • Requested by ${interaction.user.username}`,
                    iconURL: botAvatar
                }
            });

            if (bannerURL) {
                embed.setImage(bannerURL);
            }

            await interaction.editReply({
                embeds: [embed],
                components: [
                    buildMediaRow(
                        avatarURL,
                        bannerURL
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /profile command error:',
                error
            );

            await sendProfileError(
                interaction,
                '❌ Profile Unavailable',
                'Evelynn could not open this profile.'
            );
        }
    }
};