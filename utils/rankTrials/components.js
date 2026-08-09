const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

/**
 * Official Rank Trials 2.0 interaction IDs.
 *
 * Keep these values stable because
 * interaction routing depends on them.
 */
const RANK_TRIAL_COMPONENT_IDS =
    Object.freeze({
        register:
            'umbra:ranktrial:register',

        withdraw:
            'umbra:ranktrial:withdraw',

        closed:
            'umbra:ranktrial:closed',

        testRegister:
            'umbra:ranktrial:test:register',

        testWithdraw:
            'umbra:ranktrial:test:withdraw'
    });

/**
 * Build the active Rank Trials
 * registration controls.
 *
 * Used while registration is open.
 *
 * @returns {ActionRowBuilder}
 */
function buildOpenRegistrationComponents() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    RANK_TRIAL_COMPONENT_IDS
                        .register
                )
                .setLabel(
                    'Register for Trial'
                )
                .setEmoji('⚔️')
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    RANK_TRIAL_COMPONENT_IDS
                        .withdraw
                )
                .setLabel(
                    'Withdraw'
                )
                .setEmoji('🚪')
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

/**
 * Build the disabled registration control
 * displayed once registration has closed.
 *
 * @returns {ActionRowBuilder}
 */
function buildClosedRegistrationComponents() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    RANK_TRIAL_COMPONENT_IDS
                        .closed
                )
                .setLabel(
                    'Registration Closed'
                )
                .setEmoji('🔒')
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    true
                )
        );
}

/**
 * Build the Administrator-only Rank Trials
 * 2.0 runtime test controls.
 *
 * These buttons deliberately use separate
 * Custom IDs so production registration
 * schedule rules remain untouched.
 *
 * @returns {ActionRowBuilder}
 */
function buildTestRegistrationComponents() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    RANK_TRIAL_COMPONENT_IDS
                        .testRegister
                )
                .setLabel(
                    'Test Register'
                )
                .setEmoji('🧪')
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    RANK_TRIAL_COMPONENT_IDS
                        .testWithdraw
                )
                .setLabel(
                    'Test Withdraw'
                )
                .setEmoji('🚪')
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

/**
 * Build the correct component row for one
 * Rank Trial publication.
 *
 * Opening and Registration Reminder:
 * registration controls remain active.
 *
 * Final Reminder:
 * registration is considered closed.
 *
 * Battle Start / Closing:
 * no registration controls are displayed.
 *
 * @param {string} publicationKey
 * @returns {ActionRowBuilder[]}
 */
function buildRankTrialPublicationComponents(
    publicationKey
) {
    switch (
        publicationKey
    ) {
        case 'opening':

        case 'registrationReminder':
            return [
                buildOpenRegistrationComponents()
            ];

        case 'finalReminder':
            return [
                buildClosedRegistrationComponents()
            ];

        case 'battleStart':

        case 'closing':

        default:
            return [];
    }
}

module.exports = {
    RANK_TRIAL_COMPONENT_IDS,

    buildOpenRegistrationComponents,
    buildClosedRegistrationComponents,
    buildTestRegistrationComponents,
    buildRankTrialPublicationComponents
};