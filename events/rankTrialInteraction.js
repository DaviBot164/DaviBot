const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

const {
    RANK_TRIAL_COMPONENT_IDS
} = require('../utils/rankTrials/components');

const {
    registerForCurrentRankTrial,
    withdrawFromCurrentRankTrial
} = require('../utils/rankTrials/registration');

const {
    getRelevantRankTrialSchedule
} = require('../utils/rankTrials/calendar');

const {
    ranks:
        rankDatabase,

    rankTrialParticipants:
        participantDatabase
} = require('../database');

/**
 * Prevent duplicate Rank Trial interaction
 * execution inside the same Umbra process.
 */
const processingInteractions =
    new Set();

/**
 * Load one Soul's current Arrancar Rank.
 *
 * Rank Trials stores the previous rank
 * at registration time for future review
 * and promotion auditing.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
async function getCurrentArrancarRank(
    guildId,
    userId
) {
    const rankRecord =
        await rankDatabase
            .getCurrentRank(
                guildId,
                userId
            )
            .catch(
                () => null
            );

    return (
        rankRecord?.rank_name ??
        null
    );
}

/**
 * Check whether the member using a
 * Rank Trials test control is allowed
 * to bypass the production registration
 * schedule.
 *
 * Test controls are Administrator-only.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {boolean}
 */
function canUseRegistrationTest(
    interaction
) {
    return (
        interaction.memberPermissions
            ?.has(
                PermissionFlagsBits.Administrator
            ) ===
        true
    );
}

/**
 * Handle normal production Rank Trial
 * registration.
 *
 * Production registration always obeys
 * the configured Opening and Final
 * Reminder schedule.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleRegister(
    interaction
) {
    const previousRank =
        await getCurrentArrancarRank(
            interaction.guildId,
            interaction.user.id
        );

    const result =
        await registerForCurrentRankTrial({
            guildId:
                interaction.guildId,

            userId:
                interaction.user.id,

            previousRank
        });

    if (
        result.status ===
        'upcoming'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚔️ Registration Not Open',
                    'Rank Trial registration has not opened yet.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        result.status ===
        'closed'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '🔒 Registration Closed',
                    'Registration for this Rank Trial has already closed.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        result.status ===
        'existing'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Already Registered',
                    [
                        'You are already registered for this Rank Trial.',
                        '',
                        `🗓️ Trial Cycle: \`${result.schedule.trialKey}\``
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const restored =
        result.status ===
        'restored';

    await interaction.reply({
        embeds: [
            createSuccessEmbed(
                restored
                    ? '⚔️ Registration Restored'
                    : '⚔️ Rank Trial Registered',
                [
                    restored
                        ? 'Your Rank Trial registration has been restored.'
                        : 'You have successfully registered for the upcoming Rank Trial.',
                    '',
                    `🗓️ Trial Cycle: \`${result.schedule.trialKey}\``,
                    `📖 Current Rank: \`${previousRank ?? 'Unranked'}\``,
                    '',
                    '💾 Your registration was saved permanently in PostgreSQL.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Handle Administrator-only test
 * registration.
 *
 * This intentionally bypasses the normal
 * registration window so Rank Trials 2.0
 * may be tested before Opening Day.
 *
 * The record is still written to the real
 * PostgreSQL participant registry.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleTestRegister(
    interaction
) {
    if (
        !canUseRegistrationTest(
            interaction
        )
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Test Access Denied',
                    'Only an Administrator may use Rank Trials registration test controls.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const schedule =
        getRelevantRankTrialSchedule();

    const previousRank =
        await getCurrentArrancarRank(
            interaction.guildId,
            interaction.user.id
        );

    const result =
        await participantDatabase
            .registerParticipant({
                guildId:
                    interaction.guildId,

                trialKey:
                    schedule.trialKey,

                userId:
                    interaction.user.id,

                previousRank
            });

    if (
        result.status ===
        'existing'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '🧪 Test Registration Exists',
                    [
                        'Your participant record already exists for this Rank Trial.',
                        '',
                        `🗓️ Trial Cycle: \`${schedule.trialKey}\``,
                        `📋 Status: \`${result.participant?.status ?? 'UNKNOWN'}\``
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            createSuccessEmbed(
                result.status ===
                    'restored'
                    ? '🧪 Test Registration Restored'
                    : '🧪 Test Registration Created',
                [
                    'Rank Trials 2.0 bypass test completed successfully.',
                    '',
                    `🗓️ Trial Cycle: \`${schedule.trialKey}\``,
                    `📖 Current Rank: \`${previousRank ?? 'Unranked'}\``,
                    `📋 Database Status: \`${result.participant?.status ?? 'REGISTERED'}\``,
                    '',
                    '💾 This is a real PostgreSQL participant record.',
                    'Use **Test Withdraw** next to continue the runtime test.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}/**
 * Handle normal production Rank Trial
 * withdrawal.
 *
 * Production withdrawal always obeys
 * the configured registration window.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleWithdraw(
    interaction
) {
    const result =
        await withdrawFromCurrentRankTrial({
            guildId:
                interaction.guildId,

            userId:
                interaction.user.id
        });

    if (
        result.status ===
        'upcoming'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚔️ Registration Not Open',
                    'Rank Trial registration has not opened yet.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        result.status ===
        'closed'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '🔒 Registration Closed',
                    'Registration for this Rank Trial has already closed, so withdrawal is no longer available.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        result.status ===
        'not_registered'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Not Registered',
                    [
                        'You are not currently registered for this Rank Trial.',
                        '',
                        `🗓️ Trial Cycle: \`${result.schedule.trialKey}\``
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            createSuccessEmbed(
                '🚪 Rank Trial Withdrawn',
                [
                    'You have withdrawn from the upcoming Rank Trial.',
                    '',
                    `🗓️ Trial Cycle: \`${result.schedule.trialKey}\``,
                    '',
                    'You may register again while registration remains open.',
                    '',
                    '💾 Your withdrawal was saved permanently in PostgreSQL.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Handle Administrator-only test
 * withdrawal.
 *
 * This bypasses the normal registration
 * window only for runtime testing.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleTestWithdraw(
    interaction
) {
    if (
        !canUseRegistrationTest(
            interaction
        )
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Test Access Denied',
                    'Only an Administrator may use Rank Trials registration test controls.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const schedule =
        getRelevantRankTrialSchedule();

    const participant =
        await participantDatabase
            .withdrawParticipant(
                interaction.guildId,
                schedule.trialKey,
                interaction.user.id
            );

    if (!participant) {
        const existingParticipant =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    schedule.trialKey,
                    interaction.user.id
                );

        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '🧪 Test Withdrawal Unavailable',
                    [
                        existingParticipant
                            ? 'Your participant record cannot currently be withdrawn.'
                            : 'No participant record exists for this Rank Trial.',
                        '',
                        `🗓️ Trial Cycle: \`${schedule.trialKey}\``,
                        `📋 Current Status: \`${existingParticipant?.status ?? 'NONE'}\``
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            createSuccessEmbed(
                '🧪 Test Withdrawal Completed',
                [
                    'Rank Trials 2.0 withdrawal test completed successfully.',
                    '',
                    `🗓️ Trial Cycle: \`${schedule.trialKey}\``,
                    `📋 Database Status: \`${participant.status}\``,
                    '',
                    '💾 The PostgreSQL participant record was updated successfully.',
                    'Use **Test Register** again to verify registration restoration.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Route one Rank Trials 2.0 button
 * interaction to the correct handler.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleRankTrialButton(
    interaction
) {
    if (
        interaction.customId ===
        RANK_TRIAL_COMPONENT_IDS.register
    ) {
        await handleRegister(
            interaction
        );

        return;
    }

    if (
        interaction.customId ===
        RANK_TRIAL_COMPONENT_IDS.withdraw
    ) {
        await handleWithdraw(
            interaction
        );

        return;
    }

    if (
        interaction.customId ===
        RANK_TRIAL_COMPONENT_IDS.testRegister
    ) {
        await handleTestRegister(
            interaction
        );

        return;
    }

    if (
        interaction.customId ===
        RANK_TRIAL_COMPONENT_IDS.testWithdraw
    ) {
        await handleTestWithdraw(
            interaction
        );

        return;
    }

    if (
        interaction.customId ===
        RANK_TRIAL_COMPONENT_IDS.closed
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '🔒 Registration Closed',
                    'Rank Trial registration is already closed.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            createErrorEmbed(
                '❌ Unknown Rank Trial Action',
                'Umbra could not identify this Rank Trial action.'
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Rank Trials 2.0 button
     * interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const isRankTrialButton =
            interaction.isButton() &&
            interaction.customId.startsWith(
                'umbra:ranktrial:'
            );

        if (!isRankTrialButton) {
            return;
        }

        if (!interaction.inGuild()) {
            return;
        }

        if (
            processingInteractions.has(
                interaction.id
            )
        ) {
            console.warn(
                `⚠️ Duplicate Rank Trial interaction ignored: ${interaction.id}`
            );

            return;
        }

        processingInteractions.add(
            interaction.id
        );

        try {
            await handleRankTrialButton(
                interaction
            );
        } catch (error) {
            console.error(
                '❌ Umbra Rank Trial interaction error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Rank Trial Action Failed',
                    [
                        'Umbra could not complete this Rank Trial action.',
                        '',
                        'Please try again in a moment.'
                    ].join('\n')
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed],

                        components:
                            []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds:
                            [errorEmbed],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds:
                        [errorEmbed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        } finally {
            setTimeout(
                () => {
                    processingInteractions.delete(
                        interaction.id
                    );
                },
                15_000
            );
        }
    }
};