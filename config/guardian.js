/**
 * DaviBot Guardian configuration.
 *
 * Protection levels:
 * LOW    - delete spam and notify the user
 * MEDIUM - delete spam, notify the user, save a warning
 * HIGH   - delete spam, save a warning, timeout repeat offenders
 */
module.exports = {
    enabled: true,

    protectionLevel: 'HIGH',

    logChannelName: '🤖・guardian-log',

    ignoredChannelIds: [],

    ignoredRoleIds: [],

    spam: {
        enabled: true,

        /**
         * Number of messages allowed inside the time window.
         */
        maxMessages: 5,

        /**
         * Time window in milliseconds.
         */
        intervalMs: 7000,

        /**
         * Number of matching messages required to count as repeated spam.
         */
        repeatedMessageLimit: 3,

        /**
         * How long a repeated-message record remains active.
         */
        repeatedMessageWindowMs: 15000,

        /**
         * Number of Guardian violations before timeout.
         */
        timeoutAfterViolations: 3,

        /**
         * Timeout duration in milliseconds.
         * 10 minutes = 10 * 60 * 1000
         */
        timeoutDurationMs: 10 * 60 * 1000,

        /**
         * Remove duplicate/spam messages when possible.
         */
        deleteMessage: true,

        /**
         * Send a short temporary warning in the channel.
         */
        notifyUser: true,

        /**
         * Delete the temporary warning after this many milliseconds.
         */
        notificationDeleteAfterMs: 7000
    }
};