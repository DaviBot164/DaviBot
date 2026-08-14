const {
    Events,
    MessageFlags,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { randomUUID } = require('crypto');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

const {
    giveaways: giveawayDatabase
} = require('../database');

const GIVEAWAY_CHANNEL_ID =
    '1535755486505476147';

const MIN_GIVEAWAY_DURATION_MS =
    10 * 1000;

const MAX_GIVEAWAY_DURATION_MS =
    14 * 24 * 60 * 60 * 1000;

const processingInteractions =
    new Set();

const giveawayTimers =
    new Map();

const DURATION_UNITS = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
};

function createGiveawayId() {
    return randomUUID()
        .replaceAll('-', '')
        .slice(0, 10)
        .toLowerCase();
}

function parseDuration(value) {
    const match =
        value
            ?.trim()
            .toLowerCase()
            .match(/^(\d+)\s*(s|m|h|d)$/);

    if (!match) {
        return null;
    }

    const duration =
        Number(match[1]) *
        DURATION_UNITS[match[2]];

    return (
        Number.isSafeInteger(duration) &&
        duration >= MIN_GIVEAWAY_DURATION_MS &&
        duration <= MAX_GIVEAWAY_DURATION_MS
    )
        ? duration
        : null;
}

function parseWinnerCount(value) {
    if (!/^\d+$/.test(value?.trim() || '')) {
        return null;
    }

    const count =
        Number(value);

    return (
        Number.isInteger(count) &&
        count >= 1 &&
        count <= 20
    )
        ? count
        : null;
}

async function fetchGiveawayChannel(guild) {
    const channel =
        await guild.channels
            .fetch(GIVEAWAY_CHANNEL_ID)
            .catch(() => null);

    return (
        channel?.isTextBased()
            ? channel
            : null
    );
}

function hasGiveawayPermissions(
    channel,
    botMember
) {
    return Boolean(
        channel.permissionsFor(botMember)?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory
        ])
    );
}

function buildGiveawayEmbed(
    giveaway,
    host
) {
    const entries =
        giveaway.participants instanceof Set
            ? giveaway.participants.size
            : 0;

    const endsAt =
        Math.floor(
            giveaway.endsAt / 1000
        );

    const status = {
        Active: '🟢 Active',
        Ended: '🏁 Ended',
        Cancelled: '🔴 Cancelled'
    }[giveaway.status] || giveaway.status;

    const fields = [
        {
            name: '🎁 Prize',
            value: giveaway.prize,
            inline: true
        },
        {
            name: '🏆 Winners',
            value: `\`${giveaway.winnerCount}\``,
            inline: true
        },
        {
            name: '👥 Entries',
            value: `\`${entries}\``,
            inline: true
        },
        {
            name: '📜 Requirement',
            value: giveaway.requirement || 'None',
            inline: false
        },
        {
            name: '⏳ Ends',
            value:
                `<t:${endsAt}:F>\n<t:${endsAt}:R>`,
            inline: true
        },
        {
            name: '📍 Status',
            value: status,
            inline: true
        }
    ];

    if (
        Array.isArray(giveaway.winners) &&
        giveaway.winners.length
    ) {
        fields.push({
            name: '🏆 Winner(s)',
            value: giveaway.winners
                .map(id => `<@${id}>`)
                .join(', '),
            inline: false
        });
    }

    return createEmbed({
        title: `🎁 ${giveaway.prize}`,
        description: [
            giveaway.description,
            '',
            `👑 Hosted by ${host}`,
            `🆔 \`${giveaway.id}\``
        ].join('\n'),
        thumbnail:
            host.displayAvatarURL({
                extension: 'png',
                size: 512,
                forceStatic: false
            }),
        fields
    });
}

function buildGiveawayButtons(giveaway) {
    const closed =
        giveaway.status !== 'Active';

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `umbra:giveaway:join:${giveaway.id}`
                )
                .setLabel(
                    closed
                        ? 'Giveaway Ended'
                        : 'Enter Giveaway'
                )
                .setEmoji('🎉')
                .setStyle(ButtonStyle.Success)
                .setDisabled(closed),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:giveaway:leave:${giveaway.id}`
                )
                .setLabel('Leave Giveaway')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(closed),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:giveaway:participants:${giveaway.id}`
                )
                .setLabel('Entries')
                .setEmoji('👥')
                .setStyle(ButtonStyle.Primary)
        );
}

function buildParticipantsEmbed(
    giveaway,
    thumbnail = null
) {
    const participants =
        giveaway.participants instanceof Set
            ? [...giveaway.participants]
            : [];

    const visible =
        participants.slice(0, 50);

    const lines =
        visible.map(
            (id, index) =>
                `${index + 1}. <@${id}>`
        );

    if (participants.length > 50) {
        lines.push(
            `…and ${participants.length - 50} more.`
        );
    }

    return createEmbed({
        title:
            `👥 Giveaway Entries • ${giveaway.prize}`,
        description: [
            `**Entries:** \`${participants.length}\``,
            `**Winners:** \`${giveaway.winnerCount}\``,
            `**ID:** \`${giveaway.id}\``,
            '',
            lines.join('\n') || 'No entries yet.'
        ].join('\n'),
        thumbnail
    });
}function selectWinners(
    participants,
    winnerCount
) {
    const pool =
        [...participants];

    for (
        let i = pool.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            pool[i],
            pool[j]
        ] = [
            pool[j],
            pool[i]
        ];
    }

    return pool.slice(
        0,
        Math.min(
            winnerCount,
            pool.length
        )
    );
}

async function fetchGiveawayMessage(
    client,
    giveaway
) {
    const guild =
        await client.guilds
            .fetch(giveaway.guildId)
            .catch(() => null);

    if (!guild) {
        return null;
    }

    const channel =
        await guild.channels
            .fetch(giveaway.channelId)
            .catch(() => null);

    if (!channel?.isTextBased()) {
        return null;
    }

    return channel.messages
        .fetch(giveaway.messageId)
        .catch(() => null);
}

async function endGiveaway(
    client,
    giveawayId,
    guildId
) {
    let giveaway =
        await giveawayDatabase.getGiveaway(
            giveawayId,
            guildId
        );

    if (
        !giveaway ||
        giveaway.status !== 'Active'
    ) {
        return;
    }

    const winners =
        selectWinners(
            giveaway.participants,
            giveaway.winnerCount
        );

    await giveawayDatabase.saveGiveawayWinners(
        giveaway.id,
        giveaway.guildId,
        winners
    );

    giveaway =
        await giveawayDatabase.updateGiveawayStatus(
            giveaway.id,
            giveaway.guildId,
            'Ended'
        );

    if (!giveaway) {
        return;
    }

    const message =
        await fetchGiveawayMessage(
            client,
            giveaway
        );

    const host =
        await client.users
            .fetch(giveaway.hostId)
            .catch(() => client.user);

    if (message) {
        await message.edit({
            embeds: [
                buildGiveawayEmbed(
                    giveaway,
                    host
                )
            ],
            components: [
                buildGiveawayButtons(
                    giveaway
                )
            ]
        });

        if (giveaway.winners.length) {
            const mentions =
                giveaway.winners
                    .map(id => `<@${id}>`)
                    .join(', ');

            await message.reply({
                content:
                    `🎉 Congratulations ${mentions}!`,
                embeds: [
                    createSuccessEmbed(
                        '🏆 Giveaway Winner',
                        `${mentions} won **${giveaway.prize}**!`
                    )
                ],
                allowedMentions: {
                    users:
                        giveaway.winners
                }
            });
        } else {
            await message.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ No Winner',
                        `The Giveaway for **${giveaway.prize}** ended without valid entries.`
                    )
                ]
            });
        }
    }

    const timer =
        giveawayTimers.get(
            giveaway.id
        );

    if (timer) {
        clearTimeout(timer);
        giveawayTimers.delete(
            giveaway.id
        );
    }
}

function scheduleGiveaway(
    client,
    giveaway
) {
    const existing =
        giveawayTimers.get(
            giveaway.id
        );

    if (existing) {
        clearTimeout(existing);
    }

    const delay =
        Math.max(
            giveaway.endsAt -
            Date.now(),
            0
        );

    const timer =
        setTimeout(
            () => {
                endGiveaway(
                    client,
                    giveaway.id,
                    giveaway.guildId
                ).catch(
                    error =>
                        console.error(
                            '❌ Giveaway ending failed:',
                            error
                        )
                );
            },
            delay
        );

    giveawayTimers.set(
        giveaway.id,
        timer
    );
}async function replyError(
    interaction,
    title,
    description
) {
    const embed =
        createErrorEmbed(
            title,
            description
        );

    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components: []
        });

        return;
    }

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

async function handleCreateModal(interaction) {
    const creatorId =
        interaction.customId
            .split(':')[3];

    if (
        !creatorId ||
        creatorId !== interaction.user.id
    ) {
        await replyError(
            interaction,
            '❌ Invalid Giveaway Form',
            'This Giveaway form does not belong to you.'
        );

        return;
    }

    if (!interaction.inGuild()) {
        await replyError(
            interaction,
            '❌ Server Only Action',
            'Giveaways can only be created inside a server.'
        );

        return;
    }

    const getValue =
        id =>
            interaction.fields
                .getTextInputValue(id)
                .trim();

    const prize =
        getValue('giveaway-prize');

    const rawDuration =
        getValue('giveaway-duration');

    const rawWinnerCount =
        getValue('giveaway-winner-count');

    const description =
        getValue('giveaway-description');

    const requirement =
        getValue('giveaway-requirement');

    const durationMs =
        parseDuration(rawDuration);

    if (!durationMs) {
        await replyError(
            interaction,
            '❌ Invalid Giveaway Duration',
            'Use `10s`, `30m`, `2h` or `1d`. Allowed range: `10 seconds` to `14 days`.'
        );

        return;
    }

    const winnerCount =
        parseWinnerCount(
            rawWinnerCount
        );

    if (!winnerCount) {
        await replyError(
            interaction,
            '❌ Invalid Winner Count',
            'Enter a number between `1` and `20`.'
        );

        return;
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const channel =
        await fetchGiveawayChannel(
            interaction.guild
        );

    if (!channel) {
        await replyError(
            interaction,
            '❌ Giveaway Channel Not Found',
            `Evelynn could not find the configured channel.\n\nID: \`${GIVEAWAY_CHANNEL_ID}\``
        );

        return;
    }

    const botMember =
        interaction.guild.members.me;

    if (
        !botMember ||
        !hasGiveawayPermissions(
            channel,
            botMember
        )
    ) {
        await replyError(
            interaction,
            '❌ Missing Giveaway Permissions',
            `Evelynn cannot publish Giveaways in ${channel}.`
        );

        return;
    }

    const giveaway = {
        id: createGiveawayId(),
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: null,
        hostId: interaction.user.id,
        prize,
        description,
        requirement,
        winnerCount,
        status: 'Active',
        participants: new Set(),
        winners: [],
        createdAt: Date.now(),
        endsAt: Date.now() + durationMs,
        endedAt: null
    };

    let message = null;

    try {
        message =
            await channel.send({
                embeds: [
                    buildGiveawayEmbed(
                        giveaway,
                        interaction.user
                    )
                ],
                components: [
                    buildGiveawayButtons(
                        giveaway
                    )
                ]
            });

        giveaway.messageId =
            message.id;

        await giveawayDatabase
            .createGiveaway(
                giveaway
            );
    } catch (error) {
        if (message) {
            await message
                .delete()
                .catch(() => null);
        }

        throw error;
    }

    scheduleGiveaway(
        interaction.client,
        giveaway
    );

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Giveaway Published',
                [
                    `**${prize}** was published in ${channel}.`,
                    `⏳ \`${rawDuration}\` • 🏆 \`${winnerCount}\` winner(s)`,
                    `🆔 \`${giveaway.id}\``
                ].join('\n')
            )
        ],
        components: []
    });
}async function updateGiveawayMessage(
    interaction,
    giveaway
) {
    const host =
        await interaction.client.users
            .fetch(giveaway.hostId)
            .catch(
                () => interaction.user
            );

    await interaction.message.edit({
        embeds: [
            buildGiveawayEmbed(
                giveaway,
                host
            )
        ],
        components: [
            buildGiveawayButtons(
                giveaway
            )
        ]
    });
}

async function handleParticipantAction(
    interaction,
    giveaway,
    action
) {
    const joining =
        action === 'join';

    const changed =
        joining
            ? await giveawayDatabase
                .addGiveawayParticipant(
                    giveaway.id,
                    giveaway.guildId,
                    interaction.user.id
                )
            : await giveawayDatabase
                .removeGiveawayParticipant(
                    giveaway.id,
                    giveaway.guildId,
                    interaction.user.id
                );

    if (!changed) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    joining
                        ? '⚠️ Already Entered'
                        : '⚠️ Not Entered',
                    joining
                        ? `You have already entered **${giveaway.prize}**.`
                        : `You have not entered **${giveaway.prize}**.`
                )
            ],
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    giveaway =
        await giveawayDatabase.getGiveaway(
            giveaway.id,
            giveaway.guildId
        );

    await interaction.deferUpdate();

    await updateGiveawayMessage(
        interaction,
        giveaway
    );

    await interaction.followUp({
        embeds: [
            createSuccessEmbed(
                joining
                    ? '🎉 Giveaway Entered'
                    : '✅ Giveaway Left',
                [
                    joining
                        ? `You entered **${giveaway.prize}**.`
                        : `You left **${giveaway.prize}**.`,
                    `👥 Entries: \`${giveaway.participants.size}\``
                ].join('\n')
            )
        ],
        flags: MessageFlags.Ephemeral
    });
}

async function handleGiveawayButton(
    interaction
) {
    const [
        ,
        ,
        action,
        giveawayId
    ] =
        interaction.customId.split(':');

    if (
        !action ||
        !giveawayId
    ) {
        await replyError(
            interaction,
            '❌ Invalid Giveaway Action',
            'Evelynn could not identify this Giveaway action.'
        );

        return;
    }

    if (!interaction.inGuild()) {
        return;
    }

    const giveaway =
        await giveawayDatabase.getGiveaway(
            giveawayId
                .trim()
                .toLowerCase(),
            interaction.guildId
        );

    if (!giveaway) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Giveaway Unavailable',
                    `No Giveaway was found with ID \`${giveawayId}\`.`
                )
            ],
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    if (action === 'participants') {
        const thumbnail =
            interaction.guild.iconURL({
                extension: 'png',
                size: 256,
                forceStatic: false
            }) ||
            interaction.client.user
                .displayAvatarURL({
                    extension: 'png',
                    size: 256,
                    forceStatic: false
                });

        await interaction.reply({
            embeds: [
                buildParticipantsEmbed(
                    giveaway,
                    thumbnail
                )
            ],
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    if (giveaway.status !== 'Active') {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Giveaway Ended',
                    'This Giveaway is no longer accepting entries.'
                )
            ],
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    if (
        action === 'join' ||
        action === 'leave'
    ) {
        await handleParticipantAction(
            interaction,
            giveaway,
            action
        );

        return;
    }

    await replyError(
        interaction,
        '❌ Unknown Giveaway Action',
        'Evelynn does not recognize this Giveaway button.'
    );
}

async function sendInteractionError(
    interaction,
    embed
) {
    if (interaction.deferred) {
        return interaction
            .editReply({
                embeds: [embed],
                components: []
            })
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        })
        .catch(() => null);
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        const isModal =
            interaction.isModalSubmit() &&
            interaction.customId.startsWith(
                'umbra:giveaway:create:'
            );

        const isButton =
            interaction.isButton() &&
            interaction.customId.startsWith(
                'umbra:giveaway:'
            );

        if (!isModal && !isButton) {
            return;
        }

        if (
            processingInteractions.has(
                interaction.id
            )
        ) {
            return;
        }

        processingInteractions.add(
            interaction.id
        );

        try {
            if (isModal) {
                await handleCreateModal(
                    interaction
                );
            } else {
                await handleGiveawayButton(
                    interaction
                );
            }
        } catch (error) {
            console.error(
                '❌ Evelynn Giveaway failed:',
                error
            );

            await sendInteractionError(
                interaction,
                createErrorEmbed(
                    '❌ Giveaway Action Failed',
                    'Evelynn could not complete this Giveaway action.'
                )
            );
        } finally {
            setTimeout(
                () =>
                    processingInteractions.delete(
                        interaction.id
                    ),
                15_000
            );
        }
    },

    endGiveaway,
    scheduleGiveaway
};