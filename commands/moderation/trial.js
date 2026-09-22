const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createTrial,
    getTrial,
    getActiveTrial,
    getParticipants,
    setTrialStatus,
    setTrialMessage,
    countPendingParticipants
} = require('../../database/trials');

const {
    TRIAL_STATUS,
    getTrial: getTrialDefinition
} = require('../../config/trials');

const {
    reviewTrialMember
} = require('../../handlers/trialService');

const {
    buildTrialAnnouncement
} = require('../../utils/trialAnnouncement');

const {
    buildTrialComponents
} = require('../../utils/trialComponents');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

function formatRank(rankId) {
    return rankId
        .split('_')
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(' ');
}

function formatParticipantStatus(status) {
    const icons = {
        registered: '⚔️',
        passed: '✅',
        failed: '❌',
        withdrawn: '🚪'
    };

    return `${
        icons[status] ?? '•'
    } ${status.toUpperCase()}`;
}

async function disableTrialButtons(
    interaction,
    trial
) {
    if (
        !trial.channelId ||
        !trial.messageId
    ) {
        return;
    }

    try {
        const channel =
            await interaction.guild.channels.fetch(
                trial.channelId
            );

        if (
            !channel ||
            !channel.isTextBased()
        ) {
            return;
        }

        const message =
            await channel.messages.fetch(
                trial.messageId
            );

        await message.edit({
            components: [
                buildTrialComponents(
                    trial.id,
                    true
                )
            ]
        });
    } catch {
        // Announcement may have been deleted.
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trial')
        .setDescription(
            'Manage Blood Moon trials.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription(
                    'Open a new prestige trial.'
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription(
                            'Trial to open.'
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Hashira Trial',
                                value: 'hashira'
                            },
                            {
                                name: 'Upper Moon Trial',
                                value: 'upper_moon'
                            }
                        )
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription(
                    'Close registration for an active trial.'
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription(
                            'Trial to close.'
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Hashira Trial',
                                value: 'hashira'
                            },
                            {
                                name: 'Upper Moon Trial',
                                value: 'upper_moon'
                            }
                        )
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('participants')
                .setDescription(
                    'View participants in a trial.'
                )
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription(
                            'Trial ID.'
                        )
                        .setMinValue(1)
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('review')
                .setDescription(
                    'Pass or fail a trial participant.'
                )
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription(
                            'Trial ID.'
                        )
                        .setMinValue(1)
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription(
                            'Participant to review.'
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('result')
                        .setDescription(
                            'Trial result.'
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Pass',
                                value: 'pass'
                            },
                            {
                                name: 'Fail',
                                value: 'fail'
                            }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription(
                            'Optional review reason.'
                        )
                        .setMaxLength(200)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription(
                    'Cancel an active trial.'
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription(
                            'Trial to cancel.'
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Hashira Trial',
                                value: 'hashira'
                            },
                            {
                                name: 'Upper Moon Trial',
                                value: 'upper_moon'
                            }
                        )
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const action =
            interaction.options.getSubcommand();

        const handlers = {
            create,
            close,
            participants,
            review,
            cancel
        };

        await handlers[action](
            interaction
        );
    }
};

async function create(interaction) {
    const type =
        interaction.options.getString(
            'type',
            true
        );

    const definition =
        getTrialDefinition(type);

    if (!definition) {
        return sendError(
            interaction,
            'Invalid Trial',
            'That trial type does not exist.'
        );
    }

    const existing =
        await getActiveTrial(
            interaction.guild.id,
            type
        );

    if (existing) {
        return sendError(
            interaction,
            'Trial Already Open',
            `${definition.name} **#${existing.id}** is already open.`
        );
    }

    const trial = await createTrial({
        guildId:
            interaction.guild.id,

        trialType:
            type,

        createdBy:
            interaction.user.id,

        opensAt:
            new Date()
    });

    let announcement;

    try {
        announcement =
            await interaction.channel.send(
                buildTrialAnnouncement(
                    trial,
                    definition
                )
            );
    } catch (error) {
        await setTrialStatus(
            trial.id,
            TRIAL_STATUS.CANCELLED
        );

        throw error;
    }

    await setTrialMessage(
        trial.id,
        announcement.channel.id,
        announcement.id
    );

    await interaction.editReply({
        embeds: [
            createEmbed(
                'Trial Opened',
                [
                    `**${definition.name}** is now open.`,
                    '',
                    `Trial ID: **#${trial.id}**`,
                    'Registration is now available.'
                ].join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ]
    });
}

async function close(interaction) {
    const type =
        interaction.options.getString(
            'type',
            true
        );

    const definition =
        getTrialDefinition(type);

    const trial =
        await getActiveTrial(
            interaction.guild.id,
            type
        );

    if (!trial || !definition) {
        return sendError(
            interaction,
            'No Active Trial',
            'There is no open trial of this type.'
        );
    }

    const updated =
        await setTrialStatus(
            trial.id,
            TRIAL_STATUS.CLOSED
        );

    await disableTrialButtons(
        interaction,
        updated
    );

    const pending =
        await countPendingParticipants(
            trial.id
        );

    if (pending === 0) {
        await setTrialStatus(
            trial.id,
            TRIAL_STATUS.COMPLETED
        );
    }

    await interaction.editReply({
        embeds: [
            createEmbed(
                pending === 0
                    ? 'Trial Completed'
                    : 'Registration Closed',
                [
                    `**${definition.name}** registration is closed.`,
                    '',
                    `Trial ID: **#${trial.id}**`,
                    pending
                        ? `Awaiting Review: **${pending}**`
                        : 'There are no participants awaiting review.'
                ].join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ]
    });
}

async function participants(interaction) {
    const trialId =
        interaction.options.getInteger(
            'id',
            true
        );

    const trial =
        await getTrial(trialId);

    if (
        !trial ||
        trial.guildId !== interaction.guild.id
    ) {
        return sendError(
            interaction,
            'Trial Not Found',
            'That trial does not belong to this server.'
        );
    }

    const definition =
        getTrialDefinition(
            trial.trialType
        );

    const entries =
        await getParticipants(
            trial.id
        );

    const shown =
        entries.slice(0, 25);

    const lines =
        shown.map(
            participant =>
                `<@${participant.userId}> — ${
                    formatParticipantStatus(
                        participant.status
                    )
                }`
        );

    if (!lines.length) {
        lines.push(
            'No participants have been recorded.'
        );
    }

    if (entries.length > 25) {
        lines.push(
            '',
            `*Showing 25 of ${entries.length} participants.*`
        );
    }

    await interaction.editReply({
        embeds: [
            createEmbed(
                `${
                    definition?.name ??
                    'Trial'
                } Participants`,
                [
                    `Trial: **#${trial.id}**`,
                    `Status: **${trial.status.toUpperCase()}**`,
                    `Participants: **${entries.length}**`,
                    '',
                    ...lines
                ].join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ]
    });
}

async function review(interaction) {
    const trialId =
        interaction.options.getInteger(
            'id',
            true
        );

    const user =
        interaction.options.getUser(
            'member',
            true
        );

    const result =
        interaction.options.getString(
            'result',
            true
        );

    const reason =
        interaction.options.getString(
            'reason'
        );

    const member =
        await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

    if (
        !member ||
        member.user.bot
    ) {
        return sendError(
            interaction,
            'Invalid Member',
            'That participant could not be found.'
        );
    }

    const reviewResult =
        await reviewTrialMember(
            member,
            trialId,
            result === 'pass',
            interaction.user.id,
            reason
        );

    if (!reviewResult.success) {
        return sendError(
            interaction,
            'Review Failed',
            reviewResult.reason
        );
    }

    const pending =
        await countPendingParticipants(
            trialId
        );

    let completed = false;

    if (
        reviewResult.trial.status ===
            TRIAL_STATUS.CLOSED &&
        pending === 0
    ) {
        await setTrialStatus(
            trialId,
            TRIAL_STATUS.COMPLETED
        );

        completed = true;
    }

    await interaction.editReply({
        embeds: [
            createEmbed(
                result === 'pass'
                    ? 'Trial Passed'
                    : 'Trial Failed',
                [
                    `${member} has **${
                        result === 'pass'
                            ? 'passed'
                            : 'failed'
                    }** ${reviewResult.definition.name}.`,
                    '',
                    result === 'pass'
                        ? `Reward: **${
                            formatRank(
                                reviewResult
                                    .definition
                                    .rewardRank
                            )
                        }**`
                        : 'No progression rank was awarded.',
                    reason
                        ? `Reason: **${reason}**`
                        : null,
                    completed
                        ? '\nAll participants have been reviewed. The trial is now **COMPLETED**.'
                        : null
                ]
                    .filter(Boolean)
                    .join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ]
    });
}

async function cancel(interaction) {
    const type =
        interaction.options.getString(
            'type',
            true
        );

    const definition =
        getTrialDefinition(type);

    const trial =
        await getActiveTrial(
            interaction.guild.id,
            type
        );

    if (!trial || !definition) {
        return sendError(
            interaction,
            'No Active Trial',
            'There is no open trial of this type.'
        );
    }

    const updated =
        await setTrialStatus(
            trial.id,
            TRIAL_STATUS.CANCELLED
        );

    await disableTrialButtons(
        interaction,
        updated
    );

    await interaction.editReply({
        embeds: [
            createEmbed(
                'Trial Cancelled',
                [
                    `**${definition.name}** has been cancelled.`,
                    '',
                    `Trial ID: **#${trial.id}**`,
                    'Registration has been disabled.'
                ].join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ]
    });
}

async function sendError(
    interaction,
    title,
    description
) {
    await interaction.editReply({
        embeds: [
            errorEmbed(
                title,
                description
            )
        ]
    });
}