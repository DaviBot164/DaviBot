const {
    EmbedBuilder
} = require('discord.js');

const rankTrialConfig =
    require('../../config/rankTrials');

const {
    toDiscordTimestamp
} = require('./calendar');

/**
 * Build the common footer used by every
 * Rank Trial announcement.
 *
 * @returns {string}
 */
function buildFooter() {
    return rankTrialConfig
        .branding
        .footerText;
}

/**
 * Convert evaluation criteria into a
 * Discord bullet list.
 *
 * @returns {string}
 */
function buildCriteriaList() {
    return rankTrialConfig
        .evaluationCriteria
        .map(
            criterion =>
                `• ${criterion}`
        )
        .join('\n');
}

/**
 * Create the common Rank Trial embed.
 *
 * @param {Object} options
 * @returns {EmbedBuilder}
 */
function createRankTrialEmbed(
    options
) {
    const embed =
        new EmbedBuilder()
            .setColor(
                0x5B0E2D
            )
            .setTitle(
                options.title
            )
            .setDescription(
                options.description
            )
            .setTimestamp()
            .setFooter({
                text:
                    buildFooter()
            });

    if (
        options.fields
    ) {
        embed.addFields(
            options.fields
        );
    }

    return embed;
}

/**
 * Opening announcement.
 *
 * @param {Object} schedule
 * @returns {EmbedBuilder}
 */
function buildOpeningEmbed(
    schedule
) {
    return createRankTrialEmbed({
        title:
            '⚔️ Monthly Rank Trials Registration',

        description:
            [
                'The gates of Las Noches have opened.',
                '',
                'Registration for this month\'s Rank Trials is now available.',
                '',
                'Only those worthy of greater power should step forward.'
            ].join('\n'),

        fields: [
            {
                name:
                    '📅 Battle Begins',

                value:
                    toDiscordTimestamp(
                        schedule.battleStart,
                        'F'
                    ),

                inline:
                    false
            },
            {
                name:
                    '⚖ Promotion Evaluation',

                value:
                    buildCriteriaList(),

                inline:
                    false
            },
            {
                name:
                    '🌙 Important',

                value:
                    [
                        'Winning battles alone does **not** guarantee promotion.',
                        '',
                        'Las Noches Leadership makes the final decision.'
                    ].join('\n'),

                inline:
                    false
            }
        ]
    });
}

/**
 * Registration reminder.
 *
 * @param {Object} schedule
 * @returns {EmbedBuilder}
 */
function buildRegistrationReminderEmbed(
    schedule
) {
    return createRankTrialEmbed({
        title:
            '⏳ Rank Trial Registration Reminder',

        description:
            [
                'There is still time to prepare.',
                '',
                'If you wish to challenge for a higher Arrancar Rank, make sure you are ready.'
            ].join('\n'),

        fields: [
            {
                name:
                    '⚔ Battle Date',

                value:
                    toDiscordTimestamp(
                        schedule.battleStart,
                        'F'
                    ),

                inline:
                    false
            }
        ]
    });
}

/**
 * Final reminder.
 *
 * @param {Object} schedule
 * @returns {EmbedBuilder}
 */
function buildFinalReminderEmbed(
    schedule
) {
    return createRankTrialEmbed({
        title:
            '🌙 Final Reminder',

        description:
            [
                'Tomorrow, the arena will decide who is worthy.',
                '',
                'Prepare your spirit.',
                'Sharpen your blade.',
                '',
                'Las Noches is watching.'
            ].join('\n'),

        fields: [
            {
                name:
                    '⚔ Battle Begins',

                value:
                    toDiscordTimestamp(
                        schedule.battleStart,
                        'F'
                    ),

                inline:
                    false
            }
        ]
    });
}

/**
 * Battle start announcement.
 *
 * @param {Object} schedule
 * @returns {EmbedBuilder}
 */
function buildBattleStartEmbed(
    schedule
) {
    return createRankTrialEmbed({
        title:
            '🏆 Rank Trials Have Begun',

        description:
            [
                'The Monthly Rank Trials are now officially underway.',
                '',
                'Fight with honor.',
                'Fight with discipline.',
                '',
                'May only the strongest Souls rise.'
            ].join('\n'),

        fields: [
            {
                name:
                    '⚖ Final Evaluation',

                value:
                    buildCriteriaList(),

                inline:
                    false
            }
        ]
    });
}

/**
 * Closing notice.
 *
 * @returns {EmbedBuilder}
 */
function buildClosingEmbed() {
    return createRankTrialEmbed({
        title:
            '🌙 Rank Trials Concluded',

        description:
            [
                'The Monthly Rank Trials have ended.',
                '',
                'Leadership will now review every participant.',
                '',
                'Promotion announcements will be published separately.'
            ].join('\n')
    });
}

module.exports = {
    buildOpeningEmbed,
    buildRegistrationReminderEmbed,
    buildFinalReminderEmbed,
    buildBattleStartEmbed,
    buildClosingEmbed
};