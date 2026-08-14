const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrials: rankTrialDatabase,
    rankTrialParticipants: participantDatabase
} = require('../../database');

const {
    getRelevantRankTrialSchedule,
    toDiscordTimestamp
} = require('../../utils/rankTrials/calendar');

const {
    buildPublicationEmbed,
    getPublicationLabel,
    publishRankTrialAnnouncement
} = require('../../utils/rankTrials/publisher');

const {
    checkRankTrialSchedule,
    isRankTrialSchedulerRunning,
    getRankTrialSchedulerInterval
} = require('../../utils/rankTrials/scheduler');

const {
    getScheduledEventPermissions,
    getRankTrialScheduledEventState,
    synchronizeRankTrialScheduledEvent
} = require('../../utils/rankTrials/eventManager');

const {
    buildOpenRegistrationComponents,
    buildClosedRegistrationComponents,
    buildTestRegistrationComponents
} = require('../../utils/rankTrials/components');

const {
    getRegistrationState,
    getCurrentRegistrationStatistics
} = require('../../utils/rankTrials/registration');

const REVIEW_COMPONENT_PREFIX =
    'umbra:ranktrial:review';

const PUBLICATIONS = {
    opening:
        '⚔️ Opening Announcement',

    registrationReminder:
        '⏳ Registration Reminder',

    finalReminder:
        '🌙 Final Reminder',

    battleStart:
        '🏆 Battle Start',

    closing:
        '📜 Closing Notice'
};

const PUBLICATION_KEYS =
    new Set(
        Object.keys(PUBLICATIONS)
    );

const EVENT_SUCCESS_STATUSES =
    new Set([
        'created',
        'recreated',
        'updated',
        'synchronized'
    ]);

const PARTICIPANT_STATUS = {
    REGISTERED:
        '⚔️ `REGISTERED`',

    WITHDRAWN:
        '🚪 `WITHDRAWN`',

    UNDER_REVIEW:
        '🔎 `UNDER_REVIEW`',

    APPROVED:
        '✅ `APPROVED`',

    REJECTED:
        '❌ `REJECTED`'
};

const REGISTRATION_STATUS = {
    UPCOMING:
        '🕒 `UPCOMING`',

    OPEN:
        '🟢 `OPEN`',

    CLOSED:
        '🔒 `CLOSED`'
};

function getPublicationChoiceName(key) {
    return (
        PUBLICATIONS[key] ??
        'Unknown Publication'
    );
}

function getScheduledPublication(
    schedule,
    key
) {
    return (
        schedule.publications.find(
            publication =>
                publication.key === key
        ) ??
        null
    );
}

function formatPublicationStatus(record) {
    if (!record) {
        return '`PENDING`';
    }

    return (
        record.publishedAt &&
        record.messageId
    )
        ? '`PUBLISHED`'
        : '`RESERVED`';
}

function formatSchedulePublication(
    publication,
    record
) {
    return [
        `**${getPublicationLabel(
            publication.key
        )}**`,
        toDiscordTimestamp(
            publication.scheduledFor,
            'F'
        ),
        toDiscordTimestamp(
            publication.scheduledFor,
            'R'
        ),
        `**Mention:** ${
            publication.mentionEveryone
                ? '`@everyone`'
                : '`No mention`'
        }`,
        `**Database:** ${formatPublicationStatus(
            record
        )}`
    ].join('\n');
}

function formatHistoryEntry(publication) {
    return [
        `**${publication.publicationType}**`,
        `Trial: \`${publication.trialKey}\``,
        `Published: ${
            publication.publishedAt
                ? toDiscordTimestamp(
                    publication.publishedAt,
                    'F'
                )
                : '`Not completed`'
        }`,
        `Message: ${
            publication.messageId
                ? `\`${publication.messageId}\``
                : '`No message ID`'
        }`
    ].join('\n');
}

function formatEventStatus(status) {
    if (!status) {
        return '`NOT CREATED`';
    }

    return `\`${String(status).toUpperCase()}\``;
}

function formatRegistrationState(state) {
    return (
        REGISTRATION_STATUS[state] ??
        '⚪ `UNKNOWN`'
    );
}

function formatParticipantStatus(status) {
    return (
        PARTICIPANT_STATUS[status] ??
        '⚪ `UNKNOWN`'
    );
}

function buildScheduledEventLink(
    guildId,
    eventId
) {
    return eventId
        ? `https://discord.com/events/${guildId}/${eventId}`
        : null;
}

function buildRegistrationRows(state) {
    return [
        state === 'OPEN'
            ? buildOpenRegistrationComponents()
            : buildClosedRegistrationComponents()
    ];
}

function buildReviewCustomId(
    action,
    trialKey,
    userId
) {
    return [
        REVIEW_COMPONENT_PREFIX,
        action,
        trialKey,
        userId
    ].join(':');
}

function buildReviewComponents(participant) {
    if (
        [
            'REGISTERED',
            'UNDER_REVIEW'
        ].includes(
            participant.status
        )
    ) {
        return [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            buildReviewCustomId(
                                'approve',
                                participant.trialKey,
                                participant.userId
                            )
                        )
                        .setLabel('Approve')
                        .setEmoji('✅')
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            buildReviewCustomId(
                                'reject',
                                participant.trialKey,
                                participant.userId
                            )
                        )
                        .setLabel('Reject')
                        .setEmoji('❌')
                        .setStyle(
                            ButtonStyle.Danger
                        )
                )
        ];
    }

    if (
        [
            'APPROVED',
            'REJECTED'
        ].includes(
            participant.status
        ) &&
        !participant.promotedAt
    ) {
        return [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            buildReviewCustomId(
                                'reopen',
                                participant.trialKey,
                                participant.userId
                            )
                        )
                        .setLabel(
                            'Reopen Review'
                        )
                        .setEmoji('🔄')
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ];
    }

    return [];
}

async function sendError(
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
        return interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    if (interaction.replied) {
        return interaction.followUp({
            embeds: [embed],
            flags:
                MessageFlags.Ephemeral
        });
    }

    return interaction.reply({
        embeds: [embed],
        flags:
            MessageFlags.Ephemeral
    });
}

function getBotAvatar(interaction) {
    return interaction.client.user
        .displayAvatarURL({
            size: 256,
            forceStatic: false
        });
}

function getGuildIcon(interaction) {
    return interaction.guild.iconURL({
        size: 512,
        forceStatic: false
    }) ?? getBotAvatar(interaction);
}

function applyRankTrialBranding(
    interaction,
    embed,
    footer
) {
    return embed
        .setAuthor({
            name:
                rankTrialConfig.branding
                    .authorName,

            iconURL:
                getBotAvatar(interaction)
        })
        .setFooter({
            text:
                footer,

            iconURL:
                interaction.guild.iconURL({
                    size: 128,
                    forceStatic: false
                }) ??
                getBotAvatar(interaction)
        })
        .setTimestamp();
}

function addAnnouncementOption(
    subcommand,
    description
) {
    return subcommand
        .addStringOption(option =>
            option
                .setName(
                    'announcement'
                )
                .setDescription(
                    description
                )
                .setRequired(true)
                .addChoices(
                    ...Object.entries(
                        PUBLICATIONS
                    ).map(
                        ([
                            value,
                            name
                        ]) => ({
                            name,
                            value
                        })
                    )
                )
        );
}const data =
    new SlashCommandBuilder()
        .setName('ranktrials')
        .setDescription(
            'Manage the monthly TTS Rank Trials system.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
        .setDMPermission(false)

        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription(
                    'View the current Rank Trial schedule and system status.'
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('registration')
                .setDescription(
                    'Open the current Rank Trial registration panel.'
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('testregistration')
                .setDescription(
                    'Open the Rank Trial registration test panel.'
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('review')
                .setDescription(
                    'Review one Rank Trial participant.'
                )
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription(
                            'Select the member to review'
                        )
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            addAnnouncementOption(
                subcommand
                    .setName('preview')
                    .setDescription(
                        'Preview a Rank Trial announcement.'
                    ),
                'Select the announcement to preview'
            )
        )

        .addSubcommand(subcommand =>
            addAnnouncementOption(
                subcommand
                    .setName('publish')
                    .setDescription(
                        'Manually publish a Rank Trial announcement.'
                    ),
                'Select the announcement to publish'
            )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription(
                    'Run an immediate scheduler check.'
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription(
                    'View recent Rank Trial publication history.'
                )
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription(
                            'Number of entries to display'
                        )
                        .setMinValue(1)
                        .setMaxValue(10)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('event')
                .setDescription(
                    'View the current Rank Trial Discord Event.'
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('sync')
                .setDescription(
                    'Create or synchronize the Rank Trial Discord Event.'
                )
        );async function handleStatus(interaction) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const schedule =
        getRelevantRankTrialSchedule();

    const history =
        await rankTrialDatabase
            .getTrialPublications(
                interaction.guild.id,
                schedule.trialKey
            );

    const publicationMap =
        new Map(
            history.map(
                item => [
                    item.publicationType,
                    item
                ]
            )
        );

    const registration =
        getRegistrationState(
            schedule
        );

    const fields =
        schedule.publications.map(
            publication => ({
                name:
                    getPublicationChoiceName(
                        publication.key
                    ),

                value:
                    formatSchedulePublication(
                        publication,
                        publicationMap.get(
                            publication.type
                        ) ?? null
                    ),

                inline: false
            })
        );

    const embed =
        applyRankTrialBranding(
            interaction,
            createEmbed({
                title:
                    '⚔️ Monthly Rank Trials Status',

                description:
                    [
                        'Evelynn Rank Trials System',
                        '',
                        `**System:** \`${rankTrialConfig.enabled ? 'ENABLED' : 'DISABLED'}\``,
                        `**Scheduler:** \`${isRankTrialSchedulerRunning() ? 'RUNNING' : 'STOPPED'}\``,
                        `**Scheduled Events:** \`${rankTrialConfig.scheduledEvent?.enabled ? 'ENABLED' : 'DISABLED'}\``,
                        `**Registration:** ${formatRegistrationState(
                            registration.state
                        )}`,
                        `**Interval:** \`${getRankTrialSchedulerInterval() / 60_000} min\``,
                        `**Timezone:** \`${rankTrialConfig.timezone}\``,
                        `**Cycle:** \`${schedule.trialKey}\``,
                        '',
                        `**Opens:** ${toDiscordTimestamp(
                            registration.opensAt,
                            'F'
                        )}`,
                        `**Closes:** ${toDiscordTimestamp(
                            registration.closesAt,
                            'F'
                        )}`,
                        `**Battle:** ${toDiscordTimestamp(
                            schedule.battleStart,
                            'F'
                        )}`,
                        `**Relative:** ${toDiscordTimestamp(
                            schedule.battleStart,
                            'R'
                        )}`
                    ].join('\n'),

                fields,
                thumbnail:
                    getGuildIcon(
                        interaction
                    )
            }),
            'Evelynn • Rank Trials Control'
        );

    await interaction.editReply({
        embeds: [embed],
        components: []
    });
}

function buildStatisticsField(
    statistics,
    title = '👥 Participant Registry'
) {
    return {
        name: title,
        value: [
            `**Total:** \`${statistics.total}\``,
            `**Registered:** \`${statistics.registered}\``,
            `**Withdrawn:** \`${statistics.withdrawn}\``,
            `**Under Review:** \`${statistics.underReview}\``,
            `**Approved:** \`${statistics.approved}\``,
            `**Rejected:** \`${statistics.rejected}\``,
            `**Promoted:** \`${statistics.promoted}\``
        ].join('\n'),
        inline: false
    };
}

async function handleRegistration(
    interaction
) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const schedule =
        getRelevantRankTrialSchedule();

    const registration =
        getRegistrationState(
            schedule
        );

    const { statistics } =
        await getCurrentRegistrationStatistics({
            guildId:
                interaction.guild.id
        });

    const stateText =
        registration.state === 'OPEN'
            ? 'Registration is open.'
            : registration.state === 'UPCOMING'
                ? 'Registration has not opened yet.'
                : 'Registration is closed and active entries are in Staff Review.';

    const embed =
        createEmbed({
            title:
                '⚔️ Rank Trial Registration',

            description:
                [
                    `**Cycle:** \`${schedule.trialKey}\``,
                    `**Status:** ${formatRegistrationState(
                        registration.state
                    )}`,
                    '',
                    `**Opens:** ${toDiscordTimestamp(
                        registration.opensAt,
                        'F'
                    )}`,
                    `**Closes:** ${toDiscordTimestamp(
                        registration.closesAt,
                        'F'
                    )}`,
                    `**Battle:** ${toDiscordTimestamp(
                        schedule.battleStart,
                        'F'
                    )}`,
                    '',
                    stateText
                ].join('\n'),

            fields: [
                buildStatisticsField(
                    statistics
                )
            ]
        });

    await interaction.editReply({
        embeds: [embed],
        components:
            buildRegistrationRows(
                registration.state
            )
    });
}

async function handleTestRegistration(
    interaction
) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const schedule =
        getRelevantRankTrialSchedule();

    const { statistics } =
        await getCurrentRegistrationStatistics({
            guildId:
                interaction.guild.id
        });

    await interaction.editReply({
        embeds: [
            createEmbed({
                title:
                    '🧪 Rank Trial Runtime Test',

                description:
                    [
                        `**Cycle:** \`${schedule.trialKey}\``,
                        '',
                        '1. Test Register',
                        '2. Test Withdraw',
                        '3. Test Register again',
                        '',
                        'This uses the real PostgreSQL participant registry.'
                    ].join('\n'),

                fields: [
                    buildStatisticsField(
                        statistics,
                        '👥 Current Registry'
                    )
                ]
            })
        ],

        components: [
            buildTestRegistrationComponents()
        ]
    });
}

async function handleReview(interaction) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const schedule =
        getRelevantRankTrialSchedule();

    const targetUser =
        interaction.options.getUser(
            'member',
            true
        );

    const participant =
        await participantDatabase
            .getParticipant(
                interaction.guild.id,
                schedule.trialKey,
                targetUser.id
            );

    if (!participant) {
        return sendError(
            interaction,
            '❌ Participant Not Found',
            [
                `${targetUser} has no participant record for this Rank Trial.`,
                `**Cycle:** \`${schedule.trialKey}\``
            ].join('\n')
        );
    }

    const reviewedAt =
        participant.reviewedAt
            ? toDiscordTimestamp(
                participant.reviewedAt,
                'F'
            )
            : '`Not reviewed`';

    const promotedAt =
        participant.promotedAt
            ? toDiscordTimestamp(
                participant.promotedAt,
                'F'
            )
            : '`Not promoted`';

    await interaction.editReply({
        embeds: [
            createEmbed({
                title:
                    '🔎 Rank Trial Staff Review',

                description:
                    `**Cycle:** \`${schedule.trialKey}\``,

                fields: [
                    {
                        name:
                            '👤 Participant',

                        value: [
                            `**Member:** ${targetUser}`,
                            `**Status:** ${formatParticipantStatus(
                                participant.status
                            )}`,
                            `**Previous Rank:** \`${participant.previousRank ?? 'Unranked'}\``,
                            `**New Rank:** \`${participant.newRank ?? 'Not selected'}\``
                        ].join('\n'),

                        inline: false
                    },
                    {
                        name:
                            '📖 Review Record',

                        value: [
                            `**Reviewed By:** ${
                                participant.reviewedBy
                                    ? `<@${participant.reviewedBy}>`
                                    : '`Not reviewed`'
                            }`,
                            `**Reason:** ${participant.reviewReason || '`No reason recorded`'}`,
                            `**Reviewed:** ${reviewedAt}`,
                            `**Promoted:** ${promotedAt}`
                        ].join('\n'),

                        inline: false
                    }
                ]
            })
        ],

        components:
            buildReviewComponents(
                participant
            )
    });
}function getSelectedPublication(
    interaction
) {
    const publicationKey =
        interaction.options.getString(
            'announcement',
            true
        );

    if (!PUBLICATION_KEYS.has(
        publicationKey
    )) {
        return {
            error:
                'Invalid announcement.',
            publicationKey
        };
    }

    const schedule =
        getRelevantRankTrialSchedule();

    const publication =
        getScheduledPublication(
            schedule,
            publicationKey
        );

    if (!publication) {
        return {
            error:
                'This announcement is disabled in `config/rankTrials.js`.',
            publicationKey,
            schedule
        };
    }

    return {
        publicationKey,
        schedule,
        publication
    };
}

async function handlePreview(
    interaction
) {
    const selected =
        getSelectedPublication(
            interaction
        );

    if (selected.error) {
        return sendError(
            interaction,
            '❌ Announcement Unavailable',
            selected.error
        );
    }

    const {
        publicationKey,
        schedule,
        publication
    } = selected;

    const embed =
        applyRankTrialBranding(
            interaction,
            buildPublicationEmbed(
                publicationKey,
                schedule
            ),
            `${rankTrialConfig.branding.footerText} • Preview`
        );

    await interaction.reply({
        content:
            publication.mentionEveryone
                ? '`Preview mention: @everyone`'
                : '`Preview mention: none`',

        embeds: [embed],

        flags:
            MessageFlags.Ephemeral,

        allowedMentions: {
            parse: []
        }
    });
}

async function handlePublish(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const selected =
        getSelectedPublication(
            interaction
        );

    if (selected.error) {
        return sendError(
            interaction,
            '❌ Announcement Unavailable',
            selected.error
        );
    }

    const {
        publicationKey,
        schedule,
        publication
    } = selected;

    const result =
        await publishRankTrialAnnouncement(
            interaction.client,
            interaction.guild,
            schedule,
            publication
        );

    if (result.status === 'duplicate') {
        return sendError(
            interaction,
            '⚠️ Announcement Already Published',
            `This announcement already exists for cycle \`${schedule.trialKey}\`.`
        );
    }

    if (result.status !== 'published') {
        return sendError(
            interaction,
            '❌ Publication Failed',
            result.reason ??
                'Evelynn could not publish this Rank Trial announcement.'
        );
    }

    const lines = [
        `**Announcement:** ${getPublicationChoiceName(
            publicationKey
        )}`,
        `**Cycle:** \`${schedule.trialKey}\``,
        `**Channel:** <#${rankTrialConfig.channelId}>`,
        `**Message ID:** \`${result.messageId}\``
    ];

    if (
        result.scheduledEvent?.attempted
    ) {
        lines.push(
            '',
            '**Discord Event**',
            `**Status:** ${formatEventStatus(
                result.scheduledEvent.status
            )}`
        );

        if (
            result.scheduledEvent
                .discordEventId
        ) {
            const link =
                buildScheduledEventLink(
                    interaction.guild.id,
                    result.scheduledEvent
                        .discordEventId
                );

            lines.push(
                `**Event:** ${link}`
            );
        }

        if (
            result.scheduledEvent.reason
        ) {
            lines.push(
                `**Notice:** ${result.scheduledEvent.reason}`
            );
        }
    }

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Rank Trial Announcement Published',
                lines.join('\n')
            )
        ],
        components: []
    });
}

async function handleCheck(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const result =
        await checkRankTrialSchedule(
            interaction.client
        );

    const failed =
        result.failed > 0 ||
        (result.registrationCloseFailed ?? 0) > 0 ||
        (result.eventFailed ?? 0) > 0;

    const lines = [
        '**Announcements**',
        `Published: \`${result.published}\``,
        `Existing: \`${result.duplicates}\``,
        `Failed: \`${result.failed}\``,
        `Expired: \`${result.expired}\``,
        '',
        '**Registration**',
        `Closed: \`${result.registrationClosed ?? 0}\``,
        `Moved To Review: \`${result.registrationMovedToReview ?? 0}\``,
        `Failures: \`${result.registrationCloseFailed ?? 0}\``,
        '',
        '**Scheduled Events**',
        `Created: \`${result.eventCreated ?? 0}\``,
        `Recreated: \`${result.eventRecreated ?? 0}\``,
        `Updated: \`${result.eventUpdated ?? 0}\``,
        `Synchronized: \`${result.eventSynchronized ?? 0}\``,
        `Failures: \`${result.eventFailed ?? 0}\``,
        '',
        '**Recovery**',
        `Publication Reservations: \`${result.staleReservationsRemoved}\``,
        `Event Reservations: \`${result.staleEventReservationsRemoved ?? 0}\``,
        `Skipped: \`${result.skipped}\``
    ];

    await interaction.editReply({
        embeds: [
            failed
                ? createErrorEmbed(
                    '⚠️ Rank Trial Check Completed',
                    lines.join('\n')
                )
                : createSuccessEmbed(
                    '✅ Rank Trial Check Completed',
                    lines.join('\n')
                )
        ],
        components: []
    });
}

async function handleHistory(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const limit =
        interaction.options.getInteger(
            'limit'
        ) ?? 5;

    const history =
        await rankTrialDatabase
            .getRecentPublications(
                interaction.guild.id,
                limit
            );

    const embed =
        createEmbed({
            title:
                '📜 Rank Trial Publication History',

            description:
                history.length
                    ? `Latest \`${history.length}\` publication record(s).`
                    : 'No Rank Trial publications have been recorded yet.',

            fields:
                history.map(
                    (
                        publication,
                        index
                    ) => ({
                        name:
                            `${index + 1}. ${publication.publicationType}`,

                        value:
                            formatHistoryEntry(
                                publication
                            ),

                        inline:
                            false
                    })
                ),

            thumbnail:
                getGuildIcon(
                    interaction
                )
        });

    applyRankTrialBranding(
        interaction,
        embed,
        'Evelynn • Rank Trials Archive'
    );

    await interaction.editReply({
        embeds: [embed],
        components: []
    });
}async function handleEvent(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const schedule =
        getRelevantRankTrialSchedule();

    const permissions =
        getScheduledEventPermissions(
            interaction.guild
        );

    const state =
        await getRankTrialScheduledEventState(
            interaction.guild,
            schedule
        );

    const record =
        state.record;

    const discordEvent =
        state.discordEvent;

    if (!record && !discordEvent) {
        const embed =
            applyRankTrialBranding(
                interaction,
                createEmbed({
                    title:
                        '📅 Rank Trial Scheduled Event',

                    description: [
                        `No Discord Scheduled Event exists for cycle \`${schedule.trialKey}\`.`,
                        '',
                        'Use `/ranktrials sync` to create it.',
                        '',
                        `**Battle:** ${toDiscordTimestamp(
                            schedule.battleStart,
                            'F'
                        )}`,
                        `**Relative:** ${toDiscordTimestamp(
                            schedule.battleStart,
                            'R'
                        )}`
                    ].join('\n'),

                    fields: [
                        {
                            name:
                                '🛡️ Evelynn Permissions',

                            value: [
                                `**Allowed:** \`${permissions.allowed ? 'YES' : 'NO'}\``,
                                `**Create Events:** \`${permissions.hasCreateEvents ? 'YES' : 'NO'}\``,
                                `**Manage Events:** \`${permissions.hasManageEvents ? 'YES' : 'NO'}\``
                            ].join('\n'),

                            inline: false
                        }
                    ],

                    thumbnail:
                        getGuildIcon(
                            interaction
                        )
                }),
                'Evelynn • Rank Trial Event Manager'
            );

        return interaction.editReply({
            embeds: [embed],
            components: []
        });
    }

    const eventId =
        discordEvent?.id ??
        record?.discordEventId ??
        null;

    const eventStatus =
        discordEvent?.status ??
        record?.status ??
        null;

    const eventName =
        discordEvent?.name ??
        record?.eventName ??
        'Monthly Rank Trials';

    const startsAt =
        discordEvent?.scheduledStartAt ??
        record?.startsAt ??
        schedule.battleStart;

    const endsAt =
        discordEvent?.scheduledEndAt ??
        record?.endsAt ??
        null;

    const location =
        discordEvent
            ?.entityMetadata
            ?.location ??
        record?.eventLocation ??
        rankTrialConfig
            .scheduledEvent
            .location;

    const description =
        discordEvent?.description ??
        record?.eventDescription ??
        'No event description is available.';

    const link =
        buildScheduledEventLink(
            interaction.guild.id,
            eventId
        );

    const fields = [
        {
            name:
                '📖 Event',

            value: [
                `**Name:** ${eventName}`,
                `**Cycle:** \`${schedule.trialKey}\``,
                `**Status:** ${formatEventStatus(
                    eventStatus
                )}`,
                `**Event ID:** ${
                    eventId
                        ? `\`${eventId}\``
                        : '`Unavailable`'
                }`
            ].join('\n'),

            inline: false
        },
        {
            name:
                '⏰ Schedule',

            value: [
                `**Starts:** ${
                    startsAt
                        ? toDiscordTimestamp(
                            startsAt,
                            'F'
                        )
                        : '`Unavailable`'
                }`,
                `**Relative:** ${
                    startsAt
                        ? toDiscordTimestamp(
                            startsAt,
                            'R'
                        )
                        : '`Unavailable`'
                }`,
                `**Ends:** ${
                    endsAt
                        ? toDiscordTimestamp(
                            endsAt,
                            'F'
                        )
                        : '`Unavailable`'
                }`
            ].join('\n'),

            inline: false
        },
        {
            name:
                '📍 Arena',

            value:
                location ||
                '`Not configured`',

            inline: true
        },
        {
            name:
                '👥 Interested',

            value:
                `\`${state.interestedCount}\``,

            inline: true
        },
        {
            name:
                '🔗 Discord Event',

            value:
                link
                    ? `[Open Event](${link})`
                    : '`Unavailable`',

            inline: false
        },
        {
            name:
                '🛡️ Evelynn Permissions',

            value: [
                `**Allowed:** \`${permissions.allowed ? 'YES' : 'NO'}\``,
                `**Create Events:** \`${permissions.hasCreateEvents ? 'YES' : 'NO'}\``,
                `**Manage Events:** \`${permissions.hasManageEvents ? 'YES' : 'NO'}\``
            ].join('\n'),

            inline: false
        }
    ];

    if (record?.syncedAt) {
        fields.push({
            name:
                '🔄 Last Sync',

            value:
                toDiscordTimestamp(
                    record.syncedAt,
                    'F'
                ),

            inline: false
        });
    }

    const embed =
        applyRankTrialBranding(
            interaction,
            createEmbed({
                title:
                    '📅 Rank Trial Scheduled Event',

                description: [
                    description,
                    '',
                    discordEvent
                        ? 'The Discord Scheduled Event is connected to Evelynn.'
                        : 'The PostgreSQL record exists, but the Discord Event is missing.'
                ].join('\n'),

                fields,

                thumbnail:
                    getGuildIcon(
                        interaction
                    )
            }),
            'Evelynn • Rank Trial Event Manager'
        );

    await interaction.editReply({
        embeds: [embed],
        components: []
    });
}

async function handleSync(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const schedule =
        getRelevantRankTrialSchedule();

    const permissions =
        getScheduledEventPermissions(
            interaction.guild
        );

    if (!permissions.allowed) {
        return sendError(
            interaction,
            '❌ Missing Event Permissions',
            [
                'Evelynn cannot synchronize the Discord Scheduled Event.',
                '',
                `**Create Events:** \`${permissions.hasCreateEvents ? 'YES' : 'NO'}\``,
                `**Manage Events:** \`${permissions.hasManageEvents ? 'YES' : 'NO'}\``
            ].join('\n')
        );
    }

    const result =
        await synchronizeRankTrialScheduledEvent(
            interaction.guild,
            schedule
        );

    if (
        EVENT_SUCCESS_STATUSES.has(
            result.status
        )
    ) {
        const eventId =
            result.discordEvent?.id ??
            result.record?.discordEventId ??
            null;

        const link =
            buildScheduledEventLink(
                interaction.guild.id,
                eventId
            );

        const title = {
            created:
                '✅ Rank Trial Event Created',

            recreated:
                '✅ Rank Trial Event Recreated',

            updated:
                '✅ Rank Trial Event Updated',

            synchronized:
                '✅ Rank Trial Event Synchronized'
        }[result.status];

        return interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    title,
                    [
                        `**Cycle:** \`${schedule.trialKey}\``,
                        `**Result:** ${formatEventStatus(
                            result.status
                        )}`,
                        `**Battle:** ${toDiscordTimestamp(
                            schedule.battleStart,
                            'F'
                        )}`,
                        `**Event ID:** ${
                            eventId
                                ? `\`${eventId}\``
                                : '`Unavailable`'
                        }`,
                        link
                            ? `**Event:** [Open Event](${link})`
                            : '**Event:** `Unavailable`'
                    ].join('\n')
                )
            ],
            components: []
        });
    }

    if (
        result.status ===
        'disabled'
    ) {
        return sendError(
            interaction,
            '⚠️ Scheduled Events Disabled',
            result.reason ??
                'Rank Trial Scheduled Events are disabled.'
        );
    }

    if (
        result.status ===
        'missing'
    ) {
        return sendError(
            interaction,
            '⚠️ Scheduled Event Missing',
            result.reason ??
                'The Discord Scheduled Event is missing.'
        );
    }

    return sendError(
        interaction,
        '❌ Event Synchronization Failed',
        [
            `**Cycle:** \`${schedule.trialKey}\``,
            `**Result:** ${formatEventStatus(
                result.status
            )}`,
            `**Reason:** ${
                result.reason ??
                'Unknown Event Manager error.'
            }`
        ].join('\n')
    );
}const HANDLERS = {
    status:
        handleStatus,

    registration:
        handleRegistration,

    testregistration:
        handleTestRegistration,

    review:
        handleReview,

    preview:
        handlePreview,

    publish:
        handlePublish,

    check:
        handleCheck,

    history:
        handleHistory,

    event:
        handleEvent,

    sync:
        handleSync
};

module.exports = {
    category: 'events',
    data,

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                return sendError(
                    interaction,
                    '❌ Server Only Command',
                    'The Rank Trials System can only be managed inside THE Ⅹ SINS.'
                );
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                return sendError(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators may manage the TTS Rank Trials System.'
                );
            }

            const subcommand =
                interaction.options
                    .getSubcommand();

            const handler =
                HANDLERS[subcommand];

            if (!handler) {
                return sendError(
                    interaction,
                    '❌ Unknown Rank Trial Action',
                    'Evelynn could not recognize this Rank Trials action.'
                );
            }

            await handler(
                interaction
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /ranktrials failed:',
                error
            );

            await sendError(
                interaction,
                '❌ Rank Trials Command Failed',
                'Evelynn could not complete this Rank Trials action.'
            ).catch(
                responseError =>
                    console.error(
                        '❌ Rank Trials error response failed:',
                        responseError
                    )
            );
        }
    }
};