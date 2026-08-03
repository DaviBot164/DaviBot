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
    buildMonthlyRankTrialSchedule,
    getCurrentRankTrialMonth,
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

/**
 * Available Rank Trial publication keys.
 *
 * These values must match the keys used by
 * the scheduler and publisher modules.
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
 * Convert one publication key into a
 * Slash Command choice label.
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
 * Format a publication schedule field.
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
 * Format one recent publication row.
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
}

module.exports = {
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
                    .getSubcommand();

            /*
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
                                `**Check Interval:** \`${schedulerIntervalMinutes} minutes\``,
                                `**Timezone:** \`${rankTrialConfig.timezone}\``,
                                `**Trial Cycle:** \`${schedule.trialKey}\``,
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

                if (!scheduledPublication) {
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
                        ].join(' • '),

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

                if (!scheduledPublication) {
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
                                    'The publication was saved permanently in PostgreSQL.'
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
            }

            /*
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

                const checkEmbed =
                    result.failed >
                    0
                        ? createErrorEmbed(
                            '⚠️ Rank Trial Check Completed',
                            [
                                'Umbra completed an immediate scheduler check with one or more failures.',
                                '',
                                `**Published:** \`${result.published}\``,
                                `**Already Existing:** \`${result.duplicates}\``,
                                `**Failed:** \`${result.failed}\``,
                                `**Expired:** \`${result.expired}\``,
                                `**Stale Reservations Removed:** \`${result.staleReservationsRemoved}\``,
                                `**Skipped:** \`${result.skipped}\``
                            ].join('\n')
                        )
                        : createSuccessEmbed(
                            '✅ Rank Trial Check Completed',
                            [
                                'Umbra completed an immediate scheduler check.',
                                '',
                                `**Published:** \`${result.published}\``,
                                `**Already Existing:** \`${result.duplicates}\``,
                                `**Failed:** \`${result.failed}\``,
                                `**Expired:** \`${result.expired}\``,
                                `**Stale Reservations Removed:** \`${result.staleReservationsRemoved}\``,
                                `**Skipped:** \`${result.skipped}\``
                            ].join('\n')
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
                    await interaction.editReply({
                        embeds: [
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
                            })
                        ],

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
                    'Please check the PostgreSQL connection, scheduler configuration and channel permissions.'
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