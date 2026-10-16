const { MessageFlags } = require('discord.js');

const {
    getMatch,
    joinTeam,
    leaveMatch,
    cancelMatch
} = require('../database/matches');

const {
    confirmMatchStart
} = require('../database/matchStart');

const {
    reportMatchResult,
    confirmMatchResult,
    disputeMatchResult
} = require('../database/matchResults');

const {
    ensureUser
} = require('../database/users');

const {
    ensurePlayerStats
} = require('../database/playerStats');

const {
    BUTTON_PREFIX
} = require('../utils/matches/matchPanel');

const {
    refreshMatchPanel
} = require('../utils/matches/refreshMatchPanel');

const ACTIONS = new Set([
    'join_crimson',
    'join_azure',
    'leave',
    'ready',
    'cancel',
    'report_crimson',
    'report_azure',
    'confirm',
    'dispute'
]);

function parseButton(customId) {
    if (!customId.startsWith(BUTTON_PREFIX)) {
        return null;
    }

    const value = customId.slice(BUTTON_PREFIX.length);
    const separator = value.lastIndexOf(':');

    if (separator === -1) {
        return null;
    }

    const action = value.slice(0, separator);
    const matchId = value.slice(separator + 1);

    if (
        !ACTIONS.has(action) ||
        !/^[1-9]\d*$/.test(matchId)
    ) {
        return null;
    }

    return { action, matchId };
}

async function sendPrivateMessage(interaction, message) {
    await interaction.followUp({
        content: message,
        flags: MessageFlags.Ephemeral
    }).catch(() => null);
}

async function preparePlayer(interaction) {
    const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);

    if (!member || member.user.bot) {
        throw new Error(
            'Your server membership could not be verified.'
        );
    }

    await ensureUser(
        interaction.guildId,
        member.id,
        member.joinedAt
    );

    await ensurePlayerStats(
        interaction.guildId,
        member.id
    );
}

async function performAction(interaction, matchId, action) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    switch (action) {
        case 'join_crimson':
        case 'join_azure':
            await preparePlayer(interaction);

            return joinTeam(
                guildId,
                matchId,
                userId,
                action === 'join_crimson'
                    ? 'crimson'
                    : 'azure'
            );

        case 'leave':
            return leaveMatch(guildId, matchId, userId);

        case 'cancel':
            return cancelMatch(guildId, matchId, userId);

        case 'ready':
            return confirmMatchStart(
                guildId,
                matchId,
                userId
            );

        case 'report_crimson':
        case 'report_azure':
            return reportMatchResult(
                guildId,
                matchId,
                userId,
                action === 'report_crimson'
                    ? 'crimson'
                    : 'azure'
            );

        case 'confirm':
            return confirmMatchResult(
                guildId,
                matchId,
                userId
            );

        case 'dispute':
            return disputeMatchResult(
                guildId,
                matchId,
                userId
            );

        default:
            throw new Error('Unknown match action.');
    }
}

async function handleMatchInteraction(interaction) {
    if (
        !interaction.isButton() ||
        !interaction.customId.startsWith(BUTTON_PREFIX)
    ) {
        return false;
    }

    await interaction.deferUpdate();

    const button = parseButton(interaction.customId);

    if (!button || !interaction.inGuild()) {
        await sendPrivateMessage(
            interaction,
            'Invalid match interaction.'
        );

        return true;
    }

    try {
        const match = await getMatch(
            interaction.guildId,
            button.matchId
        );

        if (!match) {
            throw new Error('Match not found.');
        }

        if (
            match.channelId !== interaction.channelId ||
            match.messageId !== interaction.message.id
        ) {
            throw new Error(
                'This is not the official match panel.'
            );
        }

        if (interaction.user.bot) {
            throw new Error(
                'Bots cannot participate in matches.'
            );
        }

        await performAction(
            interaction,
            button.matchId,
            button.action
        );
    } catch (error) {
        const expectedMessages = [
            'not found',
            'already',
            'full',
            'participating',
            'captain',
            'team',
            'match',
            'recruiting',
            'confirm',
            'report',
            'result',
            'cancel',
            'start',
            'profile',
            'member',
            'available'
        ];

        const message = String(error.message || '');

        const expected = expectedMessages.some(word =>
            message.toLowerCase().includes(word)
        );

        if (!expected) {
            console.error('Match interaction failed:', error);
        }

        await sendPrivateMessage(
            interaction,
            expected
                ? `Warning: ${message}`
                : 'Akane could not complete this action.'
        );

        return true;
    }

    try {
        const updated = await refreshMatchPanel(
            interaction.client,
            interaction.guildId,
            button.matchId
        );

        if (!updated) {
            await sendPrivateMessage(
                interaction,
                'Your action was saved, but the match panel could not be refreshed.'
            );
        }
    } catch (error) {
        console.error(
            'Match panel refresh failed:',
            error
        );

        await sendPrivateMessage(
            interaction,
            'Your action was saved, but the match panel could not be refreshed.'
        );
    }

    return true;
}

module.exports = {
    handleMatchInteraction
};