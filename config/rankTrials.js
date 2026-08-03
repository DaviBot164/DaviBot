/**
 * ======================================================
 * Umbra Automatic Rank Trials Configuration
 * ======================================================
 *
 * Controls the monthly Las Noches Rank Trials.
 *
 * The actual publication history will be stored
 * permanently inside PostgreSQL.
 */

module.exports = {
    /**
     * Main Rank Trials system switch.
     *
     * false = completely disables automatic
     * Rank Trial announcements.
     */
    enabled:
        true,

    /**
     * Official Rank Trials channel.
     *
     * Current channel:
     * ⚔️・rank-trials
     */
    channelId:
        '1531706846531031060',

    /**
     * Timezone used when calculating the
     * monthly Rank Trial schedule.
     *
     * Las Noches currently uses Georgia time.
     */
    timezone:
        'Asia/Tbilisi',

    /**
     * Rank Trials are held on the final
     * Saturday of every month.
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
     * Battle start time in local Las Noches time.
     *
     * Current setting:
     * 20:00 — 8:00 PM
     */
    battleStartHour:
        20,

    battleStartMinute:
        0,

    /**
     * How often Umbra checks whether an
     * announcement is due.
     *
     * Five minutes is frequent enough while
     * keeping the system lightweight.
     */
    schedulerIntervalMs:
        5 * 60 * 1000,

    /**
     * Maximum age of a missed publication.
     *
     * Example:
     * If Umbra was offline when an announcement
     * became due, it may publish it after restart
     * only if the announcement is not older than
     * this recovery window.
     *
     * 24 hours prevents very old reminders from
     * being published unexpectedly.
     */
    recoveryWindowMs:
        24 * 60 * 60 * 1000,

    /**
     * Announcement schedule.
     *
     * All offsets are calculated relative to
     * the Rank Trial battle start.
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
         * Main registration reminder one week
         * before the Rank Trials.
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
         * Final reminder one day before battle.
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
         * Published when the monthly Rank Trials
         * officially begin.
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
         * Optional closing notice.
         *
         * Published one day after Rank Trials.
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
     * Rank Trial evaluation principles.
     *
     * These will be displayed inside automatic
     * announcements so members understand that
     * victory alone does not guarantee promotion.
     */
    evaluationCriteria: [
        'Combat performance',
        'Loyalty to Las Noches',
        'Behavior and discipline',
        'Server activity',
        'Contribution to the community',
        'Leadership trust'
    ],

    /**
     * Core announcement branding.
     */
    branding: {
        authorName:
            'Umbra • Guardian of Las Noches',

        authorityName:
            '🌙 Las Noches Authority',

        footerText:
            'Umbra • Monthly Rank Trials',

        defaultEmoji:
            '⚔️'
    },

    /**
     * PostgreSQL publication identifiers.
     *
     * These values are stored in the database.
     * Do not rename them after the system begins
     * publishing announcements.
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
    }
};