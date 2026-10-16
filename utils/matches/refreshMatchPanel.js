const {
    getMatch
} = require('../../database/matches');

const {
    getMatchStartState
} = require('../../database/matchStart');

const {
    buildMatchPanel
} = require('./matchPanel');

const refreshQueues = new Map();

async function refreshMatchPanel(client, guildId, matchId) {
    const key = `${guildId}:${matchId}`;

    const previous = refreshQueues.get(key)
        || Promise.resolve();

    const current = previous
        .catch(() => null)
        .then(async () => {
            const match = await getMatch(
                guildId,
                matchId
            );

            if (!match?.messageId) {
                return false;
            }

            const channel = await client.channels
                .fetch(match.channelId)
                .catch(() => null);

            if (!channel?.messages) {
                return false;
            }

            const message = await channel.messages
                .fetch(match.messageId)
                .catch(() => null);

            if (!message) {
                return false;
            }

            const options = {};

            if (match.status === 'recruiting') {
                const state = await getMatchStartState(
                    guildId,
                    matchId
                );

                options.confirmedTeams = state.confirmedTeams;
            }

            await message.edit(
                buildMatchPanel(match, options)
            );

            return true;
        });

    refreshQueues.set(key, current);

    try {
        return await current;
    } finally {
        if (refreshQueues.get(key) === current) {
            refreshQueues.delete(key);
        }
    }
}

module.exports = {
    refreshMatchPanel
};