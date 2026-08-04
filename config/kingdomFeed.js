module.exports = {
    /**
     * Main Soul Progression Feed switch.
     *
     * false = disable every progression
     * Feed notification.
     */
    enabled:
        true,

    /**
     * Official Soul Progression channel.
     *
     * Current channel:
     * 📈・soul-progression
     */
    channelId:
        '1534145341430038558',

    /**
     * Fallback channel name.
     *
     * Used only if the configured channel ID
     * cannot be found.
     */
    channelName:
        '📈・soul-progression',

    /**
     * Individual progression event switches.
     */
    events: {
        /**
         * Achievement unlocks are published
         * inside Soul Progression.
         */
        achievements:
            true,

        /**
         * Chronicle Title unlocks are published
         * inside Soul Progression.
         */
        titles:
            true,

        /**
         * Rank assignments, promotions,
         * demotions and removals are published
         * inside Soul Progression.
         */
        ranks:
            true,

        /**
         * Disabled to prevent duplicate Level
         * notifications.
         *
         * The Level System already sends one
         * compact Level Up Embed directly into
         * Soul Progression.
         */
        levels:
            false
    },

    /**
     * Preserved for future use.
     *
     * These milestones will become active again
     * only if events.levels is changed to true.
     */
    levelMilestones: [
        5,
        10,
        25,
        50,
        75,
        100,
        125,
        150
    ],

    /**
     * Soul Progression visual colors.
     */
    colors: {
        achievement:
            '#D4AF37',

        title:
            '#8A2BE2',

        promotion:
            '#E8E8E8',

        revocation:
            '#5B0E2D',

        level:
            '#7CFC98'
    },

    /**
     * Shared Feed footer.
     */
    footer: {
        text:
            '🌙 Umbra • Soul Records of Las Noches'
    }
};