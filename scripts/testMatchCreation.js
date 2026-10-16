const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');

const PVP_CHANNEL_ID = '1551667516458147941';

const state = {
    created: [],
    saved: [],
    cancelled: [],
    deleted: [],
    sent: [],
    replies: [],
    failAt: null
};

function reset(failAt = null) {
    for (const key of [
        'created',
        'saved',
        'cancelled',
        'deleted',
        'sent',
        'replies'
    ]) {
        state[key] = [];
    }

    state.failAt = failAt;
}

function mockModule(relativePath, exports) {
    const filename = require.resolve(relativePath);

    require(filename);

    require.cache[filename].exports = {
        ...require.cache[filename].exports,
        ...exports
    };
}

mockModule('../database/matches', {
    async createMatch(guildId, channelId, creatorId, game, size) {
        const match = {
            id: '123',
            guildId,
            channelId,
            creatorId,
            gameName: game,
            teamSize: size,
            status: 'recruiting',
            players: [{
                userId: creatorId,
                team: 'crimson',
                isCaptain: true
            }]
        };

        state.created.push(match);
        return match;
    },

    async setMatchMessage(guildId, matchId, messageId) {
        if (state.failAt === 'save') {
            throw new Error('Simulated database save failure.');
        }

        state.saved.push({ guildId, matchId, messageId });
    }
});

mockModule('../database/matchModeration', {
    async forceCancelMatch(guildId, matchId) {
        state.cancelled.push({ guildId, matchId });
        return { id: matchId, status: 'cancelled' };
    }
});

mockModule('../database/users', {
    async ensureUser() {
        return {};
    }
});

mockModule('../database/playerStats', {
    async ensurePlayerStats() {
        return {};
    }
});

mockModule('../utils/matches/matchPanel', {
    buildMatchPanel() {
        return {
            embeds: [],
            components: []
        };
    }
});

const command = require('../commands/progression/match');

function createInteraction() {
    const message = {
        id: 'message-123',
        url: 'https://discord.com/channels/1/2/3',

        async delete() {
            state.deleted.push(this.id);
        }
    };

    const channel = {
        isTextBased: () => true,

        async send(payload) {
            if (state.failAt === 'send') {
                throw new Error('Simulated Discord send failure.');
            }

            state.sent.push(payload);
            return message;
        }
    };

    return {
        guildId: 'test-guild',
        channelId: PVP_CHANNEL_ID,
        channel,
        user: { id: 'player-1' },

        inGuild: () => true,

        guild: {
            members: {
                async fetchMe() {
                    return {
                        permissionsIn() {
                            return {
                                has(permissions) {
                                    return [
                                        PermissionFlagsBits.ViewChannel,
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.EmbedLinks
                                    ].every(
                                        permission =>
                                            permissions.includes(permission)
                                    );
                                }
                            };
                        }
                    };
                },

                async fetch() {
                    return {
                        id: 'player-1',
                        joinedAt: new Date(),
                        user: { bot: false }
                    };
                }
            }
        },

        options: {
            getString: () => 'Slayers 2',
            getInteger: () => 2
        },

        async deferReply() {},

        async editReply(payload) {
            state.replies.push(payload);

            if (state.failAt === 'reply') {
                throw new Error(
                    'Simulated confirmation failure.'
                );
            }

            return payload;
        }
    };
}

async function runSilently(callback) {
    const originalError = console.error;

    console.error = () => {};

    try {
        await callback();
    } finally {
        console.error = originalError;
    }
}

async function testSuccess() {
    reset();

    await command.execute(createInteraction());

    assert.equal(state.created.length, 1);
    assert.equal(state.sent.length, 1);
    assert.equal(state.saved.length, 1);
    assert.equal(state.cancelled.length, 0);
    assert.equal(state.deleted.length, 0);

    assert.ok(
        state.replies[0].content.includes(
            'created successfully'
        )
    );

    console.log('PASS: Match created and published');
}

async function testSendFailure() {
    reset('send');

    await runSilently(() =>
        command.execute(createInteraction())
    );

    assert.equal(state.created.length, 1);
    assert.equal(state.sent.length, 0);
    assert.equal(state.saved.length, 0);
    assert.equal(state.cancelled.length, 1);
    assert.equal(state.deleted.length, 0);

    console.log('PASS: Failed publication cancels match');
}

async function testSaveFailure() {
    reset('save');

    await runSilently(() =>
        command.execute(createInteraction())
    );

    assert.equal(state.created.length, 1);
    assert.equal(state.sent.length, 1);
    assert.equal(state.saved.length, 0);
    assert.equal(state.cancelled.length, 1);
    assert.equal(state.deleted.length, 1);

    console.log('PASS: Failed message save triggers cleanup');
}

async function testReplyFailure() {
    reset('reply');

    await runSilently(() =>
        command.execute(createInteraction())
    );

    assert.equal(state.created.length, 1);
    assert.equal(state.sent.length, 1);
    assert.equal(state.saved.length, 1);
    assert.equal(state.cancelled.length, 0);
    assert.equal(state.deleted.length, 0);

    console.log('PASS: Failed confirmation preserves match');
}

async function main() {
    assert.equal(command.data.name, 'match');

    await testSuccess();
    await testSendFailure();
    await testSaveFailure();
    await testReplyFailure();

    console.log('');
    console.log('ALL MATCH CREATION TESTS PASSED');
}

main().catch(error => {
    console.error('MATCH CREATION TEST FAILED');
    console.error(error);
    process.exitCode = 1;
});