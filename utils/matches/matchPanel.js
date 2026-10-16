const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    createEmbed
} = require('../embeds');

const BUTTON_PREFIX = 'akane:match:';

const TEAM_INFO = Object.freeze({
    crimson: {
        name: 'Crimson',
        emoji: '🔴'
    },
    azure: {
        name: 'Azure',
        emoji: '🔵'
    }
});

const STATUS_LABELS = Object.freeze({
    recruiting: 'Recruiting',
    ready: 'Ready',
    active: 'In Battle',
    reported: 'Awaiting Confirmation',
    disputed: 'Under Review',
    completed: 'Completed',
    cancelled: 'Cancelled'
});

function matchButton(matchId, action, label, style, emoji) {
    const button = new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}${action}:${matchId}`)
        .setLabel(label)
        .setStyle(style);

    if (emoji) {
        button.setEmoji(emoji);
    }

    return button;
}

function formatTeam(match, team) {
    const info = TEAM_INFO[team];

    const players = match.players.filter(
        player => player.team === team
    );

    const lines = players.map(player =>
        `${player.isCaptain ? '👑' : '⚔️'} <@${player.userId}>`
    );

    const emptySlots = Math.max(
        0,
        match.teamSize - players.length
    );

    for (let index = 0; index < emptySlots; index++) {
        lines.push('➕ Empty Slot');
    }

    return {
        name: `${info.emoji} Team ${info.name} • ${players.length}/${match.teamSize}`,
        value: lines.join('\n') || 'No players yet.',
        inline: true
    };
}

function buildMatchButtons(match) {
    const rows = [];

    if (match.status === 'recruiting') {
        rows.push(
            new ActionRowBuilder().addComponents(
                matchButton(
                    match.id,
                    'join_crimson',
                    'Join Crimson',
                    ButtonStyle.Primary,
                    '🔴'
                ),
                matchButton(
                    match.id,
                    'join_azure',
                    'Join Azure',
                    ButtonStyle.Primary,
                    '🔵'
                ),
                matchButton(
                    match.id,
                    'leave',
                    'Leave',
                    ButtonStyle.Secondary,
                    '🚪'
                )
            )
        );

        rows.push(
            new ActionRowBuilder().addComponents(
                matchButton(
                    match.id,
                    'ready',
                    'Captain Ready',
                    ButtonStyle.Success,
                    '⚔️'
                ),
                matchButton(
                    match.id,
                    'cancel',
                    'Cancel Match',
                    ButtonStyle.Danger,
                    '✖️'
                )
            )
        );
    }

    if (match.status === 'active') {
        rows.push(
            new ActionRowBuilder().addComponents(
                matchButton(
                    match.id,
                    'report_crimson',
                    'Crimson Won',
                    ButtonStyle.Primary,
                    '🔴'
                ),
                matchButton(
                    match.id,
                    'report_azure',
                    'Azure Won',
                    ButtonStyle.Primary,
                    '🔵'
                )
            )
        );
    }

    if (match.status === 'reported') {
        rows.push(
            new ActionRowBuilder().addComponents(
                matchButton(
                    match.id,
                    'confirm',
                    'Confirm Result',
                    ButtonStyle.Success,
                    '✅'
                ),
                matchButton(
                    match.id,
                    'dispute',
                    'Dispute Result',
                    ButtonStyle.Danger,
                    '⚠️'
                )
            )
        );
    }

    return rows;
}

function getMatchDescription(match) {
    const lines = [
        `**Game:** ${match.gameName}`,
        `**Format:** ${match.teamSize}v${match.teamSize}`,
        `**Status:** ${STATUS_LABELS[match.status] || match.status}`,
        `**Host:** <@${match.creatorId}>`
    ];

    if (match.status === 'recruiting') {
        lines.push(
            '',
            'Join a team to participate.',
            'Both captains must confirm when the teams are full.'
        );
    }

    if (match.status === 'active') {
        lines.push(
            '',
            '⚔️ The battle has begun!',
            'After the match, a captain must report the winning team.'
        );
    }

    if (match.status === 'reported') {
        const winner = TEAM_INFO[match.reportedWinner];

        lines.push(
            '',
            `**Reported Winner:** ${winner?.emoji || '🏆'} ${winner?.name || 'Unknown'}`,
            `**Reported By:** <@${match.reportedBy}>`,
            '',
            'The opposing captain must confirm or dispute.'
        );
    }

    if (match.status === 'disputed') {
        lines.push(
            '',
            '⚠️ The result has been disputed.',
            'Staff review is required.'
        );
    }

    if (match.status === 'completed') {
        const winner = TEAM_INFO[match.winnerTeam];

        lines.push(
            '',
            `🏆 **Winner:** ${winner?.name || 'Unknown'}`,
            'The match result has been recorded.'
        );
    }

    if (match.status === 'cancelled') {
        lines.push(
            '',
            'This match has been cancelled.'
        );
    }

    return lines.join('\n');
}

function buildMatchPanel(match, options = {}) {
    if (
        !match ||
        !Array.isArray(match.players)
    ) {
        throw new Error('Invalid match data.');
    }

    const embed = createEmbed(
        `⚔️ BLOOD MOON • MATCH #${match.id}`,
        getMatchDescription(match)
    );

    embed.addFields(
        formatTeam(match, 'crimson'),
        formatTeam(match, 'azure')
    );

    if (options.confirmedTeams?.length) {
        const names = options.confirmedTeams.map(
            team => TEAM_INFO[team]?.name || team
        );

        embed.addFields({
            name: '⚔️ Captain Confirmations',
            value: names.join(' • '),
            inline: false
        });
    }

    return {
        embeds: [embed],
        components: buildMatchButtons(match),
        allowedMentions: {
            parse: []
        }
    };
}

module.exports = {
    BUTTON_PREFIX,
    buildMatchPanel
};