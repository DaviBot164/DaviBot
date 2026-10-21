const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    escapeMarkdown
} = require('discord.js');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    getUserCases
} = require('../../database/moderationCases');

const PAGE_SIZE = 5;

const ACTION_NAMES = Object.freeze({
    warn: 'Warning',
    unwarn: 'Warning Removed',
    timeout: 'Timeout',
    untimeout: 'Timeout Removed',
    kick: 'Kick',
    ban: 'Ban',
    unban: 'Ban Removed',
    lock: 'Channel Locked',
    unlock: 'Channel Unlocked',
    slowmode: 'Slowmode',
    clear: 'Messages Cleared',
    guardian: 'Guardian',
    emergency: 'Emergency Control'
});

function dateText(value) {
    if (!value) return 'Date unavailable';

    const timestamp = new Date(value).getTime();

    return Number.isFinite(timestamp)
        ? `<t:${Math.floor(timestamp / 1000)}:f>`
        : 'Date unavailable';
}

function statusText(record) {
    if (record.resolvedAt) return 'Resolved';

    const expiresAt = record.expiresAt
        ? new Date(record.expiresAt).getTime()
        : NaN;

    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
        return 'Expired';
    }

    return record.active ? 'Active' : 'Recorded';
}

function reasonText(value) {
    const raw = String(value ?? '')
        .replace(/\s+/gu, ' ')
        .trim();

    if (!raw) return 'No reason provided.';

    const shortened = raw.length > 220
        ? `${raw.slice(0, 217)}...`
        : raw;

    return escapeMarkdown(shortened);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View a member moderation history.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Member whose history you want to view.')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'Use this command inside a server.',
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.ModerateMembers
            )
        ) {
            await interaction.reply({
                content: 'You need the Moderate Members permission.',
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        try {
            const target = interaction.options.getUser('member', true);

            const records = await getUserCases(
                interaction.guildId,
                target.id,
                100
            );

            if (!Array.isArray(records)) {
                throw new Error('Moderation history returned invalid data.');
            }

            let page = 0;

            const totalPages = Math.max(
                1,
                Math.ceil(records.length / PAGE_SIZE)
            );

            const prefix = `akane:history:${interaction.id}`;

            function payload(disabled = false) {
                const embed = createEmbed(
                    '🛡️ Moderation History',
                    [
                        `Member: <@${target.id}> (\`${target.id}\`)`,
                        records.length
                            ? `Loaded: **${records.length}** latest cases • Page **${page + 1}/${totalPages}**`
                            : 'No moderation cases were found.',
                        records.length === 100
                            ? 'Showing the latest 100 cases; older records may exist.'
                            : ''
                    ].filter(Boolean).join('\n')
                );

                const visible = records.slice(
                    page * PAGE_SIZE,
                    (page + 1) * PAGE_SIZE
                );

                for (const record of visible) {
                    const action = ACTION_NAMES[record.action]
                        ?? String(record.action ?? 'Unknown').slice(0, 80);

                    const details = [
                        `${dateText(record.createdAt)} • **${statusText(record)}**`,
                        record.moderatorId
                            ? `Moderator: <@${record.moderatorId}>`
                            : 'Moderator: Unavailable',
                        `Reason: ${reasonText(record.reason)}`
                    ];

                    if (record.channelId) {
                        details.push(`Channel: <#${record.channelId}>`);
                    }

                    embed.addFields({
                        name: `#${record.id} • ${action}`,
                        value: details.join('\n')
                    });
                }

                const components = totalPages > 1
                    ? [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${prefix}:previous`)
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(disabled || page === 0),
                            new ButtonBuilder()
                                .setCustomId(`${prefix}:next`)
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(
                                    disabled || page === totalPages - 1
                                )
                        )
                    ]
                    : [];

                return {
                    embeds: [embed],
                    components,
                    allowedMentions: { parse: [] }
                };
            }

            const reply = await interaction.editReply(payload());

            if (totalPages === 1) return;

            const collector = reply.createMessageComponentCollector({
                filter: component =>
                    component.user.id === interaction.user.id &&
                    [
                        `${prefix}:previous`,
                        `${prefix}:next`
                    ].includes(component.customId),
                time: 5 * 60_000
            });

            let queue = Promise.resolve();
            let ended = false;

            collector.on('collect', component => {
                // Acknowledge immediately, before waiting for earlier clicks.
                const acknowledgement = component.deferUpdate()
                    .then(() => true)
                    .catch(error => {
                        console.error(
                            'History button acknowledgement failed:',
                            error
                        );

                        return false;
                    });

                queue = queue.then(async () => {
                    if (!await acknowledgement || ended) return;

                    const direction = component.customId.endsWith(':next')
                        ? 1
                        : -1;

                    page = Math.min(
                        totalPages - 1,
                        Math.max(0, page + direction)
                    );

                    await interaction.editReply(payload());
                }).catch(error => {
                    console.error('History navigation failed:', error);
                });
            });

            collector.on('end', () => {
                ended = true;

                queue = queue.then(() =>
                    interaction.editReply(payload(true))
                ).catch(error => {
                    console.error('History controls cleanup failed:', error);
                });
            });
        } catch (error) {
            console.error('History command failed:', error);

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'History Failed',
                        'Akane could not load this member’s moderation history.'
                    )
                ],
                components: [],
                allowedMentions: { parse: [] }
            });
        }
    }
};