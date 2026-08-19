const {
    Events,
    MessageFlags,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
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
    ranks: rankDatabase,
    rankTrialParticipants: participantDatabase
} = require('../database');

const REVIEW_COMPONENT_PREFIX =
    'umbra:ranktrial:review';

const REVIEW_MODAL_PREFIX =
    'umbra:ranktrial:reviewmodal';

const processingInteractions =
    new Set();

const TRIAL_KEY_PATTERN =
    /^[0-9]{4}-(0[1-9]|1[0-2])$/;

const USER_ID_PATTERN =
    /^[0-9]{16,22}$/;

async function getCurrentSinRank(
    guildId,
    userId
) {
    return (
        await rankDatabase
            .getCurrentRank(
                guildId,
                userId
            )
            .catch(() => null)
    )?.rank_name ?? null;
}

function isAdministrator(interaction) {
    return (
        interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        ) === true
    );
}

function parseReviewId(
    customId,
    area,
    allowedActions
) {
    if (typeof customId !== 'string') {
        return null;
    }

    const parts =
        customId.split(':');

    if (parts.length !== 6) {
        return null;
    }

    const [
        namespace,
        system,
        parsedArea,
        action,
        trialKey,
        userId
    ] = parts;

    if (
        namespace !== 'umbra' ||
        system !== 'ranktrial' ||
        parsedArea !== area ||
        !allowedActions.includes(action) ||
        !TRIAL_KEY_PATTERN.test(trialKey) ||
        !USER_ID_PATTERN.test(userId)
    ) {
        return null;
    }

    return {
        action,
        trialKey,
        userId
    };
}

function parseReviewCustomId(customId) {
    return parseReviewId(
        customId,
        'review',
        [
            'approve',
            'reject',
            'reopen'
        ]
    );
}

function parseReviewModalCustomId(customId) {
    return parseReviewId(
        customId,
        'reviewmodal',
        [
            'approve',
            'reject'
        ]
    );
}

function isCurrentReviewCycle(trialKey) {
    return (
        getRelevantRankTrialSchedule()
            .trialKey === trialKey
    );
}

function buildReviewReasonModal(
    action,
    trialKey,
    userId
) {
    const approving =
        action === 'approve';

    const input =
        new TextInputBuilder()
            .setCustomId('reviewReason')
            .setLabel('Review Reason')
            .setPlaceholder(
                approving
                    ? 'Why was this member approved?'
                    : 'Why was this member rejected?'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(500);

    return new ModalBuilder()
        .setCustomId(
            [
                REVIEW_MODAL_PREFIX,
                action,
                trialKey,
                userId
            ].join(':')
        )
        .setTitle(
            approving
                ? 'Approve Captain Trial'
                : 'Reject Captain Trial'
        )
        .addComponents(
            new ActionRowBuilder()
                .addComponents(input)
        );
}

async function replyEmbed(
    interaction,
    embed
) {
    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

async function replyWarning(
    interaction,
    title,
    description
) {
    return replyEmbed(
        interaction,
        createWarningEmbed(
            title,
            description
        )
    );
}

async function replyError(
    interaction,
    title,
    description
) {
    return replyEmbed(
        interaction,
        createErrorEmbed(
            title,
            description
        )
    );
}

async function replySuccess(
    interaction,
    title,
    description
) {
    return replyEmbed(
        interaction,
        createSuccessEmbed(
            title,
            description
        )
    );
}async function handleRegister(interaction) {
    const previousRank =
        await getCurrentSinRank(
            interaction.guildId,
            interaction.user.id
        );

    const result =
        await registerForCurrentRankTrial({
            guildId: interaction.guildId,
            userId: interaction.user.id,
            previousRank
        });

    if (result.status === 'upcoming') {
        return replyWarning(
            interaction,
            '⚔️ Registration Not Open',
            'Captain Trial registration has not opened yet.'
        );
    }

    if (result.status === 'closed') {
        return replyWarning(
            interaction,
            '🔒 Registration Closed',
            'Registration for this Captain Trial has already closed.'
        );
    }

    if (result.status === 'existing') {
        return replyWarning(
            interaction,
            '⚠️ Already Registered',
            [
                'You are already registered for this Captain Trial.',
                `🗓️ Cycle: \`${result.schedule.trialKey}\``
            ].join('\n')
        );
    }

    const restored =
        result.status === 'restored';

    return replySuccess(
        interaction,
        restored
            ? '⚔️ Registration Restored'
            : '⚔️ Captain Trial Registered',
        [
            restored
                ? 'Your registration has been restored.'
                : 'You are registered for the upcoming Captain Trial.',
            `🗓️ Cycle: \`${result.schedule.trialKey}\``,
            `📖 Rank: \`${previousRank ?? 'Unranked'}\``
        ].join('\n')
    );
}

async function handleTestRegister(interaction) {
    if (!isAdministrator(interaction)) {
        return replyError(
            interaction,
            '❌ Test Access Denied',
            'Only an Administrator may use Captain Trial test controls.'
        );
    }

    const schedule =
        getRelevantRankTrialSchedule();

    const previousRank =
        await getCurrentSinRank(
            interaction.guildId,
            interaction.user.id
        );

    const result =
        await participantDatabase
            .registerParticipant({
                guildId: interaction.guildId,
                trialKey: schedule.trialKey,
                userId: interaction.user.id,
                previousRank
            });

    if (result.status === 'existing') {
        return replyWarning(
            interaction,
            '🧪 Test Registration Exists',
            [
                'A participant record already exists.',
                `🗓️ Cycle: \`${schedule.trialKey}\``,
                `📋 Status: \`${result.participant?.status ?? 'UNKNOWN'}\``
            ].join('\n')
        );
    }

    return replySuccess(
        interaction,
        result.status === 'restored'
            ? '🧪 Test Registration Restored'
            : '🧪 Test Registration Created',
        [
            `🗓️ Cycle: \`${schedule.trialKey}\``,
            `📖 Rank: \`${previousRank ?? 'Unranked'}\``,
            `📋 Status: \`${result.participant?.status ?? 'REGISTERED'}\``
        ].join('\n')
    );
}

async function handleWithdraw(interaction) {
    const result =
        await withdrawFromCurrentRankTrial({
            guildId: interaction.guildId,
            userId: interaction.user.id
        });

    if (result.status === 'upcoming') {
        return replyWarning(
            interaction,
            '⚔️ Registration Not Open',
            'Captain Trial registration has not opened yet.'
        );
    }

    if (result.status === 'closed') {
        return replyWarning(
            interaction,
            '🔒 Registration Closed',
            'Withdrawal is no longer available.'
        );
    }

    if (result.status === 'not_registered') {
        return replyWarning(
            interaction,
            '⚠️ Not Registered',
            [
                'You are not registered for this Captain Trial.',
                `🗓️ Cycle: \`${result.schedule.trialKey}\``
            ].join('\n')
        );
    }

    return replySuccess(
        interaction,
        '🚪 Captain Trial Withdrawn',
        [
            'You have withdrawn from the upcoming Captain Trial.',
            `🗓️ Cycle: \`${result.schedule.trialKey}\``
        ].join('\n')
    );
}

async function handleTestWithdraw(interaction) {
    if (!isAdministrator(interaction)) {
        return replyError(
            interaction,
            '❌ Test Access Denied',
            'Only an Administrator may use Captain Trial test controls.'
        );
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
        const current =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    schedule.trialKey,
                    interaction.user.id
                );

        return replyWarning(
            interaction,
            '🧪 Test Withdrawal Unavailable',
            [
                current
                    ? 'This participant record cannot currently be withdrawn.'
                    : 'No participant record exists.',
                `🗓️ Cycle: \`${schedule.trialKey}\``,
                `📋 Status: \`${current?.status ?? 'NONE'}\``
            ].join('\n')
        );
    }

    return replySuccess(
        interaction,
        '🧪 Test Withdrawal Completed',
        [
            `🗓️ Cycle: \`${schedule.trialKey}\``,
            `📋 Status: \`${participant.status}\``
        ].join('\n')
    );
}async function validateReviewTarget(
    interaction,
    reviewData,
    action
) {
    if (!isAdministrator(interaction)) {
        await replyError(
            interaction,
            '❌ Review Access Denied',
            `Only an Administrator may ${action} Captain Trial participants.`
        );

        return null;
    }

    if (
        !isCurrentReviewCycle(
            reviewData.trialKey
        )
    ) {
        await replyWarning(
            interaction,
            '⚠️ Stale Review Panel',
            [
                'This review panel belongs to a different Captain Trial cycle.',
                `🗓️ Cycle: \`${reviewData.trialKey}\``,
                'Open a fresh `/ranktrials review` panel.'
            ].join('\n')
        );

        return null;
    }

    const participant =
        await participantDatabase
            .getParticipant(
                interaction.guildId,
                reviewData.trialKey,
                reviewData.userId
            );

    if (
        !participant ||
        ![
            'REGISTERED',
            'UNDER_REVIEW'
        ].includes(participant.status)
    ) {
        await replyWarning(
            interaction,
            action === 'approve'
                ? '⚠️ Approval Unavailable'
                : '⚠️ Rejection Unavailable',
            [
                `This participant cannot currently be ${action}d.`,
                `👤 Member: <@${reviewData.userId}>`,
                `📋 Status: \`${participant?.status ?? 'NOT_FOUND'}\``
            ].join('\n')
        );

        return null;
    }

    return participant;
}

async function handleReviewDecisionButton(
    interaction,
    reviewData,
    action
) {
    const participant =
        await validateReviewTarget(
            interaction,
            reviewData,
            action
        );

    if (!participant) {
        return;
    }

    await interaction.showModal(
        buildReviewReasonModal(
            action,
            reviewData.trialKey,
            reviewData.userId
        )
    );
}

async function handleReviewApproveButton(
    interaction,
    reviewData
) {
    return handleReviewDecisionButton(
        interaction,
        reviewData,
        'approve'
    );
}

async function handleReviewRejectButton(
    interaction,
    reviewData
) {
    return handleReviewDecisionButton(
        interaction,
        reviewData,
        'reject'
    );
}

async function handleReviewReopen(
    interaction,
    reviewData
) {
    if (!isAdministrator(interaction)) {
        return replyError(
            interaction,
            '❌ Review Access Denied',
            'Only an Administrator may reopen a Captain Trial review.'
        );
    }

    if (
        !isCurrentReviewCycle(
            reviewData.trialKey
        )
    ) {
        return replyWarning(
            interaction,
            '⚠️ Stale Review Panel',
            [
                'This review panel belongs to a different Captain Trial cycle.',
                `🗓️ Cycle: \`${reviewData.trialKey}\``
            ].join('\n')
        );
    }

    const participant =
        await participantDatabase
            .reopenParticipantReview(
                interaction.guildId,
                reviewData.trialKey,
                reviewData.userId
            );

    if (!participant) {
        const current =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    reviewData.trialKey,
                    reviewData.userId
                );

        return replyWarning(
            interaction,
            '⚠️ Review Cannot Be Reopened',
            [
                'Evelynn could not reopen this Staff Review.',
                `👤 Member: <@${reviewData.userId}>`,
                `📋 Status: \`${current?.status ?? 'NOT_FOUND'}\``,
                `⬆️ Promoted: \`${current?.promotedAt ? 'YES' : 'NO'}\``
            ].join('\n')
        );
    }

    return replySuccess(
        interaction,
        '🔄 Staff Review Reopened',
        [
            `<@${reviewData.userId}> returned to Staff Review.`,
            `🗓️ Cycle: \`${reviewData.trialKey}\``,
            `📋 Status: \`${participant.status}\``
        ].join('\n')
    );
}async function applyReviewDecision(
    interaction,
    reviewData,
    reviewReason
) {
    const approving =
        reviewData.action === 'approve';

    const method =
        approving
            ? 'approveParticipant'
            : 'rejectParticipant';

    const participant =
        await participantDatabase[method]({
            guildId: interaction.guildId,
            trialKey: reviewData.trialKey,
            userId: reviewData.userId,
            reviewedBy: interaction.user.id,
            reviewReason
        });

    if (!participant) {
        const current =
            await participantDatabase
                .getParticipant(
                    interaction.guildId,
                    reviewData.trialKey,
                    reviewData.userId
                );

        return replyWarning(
            interaction,
            approving
                ? '⚠️ Approval Unavailable'
                : '⚠️ Rejection Unavailable',
            [
                `Evelynn could not ${reviewData.action} this participant from the current state.`,
                `👤 Member: <@${reviewData.userId}>`,
                `📋 Status: \`${current?.status ?? 'NOT_FOUND'}\``
            ].join('\n')
        );
    }

    const details = [
        `<@${reviewData.userId}> ${
            approving
                ? 'passed'
                : 'did not pass'
        } Staff Review.`,
        `🗓️ Cycle: \`${reviewData.trialKey}\``,
        `📋 Status: \`${participant.status}\``,
        `👤 Reviewed By: <@${interaction.user.id}>`
    ];

    if (approving) {
        details.splice(
            3,
            0,
            `📖 Previous Rank: \`${participant.previousRank ?? 'Unranked'}\``,
            `⬆️ New Rank: \`${participant.newRank ?? 'Not selected yet'}\``
        );
    }

    details.push(
        '',
        '**Review Reason**',
        reviewReason
    );

    return replySuccess(
        interaction,
        approving
            ? '✅ Participant Approved'
            : '❌ Participant Rejected',
        details.join('\n')
    );
}

async function handleReviewModalSubmit(
    interaction,
    reviewData
) {
    if (!isAdministrator(interaction)) {
        return replyError(
            interaction,
            '❌ Review Access Denied',
            'Only an Administrator may complete a Captain Trial Staff Review.'
        );
    }

    if (
        !isCurrentReviewCycle(
            reviewData.trialKey
        )
    ) {
        return replyWarning(
            interaction,
            '⚠️ Stale Review Modal',
            [
                'This review form belongs to a different Captain Trial cycle.',
                `🗓️ Cycle: \`${reviewData.trialKey}\``,
                'Open a fresh `/ranktrials review` panel.'
            ].join('\n')
        );
    }

    const reviewReason =
        interaction.fields
            .getTextInputValue(
                'reviewReason'
            )
            .trim();

    if (reviewReason.length < 3) {
        return replyWarning(
            interaction,
            '⚠️ Review Reason Required',
            'Please provide a valid Staff Review reason.'
        );
    }

    if (
        ![
            'approve',
            'reject'
        ].includes(
            reviewData.action
        )
    ) {
        return replyError(
            interaction,
            '❌ Unknown Review Decision',
            'Evelynn could not identify this Staff Review decision.'
        );
    }

    return applyReviewDecision(
        interaction,
        reviewData,
        reviewReason
    );
}async function handleStaffReviewButton(
    interaction,
    reviewData
) {
    const handlers = {
        approve:
            handleReviewApproveButton,

        reject:
            handleReviewRejectButton,

        reopen:
            handleReviewReopen
    };

    const handler =
        handlers[reviewData.action];

    if (!handler) {
        return replyError(
            interaction,
            '❌ Unknown Review Action',
            'Evelynn could not identify this Staff Review action.'
        );
    }

    return handler(
        interaction,
        reviewData
    );
}

const RANK_TRIAL_BUTTON_HANDLERS = {
    [RANK_TRIAL_COMPONENT_IDS.register]:
        handleRegister,

    [RANK_TRIAL_COMPONENT_IDS.withdraw]:
        handleWithdraw,

    [RANK_TRIAL_COMPONENT_IDS.testRegister]:
        handleTestRegister,

    [RANK_TRIAL_COMPONENT_IDS.testWithdraw]:
        handleTestWithdraw
};

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
            return replyError(
                interaction,
                '❌ Invalid Review Control',
                'Evelynn could not validate this Staff Review control.'
            );
        }

        return handleStaffReviewButton(
            interaction,
            reviewData
        );
    }

    if (
        interaction.customId ===
        RANK_TRIAL_COMPONENT_IDS.closed
    ) {
        return replyWarning(
            interaction,
            '🔒 Registration Closed',
            'Captain Trial registration is already closed.'
        );
    }

    const handler =
        RANK_TRIAL_BUTTON_HANDLERS[
            interaction.customId
        ];

    if (!handler) {
        return replyError(
            interaction,
            '❌ Unknown Captain Trial Action',
            'Evelynn could not identify this Captain Trial action.'
        );
    }

    return handler(
        interaction
    );
}

async function sendInteractionError(
    interaction,
    embed
) {
    if (interaction.deferred) {
        return interaction
            .editReply({
                embeds: [embed],
                components: []
            })
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        })
        .catch(() => null);
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        const isButton =
            interaction.isButton() &&
            interaction.customId.startsWith(
                'umbra:ranktrial:'
            );

        const isModal =
            interaction.isModalSubmit() &&
            interaction.customId.startsWith(
                `${REVIEW_MODAL_PREFIX}:`
            );

        if (!isButton && !isModal) {
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
            return;
        }

        processingInteractions.add(
            interaction.id
        );

        try {
            if (isModal) {
                const reviewData =
                    parseReviewModalCustomId(
                        interaction.customId
                    );

                if (!reviewData) {
                    return replyError(
                        interaction,
                        '❌ Invalid Review Form',
                        'Evelynn could not validate this Staff Review form.'
                    );
                }

                return handleReviewModalSubmit(
                    interaction,
                    reviewData
                );
            }

            return handleRankTrialButton(
                interaction
            );
        } catch (error) {
            console.error(
                '❌ Evelynn Captain Trial failed:',
                error
            );

            await sendInteractionError(
                interaction,
                createErrorEmbed(
                    '❌ Captain Trial Action Failed',
                    'Evelynn could not complete this Captain Trial action.'
                )
            );
        } finally {
            setTimeout(
                () =>
                    processingInteractions.delete(
                        interaction.id
                    ),
                15_000
            );
        }
    }
};
