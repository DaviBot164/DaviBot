const {
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    GuildScheduledEventStatus,
    PermissionFlagsBits
} = require('discord.js');

const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrialEvents:
        rankTrialEventDatabase
} = require('../../database');

/**
 * Difference tolerated when comparing
 * Discord and PostgreSQL Event timestamps.
 *
 * @type {number}
 */
const DATE_TOLERANCE_MS =
    2_000;

/**
 * Maximum Discord Scheduled Event name length.
 *
 * @type {number}
 */
const EVENT_NAME_MAX_LENGTH =
    100;

/**
 * Maximum External Event location length.
 *
 * @type {number}
 */
const EVENT_LOCATION_MAX_LENGTH =
    100;

/**
 * Maximum Discord Event description length.
 *
 * @type {number}
 */
const EVENT_DESCRIPTION_MAX_LENGTH =
    1_000;

/**
 * Safely limit text to a selected length.
 *
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
function limitText(
    value,
    maxLength
) {
    const normalizedValue =
        String(
            value ??
            ''
        ).trim();

    if (
        normalizedValue.length <=
        maxLength
    ) {
        return normalizedValue;
    }

    return (
        normalizedValue.slice(
            0,
            Math.max(
                0,
                maxLength - 3
            )
        ) +
        '...'
    );
}

/**
 * Convert a Rank Trial month number into
 * its English month name.
 *
 * @param {number} month
 * @returns {string}
 */
function getMonthName(
    month
) {
    const date =
        new Date(
            Date.UTC(
                2026,
                Number(month) - 1,
                1
            )
        );

    return new Intl.DateTimeFormat(
        'en-US',
        {
            month:
                'long',

            timeZone:
                'UTC'
        }
    ).format(
        date
    );
}

/**
 * Build the Discord Scheduled Event name.
 *
 * Example:
 *
 * ⚔️ Monthly Rank Trials — August 2026
 *
 * @param {Object} schedule
 * @returns {string}
 */
function buildRankTrialEventName(
    schedule
) {
    const monthName =
        getMonthName(
            schedule.month
        );

    return limitText(
        [
            rankTrialConfig
                .scheduledEvent
                .namePrefix,

            `${monthName} ${schedule.year}`
        ].join(
            ' — '
        ),
        EVENT_NAME_MAX_LENGTH
    );
}

/**
 * Convert the configured evaluation criteria
 * into a compact Event description list.
 *
 * @returns {string}
 */
function buildEventCriteriaList() {
    return rankTrialConfig
        .evaluationCriteria
        .map(
            criterion =>
                `• ${criterion}`
        )
        .join('\n');
}

/**
 * Build the Discord Scheduled Event
 * description.
 *
 * @param {Object} schedule
 * @returns {string}
 */
function buildRankTrialEventDescription(
    schedule
) {
    const rawDescription =
        [
            '⚔️ Monthly Rank Trials',
            '',
            'The Monthly Rank Trials are now open.',
            '',
            'If you wish to earn a higher Arrancar Rank, this is your opportunity to prove yourself.',
            '',
            'Promotion is based on:',
            '',
            '• Combat Performance',
            '• Activity',
            '• Behavior',
            '• Loyalty',
            '• Contribution to the Server',
            '',
            'Winning battles alone does not guarantee a promotion.',
            '',
            'The final decision will always be made by the Las Noches Leadership.',
            '',
            'Good luck to everyone participating.'
        ].join('\n');

    const configuredLimit =
        Math.min(
            Math.max(
                Number(
                    rankTrialConfig
                        .scheduledEvent
                        .descriptionMaxLength
                ) ||
                EVENT_DESCRIPTION_MAX_LENGTH,
                100
            ),
            EVENT_DESCRIPTION_MAX_LENGTH
        );

    return limitText(
        rawDescription,
        configuredLimit
    );
}

/**
 * Build the configured External Event location.
 *
 * @returns {string}
 */
function buildRankTrialEventLocation() {
    return limitText(
        rankTrialConfig
            .scheduledEvent
            .location,
        EVENT_LOCATION_MAX_LENGTH
    );
}

/**
 * Calculate the Scheduled Event ending time.
 *
 * @param {Date} startsAt
 * @returns {Date}
 */
function buildRankTrialEventEnd(
    startsAt
) {
    const durationMinutes =
        Math.max(
            30,
            Math.floor(
                Number(
                    rankTrialConfig
                        .scheduledEvent
                        .durationMinutes
                ) ||
                180
            )
        );

    return new Date(
        startsAt.getTime() +
        durationMinutes *
        60_000
    );
}

/**
 * Build all expected Discord Event data
 * from one monthly Rank Trial schedule.
 *
 * @param {Object} schedule
 * @returns {{
 *     guildId?: string,
 *     trialKey: string,
 *     eventName: string,
 *     eventDescription: string,
 *     eventLocation: string,
 *     startsAt: Date,
 *     endsAt: Date,
 *     status: string
 * }}
 */
function buildExpectedRankTrialEvent(
    schedule
) {
    const startsAt =
        new Date(
            schedule.battleStart
        );

    return {
        trialKey:
            schedule.trialKey,

        eventName:
            buildRankTrialEventName(
                schedule
            ),

        eventDescription:
            buildRankTrialEventDescription(
                schedule
            ),

        eventLocation:
            buildRankTrialEventLocation(),

        startsAt,

        endsAt:
            buildRankTrialEventEnd(
                startsAt
            ),

        status:
            rankTrialConfig
                .eventStatuses
                .scheduled
    };
}

/**
 * Check whether Umbra may create and manage
 * Discord Scheduled Events.
 *
 * Administrator automatically passes.
 *
 * CreateEvents allows Umbra to create and
 * manage Events created by Umbra.
 *
 * ManageEvents allows broader Event control.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {{
 *     allowed: boolean,
 *     hasCreateEvents: boolean,
 *     hasManageEvents: boolean,
 *     hasAdministrator: boolean
 * }}
 */
function getScheduledEventPermissions(
    guild
) {
    const botMember =
        guild.members.me;

    if (!botMember) {
        return {
            allowed:
                false,

            hasCreateEvents:
                false,

            hasManageEvents:
                false,

            hasAdministrator:
                false
        };
    }

    const permissions =
        botMember.permissions;

    const hasAdministrator =
        permissions.has(
            PermissionFlagsBits.Administrator
        );

    const hasCreateEvents =
        permissions.has(
            PermissionFlagsBits.CreateEvents
        );

    const hasManageEvents =
        permissions.has(
            PermissionFlagsBits.ManageEvents
        );

    return {
        allowed:
            hasAdministrator ||
            hasCreateEvents ||
            hasManageEvents,

        hasCreateEvents,

        hasManageEvents,

        hasAdministrator
    };
}/**
 * Build the options accepted by
 * GuildScheduledEventManager#create.
 *
 * Rank Trials use an External Event so no
 * voice or stage channel is required.
 *
 * @param {Object} expectedEvent
 * @returns {import('discord.js').GuildScheduledEventCreateOptions}
 */
function buildDiscordEventCreateOptions(
    expectedEvent
) {
    return {
        name:
            expectedEvent.eventName,

        description:
            expectedEvent.eventDescription,

        scheduledStartTime:
            expectedEvent.startsAt,

        scheduledEndTime:
            expectedEvent.endsAt,

        privacyLevel:
            GuildScheduledEventPrivacyLevel
                .GuildOnly,

        entityType:
            GuildScheduledEventEntityType
                .External,

        entityMetadata: {
            location:
                expectedEvent.eventLocation
        },

        reason:
            `Umbra Monthly Rank Trials Event Manager • ${expectedEvent.trialKey}`
    };
}

/**
 * Fetch one Discord Scheduled Event.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string|null} discordEventId
 * @returns {Promise<import('discord.js').GuildScheduledEvent|null>}
 */
async function fetchDiscordRankTrialEvent(
    guild,
    discordEventId
) {
    if (!discordEventId) {
        return null;
    }

    return guild.scheduledEvents
        .fetch(
            discordEventId
        )
        .catch(
            error => {
                if (
                    error.code ===
                    10070
                ) {
                    return null;
                }

                throw error;
            }
        );
}

/**
 * Compare two Dates with a small tolerance.
 *
 * @param {Date|null} firstDate
 * @param {Date|null} secondDate
 * @returns {boolean}
 */
function datesMatch(
    firstDate,
    secondDate
) {
    if (
        !(firstDate instanceof Date) ||
        !(secondDate instanceof Date)
    ) {
        return false;
    }

    return (
        Math.abs(
            firstDate.getTime() -
            secondDate.getTime()
        ) <=
        DATE_TOLERANCE_MS
    );
}

/**
 * Read the External Event location from a
 * Discord Scheduled Event.
 *
 * @param {import('discord.js').GuildScheduledEvent} discordEvent
 * @returns {string}
 */
function getDiscordEventLocation(
    discordEvent
) {
    return (
        discordEvent
            .entityMetadata
            ?.location ??
        ''
    );
}

/**
 * Check whether a Discord Event already
 * matches Umbra's expected configuration.
 *
 * @param {import('discord.js').GuildScheduledEvent} discordEvent
 * @param {Object} expectedEvent
 * @returns {boolean}
 */
function discordEventMatchesExpected(
    discordEvent,
    expectedEvent
) {
    return (
        discordEvent.name ===
            expectedEvent.eventName &&

        (
            discordEvent.description ??
            ''
        ) ===
            expectedEvent.eventDescription &&

        getDiscordEventLocation(
            discordEvent
        ) ===
            expectedEvent.eventLocation &&

        datesMatch(
            discordEvent.scheduledStartAt,
            expectedEvent.startsAt
        ) &&

        datesMatch(
            discordEvent.scheduledEndAt,
            expectedEvent.endsAt
        ) &&

        discordEvent.entityType ===
            GuildScheduledEventEntityType
                .External
    );
}

/**
 * Convert a Discord Scheduled Event status
 * into Umbra's PostgreSQL status.
 *
 * @param {GuildScheduledEventStatus} discordStatus
 * @returns {'SCHEDULED'|'ACTIVE'|'COMPLETED'|'CANCELLED'}
 */
function mapDiscordEventStatus(
    discordStatus
) {
    switch (
        discordStatus
    ) {
        case GuildScheduledEventStatus
            .Active:
            return rankTrialConfig
                .eventStatuses
                .active;

        case GuildScheduledEventStatus
            .Completed:
            return rankTrialConfig
                .eventStatuses
                .completed;

        case GuildScheduledEventStatus
            .Canceled:
            return rankTrialConfig
                .eventStatuses
                .cancelled;

        case GuildScheduledEventStatus
            .Scheduled:

        default:
            return rankTrialConfig
                .eventStatuses
                .scheduled;
    }
}

/**
 * Create a Discord Scheduled Event and store
 * its permanent ID inside PostgreSQL.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @returns {Promise<{
 *     status: 'created'|'existing'|'disabled'|'failed',
 *     record?: Object,
 *     discordEvent?: import('discord.js').GuildScheduledEvent,
 *     reason?: string
 * }>}
 */
async function createRankTrialScheduledEvent(
    guild,
    schedule
) {
    if (
        !rankTrialConfig.enabled ||
        !rankTrialConfig
            .scheduledEvent
            .enabled
    ) {
        return {
            status:
                'disabled',

            reason:
                'Rank Trial Scheduled Events are disabled.'
        };
    }

    const permissionState =
        getScheduledEventPermissions(
            guild
        );

    if (
        !permissionState.allowed
    ) {
        return {
            status:
                'failed',

            reason:
                'Umbra requires Create Events or Manage Events permission.'
        };
    }

    const expectedEvent =
        buildExpectedRankTrialEvent(
            schedule
        );

    const existingRecord =
        await rankTrialEventDatabase
            .getRankTrialEvent(
                guild.id,
                schedule.trialKey
            );

    /*
     * If PostgreSQL already has a Discord Event
     * ID, fetch and return the existing Event.
     */
    if (
        existingRecord
            ?.discordEventId
    ) {
        const existingDiscordEvent =
            await fetchDiscordRankTrialEvent(
                guild,
                existingRecord.discordEventId
            );

        if (
            existingDiscordEvent
        ) {
            return {
                status:
                    'existing',

                record:
                    existingRecord,

                discordEvent:
                    existingDiscordEvent
            };
        }

        await rankTrialEventDatabase
            .markRankTrialEventDeleted(
                guild.id,
                schedule.trialKey
            );
    }

    /*
     * A deleted PostgreSQL record remains
     * reserved for the same monthly cycle.
     *
     * Umbra creates a new Discord Event and
     * attaches its ID to the existing record.
     */
    if (
        existingRecord
    ) {
        try {
            const createdDiscordEvent =
                await guild.scheduledEvents
                    .create(
                        buildDiscordEventCreateOptions(
                            expectedEvent
                        )
                    );

            const restoredRecord =
                await rankTrialEventDatabase
                    .restoreRankTrialEvent(
                        guild.id,
                        schedule.trialKey,
                        createdDiscordEvent.id
                    );

            if (!restoredRecord) {
                throw new Error(
                    'Discord Event was created, but its PostgreSQL record could not be restored.'
                );
            }

            return {
                status:
                    'created',

                record:
                    restoredRecord,

                discordEvent:
                    createdDiscordEvent
            };
        } catch (error) {
            return {
                status:
                    'failed',

                reason:
                    error instanceof Error
                        ? error.message
                        : String(
                            error
                        )
            };
        }
    }

    /*
     * Atomically reserve the monthly Event in
     * PostgreSQL before creating it in Discord.
     */
    const reservation =
        await rankTrialEventDatabase
            .reserveRankTrialEvent({
                guildId:
                    guild.id,

                trialKey:
                    expectedEvent.trialKey,

                eventName:
                    expectedEvent.eventName,

                eventDescription:
                    expectedEvent.eventDescription,

                eventLocation:
                    expectedEvent.eventLocation,

                startsAt:
                    expectedEvent.startsAt,

                endsAt:
                    expectedEvent.endsAt,

                status:
                    expectedEvent.status
            });

    if (!reservation) {
        const concurrentRecord =
            await rankTrialEventDatabase
                .getRankTrialEvent(
                    guild.id,
                    schedule.trialKey
                );

        return {
            status:
                'existing',

            record:
                concurrentRecord ??
                undefined
        };
    }

    try {
        const createdDiscordEvent =
            await guild.scheduledEvents
                .create(
                    buildDiscordEventCreateOptions(
                        expectedEvent
                    )
                );

        const completedRecord =
            await rankTrialEventDatabase
                .completeRankTrialEventCreation(
                    reservation.id,
                    createdDiscordEvent.id
                );

        if (!completedRecord) {
            throw new Error(
                'Discord Event was created, but PostgreSQL completion failed.'
            );
        }

        console.log(
            '======================================'
        );

        console.log(
            '📅 Rank Trial Discord Event Created'
        );

        console.log(
            `🗓️ Trial Cycle: ${schedule.trialKey}`
        );

        console.log(
            `🆔 Discord Event ID: ${createdDiscordEvent.id}`
        );

        console.log(
            `🏰 Server: ${guild.name}`
        );

        console.log(
            `⏰ Starts: ${expectedEvent.startsAt.toISOString()}`
        );

        console.log(
            `🏁 Ends: ${expectedEvent.endsAt.toISOString()}`
        );

        console.log(
            '======================================'
        );

        return {
            status:
                'created',

            record:
                completedRecord,

            discordEvent:
                createdDiscordEvent
        };
    } catch (error) {
        await rankTrialEventDatabase
            .releaseRankTrialEventReservation(
                reservation.id
            )
            .catch(
                releaseError => {
                    console.error(
                        '❌ Failed to release Rank Trial Event reservation:'
                    );

                    console.error(
                        releaseError
                    );
                }
            );

        console.error(
            '❌ Rank Trial Discord Event creation failed:'
        );

        console.error(
            error
        );

        return {
            status:
                'failed',

            reason:
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    )
        };
    }
}/**
 * Build the options accepted by
 * GuildScheduledEventManager#edit.
 *
 * @param {Object} expectedEvent
 * @returns {import('discord.js').GuildScheduledEventEditOptions}
 */
function buildDiscordEventEditOptions(
    expectedEvent
) {
    return {
        name:
            expectedEvent.eventName,

        description:
            expectedEvent.eventDescription,

        scheduledStartTime:
            expectedEvent.startsAt,

        scheduledEndTime:
            expectedEvent.endsAt,

        entityMetadata: {
            location:
                expectedEvent.eventLocation
        },

        reason:
            `Umbra Monthly Rank Trials synchronization • ${expectedEvent.trialKey}`
    };
}

/**
 * Safely update one existing Discord
 * Scheduled Event.
 *
 * Completed and cancelled Events cannot
 * return to the Scheduled state, so Umbra
 * does not attempt to edit them.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').GuildScheduledEvent} discordEvent
 * @param {Object} expectedEvent
 * @returns {Promise<import('discord.js').GuildScheduledEvent>}
 */
async function updateDiscordRankTrialEvent(
    guild,
    discordEvent,
    expectedEvent
) {
    const closedStatuses =
        new Set([
            GuildScheduledEventStatus
                .Completed,

            GuildScheduledEventStatus
                .Canceled
        ]);

    if (
        closedStatuses.has(
            discordEvent.status
        )
    ) {
        return discordEvent;
    }

    return guild.scheduledEvents
        .edit(
            discordEvent,
            buildDiscordEventEditOptions(
                expectedEvent
            )
        );
}

/**
 * Save the latest Discord Scheduled Event
 * details and status in PostgreSQL.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @param {import('discord.js').GuildScheduledEvent} discordEvent
 * @param {Object} expectedEvent
 * @returns {Promise<Object|null>}
 */
async function saveDiscordEventState(
    guild,
    schedule,
    discordEvent,
    expectedEvent
) {
    return rankTrialEventDatabase
        .updateRankTrialEvent({
            guildId:
                guild.id,

            trialKey:
                schedule.trialKey,

            discordEventId:
                discordEvent.id,

            eventName:
                discordEvent.name ||
                expectedEvent.eventName,

            eventDescription:
                discordEvent.description ??
                expectedEvent.eventDescription,

            eventLocation:
                getDiscordEventLocation(
                    discordEvent
                ) ||
                expectedEvent.eventLocation,

            startsAt:
                discordEvent.scheduledStartAt ??
                expectedEvent.startsAt,

            endsAt:
                discordEvent.scheduledEndAt ??
                expectedEvent.endsAt,

            status:
                mapDiscordEventStatus(
                    discordEvent.status
                )
        });
}

/**
 * Synchronize the monthly Rank Trial Event
 * between PostgreSQL and Discord.
 *
 * Behavior:
 *
 * - Creates the Event if no record exists.
 * - Fetches an existing Event by its saved ID.
 * - Recreates a manually deleted Event when
 *   recreation is enabled.
 * - Updates Event details when config or
 *   schedule values have changed.
 * - Saves the latest Discord status.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @returns {Promise<{
 *     status:
 *         'created'|
 *         'synchronized'|
 *         'updated'|
 *         'recreated'|
 *         'missing'|
 *         'disabled'|
 *         'failed',
 *     record?: Object,
 *     discordEvent?: import('discord.js').GuildScheduledEvent,
 *     changed?: boolean,
 *     reason?: string
 * }>}
 */
async function synchronizeRankTrialScheduledEvent(
    guild,
    schedule
) {
    if (
        !rankTrialConfig.enabled ||
        !rankTrialConfig
            .scheduledEvent
            .enabled
    ) {
        return {
            status:
                'disabled',

            reason:
                'Rank Trial Scheduled Events are disabled.'
        };
    }

    const permissionState =
        getScheduledEventPermissions(
            guild
        );

    if (
        !permissionState.allowed
    ) {
        return {
            status:
                'failed',

            reason:
                'Umbra requires Create Events or Manage Events permission.'
        };
    }

    try {
        const expectedEvent =
            buildExpectedRankTrialEvent(
                schedule
            );

        let databaseRecord =
            await rankTrialEventDatabase
                .getRankTrialEvent(
                    guild.id,
                    schedule.trialKey
                );

        /*
         * No PostgreSQL record exists yet.
         */
        if (!databaseRecord) {
            const creationResult =
                await createRankTrialScheduledEvent(
                    guild,
                    schedule
                );

            return {
                ...creationResult,

                status:
                    creationResult.status ===
                        'created'
                        ? 'created'
                        : creationResult.status
            };
        }

        let discordEvent =
            await fetchDiscordRankTrialEvent(
                guild,
                databaseRecord.discordEventId
            );

        /*
         * The saved Event no longer exists
         * inside Discord.
         */
        if (!discordEvent) {
            await rankTrialEventDatabase
                .markRankTrialEventDeleted(
                    guild.id,
                    schedule.trialKey
                );

            if (
                !rankTrialConfig
                    .scheduledEvent
                    .recreateIfDeleted
            ) {
                return {
                    status:
                        'missing',

                    record:
                        databaseRecord,

                    reason:
                        'The Discord Scheduled Event was deleted and automatic recreation is disabled.'
                };
            }

            const recreationResult =
                await createRankTrialScheduledEvent(
                    guild,
                    schedule
                );

            return {
                ...recreationResult,

                status:
                    recreationResult.status ===
                        'created'
                        ? 'recreated'
                        : recreationResult.status
            };
        }

        const eventMatches =
            discordEventMatchesExpected(
                discordEvent,
                expectedEvent
            );

        let changed =
            false;

        /*
         * Update only Events that are still
         * editable and when sync updates are
         * enabled in configuration.
         */
        if (
            !eventMatches &&
            rankTrialConfig
                .scheduledEvent
                .updateExistingEvent
        ) {
            discordEvent =
                await updateDiscordRankTrialEvent(
                    guild,
                    discordEvent,
                    expectedEvent
                );

            changed =
                true;
        }

        databaseRecord =
            await saveDiscordEventState(
                guild,
                schedule,
                discordEvent,
                expectedEvent
            );

        if (!databaseRecord) {
            return {
                status:
                    'failed',

                discordEvent,

                reason:
                    'The Discord Event was synchronized, but PostgreSQL could not be updated.'
            };
        }

        if (changed) {
            console.log(
                '======================================'
            );

            console.log(
                '🔄 Rank Trial Discord Event Updated'
            );

            console.log(
                `🗓️ Trial Cycle: ${schedule.trialKey}`
            );

            console.log(
                `🆔 Discord Event ID: ${discordEvent.id}`
            );

            console.log(
                `🏰 Server: ${guild.name}`
            );

            console.log(
                '======================================'
            );
        }

        return {
            status:
                changed
                    ? 'updated'
                    : 'synchronized',

            record:
                databaseRecord,

            discordEvent,

            changed
        };
    } catch (error) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Rank Trial Event synchronization failed.'
        );

        console.error(
            `🗓️ Trial Cycle: ${schedule.trialKey}`
        );

        console.error(
            `🏰 Server: ${guild.name}`
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        return {
            status:
                'failed',

            reason:
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    )
        };
    }
}/**
 * Fetch the members who selected Interested
 * on a Discord Scheduled Event.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} discordEventId
 * @returns {Promise<import('discord.js').Collection>}
 */
async function fetchRankTrialEventSubscribers(
    guild,
    discordEventId
) {
    if (!discordEventId) {
        throw new TypeError(
            'A Discord Scheduled Event ID is required.'
        );
    }

    return guild.scheduledEvents
        .fetchSubscribers(
            discordEventId,
            {
                limit: 100
            }
        );
}

/**
 * Count interested members.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} discordEventId
 * @returns {Promise<number>}
 */
async function countRankTrialEventSubscribers(
    guild,
    discordEventId
) {
    const subscribers =
        await fetchRankTrialEventSubscribers(
            guild,
            discordEventId
        );

    return subscribers.size;
}

/**
 * Load the current Rank Trial Event state.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @returns {Promise<Object>}
 */
async function getRankTrialScheduledEventState(
    guild,
    schedule
) {
    const record =
        await rankTrialEventDatabase
            .getRankTrialEvent(
                guild.id,
                schedule.trialKey
            );

    if (
        !record ||
        !record.discordEventId
    ) {
        return {
            record,
            discordEvent: null,
            interestedCount: 0
        };
    }

    const discordEvent =
        await fetchDiscordRankTrialEvent(
            guild,
            record.discordEventId
        );

    if (!discordEvent) {
        await rankTrialEventDatabase
            .markRankTrialEventDeleted(
                guild.id,
                schedule.trialKey
            );

        return {
            record,
            discordEvent: null,
            interestedCount: 0
        };
    }

    return {
        record,
        discordEvent,
        interestedCount:
            Number(
                discordEvent.userCount ?? 0
            )
    };
}

/**
 * Refresh Event status inside PostgreSQL.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @returns {Promise<Object|null>}
 */
async function refreshRankTrialEventStatus(
    guild,
    schedule
) {
    const record =
        await rankTrialEventDatabase
            .getRankTrialEvent(
                guild.id,
                schedule.trialKey
            );

    if (
        !record ||
        !record.discordEventId
    ) {
        return record;
    }

    const discordEvent =
        await fetchDiscordRankTrialEvent(
            guild,
            record.discordEventId
        );

    if (!discordEvent) {
        return rankTrialEventDatabase
            .markRankTrialEventDeleted(
                guild.id,
                schedule.trialKey
            );
    }

    return rankTrialEventDatabase
        .updateRankTrialEventStatus(
            guild.id,
            schedule.trialKey,
            mapDiscordEventStatus(
                discordEvent.status
            )
        );
}

/**
 * Synchronize Rank Trial Events
 * for multiple guilds.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} schedule
 * @param {string[]} guildIds
 * @returns {Promise<Array>}
 */
async function synchronizeRankTrialEventsForGuilds(
    client,
    schedule,
    guildIds
) {
    const results = [];

    for (
        const guildId of guildIds
    ) {
        const guild =
            client.guilds.cache.get(
                guildId
            ) ??
            await client.guilds
                .fetch(
                    guildId
                )
                .catch(
                    () => null
                );

        if (!guild) {
            results.push({
                guildId,
                status: 'failed',
                reason:
                    'Guild could not be fetched.'
            });

            continue;
        }

        const result =
            await synchronizeRankTrialScheduledEvent(
                guild,
                schedule
            );

        results.push({
            guildId: guild.id,
            status: result.status,
            reason: result.reason,
            discordEventId:
                result.discordEvent?.id
        });
    }

    return results;
}

module.exports = {
    limitText,
    getMonthName,
    buildRankTrialEventName,
    buildEventCriteriaList,
    buildRankTrialEventDescription,
    buildRankTrialEventLocation,
    buildRankTrialEventEnd,
    buildExpectedRankTrialEvent,
    getScheduledEventPermissions,
    buildDiscordEventCreateOptions,
    buildDiscordEventEditOptions,
    fetchDiscordRankTrialEvent,
    datesMatch,
    getDiscordEventLocation,
    discordEventMatchesExpected,
    mapDiscordEventStatus,
    createRankTrialScheduledEvent,
    updateDiscordRankTrialEvent,
    saveDiscordEventState,
    synchronizeRankTrialScheduledEvent,
    fetchRankTrialEventSubscribers,
    countRankTrialEventSubscribers,
    getRankTrialScheduledEventState,
    refreshRankTrialEventStatus,
    synchronizeRankTrialEventsForGuilds
};