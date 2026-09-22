const {
    MessageFlags
} = require('discord.js');

const {
    getTrial,
    getParticipant,
    registerParticipant,
    withdrawParticipant
} = require('../database/trials');

const {
    getUser
} = require('../database/users');

const {
    getTrial: getTrialDefinition
} = require('../config/trials');

const {
    checkEligibility
} = require('./trialService');

const {
    createEmbed,
    errorEmbed
} = require('../utils/embeds');

async function handleTrialButton(
    interaction
) {
    if (
        !interaction.customId.startsWith(
            'akane:trial:'
        )
    ) {
        return false;
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const parts =
        interaction.customId.split(':');

    const action = parts[2];
    const trialId = parts[3];

    if (
        !trialId ||
        !['register', 'withdraw'].includes(
            action
        )
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Invalid Trial',
                    'This trial interaction is no longer valid.'
                )
            ]
        });

        return true;
    }

    const trial = await getTrial(
        trialId
    );

    if (
        !trial ||
        trial.guildId !== interaction.guild.id
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Trial Not Found',
                    'This trial could not be found.'
                )
            ]
        });

        return true;
    }

    if (trial.status !== 'open') {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Registration Closed',
                    'Registration for this trial is no longer open.'
                )
            ]
        });

        return true;
    }

    const definition =
        getTrialDefinition(
            trial.trialType
        );

    if (!definition) {
        throw new Error(
            'Trial definition not found.'
        );
    }

    if (action === 'withdraw') {
        const participant =
            await withdrawParticipant(
                trial.id,
                interaction.user.id
            );

        if (!participant) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Not Registered',
                        'You are not currently registered for this trial.'
                    )
                ]
            });

            return true;
        }

        await interaction.editReply({
            embeds: [
                createEmbed(
                    'Trial Withdrawn',
                    `You have withdrawn from **${definition.name}**.`
                )
                    .setFooter({
                        text: 'AKANE • BLOOD MOON'
                    })
            ]
        });

        return true;
    }

    const user = await getUser(
        interaction.guild.id,
        interaction.user.id
    );

    const eligibility =
        checkEligibility(
            user,
            definition
        );

    if (!eligibility.eligible) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Trial Requirements',
                    eligibility.reason
                )
            ]
        });

        return true;
    }

    const existing =
        await getParticipant(
            trial.id,
            interaction.user.id
        );

    if (
        existing &&
        existing.status === 'registered'
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Already Registered',
                    `You are already registered for **${definition.name}**.`
                )
            ]
        });

        return true;
    }

    if (
        existing &&
        existing.status !== 'withdrawn'
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Trial Already Reviewed',
                    'Your result for this trial has already been recorded.'
                )
            ]
        });

        return true;
    }

    await registerParticipant(
        trial.id,
        interaction.guild.id,
        interaction.user.id
    );

    await interaction.editReply({
        embeds: [
            createEmbed(
                'Trial Registered',
                [
                    `You are now registered for **${definition.name}**.`,
                    '',
                    `Trial: **#${trial.id}**`,
                    `Reward: **${formatRank(definition.rewardRank)}**`
                ].join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ]
    });

    return true;
}

function formatRank(rankId) {
    return rankId
        .split('_')
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(' ');
}

module.exports = {
    handleTrialButton
};