const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrials:
        rankTrialDatabase
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

/**
 * Available Rank Trial publication keys.
 *
 * These values must match the scheduler
 * and publisher modules.
 */
const PUBLICATION_KEYS =
    new Set([
        'opening',
        'registrationReminder',
        'finalReminder',
        'battleStart',
        'closing'
    ]);

/**
 * Convert a publication key into a
 * readable command option label.
 *
 * @param {string} publicationKey
 * @returns {string}
 */
function getPublicationChoiceName(
    publicationKey
) {
    switch (
        publicationKey
    ) {
        case 'opening':
            return '⚔️ Opening Announcement';

        case 'registrationReminder':
            return '⏳ Registration Reminder';

        case 'finalReminder':
            return '🌙 Final Reminder';

        case 'battleStart':
            return '🏆 Battle Start';

        case 'closing':
            return '📜 Closing Notice';

        default:
            return 'Unknown Publication';
    }
}

/**
 * Return one publication from a monthly
 * Rank Trial schedule.
 *
 * @param {Object} schedule
 * @param {string} publicationKey
 * @returns {Object|null}
 */
function getScheduledPublication(
    schedule,
    publicationKey
) {
    return (
        schedule.publications.find(
            publication =>
                publication.key ===
                publicationKey
        ) ??
        null
    );
}

/**
 * Format a publication database status.
 *
 * @param {Object|null} publicationRecord
 * @returns {string}
 */
function formatPublicationDatabaseStatus(
    publicationRecord
) {
    if (!publicationRecord) {
        return '`PENDING`';
    }

    if (
        publicationRecord.publishedAt &&
        publicationRecord.messageId
    ) {
        return '`PUBLISHED`';
    }

    return '`RESERVED`';
}

/**
 * Format one publication schedule entry.
 *
 * @param {Object} scheduledPublication
 * @param {Object|null} publicationRecord
 * @returns {string}
 */
function formatSchedulePublication(
    scheduledPublication,
    publicationRecord
) {
    const label =
        getPublicationLabel(
            scheduledPublication.key
        );

    const mentionState =
        scheduledPublication.mentionEveryone
            ? '`@everyone`'
            : '`No mention`';

    return [
        `**${label}**`,
        `${toDiscordTimestamp(
            scheduledPublication.scheduledFor,
            'F'
        )}`,
        `${toDiscordTimestamp(
            scheduledPublication.scheduledFor,
            'R'
        )}`,
        `**Mention:** ${mentionState}`,
        `**Database:** ${formatPublicationDatabaseStatus(
            publicationRecord
        )}`
    ].join('\n');
}

/**
 * Format one recent publication record.
 *
 * @param {Object} publication
 * @returns {string}
 */
function formatHistoryEntry(
    publication
) {
    const publishedTimestamp =
        publication.publishedAt
            ? toDiscordTimestamp(
                publication.publishedAt,
                'F'
            )
            : '`Not completed`';

    const messageReference =
        publication.messageId
            ? `\`${publication.messageId}\``
            : '`No message ID`';

    return [
        `**${publication.publicationType}**`,
        `Trial: \`${publication.trialKey}\``,
        `Published: ${publishedTimestamp}`,
        `Message: ${messageReference}`
    ].join('\n');
}

/**
 * Convert an Event Manager result into
 * a readable status label.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
function formatEventManagerStatus(
    status
) {
    switch (
        status
    ) {
        case 'created':
            return '`CREATED`';

        case 'recreated':
            return '`RECREATED`';

        case 'updated':
            return '`UPDATED`';

        case 'synchronized':
            return '`SYNCHRONIZED`';

        case 'scheduled':
        case 'SCHEDULED':
            return '`SCHEDULED`';

        case 'active':
        case 'ACTIVE':
            return '`ACTIVE`';

        case 'completed':
        case 'COMPLETED':
            return '`COMPLETED`';

        case 'cancelled':
        case 'CANCELLED':
            return '`CANCELLED`';

        case 'deleted':
        case 'DELETED':
            return '`DELETED`';

        case 'missing':
            return '`MISSING`';

        case 'disabled':
            return '`DISABLED`';

        case 'failed':
            return '`FAILED`';

        default:
            return '`NOT CREATED`';
    }
}

/**
 * Build a Discord Scheduled Event link.
 *
 * @param {string} guildId
 * @param {string|null|undefined} eventId
 * @returns {string}
 */
function buildScheduledEventLink(
    guildId,
    eventId
) {
    if (!eventId) {
        return '`Unavailable`';
    }

    return (
        `https://discord.com/events/` +
        `${guildId}/${eventId}`
    );
}

/**
 * Convert Rank Trials 2.0 registration
 * state into a readable label.
 *
 * @param {string} state
 * @returns {string}
 */
function formatRegistrationState(
    state
) {
    switch (
        state
    ) {
        case 'UPCOMING':
            return '🕒 `UPCOMING`';

        case 'OPEN':
            return '🟢 `OPEN`';

        case 'CLOSED':
            return '🔒 `CLOSED`';

        default:
            return '⚪ `UNKNOWN`';
    }
}

/**
 * Build the normal production registration
 * controls shown in the Administrator panel.
 *
 * @param {string} registrationState
 * @returns {import('discord.js').ActionRowBuilder[]}
 */
function buildRegistrationControlRows(
    registrationState
) {
    if (
        registrationState ===
        'OPEN'
    ) {
        return [
            buildOpenRegistrationComponents()
        ];
    }

    return [
        buildClosedRegistrationComponents()
    ];
}

/**
 * Safely respond with an error Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} title
 * @param {string} message
 * @returns {Promise<void>}
 */
async function sendRankTrialError(
    interaction,
    title,
    message
) {
    const errorEmbed =
        createErrorEmbed(
            title,
            message
        );

    if (
        interaction.deferred
    ) {
        await interaction.editReply({
            embeds:
                [errorEmbed],

            components:
                []
        });

        return;
    }

    if (
        interaction.replied
    ) {
        await interaction.followUp({
            embeds:
                [errorEmbed],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds:
            [errorEmbed],

        flags:
            MessageFlags.Ephemeral
    });
}module.exports = {
    category:
        'events',

    data:
        new SlashCommandBuilder()
            .setName(
                'ranktrials'
            )
            .setDescription(
                'Manage the Automatic Monthly Rank Trials system.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(
                false
            )

            /*
             * /ranktrials status
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'status'
                        )
                        .setDescription(
                            'View the next Rank Trial schedule and scheduler status.'
                        )
            )

            /*
             * /ranktrials registration
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'registration'
                        )
                        .setDescription(
                            'Open the Rank Trials 2.0 registration control panel.'
                        )
            )

            /*
             * /ranktrials testregistration
             *
             * Administrator-only runtime test
             * panel for Rank Trials 2.0.
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'testregistration'
                        )
                        .setDescription(
                            'Open the Rank Trials 2.0 registration test panel.'
                        )
            )

            /*
             * /ranktrials preview
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'preview'
                        )
                        .setDescription(
                            'Privately preview a Rank Trial announcement.'
                        )
                        .addStringOption(
                            option =>
                                option
                                    .setName(
                                        'announcement'
                                    )
                                    .setDescription(
                                        'Select the announcement to preview'
                                    )
                                    .setRequired(
                                        true
                                    )
                                    .addChoices(
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'opening'
                                                ),

                                            value:
                                                'opening'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'registrationReminder'
                                                ),

                                            value:
                                                'registrationReminder'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'finalReminder'
                                                ),

                                            value:
                                                'finalReminder'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'battleStart'
                                                ),

                                            value:
                                                'battleStart'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'closing'
                                                ),

                                            value:
                                                'closing'
                                        }
                                    )
                        )
            )

            /*
             * /ranktrials publish
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'publish'
                        )
                        .setDescription(
                            'Manually publish a scheduled Rank Trial announcement.'
                        )
                        .addStringOption(
                            option =>
                                option
                                    .setName(
                                        'announcement'
                                    )
                                    .setDescription(
                                        'Select the announcement to publish'
                                    )
                                    .setRequired(
                                        true
                                    )
                                    .addChoices(
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'opening'
                                                ),

                                            value:
                                                'opening'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'registrationReminder'
                                                ),

                                            value:
                                                'registrationReminder'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'finalReminder'
                                                ),

                                            value:
                                                'finalReminder'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'battleStart'
                                                ),

                                            value:
                                                'battleStart'
                                        },
                                        {
                                            name:
                                                getPublicationChoiceName(
                                                    'closing'
                                                ),

                                            value:
                                                'closing'
                                        }
                                    )
                        )
            )

            /*
             * /ranktrials check
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'check'
                        )
                        .setDescription(
                            'Run an immediate automatic Rank Trial schedule check.'
                        )
            )

            /*
             * /ranktrials history
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'history'
                        )
                        .setDescription(
                            'View recent Rank Trial publication history.'
                        )
                        .addIntegerOption(
                            option =>
                                option
                                    .setName(
                                        'limit'
                                    )
                                    .setDescription(
                                        'Number of history entries to display'
                                    )
                                    .setMinValue(
                                        1
                                    )
                                    .setMaxValue(
                                        10
                                    )
                                    .setRequired(
                                        false
                                    )
                        )
            )

            /*
             * /ranktrials event
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'event'
                        )
                        .setDescription(
                            'View the current Rank Trial Discord Scheduled Event.'
                        )
            )

            /*
             * /ranktrials sync
             */
            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'sync'
                        )
                        .setDescription(
                            'Create, restore or synchronize the Rank Trial Discord Event.'
                        )
            ),

    /**
     * Execute the /ranktrials command.
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
                await sendRankTrialError(
                    interaction,
                    '❌ Server Only Command',
                    'The Rank Trials System can only be managed inside Las Noches.'
                );

                return;
            }

            if (
                !interaction.memberPermissions
                    .has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                await sendRankTrialError(
                    interaction,
                    '❌ Permission Denied',
                    'Only a Las Noches Administrator may manage the Monthly Rank Trials System.'
                );

                return;
            }

            const subcommand =
                interaction.options
                    .getSubcommand();            /*
             * STATUS
             */
            if (
                subcommand ===
                'status'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const schedule =
                    getRelevantRankTrialSchedule();

                const publicationHistory =
                    await rankTrialDatabase
                        .getTrialPublications(
                            interaction.guild.id,
                            schedule.trialKey
                        );

                const publicationMap =
                    new Map(
                        publicationHistory.map(
                            publication => [
                                publication.publicationType,
                                publication
                            ]
                        )
                    );

                const statusFields =
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
                                    ) ??
                                    null
                                ),

                            inline:
                                false
                        })
                    );

                const schedulerIntervalMinutes =
                    getRankTrialSchedulerInterval() /
                    60_000;

                const registration =
                    getRegistrationState(
                        schedule
                    );

                const statusEmbed =
                    createEmbed({
                        title:
                            '⚔️ Monthly Rank Trials Status',

                        description:
                            [
                                'Umbra Automatic Rank Trials System',
                                '',
                                `**System:** ${
                                    rankTrialConfig.enabled
                                        ? '`ENABLED`'
                                        : '`DISABLED`'
                                }`,
                                `**Scheduler:** ${
                                    isRankTrialSchedulerRunning()
                                        ? '`RUNNING`'
                                        : '`STOPPED`'
                                }`,
                                `**Scheduled Events:** ${
                                    rankTrialConfig
                                        .scheduledEvent
                                        ?.enabled
                                        ? '`ENABLED`'
                                        : '`DISABLED`'
                                }`,
                                `**Registration:** ${formatRegistrationState(
                                    registration.state
                                )}`,
                                `**Check Interval:** \`${schedulerIntervalMinutes} minutes\``,
                                `**Timezone:** \`${rankTrialConfig.timezone}\``,
                                `**Trial Cycle:** \`${schedule.trialKey}\``,
                                '',
                                `**Registration Opens:** ${toDiscordTimestamp(
                                    registration.opensAt,
                                    'F'
                                )}`,
                                `**Registration Closes:** ${toDiscordTimestamp(
                                    registration.closesAt,
                                    'F'
                                )}`,
                                '',
                                `**Battle Start:** ${toDiscordTimestamp(
                                    schedule.battleStart,
                                    'F'
                                )}`,
                                `**Relative Time:** ${toDiscordTimestamp(
                                    schedule.battleStart,
                                    'R'
                                )}`
                            ].join('\n'),

                        fields:
                            statusFields,

                        thumbnail:
                            interaction.guild.iconURL({
                                size:
                                    512,

                                forceStatic:
                                    false
                            }) ??
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                })
                    });

                statusEmbed.setAuthor({
                    name:
                        rankTrialConfig
                            .branding
                            .authorName,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    256,

                                forceStatic:
                                    false
                            })
                });

                statusEmbed.setFooter({
                    text:
                        'Umbra • Rank Trials Control'
                });

                statusEmbed.setTimestamp();

                await interaction.editReply({
                    embeds:
                        [statusEmbed],

                    components:
                        []
                });

                return;
            }

            /*
             * REGISTRATION
             */
            if (
                subcommand ===
                'registration'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const schedule =
                    getRelevantRankTrialSchedule();

                const registration =
                    getRegistrationState(
                        schedule
                    );

                const {
                    statistics
                } =
                    await getCurrentRegistrationStatistics({
                        guildId:
                            interaction.guild.id
                    });

                const registrationEmbed =
                    createEmbed({
                        title:
                            '⚔️ Rank Trials 2.0 Registration',

                        description:
                            [
                                'Administrator control panel for the current Monthly Rank Trial.',
                                '',
                                `**Trial Cycle:** \`${schedule.trialKey}\``,
                                `**Registration:** ${formatRegistrationState(
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
                                `**Battle Start:** ${toDiscordTimestamp(
                                    schedule.battleStart,
                                    'F'
                                )}`,
                                '',
                                registration.state ===
                                    'OPEN'
                                    ? 'Use the controls below to register or withdraw from the current Trial.'
                                    : registration.state ===
                                        'UPCOMING'
                                        ? 'Registration has not opened yet. The controls will become available when the Opening Announcement is due.'
                                        : 'Registration is closed. Registered Souls have entered the Staff Review phase.'
                            ].join('\n'),

                        fields: [
                            {
                                name:
                                    '👥 Participant Registry',

                                value:
                                    [
                                        `**Total Records:** \`${statistics.total}\``,
                                        `**Registered:** \`${statistics.registered}\``,
                                        `**Withdrawn:** \`${statistics.withdrawn}\``,
                                        `**Under Review:** \`${statistics.underReview}\``,
                                        `**Approved:** \`${statistics.approved}\``,
                                        `**Rejected:** \`${statistics.rejected}\``,
                                        `**Promoted:** \`${statistics.promoted}\``
                                    ].join('\n'),

                                inline:
                                    false
                            },
                            {
                                name:
                                    '🔒 Registration Rules',

                                value:
                                    [
                                        '• Registration opens with the Opening Announcement.',
                                        '• Registration closes with the Final Reminder.',
                                        '• A withdrawn Soul may register again while registration remains open.',
                                        '• After closing, active registrations automatically move to Staff Review.'
                                    ].join('\n'),

                                inline:
                                    false
                            }
                        ],

                        thumbnail:
                            interaction.guild.iconURL({
                                size:
                                    512,

                                forceStatic:
                                    false
                            }) ??
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                })
                    });

                registrationEmbed.setAuthor({
                    name:
                        rankTrialConfig
                            .branding
                            .authorName,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    256,

                                forceStatic:
                                    false
                            })
                });

                registrationEmbed.setFooter({
                    text:
                        'Umbra • Rank Trials 2.0'
                });

                registrationEmbed.setTimestamp();

                const registrationComponents =
                    buildRegistrationControlRows(
                        registration.state
                    );

                await interaction.editReply({
                    embeds:
                        [registrationEmbed],

                    components:
                        registrationComponents
                });

                return;
            }

            /*
             * TESTREGISTRATION
             *
             * Administrator-only runtime panel.
             *
             * This panel deliberately bypasses
             * the production registration window
             * through dedicated test buttons.
             */
            if (
                subcommand ===
                'testregistration'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const schedule =
                    getRelevantRankTrialSchedule();

                const {
                    statistics
                } =
                    await getCurrentRegistrationStatistics({
                        guildId:
                            interaction.guild.id
                    });

                const testEmbed =
                    createEmbed({
                        title:
                            '🧪 Rank Trials 2.0 Runtime Test',

                        description:
                            [
                                'Administrator-only registration test panel.',
                                '',
                                `**Trial Cycle:** \`${schedule.trialKey}\``,
                                '',
                                'These controls bypass the normal Opening/Final Reminder window only for testing.',
                                '',
                                '**Recommended Test Order**',
                                '1. Test Register',
                                '2. Test Withdraw',
                                '3. Test Register again',
                                '',
                                'The test uses the real PostgreSQL participant registry.'
                            ].join('\n'),

                        fields: [
                            {
                                name:
                                    '👥 Current Registry State',

                                value:
                                    [
                                        `**Total Records:** \`${statistics.total}\``,
                                        `**Registered:** \`${statistics.registered}\``,
                                        `**Withdrawn:** \`${statistics.withdrawn}\``,
                                        `**Under Review:** \`${statistics.underReview}\``,
                                        `**Approved:** \`${statistics.approved}\``,
                                        `**Rejected:** \`${statistics.rejected}\``,
                                        `**Promoted:** \`${statistics.promoted}\``
                                    ].join('\n'),

                                inline:
                                    false
                            },
                            {
                                name:
                                    '⚠️ Test Notice',

                                value:
                                    [
                                        '• Only Administrators can use these buttons.',
                                        '• Production schedule rules remain unchanged.',
                                        '• Test actions write to the real Rank Trial participant table.',
                                        '• Test Withdraw preserves the row as `WITHDRAWN`.',
                                        '• Test Register can restore that row to `REGISTERED`.'
                                    ].join('\n'),

                                inline:
                                    false
                            }
                        ],

                        thumbnail:
                            interaction.guild.iconURL({
                                size:
                                    512,

                                forceStatic:
                                    false
                            }) ??
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                })
                    });

                testEmbed.setAuthor({
                    name:
                        rankTrialConfig
                            .branding
                            .authorName,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    256,

                                forceStatic:
                                    false
                            })
                });

                testEmbed.setFooter({
                    text:
                        'Umbra • Rank Trials 2.0 Test Mode'
                });

                testEmbed.setTimestamp();

                await interaction.editReply({
                    embeds:
                        [testEmbed],

                    components: [
                        buildTestRegistrationComponents()
                    ]
                });

                return;
            }            /*
             * PREVIEW
             */
            if (
                subcommand ===
                'preview'
            ) {
                const publicationKey =
                    interaction.options
                        .getString(
                            'announcement',
                            true
                        );

                if (
                    !PUBLICATION_KEYS.has(
                        publicationKey
                    )
                ) {
                    await sendRankTrialError(
                        interaction,
                        '❌ Invalid Announcement',
                        'Umbra could not recognize the selected Rank Trial announcement.'
                    );

                    return;
                }

                const schedule =
                    getRelevantRankTrialSchedule();

                const scheduledPublication =
                    getScheduledPublication(
                        schedule,
                        publicationKey
                    );

                if (
                    !scheduledPublication
                ) {
                    await sendRankTrialError(
                        interaction,
                        '❌ Announcement Disabled',
                        'This Rank Trial announcement is currently disabled in `config/rankTrials.js`.'
                    );

                    return;
                }

                const previewEmbed =
                    buildPublicationEmbed(
                        publicationKey,
                        schedule
                    );

                previewEmbed.setAuthor({
                    name:
                        rankTrialConfig
                            .branding
                            .authorName,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    256,

                                forceStatic:
                                    false
                            })
                });

                previewEmbed.setFooter({
                    text:
                        [
                            rankTrialConfig
                                .branding
                                .footerText,

                            'Preview Only'
                        ].join(
                            ' • '
                        ),

                    iconURL:
                        interaction.guild.iconURL({
                            size:
                                128,

                            forceStatic:
                                false
                        }) ??
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    128,

                                forceStatic:
                                    false
                            })
                });

                await interaction.reply({
                    content:
                        scheduledPublication
                            .mentionEveryone
                            ? '`Preview mention: @everyone`'
                            : '`Preview mention: none`',

                    embeds:
                        [previewEmbed],

                    flags:
                        MessageFlags.Ephemeral,

                    allowedMentions: {
                        parse:
                            []
                    }
                });

                return;
            }

            /*
             * PUBLISH
             */
            if (
                subcommand ===
                'publish'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const publicationKey =
                    interaction.options
                        .getString(
                            'announcement',
                            true
                        );

                if (
                    !PUBLICATION_KEYS.has(
                        publicationKey
                    )
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Announcement',
                                'Umbra could not recognize the selected Rank Trial announcement.'
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                const schedule =
                    getRelevantRankTrialSchedule();

                const scheduledPublication =
                    getScheduledPublication(
                        schedule,
                        publicationKey
                    );

                if (
                    !scheduledPublication
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Announcement Disabled',
                                'This Rank Trial announcement is currently disabled in `config/rankTrials.js`.'
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                const result =
                    await publishRankTrialAnnouncement(
                        interaction.client,
                        interaction.guild,
                        schedule,
                        scheduledPublication
                    );

                if (
                    result.status ===
                    'published'
                ) {
                    const scheduledEventLines =
                        [];

                    if (
                        result.scheduledEvent
                            ?.attempted
                    ) {
                        scheduledEventLines.push(
                            '',
                            '**Discord Scheduled Event**',
                            `**Status:** ${formatEventManagerStatus(
                                result.scheduledEvent
                                    .status
                            )}`
                        );

                        if (
                            result.scheduledEvent
                                .discordEventId
                        ) {
                            scheduledEventLines.push(
                                `**Event:** ${buildScheduledEventLink(
                                    interaction.guild.id,
                                    result.scheduledEvent
                                        .discordEventId
                                )}`
                            );
                        }

                        if (
                            result.scheduledEvent
                                .reason
                        ) {
                            scheduledEventLines.push(
                                `**Event Notice:** ${result.scheduledEvent.reason}`
                            );
                        }
                    }

                    await interaction.editReply({
                        embeds: [
                            createSuccessEmbed(
                                '✅ Rank Trial Announcement Published',
                                [
                                    `**Announcement:** ${getPublicationChoiceName(
                                        publicationKey
                                    )}`,
                                    `**Trial Cycle:** \`${schedule.trialKey}\``,
                                    `**Channel:** <#${rankTrialConfig.channelId}>`,
                                    `**Message ID:** \`${result.messageId}\``,
                                    '',
                                    'The publication was saved permanently in PostgreSQL.',
                                    ...scheduledEventLines
                                ].join('\n')
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                if (
                    result.status ===
                    'duplicate'
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '⚠️ Announcement Already Published',
                                [
                                    `The selected announcement already exists for Rank Trial cycle \`${schedule.trialKey}\`.`,
                                    '',
                                    'Umbra blocked the duplicate publication using PostgreSQL history.'
                                ].join('\n')
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Publication Failed',
                            [
                                'Umbra could not publish the selected Rank Trial announcement.',
                                '',
                                `**Reason:** ${result.reason ?? 'Unknown publication error.'}`
                            ].join('\n')
                        )
                    ],

                    components:
                        []
                });

                return;
            }            /*
             * CHECK
             */
            if (
                subcommand ===
                'check'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const result =
                    await checkRankTrialSchedule(
                        interaction.client
                    );

                const checkLines = [
                    result.failed > 0
                        ? 'Umbra completed an immediate scheduler check with one or more failures.'
                        : 'Umbra completed an immediate scheduler check.',
                    '',
                    '**Announcements**',
                    `**Published:** \`${result.published}\``,
                    `**Already Existing:** \`${result.duplicates}\``,
                    `**Failed:** \`${result.failed}\``,
                    `**Expired:** \`${result.expired}\``,
                    '',
                    '**Rank Trials 2.0 Registration**',
                    `**Close Attempts:** \`${result.registrationCloseAttempted ?? 0}\``,
                    `**Cycles Closed:** \`${result.registrationClosed ?? 0}\``,
                    `**Moved To Review:** \`${result.registrationMovedToReview ?? 0}\``,
                    `**Close Failures:** \`${result.registrationCloseFailed ?? 0}\``,
                    '',
                    '**Scheduled Events**',
                    `**Created:** \`${result.eventCreated ?? 0}\``,
                    `**Recreated:** \`${result.eventRecreated ?? 0}\``,
                    `**Updated:** \`${result.eventUpdated ?? 0}\``,
                    `**Synchronized:** \`${result.eventSynchronized ?? 0}\``,
                    `**Failures:** \`${result.eventFailed ?? 0}\``,
                    '',
                    '**Recovery**',
                    `**Publication Reservations Removed:** \`${result.staleReservationsRemoved}\``,
                    `**Event Reservations Removed:** \`${result.staleEventReservationsRemoved ?? 0}\``,
                    `**Scheduler Skipped:** \`${result.skipped}\``
                ];

                const checkEmbed =
                    result.failed > 0 ||
                    (
                        result.registrationCloseFailed ??
                        0
                    ) > 0 ||
                    (
                        result.eventFailed ??
                        0
                    ) > 0
                        ? createErrorEmbed(
                            '⚠️ Rank Trial Check Completed',
                            checkLines.join('\n')
                        )
                        : createSuccessEmbed(
                            '✅ Rank Trial Check Completed',
                            checkLines.join('\n')
                        );

                await interaction.editReply({
                    embeds:
                        [checkEmbed],

                    components:
                        []
                });

                return;
            }

            /*
             * HISTORY
             */
            if (
                subcommand ===
                'history'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const limit =
                    interaction.options
                        .getInteger(
                            'limit'
                        ) ??
                    5;

                const history =
                    await rankTrialDatabase
                        .getRecentPublications(
                            interaction.guild.id,
                            limit
                        );

                if (
                    history.length ===
                    0
                ) {
                    const emptyHistoryEmbed =
                        createEmbed({
                            title:
                                '📜 Rank Trial Publication History',

                            description:
                                [
                                    'No Rank Trial publications have been recorded yet.',
                                    '',
                                    'History will appear after Umbra publishes or reserves its first automatic announcement.'
                                ].join('\n'),

                            thumbnail:
                                interaction.guild.iconURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                }) ??
                                interaction.client.user
                                    .displayAvatarURL({
                                        size:
                                            512,

                                        forceStatic:
                                            false
                                    })
                        });

                    emptyHistoryEmbed.setAuthor({
                        name:
                            rankTrialConfig
                                .branding
                                .authorName,

                        iconURL:
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        256,

                                    forceStatic:
                                        false
                                })
                    });

                    emptyHistoryEmbed.setFooter({
                        text:
                            'Umbra • Rank Trials Archive'
                    });

                    emptyHistoryEmbed.setTimestamp();

                    await interaction.editReply({
                        embeds:
                            [emptyHistoryEmbed],

                        components:
                            []
                    });

                    return;
                }

                const historyFields =
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
                    );

                const historyEmbed =
                    createEmbed({
                        title:
                            '📜 Rank Trial Publication History',

                        description:
                            [
                                `Showing the latest \`${history.length}\` Rank Trial publication record(s).`,
                                '',
                                'PostgreSQL history protects the system from duplicate announcements after restarts and redeployments.'
                            ].join('\n'),

                        fields:
                            historyFields,

                        thumbnail:
                            interaction.guild.iconURL({
                                size:
                                    512,

                                forceStatic:
                                    false
                            }) ??
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                })
                    });

                historyEmbed.setAuthor({
                    name:
                        rankTrialConfig
                            .branding
                            .authorName,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    256,

                                forceStatic:
                                    false
                            })
                });

                historyEmbed.setFooter({
                    text:
                        'Umbra • Rank Trials Archive'
                });

                historyEmbed.setTimestamp();

                await interaction.editReply({
                    embeds:
                        [historyEmbed],

                    components:
                        []
                });

                return;
            }

            /*
             * EVENT
             */
            if (
                subcommand ===
                'event'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const schedule =
                    getRelevantRankTrialSchedule();

                const permissionState =
                    getScheduledEventPermissions(
                        interaction.guild
                    );

                const eventState =
                    await getRankTrialScheduledEventState(
                        interaction.guild,
                        schedule
                    );

                const databaseRecord =
                    eventState.record;

                const discordEvent =
                    eventState.discordEvent;

                if (
                    !databaseRecord &&
                    !discordEvent
                ) {
                    const notCreatedEmbed =
                        createEmbed({
                            title:
                                '📅 Rank Trial Scheduled Event',

                            description:
                                [
                                    `No Discord Scheduled Event exists for cycle \`${schedule.trialKey}\`.`,
                                    '',
                                    'Use `/ranktrials sync` to create it safely.',
                                    '',
                                    `**Battle Start:** ${toDiscordTimestamp(
                                        schedule.battleStart,
                                        'F'
                                    )}`,
                                    `**Relative Time:** ${toDiscordTimestamp(
                                        schedule.battleStart,
                                        'R'
                                    )}`
                                ].join('\n'),

                            fields: [
                                {
                                    name:
                                        '🛡️ Umbra Event Permissions',

                                    value:
                                        [
                                            `**Allowed:** ${
                                                permissionState.allowed
                                                    ? '`YES`'
                                                    : '`NO`'
                                            }`,
                                            `**Administrator:** ${
                                                permissionState.hasAdministrator
                                                    ? '`YES`'
                                                    : '`NO`'
                                            }`,
                                            `**Create Events:** ${
                                                permissionState.hasCreateEvents
                                                    ? '`YES`'
                                                    : '`NO`'
                                            }`,
                                            `**Manage Events:** ${
                                                permissionState.hasManageEvents
                                                    ? '`YES`'
                                                    : '`NO`'
                                            }`
                                        ].join('\n'),

                                    inline:
                                        false
                                }
                            ],

                            thumbnail:
                                interaction.guild.iconURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                }) ??
                                interaction.client.user
                                    .displayAvatarURL({
                                        size:
                                            512,

                                        forceStatic:
                                            false
                                    })
                        });

                    notCreatedEmbed.setAuthor({
                        name:
                            rankTrialConfig
                                .branding
                                .authorName,

                        iconURL:
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        256,

                                    forceStatic:
                                        false
                                })
                    });

                    notCreatedEmbed.setFooter({
                        text:
                            'Umbra • Rank Trial Event Manager'
                    });

                    notCreatedEmbed.setTimestamp();

                    await interaction.editReply({
                        embeds:
                            [notCreatedEmbed],

                        components:
                            []
                    });

                    return;
                }

                const eventId =
                    discordEvent
                        ?.id ??
                    databaseRecord
                        ?.discordEventId ??
                    null;

                const eventStatus =
                    discordEvent
                        ?.status ??
                    databaseRecord
                        ?.status ??
                    null;

                const eventName =
                    discordEvent
                        ?.name ??
                    databaseRecord
                        ?.eventName ??
                    'Monthly Rank Trials';

                const startsAt =
                    discordEvent
                        ?.scheduledStartAt ??
                    databaseRecord
                        ?.startsAt ??
                    schedule.battleStart;

                const endsAt =
                    discordEvent
                        ?.scheduledEndAt ??
                    databaseRecord
                        ?.endsAt ??
                    null;

                const eventLocation =
                    discordEvent
                        ?.entityMetadata
                        ?.location ??
                    databaseRecord
                        ?.eventLocation ??
                    rankTrialConfig
                        .scheduledEvent
                        .location;

                const eventDescription =
                    discordEvent
                        ?.description ??
                    databaseRecord
                        ?.eventDescription ??
                    'No Event description is currently available.';

                const eventLink =
                    buildScheduledEventLink(
                        interaction.guild.id,
                        eventId
                    );

                const eventFields = [
                    {
                        name:
                            '📖 Event Identity',

                        value:
                            [
                                `**Name:** ${eventName}`,
                                `**Trial Cycle:** \`${schedule.trialKey}\``,
                                `**Status:** ${formatEventManagerStatus(
                                    eventStatus
                                )}`,
                                `**Discord Event ID:** ${
                                    eventId
                                        ? `\`${eventId}\``
                                        : '`Unavailable`'
                                }`
                            ].join('\n'),

                        inline:
                            false
                    },
                    {
                        name:
                            '⏰ Schedule',

                        value:
                            [
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

                        inline:
                            false
                    },
                    {
                        name:
                            '📍 Arena',

                        value:
                            eventLocation ||
                            '`No location configured`',

                        inline:
                            true
                    },
                    {
                        name:
                            '👥 Interested Souls',

                        value:
                            `\`${eventState.interestedCount}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🔗 Discord Event',

                        value:
                            eventId
                                ? `[Open Scheduled Event](${eventLink})`
                                : '`Unavailable`',

                        inline:
                            false
                    },
                    {
                        name:
                            '🛡️ Umbra Permissions',

                        value:
                            [
                                `**Allowed:** ${
                                    permissionState.allowed
                                        ? '`YES`'
                                        : '`NO`'
                                }`,
                                `**Create Events:** ${
                                    permissionState.hasCreateEvents
                                        ? '`YES`'
                                        : '`NO`'
                                }`,
                                `**Manage Events:** ${
                                    permissionState.hasManageEvents
                                        ? '`YES`'
                                        : '`NO`'
                                }`
                            ].join('\n'),

                        inline:
                            false
                    }
                ];

                if (
                    databaseRecord
                        ?.syncedAt
                ) {
                    eventFields.push({
                        name:
                            '🔄 Last Database Sync',

                        value:
                            toDiscordTimestamp(
                                databaseRecord.syncedAt,
                                'F'
                            ),

                        inline:
                            false
                    });
                }

                const eventEmbed =
                    createEmbed({
                        title:
                            '📅 Rank Trial Scheduled Event',

                        description:
                            [
                                eventDescription,
                                '',
                                discordEvent
                                    ? 'The Discord Scheduled Event is currently connected to Umbra.'
                                    : 'The PostgreSQL record exists, but the Discord Scheduled Event is currently missing.'
                            ].join('\n'),

                        fields:
                            eventFields,

                        thumbnail:
                            interaction.guild.iconURL({
                                size:
                                    512,

                                forceStatic:
                                    false
                            }) ??
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        512,

                                    forceStatic:
                                        false
                                })
                    });

                eventEmbed.setAuthor({
                    name:
                        rankTrialConfig
                            .branding
                            .authorName,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    256,

                                forceStatic:
                                    false
                            })
                });

                eventEmbed.setFooter({
                    text:
                        'Umbra • Rank Trial Event Manager'
                });

                eventEmbed.setTimestamp();

                await interaction.editReply({
                    embeds:
                        [eventEmbed],

                    components:
                        []
                });

                return;
            }            /*
             * SYNC
             */
            if (
                subcommand ===
                'sync'
            ) {
                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const schedule =
                    getRelevantRankTrialSchedule();

                const permissionState =
                    getScheduledEventPermissions(
                        interaction.guild
                    );

                if (
                    !permissionState.allowed
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Missing Event Permissions',
                                [
                                    'Umbra cannot create or synchronize the Discord Scheduled Event.',
                                    '',
                                    'Required bot permission:',
                                    '• Create Events',
                                    '',
                                    'Recommended additional permission:',
                                    '• Manage Events',
                                    '',
                                    `**Administrator:** ${
                                        permissionState.hasAdministrator
                                            ? '`YES`'
                                            : '`NO`'
                                    }`,
                                    `**Create Events:** ${
                                        permissionState.hasCreateEvents
                                            ? '`YES`'
                                            : '`NO`'
                                    }`,
                                    `**Manage Events:** ${
                                        permissionState.hasManageEvents
                                            ? '`YES`'
                                            : '`NO`'
                                    }`
                                ].join('\n')
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                const result =
                    await synchronizeRankTrialScheduledEvent(
                        interaction.guild,
                        schedule
                    );

                if (
                    result.status ===
                        'created' ||
                    result.status ===
                        'recreated' ||
                    result.status ===
                        'updated' ||
                    result.status ===
                        'synchronized'
                ) {
                    const discordEventId =
                        result.discordEvent
                            ?.id ??
                        result.record
                            ?.discordEventId ??
                        null;

                    const eventLink =
                        buildScheduledEventLink(
                            interaction.guild.id,
                            discordEventId
                        );

                    const successTitle =
                        result.status ===
                            'created'
                            ? '✅ Rank Trial Event Created'
                            : result.status ===
                                'recreated'
                                ? '✅ Rank Trial Event Recreated'
                                : result.status ===
                                    'updated'
                                    ? '✅ Rank Trial Event Updated'
                                    : '✅ Rank Trial Event Synchronized';

                    await interaction.editReply({
                        embeds: [
                            createSuccessEmbed(
                                successTitle,
                                [
                                    `**Trial Cycle:** \`${schedule.trialKey}\``,
                                    `**Result:** ${formatEventManagerStatus(
                                        result.status
                                    )}`,
                                    `**Battle Start:** ${toDiscordTimestamp(
                                        schedule.battleStart,
                                        'F'
                                    )}`,
                                    `**Discord Event ID:** ${
                                        discordEventId
                                            ? `\`${discordEventId}\``
                                            : '`Unavailable`'
                                    }`,
                                    '',
                                    discordEventId
                                        ? `**Event:** [Open Scheduled Event](${eventLink})`
                                        : '**Event:** `Unavailable`',
                                    '',
                                    'PostgreSQL and Discord are now synchronized.'
                                ].join('\n')
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                if (
                    result.status ===
                    'disabled'
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '⚠️ Scheduled Events Disabled',
                                result.reason ??
                                'Rank Trial Scheduled Events are disabled in configuration.'
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                if (
                    result.status ===
                    'missing'
                ) {
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '⚠️ Scheduled Event Missing',
                                [
                                    result.reason ??
                                    'The Discord Scheduled Event is missing.',
                                    '',
                                    'Enable `recreateIfDeleted` in `config/rankTrials.js` to allow automatic recovery.'
                                ].join('\n')
                            )
                        ],

                        components:
                            []
                    });

                    return;
                }

                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Event Synchronization Failed',
                            [
                                'Umbra could not synchronize the Rank Trial Scheduled Event.',
                                '',
                                `**Trial Cycle:** \`${schedule.trialKey}\``,
                                `**Result:** ${formatEventManagerStatus(
                                    result.status
                                )}`,
                                `**Reason:** ${
                                    result.reason ??
                                    'Unknown Event Manager error.'
                                }`
                            ].join('\n')
                        )
                    ],

                    components:
                        []
                });

                return;
            }

            await sendRankTrialError(
                interaction,
                '❌ Unknown Rank Trial Action',
                'Umbra could not recognize the selected Rank Trials action.'
            );
        } catch (error) {
            console.error(
                '======================================'
            );

            console.error(
                '❌ Umbra Rank Trials command error:'
            );

            console.error(
                error
            );

            console.error(
                '======================================'
            );

            await sendRankTrialError(
                interaction,
                '❌ Rank Trials Command Failed',
                [
                    'Umbra could not complete this Rank Trials action.',
                    '',
                    'Please check the PostgreSQL connection, Event permissions, scheduler configuration and channel access.'
                ].join('\n')
            ).catch(
                responseError => {
                    console.error(
                        '❌ Failed to send the Rank Trials command error response:'
                    );

                    console.error(
                        responseError
                    );
                }
            );
        }
    }
};