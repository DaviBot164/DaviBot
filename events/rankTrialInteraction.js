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
 * Official Staff Review component prefix.
 *
 * Expected format:
 *
 * umbra:ranktrial:review:approve:2026-08:USER_ID
 * umbra:ranktrial:review:reject:2026-08:USER_ID
 * umbra:ranktrial:review:reopen:2026-08:USER_ID
 */
const REVIEW_COMPONENT_PREFIX =
    'umbra:ranktrial:review';

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
 * Check whether an Administrator may use
 * Rank Trials protected controls.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {boolean}
 */
function hasAdministratorPermission(
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
 * Check whether the member using a
 * Rank Trials test control is allowed
 * to bypass the production registration
 * schedule.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {boolean}
 */
function canUseRegistrationTest(
    interaction
) {
    return hasAdministratorPermission(
        interaction
    );
}

/**
 * Parse one Staff Review Custom ID.
 *
 * Expected:
 *
 * umbra:ranktrial:review:
 * approve:2026-08:USER_ID
 *
 * @param {string} customId
 * @returns {{
 *     action: 'approve'|'reject'|'reopen',
 *     trialKey: string,
 *     userId: string
 * }|null}
 */
function parseReviewCustomId(
    customId
) {
    if (
        typeof customId !==
        'string'
    ) {
        return null;
    }

    const parts =
        customId.split(':');

    if (
        parts.length !==
        6
    ) {
        return null;
    }

    const [
        namespace,
        system,
        area,
        action,
        trialKey,
        userId
    ] =
        parts;

    if (
        namespace !==
            'umbra' ||
        system !==
            'ranktrial' ||
        area !==
            'review'
    ) {
        return null;
    }

    if (
        action !==
            'approve' &&
        action !==
            'reject' &&
        action !==
            'reopen'
    ) {
        return null;
    }

    if (
        !/^[0-9]{4}-(0[1-9]|1[0-2])$/
            .test(
                trialKey
            )
    ) {
        return null;
    }

    if (
        !/^[0-9]{16,22}$/
            .test(
                userId
            )
    ) {
        return null;
    }

    return {
        action,
        trialKey,
        userId
    };
}

/**
 * Verify that one Staff Review action
 * belongs to the currently relevant
 * Rank Trial cycle.
 *
 * This prevents stale Review panels from
 * changing another monthly cycle later.
 *
 * @param {string} trialKey
 * @returns {boolean}
 */
function isCurrentReviewCycle(
    trialKey
) {
    const schedule =
        getRelevantRankTrialSchedule();

    return (
        schedule.trialKey ===
        trialKey
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
}/**
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
}

/**
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
}/**
 * Handle one Staff Review approval.
 *
 * This only updates the Rank Trials
 * participant review state.
 *
 * It does NOT directly change the real
 * Arrancar Rank yet.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {{
 *     trialKey: string,
 *     userId: string
 * }} reviewData
 * @returns {Promise<void>}
 */
async function handleReviewApprove(
    interaction,
    reviewData
) {
    if (
        !hasAdministratorPermission(
            interaction
        )
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Review Access Denied',
                    'Only an Administrator may approve Rank Trial participants.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        !isCurrentReviewCycle(
            reviewData.trialKey
        )
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Stale Review Panel',
                    [
                        'This Staff Review panel belongs to an older or different Rank Trial cycle.',
                        '',
                        `**Panel Cycle:** \`${reviewData.trialKey}\``,
                        '',
                        'Open a fresh `/ranktrials review` panel before continuing.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const participant =
        await participantDatabase
            .approveParticipant({
                guildId:
                    interaction.guildId,

                trialKey:
                    reviewData.trialKey,

                userId:
                    reviewData.userId,

                reviewedBy:
                    interaction.user.id,

                reviewReason:
                    'Approved through Umbra Staff Review Panel.'
            });

    if (!participant) {
        const currentParticipant =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    reviewData.trialKey,
                    reviewData.userId
                );

        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Approval Unavailable',
                    [
                        'Umbra could not approve this participant from the current state.',
                        '',
                        `**Trial Cycle:** \`${reviewData.trialKey}\``,
                        `**Soul:** <@${reviewData.userId}>`,
                        `**Current Status:** \`${currentParticipant?.status ?? 'NOT_FOUND'}\``
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
                '✅ Rank Trial Participant Approved',
                [
                    `<@${reviewData.userId}> has passed Staff Review.`,
                    '',
                    `**Trial Cycle:** \`${reviewData.trialKey}\``,
                    `**Status:** \`${participant.status}\``,
                    `**Previous Rank:** \`${participant.previousRank ?? 'Unranked'}\``,
                    `**New Rank:** \`${participant.newRank ?? 'Not selected yet'}\``,
                    `**Reviewed By:** <@${interaction.user.id}>`,
                    '',
                    'The participant is now ready for the promotion decision stage.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Handle one Staff Review rejection.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {{
 *     trialKey: string,
 *     userId: string
 * }} reviewData
 * @returns {Promise<void>}
 */
async function handleReviewReject(
    interaction,
    reviewData
) {
    if (
        !hasAdministratorPermission(
            interaction
        )
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Review Access Denied',
                    'Only an Administrator may reject Rank Trial participants.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        !isCurrentReviewCycle(
            reviewData.trialKey
        )
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Stale Review Panel',
                    [
                        'This Staff Review panel belongs to an older or different Rank Trial cycle.',
                        '',
                        `**Panel Cycle:** \`${reviewData.trialKey}\``,
                        '',
                        'Open a fresh `/ranktrials review` panel before continuing.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const participant =
        await participantDatabase
            .rejectParticipant({
                guildId:
                    interaction.guildId,

                trialKey:
                    reviewData.trialKey,

                userId:
                    reviewData.userId,

                reviewedBy:
                    interaction.user.id,

                reviewReason:
                    'Rejected through Umbra Staff Review Panel.'
            });

    if (!participant) {
        const currentParticipant =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    reviewData.trialKey,
                    reviewData.userId
                );

        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Rejection Unavailable',
                    [
                        'Umbra could not reject this participant from the current state.',
                        '',
                        `**Trial Cycle:** \`${reviewData.trialKey}\``,
                        `**Soul:** <@${reviewData.userId}>`,
                        `**Current Status:** \`${currentParticipant?.status ?? 'NOT_FOUND'}\``
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
                '❌ Rank Trial Participant Rejected',
                [
                    `<@${reviewData.userId}> did not pass Staff Review.`,
                    '',
                    `**Trial Cycle:** \`${reviewData.trialKey}\``,
                    `**Status:** \`${participant.status}\``,
                    `**Reviewed By:** <@${interaction.user.id}>`,
                    '',
                    'The decision was saved permanently in PostgreSQL.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Reopen one completed Staff Review.
 *
 * APPROVED / REJECTED
 *          ↓
 * UNDER_REVIEW
 *
 * A participant that has already completed
 * a real promotion cannot be reopened by the
 * database layer.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {{
 *     trialKey: string,
 *     userId: string
 * }} reviewData
 * @returns {Promise<void>}
 */
async function handleReviewReopen(
    interaction,
    reviewData
) {
    if (
        !hasAdministratorPermission(
            interaction
        )
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Review Access Denied',
                    'Only an Administrator may reopen a Rank Trial review.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        !isCurrentReviewCycle(
            reviewData.trialKey
        )
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Stale Review Panel',
                    [
                        'This Staff Review panel belongs to an older or different Rank Trial cycle.',
                        '',
                        `**Panel Cycle:** \`${reviewData.trialKey}\``
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const participant =
        await participantDatabase
            .reopenParticipantReview(
                interaction.guildId,
                reviewData.trialKey,
                reviewData.userId
            );

    if (!participant) {
        const currentParticipant =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    reviewData.trialKey,
                    reviewData.userId
                );

        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Review Cannot Be Reopened',
                    [
                        'Umbra could not reopen this Staff Review.',
                        '',
                        `**Trial Cycle:** \`${reviewData.trialKey}\``,
                        `**Soul:** <@${reviewData.userId}>`,
                        `**Current Status:** \`${currentParticipant?.status ?? 'NOT_FOUND'}\``,
                        `**Already Promoted:** \`${currentParticipant?.promotedAt ? 'YES' : 'NO'}\``
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
                '🔄 Staff Review Reopened',
                [
                    `<@${reviewData.userId}> has been returned to Staff Review.`,
                    '',
                    `**Trial Cycle:** \`${reviewData.trialKey}\``,
                    `**Status:** \`${participant.status}\``,
                    '',
                    'Open `/ranktrials review` again to make a new decision.'
                ].join('\n')
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}/**
 * Route one Staff Review button.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {{
 *     action: 'approve'|'reject'|'reopen',
 *     trialKey: string,
 *     userId: string
 * }} reviewData
 * @returns {Promise<void>}
 */
async function handleStaffReviewButton(
    interaction,
    reviewData
) {
    switch (
        reviewData.action
    ) {
        case 'approve':
            await handleReviewApprove(
                interaction,
                reviewData
            );

            return;

        case 'reject':
            await handleReviewReject(
                interaction,
                reviewData
            );

            return;

        case 'reopen':
            await handleReviewReopen(
                interaction,
                reviewData
            );

            return;

        default:
            await interaction.reply({
                embeds: [
                    createErrorEmbed(
                        '❌ Unknown Review Action',
                        'Umbra could not identify this Staff Review action.'
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });
    }
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
        interaction.customId.startsWith(
            `${REVIEW_COMPONENT_PREFIX}:`
        )
    ) {
        const reviewData =
            parseReviewCustomId(
                interaction.customId
            );

        if (!reviewData) {
            await interaction.reply({
                embeds: [
                    createErrorEmbed(
                        '❌ Invalid Review Control',
                        'Umbra could not validate this Staff Review control.'
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        await handleStaffReviewButton(
            interaction,
            reviewData
        );

        return;
    }

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
     * Registration, test registration
     * and Staff Review controls are all
     * routed through this event.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        const isRankTrialButton =
            interaction.isButton() &&
            interaction.customId.startsWith(
                'umbra:ranktrial:'
            );

        if (
            !isRankTrialButton
        ) {
            return;
        }

        if (
            !interaction.inGuild()
        ) {
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
                '======================================'
            );

            console.error(
                '❌ Umbra Rank Trial interaction error:'
            );

            console.error(
                error
            );

            console.error(
                '======================================'
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

            if (
                interaction.deferred
            ) {
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

            if (
                interaction.replied
            ) {
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
            /*
             * Keep the interaction ID locked
             * briefly so accidental duplicate
             * delivery cannot execute the same
             * database action twice.
             */
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