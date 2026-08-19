const {
    EmbedBuilder
} = require('discord.js');

const brand =
    require('../../config/brand');

const rankTrialConfig =
    require('../../config/rankTrials');

const {
    toDiscordTimestamp
} = require('./calendar');

/**
 * Build the shared Captain Trial footer.
 *
 * @returns {string}
 */
function buildFooter() {
    return rankTrialConfig
        .branding
        .footerText;
}

/**
 * Convert evaluation criteria into
 * a Discord bullet list.
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
 * Create a Captain Trial embed.
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
                brand.themeColor
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

    if (options.fields) {
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
            '⚔️ Monthly Captain Trials Registration',

        description:
            [
                'The gates to the Lunar Arena are now open.',
                '',
                'Registration for this month’s **Captain Trials** is now available.',
                '',
                'Any eligible Soul may step forward and challenge for a numbered Captain Rank.'
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
                    '☾ Captain Hierarchy',

                value:
                    [
                        '**Ø・CAPTAIN** — Highest position',
                        '**Ⅰ–Ⅹ・CAPTAIN** — Ranked positions',
                        '**◇・UNRANKED** — No Captain Rank'
                    ].join('\n'),

                inline:
                    false
            },
            {
                name:
                    '⚔️ Evaluation',

                value:
                    buildCriteriaList(),

                inline:
                    false
            },
            {
                name:
                    '✦ Final Decision',

                value:
                    [
                        'Winning battles alone does **not** guarantee promotion.',
                        '',
                        `${rankTrialConfig.branding.authorityName} makes the final decision.`
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
            '⏳ Captain Trials Registration Reminder',

        description:
            [
                'There is still time to enter the Trials.',
                '',
                'If you intend to challenge for a higher Captain Rank, prepare yourself before registration closes.'
            ].join('\n'),

        fields: [
            {
                name:
                    '⚔️ Battle Date',

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
            '✦ Final Captain Trials Reminder',

        description:
            [
                'Tomorrow, the Lunar Arena will decide who is worthy.',
                '',
                'Prepare your spirit.',
                'Sharpen your blade.',
                '',
                `${brand.serverName} is watching.`
            ].join('\n'),

        fields: [
            {
                name:
                    '⚔️ Battle Begins',

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
            '⚔️ Captain Trials Have Begun',

        description:
            [
                'The Monthly Captain Trials are officially underway.',
                '',
                'Fight with honor.',
                'Fight with discipline.',
                '',
                'May only the strongest rise beneath the eternal moon.'
            ].join('\n'),

        fields: [
            {
                name:
                    '⚔️ Final Evaluation',

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
            '✦ Captain Trials Concluded',

        description:
            [
                'The Monthly Captain Trials have ended.',
                '',
                'High Command will now review every participant and determine the final placements.',
                '',
                'Captain Rank announcements will be published separately.'
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