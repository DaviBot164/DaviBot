/**
 * ======================================================
 * Evelynn Automatic Rank Trials Configuration
 * ======================================================
 *
 * Controls the monthly Ten Sins Rank Trials,
 * announcements and Discord Scheduled Event.
 *
 * Publication and Event history are stored
 * permanently inside PostgreSQL.
 */

module.exports = {
    /**
     * Main Rank Trials system switch.
     *
     * false disables automatic announcements
     * and Discord Scheduled Event management.
     */
    enabled:
        true,

    /**
     * Official Rank Trials text channel.
     *
     * Current channel:
     * ⚔️・rank-trials
     */
    channelId:
        '1531706846531031060',

    /**
     * Timezone used for every Rank Trial date.
     */
    timezone:
        'Asia/Tbilisi',

    /**
     * Rank Trials occur on the final Saturday
     * of every month.
     *
     * JavaScript weekday numbers:
     *
     * 0 = Sunday
     * 1 = Monday
     * 2 = Tuesday
     * 3 = Wednesday
     * 4 = Thursday
     * 5 = Friday
     * 6 = Saturday
     */
    trialWeekday:
        6,

    /**
     * Official battle start time.
     *
     * Current setting:
     * 20:00 — 8:00 PM Georgia time.
     */
    battleStartHour:
        20,

    battleStartMinute:
        0,

    /**
     * Scheduler checks every five minutes.
     */
    schedulerIntervalMs:
        5 * 60 * 1000,

    /**
     * Recently missed announcements may be
     * recovered for up to 24 hours.
     */
    recoveryWindowMs:
        24 * 60 * 60 * 1000,

    /**
     * ======================================================
     * Discord Scheduled Event
     * ======================================================
     */
    scheduledEvent: {
        /**
         * Enables automatic creation and
         * synchronization of the Discord Event.
         */
        enabled:
            true,

        /**
         * Create the Discord Event when the
         * Opening Announcement is published.
         */
        createWithOpeningAnnouncement:
            true,

        /**
         * Event duration after battle start.
         *
         * Current setting:
         * Three hours.
         */
        durationMinutes:
            180,

        /**
         * External Event location displayed
         * inside Discord.
         */
        location:
            'Ten Sins Arena • Battle Room',

        /**
         * Event name format.
         *
         * The manager adds the month and year.
         */
        namePrefix:
            '⚔️ Monthly Rank Trials',

        /**
         * Event description limit safeguard.
         *
         * Discord currently allows longer text,
         * but Evelynn keeps it compact.
         */
        descriptionMaxLength:
            900,

        /**
         * If the Event is deleted manually,
         * automatic sync may recreate it.
         */
        recreateIfDeleted:
            true,

        /**
         * When true, Evelynn updates an existing
         * Scheduled Event if its configured
         * name, times, location or description
         * no longer match.
         */
        updateExistingEvent:
            true
    },    /**
     * Announcement schedule.
     *
     * All times are based on battle start.
     */
    announcements: {
        /**
         * Registration opens two weeks before
         * the final Saturday.
         */
        opening: {
            enabled:
                true,

            daysBefore:
                14,

            hour:
                18,

            minute:
                0,

            mentionEveryone:
                true
        },

        /**
         * Registration reminder one week before.
         */
        registrationReminder: {
            enabled:
                true,

            daysBefore:
                7,

            hour:
                18,

            minute:
                0,

            mentionEveryone:
                false
        },

        /**
         * Final reminder one day before.
         */
        finalReminder: {
            enabled:
                true,

            daysBefore:
                1,

            hour:
                20,

            minute:
                0,

            mentionEveryone:
                true
        },

        /**
         * Published when the Trials begin.
         */
        battleStart: {
            enabled:
                true,

            daysBefore:
                0,

            hour:
                20,

            minute:
                0,

            mentionEveryone:
                true
        },

        /**
         * Published one day after the Trials.
         */
        closing: {
            enabled:
                true,

            daysAfter:
                1,

            hour:
                18,

            minute:
                0,

            mentionEveryone:
                false
        }
    },

    /**
     * Promotion evaluation principles.
     */
    evaluationCriteria: [
        'Combat performance',
        'Loyalty to THE Ⅹ SINS',
        'Behavior and discipline',
        'Server activity',
        'Contribution to the community',
        'Leadership trust'
    ],    /**
     * Core branding.
     */
    branding: {
        authorName:
            'Evelynn • THE Ⅹ SINS',

        authorityName:
            '♛ THE Ⅹ SINS Authority',

        footerText:
            'Evelynn • Monthly Rank Trials',

        defaultEmoji:
            '⚔️'
    },

    /**
     * PostgreSQL publication identifiers.
     *
     * Do not rename these values after
     * publication history has been created.
     */
    publicationTypes: {
        opening:
            'OPENING',

        registrationReminder:
            'REGISTRATION_REMINDER',

        finalReminder:
            'FINAL_REMINDER',

        battleStart:
            'BATTLE_START',

        closing:
            'CLOSING'
    },

    /**
     * PostgreSQL Scheduled Event states.
     *
     * These values are stored permanently.
     */
    eventStatuses: {
        scheduled:
            'SCHEDULED',

        active:
            'ACTIVE',

        completed:
            'COMPLETED',

        cancelled:
            'CANCELLED',

        deleted:
            'DELETED'
    }
};