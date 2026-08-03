const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrials:
        rankTrialDatabase
} = require('../../database');

const {
    buildMonthlyRankTrialSchedule,
    getCurrentRankTrialMonth,
    getNextMonth
} = require('./calendar');

const {
    publishRankTrialToGuilds
} = require('./publisher');

/**
 * Active Rank Trials scheduler interval.
 *
 * Only one interval may run inside the
 * current Umbra process.
 *
 * @type {NodeJS.Timeout|null}
 */
let schedulerInterval =
    null;

/**
 * Prevent overlapping scheduler checks.
 *
 * This may happen if a database or Discord
 * request takes longer than the configured
 * scheduler interval.
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
 * Umbra checks both the current and next month.
 *
 * The next month's Opening announcement may
 * become relevant before the calendar month
 * itself begins in unusual configurations.
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
 * A publication is due when:
 *
 * - Its scheduled time has passed.
 * - It is still inside the recovery window.
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
 * Publish all currently due announcements
 * from one monthly schedule.
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
}

/**
 * Run one complete Rank Trials scheduler check.
 *
 * PostgreSQL remains the final source of truth,
 * so running this function repeatedly cannot
 * publish the same announcement twice.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Date} now
 * @returns {Promise<{
 *     skipped: boolean,
 *     published: number,
 *     duplicates: number,
 *     failed: number,
 *     expired: number,
 *     staleReservationsRemoved: number
 * }>}
 */
async function checkRankTrialSchedule(
    client,
    now =
        new Date()
) {
    if (
        !rankTrialConfig.enabled
    ) {
        return {
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
                0
        };
    }

    if (
        schedulerCheckInProgress
    ) {
        console.log(
            'ℹ️ Rank Trials scheduler check skipped because another check is still running.'
        );

        return {
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
                0
        };
    }

    schedulerCheckInProgress =
        true;

    try {
        if (
            !client.isReady()
        ) {
            return {
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
                    0
            };
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

            return {
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
                    0
            };
        }

        /*
         * Remove abandoned reservations left
         * behind by an interrupted process.
         */
        const staleReservationsRemoved =
            await rankTrialDatabase
                .clearStaleReservations(
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

            staleReservationsRemoved
        };

        for (
            const schedule of
            schedules
        ) {
            const scheduleSummary =
                await processMonthlySchedule(
                    client,
                    schedule,
                    now,
                    guildIds
                );

            totalSummary.published +=
                scheduleSummary.published;

            totalSummary.duplicates +=
                scheduleSummary.duplicates;

            totalSummary.failed +=
                scheduleSummary.failed;

            totalSummary.expired +=
                scheduleSummary.expired;
        }

        if (
            totalSummary.published >
                0 ||
            totalSummary.failed >
                0
        ) {
            console.log(
                '======================================'
            );

            console.log(
                '⚔️ Rank Trials Scheduler Check Completed'
            );

            console.log(
                `✅ Published: ${totalSummary.published}`
            );

            console.log(
                `ℹ️ Existing: ${totalSummary.duplicates}`
            );

            console.log(
                `❌ Failed: ${totalSummary.failed}`
            );

            console.log(
                `⌛ Expired: ${totalSummary.expired}`
            );

            console.log(
                `🧹 Stale Reservations Removed: ${totalSummary.staleReservationsRemoved}`
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
                0
        };
    } finally {
        schedulerCheckInProgress =
            false;
    }
}

/**
 * Start the Automatic Rank Trials scheduler.
 *
 * An immediate check runs first so Umbra can
 * recover a recently missed announcement after
 * restarting or redeploying.
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
            '⚠️ Rank Trials scheduler could not start because Umbra is not ready.'
        );

        return false;
    }

    /*
     * Run immediately after Umbra becomes ready.
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

    /*
     * Allow Node.js to shut down naturally
     * if this interval is the only active task.
     */
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
        `⏱️ Check Interval: ${rankTrialConfig.schedulerIntervalMs / 60000} minutes`
    );

    console.log(
        '📅 Trial Day: Final Saturday of every month'
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
 * Return whether the scheduler is currently
 * active inside this Umbra process.
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
    processMonthlySchedule,
    checkRankTrialSchedule,
    startRankTrialScheduler,
    stopRankTrialScheduler,
    isRankTrialSchedulerRunning,
    getRankTrialSchedulerInterval
};