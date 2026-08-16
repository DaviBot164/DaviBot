const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrials:
        rankTrialDatabase,

    rankTrialEvents:
        rankTrialEventDatabase
} = require('../../database');

const {
    buildMonthlyRankTrialSchedule,
    getCurrentRankTrialMonth,
    getNextMonth
} = require('./calendar');

const {
    publishRankTrialToGuilds
} = require('./publisher');

const {
    synchronizeRankTrialEventsForGuilds
} = require('./eventManager');

const {
    getRegistrationState,
    closeRegistrationForSchedule
} = require('./registration');

/**
 * Active Rank Trials scheduler interval.
 *
 * Only one interval may run inside the
 * current Evelynn process.
 *
 * @type {NodeJS.Timeout|null}
 */
let schedulerInterval =
    null;

/**
 * Prevent overlapping scheduler checks.
 */
let schedulerCheckInProgress =
    false;

/**
 * Return the configured active Guild IDs.
 *
 * Expected environment format:
 *
 * GUILD_IDS=server_id_1,server_id_2
 *
 * @returns {string[]}
 */
function getConfiguredGuildIds() {
    const rawGuildIds =
        process.env.GUILD_IDS ??
        process.env.GUILD_ID ??
        '';

    return [
        ...new Set(
            rawGuildIds
                .split(',')
                .map(
                    guildId =>
                        guildId.trim()
                )
                .filter(
                    Boolean
                )
        )
    ];
}

/**
 * Return every monthly schedule that may
 * currently contain a due announcement.
 *
 * Evelynn checks both the current and next month.
 *
 * @param {Date} now
 * @returns {Array<
 *     ReturnType<typeof buildMonthlyRankTrialSchedule>
 * >}
 */
function getSchedulesToCheck(
    now =
        new Date()
) {
    const currentMonth =
        getCurrentRankTrialMonth(
            now
        );

    const nextMonth =
        getNextMonth(
            currentMonth.year,
            currentMonth.month
        );

    return [
        buildMonthlyRankTrialSchedule(
            currentMonth.year,
            currentMonth.month
        ),

        buildMonthlyRankTrialSchedule(
            nextMonth.year,
            nextMonth.month
        )
    ];
}

/**
 * Check whether one publication is currently
 * eligible to be published.
 *
 * @param {Date} now
 * @param {Date} scheduledFor
 * @returns {boolean}
 */
function isPublicationDue(
    now,
    scheduledFor
) {
    const currentTime =
        now.getTime();

    const scheduledTime =
        scheduledFor.getTime();

    if (
        currentTime <
        scheduledTime
    ) {
        return false;
    }

    const publicationAge =
        currentTime -
        scheduledTime;

    return (
        publicationAge <=
        rankTrialConfig.recoveryWindowMs
    );
}

/**
 * Check whether one publication is already
 * too old to recover.
 *
 * @param {Date} now
 * @param {Date} scheduledFor
 * @returns {boolean}
 */
function isPublicationExpired(
    now,
    scheduledFor
) {
    return (
        now.getTime() -
        scheduledFor.getTime() >
        rankTrialConfig.recoveryWindowMs
    );
}

/**
 * Return the Opening publication belonging
 * to one monthly Rank Trial schedule.
 *
 * @param {Object} schedule
 * @returns {Object|null}
 */
function getOpeningPublication(
    schedule
) {
    return (
        schedule.publications.find(
            publication =>
                publication.key ===
                'opening'
        ) ??
        null
    );
}

/**
 * Return the final publication belonging
 * to one monthly Rank Trial schedule.
 *
 * This is normally the Closing Notice.
 *
 * @param {Object} schedule
 * @returns {Object|null}
 */
function getFinalPublication(
    schedule
) {
    if (
        schedule.publications.length ===
        0
    ) {
        return null;
    }

    return schedule.publications[
        schedule.publications.length -
        1
    ];
}

/**
 * Determine whether the Discord Scheduled
 * Event should currently exist.
 *
 * The Event becomes eligible when Opening
 * Registration begins.
 *
 * Evelynn continues synchronizing it until the
 * final monthly publication has passed.
 *
 * @param {Object} schedule
 * @param {Date} now
 * @returns {boolean}
 */
function shouldSynchronizeRankTrialEvent(
    schedule,
    now
) {
    if (
        !rankTrialConfig.enabled ||
        !rankTrialConfig
            .scheduledEvent
            ?.enabled
    ) {
        return false;
    }

    const openingPublication =
        getOpeningPublication(
            schedule
        );

    const finalPublication =
        getFinalPublication(
            schedule
        );

    if (
        !openingPublication ||
        !finalPublication
    ) {
        return false;
    }

    const currentTime =
        now.getTime();

    return (
        currentTime >=
            openingPublication
                .scheduledFor
                .getTime() &&

        currentTime <=
            finalPublication
                .scheduledFor
                .getTime()
    );
}/**
 * Create, restore or update the Discord
 * Scheduled Event for one monthly cycle.
 *
 * This runs independently from publication
 * creation, so an existing announcement cannot
 * prevent Event recovery.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} schedule
 * @param {Date} now
 * @param {string[]} guildIds
 * @returns {Promise<{
 *     attempted: number,
 *     created: number,
 *     recreated: number,
 *     updated: number,
 *     synchronized: number,
 *     failed: number,
 *     skipped: number
 * }>}
 */
async function processScheduledEventSynchronization(
    client,
    schedule,
    now,
    guildIds
) {
    const summary = {
        attempted:
            0,

        created:
            0,

        recreated:
            0,

        updated:
            0,

        synchronized:
            0,

        failed:
            0,

        skipped:
            0
    };

    if (
        !shouldSynchronizeRankTrialEvent(
            schedule,
            now
        )
    ) {
        summary.skipped +=
            1;

        return summary;
    }

    const results =
        await synchronizeRankTrialEventsForGuilds(
            client,
            schedule,
            guildIds
        );

    for (
        const result of
        results
    ) {
        summary.attempted +=
            1;

        switch (
            result.status
        ) {
            case 'created':
                summary.created +=
                    1;
                break;

            case 'recreated':
                summary.recreated +=
                    1;
                break;

            case 'updated':
                summary.updated +=
                    1;
                break;

            case 'synchronized':
                summary.synchronized +=
                    1;
                break;

            case 'disabled':
            case 'missing':
                summary.skipped +=
                    1;
                break;

            default:
                summary.failed +=
                    1;
                break;
        }
    }

    return summary;
}

/**
 * Close Rank Trials 2.0 registration
 * for one monthly cycle when its configured
 * registration window has ended.
 *
 * Registration close is based on time,
 * not on whether the Final Reminder was
 * successfully published.
 *
 * This keeps registration reliable even if
 * Discord temporarily fails to send an
 * announcement.
 *
 * The underlying database transition is
 * idempotent:
 *
 * REGISTERED -> UNDER_REVIEW
 *
 * Running this function again will not
 * modify WITHDRAWN, APPROVED, REJECTED or
 * already UNDER_REVIEW participants.
 *
 * @param {Object} schedule
 * @param {Date} now
 * @param {string[]} guildIds
 * @returns {Promise<{
 *     attempted: number,
 *     closed: number,
 *     moved: number,
 *     failed: number,
 *     skipped: number
 * }>}
 */
async function processRegistrationClose(
    schedule,
    now,
    guildIds
) {
    const summary = {
        attempted:
            0,

        closed:
            0,

        moved:
            0,

        failed:
            0,

        skipped:
            0
    };

    const registrationState =
        getRegistrationState(
            schedule,
            now
        );

    if (
        registrationState.state !==
        'CLOSED'
    ) {
        summary.skipped +=
            1;

        return summary;
    }

    for (
        const guildId of
        guildIds
    ) {
        summary.attempted +=
            1;

        try {
            const result =
                await closeRegistrationForSchedule({
                    guildId,
                    schedule
                });

            summary.closed +=
                1;

            summary.moved +=
                result
                    .movedParticipants
                    .length;

            if (
                result
                    .movedParticipants
                    .length >
                0
            ) {
                console.log(
                    '======================================'
                );

                console.log(
                    '🔒 Rank Trials 2.0 Registration Closed'
                );

                console.log(
                    `🗓️ Trial Cycle: ${schedule.trialKey}`
                );

                console.log(
                    `🏰 Guild ID: ${guildId}`
                );

                console.log(
                    `👥 Participants Moved To Review: ${result.movedParticipants.length}`
                );

                console.log(
                    `📋 Under Review: ${result.statistics.underReview}`
                );

                console.log(
                    '======================================'
                );
            }
        } catch (error) {
            summary.failed +=
                1;

            console.error(
                '======================================'
            );

            console.error(
                '❌ Rank Trials 2.0 registration close failed.'
            );

            console.error(
                `🗓️ Trial Cycle: ${schedule.trialKey}`
            );

            console.error(
                `🏰 Guild ID: ${guildId}`
            );

            console.error(
                error
            );

            console.error(
                '======================================'
            );
        }
    }

    return summary;
}

/**
 * Publish all currently due announcements
 * from one monthly Rank Trial schedule.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {ReturnType<typeof buildMonthlyRankTrialSchedule>} schedule
 * @param {Date} now
 * @param {string[]} guildIds
 * @returns {Promise<{
 *     published: number,
 *     duplicates: number,
 *     failed: number,
 *     expired: number
 * }>}
 */
async function processMonthlySchedule(
    client,
    schedule,
    now,
    guildIds
) {
    const summary = {
        published:
            0,

        duplicates:
            0,

        failed:
            0,

        expired:
            0
    };

    for (
        const publication of
        schedule.publications
    ) {
        if (
            publication.scheduledFor
                .getTime() >
            now.getTime()
        ) {
            continue;
        }

        if (
            isPublicationExpired(
                now,
                publication.scheduledFor
            )
        ) {
            summary.expired +=
                1;

            continue;
        }

        if (
            !isPublicationDue(
                now,
                publication.scheduledFor
            )
        ) {
            continue;
        }

        const results =
            await publishRankTrialToGuilds(
                client,
                schedule,
                publication,
                guildIds
            );

        for (
            const result of
            results
        ) {
            switch (
                result.status
            ) {
                case 'published':
                    summary.published +=
                        1;
                    break;

                case 'duplicate':
                    summary.duplicates +=
                        1;
                    break;

                default:
                    summary.failed +=
                        1;
                    break;
            }
        }
    }

    return summary;
}/**
 * Run one complete Rank Trials scheduler check.
 *
 * PostgreSQL remains the final source of truth,
 * so repeated checks cannot publish duplicate
 * announcements, create duplicate Events or
 * re-close already reviewed registrations.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Date} now
 * @returns {Promise<{
 *     skipped: boolean,
 *     published: number,
 *     duplicates: number,
 *     failed: number,
 *     expired: number,
 *     staleReservationsRemoved: number,
 *     staleEventReservationsRemoved: number,
 *     registrationCloseAttempted: number,
 *     registrationClosed: number,
 *     registrationMovedToReview: number,
 *     registrationCloseFailed: number,
 *     registrationCloseSkipped: number,
 *     eventAttempted: number,
 *     eventCreated: number,
 *     eventRecreated: number,
 *     eventUpdated: number,
 *     eventSynchronized: number,
 *     eventFailed: number,
 *     eventSkipped: number
 * }>}
 */
async function checkRankTrialSchedule(
    client,
    now =
        new Date()
) {
    const emptyResult = {
        skipped:
            true,

        published:
            0,

        duplicates:
            0,

        failed:
            0,

        expired:
            0,

        staleReservationsRemoved:
            0,

        staleEventReservationsRemoved:
            0,

        registrationCloseAttempted:
            0,

        registrationClosed:
            0,

        registrationMovedToReview:
            0,

        registrationCloseFailed:
            0,

        registrationCloseSkipped:
            0,

        eventAttempted:
            0,

        eventCreated:
            0,

        eventRecreated:
            0,

        eventUpdated:
            0,

        eventSynchronized:
            0,

        eventFailed:
            0,

        eventSkipped:
            0
    };

    if (
        !rankTrialConfig.enabled
    ) {
        return emptyResult;
    }

    if (
        schedulerCheckInProgress
    ) {
        console.log(
            'ℹ️ Rank Trials scheduler check skipped because another check is still running.'
        );

        return emptyResult;
    }

    schedulerCheckInProgress =
        true;

    try {
        if (
            !client.isReady()
        ) {
            return emptyResult;
        }

        const guildIds =
            getConfiguredGuildIds();

        if (
            guildIds.length ===
            0
        ) {
            console.warn(
                '⚠️ Rank Trials scheduler found no configured Guild IDs.'
            );

            return emptyResult;
        }

        /*
         * Remove abandoned publication
         * reservations.
         */
        const staleReservationsRemoved =
            await rankTrialDatabase
                .clearStaleReservations(
                    30
                );

        /*
         * Remove abandoned Scheduled Event
         * reservations.
         */
        const staleEventReservationsRemoved =
            await rankTrialEventDatabase
                .clearStaleRankTrialEventReservations(
                    30
                );

        if (
            staleReservationsRemoved >
            0
        ) {
            console.warn(
                `⚠️ Removed ${staleReservationsRemoved} stale Rank Trial publication reservation(s).`
            );
        }

        if (
            staleEventReservationsRemoved >
            0
        ) {
            console.warn(
                `⚠️ Removed ${staleEventReservationsRemoved} stale Rank Trial Event reservation(s).`
            );
        }

        const schedules =
            getSchedulesToCheck(
                now
            );

        const totalSummary = {
            skipped:
                false,

            published:
                0,

            duplicates:
                0,

            failed:
                0,

            expired:
                0,

            staleReservationsRemoved,

            staleEventReservationsRemoved,

            registrationCloseAttempted:
                0,

            registrationClosed:
                0,

            registrationMovedToReview:
                0,

            registrationCloseFailed:
                0,

            registrationCloseSkipped:
                0,

            eventAttempted:
                0,

            eventCreated:
                0,

            eventRecreated:
                0,

            eventUpdated:
                0,

            eventSynchronized:
                0,

            eventFailed:
                0,

            eventSkipped:
                0
        };

        for (
            const schedule of
            schedules
        ) {
            /*
             * First process due announcements.
             */
            const publicationSummary =
                await processMonthlySchedule(
                    client,
                    schedule,
                    now,
                    guildIds
                );

            totalSummary.published +=
                publicationSummary.published;

            totalSummary.duplicates +=
                publicationSummary.duplicates;

            totalSummary.failed +=
                publicationSummary.failed;

            totalSummary.expired +=
                publicationSummary.expired;

            /*
             * Rank Trials 2.0:
             * close registration independently
             * from Discord announcement success.
             */
            const registrationSummary =
                await processRegistrationClose(
                    schedule,
                    now,
                    guildIds
                );

            totalSummary.registrationCloseAttempted +=
                registrationSummary.attempted;

            totalSummary.registrationClosed +=
                registrationSummary.closed;

            totalSummary.registrationMovedToReview +=
                registrationSummary.moved;

            totalSummary.registrationCloseFailed +=
                registrationSummary.failed;

            totalSummary.registrationCloseSkipped +=
                registrationSummary.skipped;

            /*
             * Then independently create,
             * restore or synchronize the
             * Discord Scheduled Event.
             */
            const eventSummary =
                await processScheduledEventSynchronization(
                    client,
                    schedule,
                    now,
                    guildIds
                );

            totalSummary.eventAttempted +=
                eventSummary.attempted;

            totalSummary.eventCreated +=
                eventSummary.created;

            totalSummary.eventRecreated +=
                eventSummary.recreated;

            totalSummary.eventUpdated +=
                eventSummary.updated;

            totalSummary.eventSynchronized +=
                eventSummary.synchronized;

            totalSummary.eventFailed +=
                eventSummary.failed;

            totalSummary.eventSkipped +=
                eventSummary.skipped;
        }        const shouldLogSummary =
            totalSummary.published >
                0 ||
            totalSummary.failed >
                0 ||
            totalSummary.registrationMovedToReview >
                0 ||
            totalSummary.registrationCloseFailed >
                0 ||
            totalSummary.eventCreated >
                0 ||
            totalSummary.eventRecreated >
                0 ||
            totalSummary.eventUpdated >
                0 ||
            totalSummary.eventFailed >
                0 ||
            totalSummary.staleReservationsRemoved >
                0 ||
            totalSummary.staleEventReservationsRemoved >
                0;

        if (
            shouldLogSummary
        ) {
            console.log(
                '======================================'
            );

            console.log(
                '⚔️ Rank Trials Scheduler Check Completed'
            );

            console.log(
                `✅ Announcements Published: ${totalSummary.published}`
            );

            console.log(
                `ℹ️ Announcements Existing: ${totalSummary.duplicates}`
            );

            console.log(
                `❌ Announcement Failures: ${totalSummary.failed}`
            );

            console.log(
                `⌛ Expired Announcements: ${totalSummary.expired}`
            );

            console.log(
                `🔒 Registration Close Attempts: ${totalSummary.registrationCloseAttempted}`
            );

            console.log(
                `✅ Registration Cycles Closed: ${totalSummary.registrationClosed}`
            );

            console.log(
                `👥 Participants Moved To Review: ${totalSummary.registrationMovedToReview}`
            );

            console.log(
                `❌ Registration Close Failures: ${totalSummary.registrationCloseFailed}`
            );

            console.log(
                `📅 Events Created: ${totalSummary.eventCreated}`
            );

            console.log(
                `♻️ Events Recreated: ${totalSummary.eventRecreated}`
            );

            console.log(
                `🔄 Events Updated: ${totalSummary.eventUpdated}`
            );

            console.log(
                `✅ Events Synchronized: ${totalSummary.eventSynchronized}`
            );

            console.log(
                `❌ Event Failures: ${totalSummary.eventFailed}`
            );

            console.log(
                `🧹 Publication Reservations Removed: ${totalSummary.staleReservationsRemoved}`
            );

            console.log(
                `🧹 Event Reservations Removed: ${totalSummary.staleEventReservationsRemoved}`
            );

            console.log(
                '======================================'
            );
        }

        return totalSummary;
    } catch (error) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Rank Trials scheduler check failed:'
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        return {
            skipped:
                false,

            published:
                0,

            duplicates:
                0,

            failed:
                1,

            expired:
                0,

            staleReservationsRemoved:
                0,

            staleEventReservationsRemoved:
                0,

            registrationCloseAttempted:
                0,

            registrationClosed:
                0,

            registrationMovedToReview:
                0,

            registrationCloseFailed:
                1,

            registrationCloseSkipped:
                0,

            eventAttempted:
                0,

            eventCreated:
                0,

            eventRecreated:
                0,

            eventUpdated:
                0,

            eventSynchronized:
                0,

            eventFailed:
                1,

            eventSkipped:
                0
        };
    } finally {
        schedulerCheckInProgress =
            false;
    }
}/**
 * Start the Automatic Rank Trials scheduler.
 *
 * Evelynn performs one immediate check so
 * recently missed announcements, registration
 * closes and Discord Events may be recovered
 * after restart or redeploy.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<boolean>}
 */
async function startRankTrialScheduler(
    client
) {
    if (
        !rankTrialConfig.enabled
    ) {
        console.log(
            'ℹ️ Automatic Rank Trials are disabled in config/rankTrials.js.'
        );

        return false;
    }

    if (
        schedulerInterval
    ) {
        console.log(
            'ℹ️ Rank Trials scheduler is already running.'
        );

        return false;
    }

    if (
        !client.isReady()
    ) {
        console.warn(
            '⚠️ Rank Trials scheduler could not start because Evelynn is not ready.'
        );

        return false;
    }

    /*
     * Immediate startup recovery check.
     */
    await checkRankTrialSchedule(
        client
    );

    schedulerInterval =
        setInterval(
            () => {
                void checkRankTrialSchedule(
                    client
                );
            },

            rankTrialConfig
                .schedulerIntervalMs
        );

    schedulerInterval.unref?.();

    console.log(
        '======================================'
    );

    console.log(
        '⚔️ Automatic Rank Trials Scheduler Started'
    );

    console.log(
        `📍 Channel ID: ${rankTrialConfig.channelId}`
    );

    console.log(
        `🌍 Timezone: ${rankTrialConfig.timezone}`
    );

    console.log(
        `⏱️ Check Interval: ${rankTrialConfig.schedulerIntervalMs / 60_000} minutes`
    );

    console.log(
        '📅 Trial Day: Final Saturday of every month'
    );

    console.log(
        '🔒 Rank Trials 2.0 Registration Close: Final Reminder'
    );

    console.log(
        `📆 Discord Events: ${
            rankTrialConfig
                .scheduledEvent
                ?.enabled
                ? 'Enabled'
                : 'Disabled'
        }`
    );

    console.log(
        '======================================'
    );

    return true;
}

/**
 * Stop the active Rank Trials scheduler.
 *
 * @returns {boolean}
 */
function stopRankTrialScheduler() {
    if (
        !schedulerInterval
    ) {
        return false;
    }

    clearInterval(
        schedulerInterval
    );

    schedulerInterval =
        null;

    schedulerCheckInProgress =
        false;

    console.log(
        '🛑 Automatic Rank Trials scheduler stopped.'
    );

    return true;
}

/**
 * Return whether the scheduler is active
 * inside the current Evelynn process.
 *
 * @returns {boolean}
 */
function isRankTrialSchedulerRunning() {
    return (
        schedulerInterval !==
        null
    );
}

/**
 * Return the configured scheduler interval.
 *
 * @returns {number}
 */
function getRankTrialSchedulerInterval() {
    return rankTrialConfig
        .schedulerIntervalMs;
}

module.exports = {
    getConfiguredGuildIds,
    getSchedulesToCheck,
    isPublicationDue,
    isPublicationExpired,
    getOpeningPublication,
    getFinalPublication,

    shouldSynchronizeRankTrialEvent,
    processScheduledEventSynchronization,

    processRegistrationClose,
    processMonthlySchedule,

    checkRankTrialSchedule,
    startRankTrialScheduler,
    stopRankTrialScheduler,
    isRankTrialSchedulerRunning,
    getRankTrialSchedulerInterval
};