const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');

const matchCommand = require('../commands/progression/match');

const PVP_CHANNEL_ID = '1551667516458147941';

async function testChannelRestriction() {
    let response = null;

    const interaction = {
        inGuild: () => true,
        channelId: 'wrong-channel',

        reply: async payload => {
            response = payload;
        }
    };

    await matchCommand.execute(interaction);

    assert.ok(
        response.content.includes(PVP_CHANNEL_ID)
    );

    console.log('PASS: PvP channel restriction');
}

async function testServerRestriction() {
    let response = null;

    await matchCommand.execute({
        inGuild: () => false,

        reply: async payload => {
            response = payload;
        }
    });

    assert.ok(
        response.content.includes('server-only')
    );

    console.log('PASS: Server restriction');
}

async function testMissingPermissions() {
    let response = null;
    let deferred = false;

    const interaction = {
        inGuild: () => true,
        guildId: 'test-guild',
        channelId: PVP_CHANNEL_ID,

        channel: {
            isTextBased: () => true,
            send: async () => {
                throw new Error(
                    'The message must not be sent.'
                );
            }
        },

        guild: {
            members: {
                fetchMe: async () => ({
                    permissionsIn: () => ({
                        has: () => false
                    })
                })
            }
        },

        options: {
            getString: () => 'Slayers 2',
            getInteger: () => 1
        },

        deferReply: async () => {
            deferred = true;
        },

        editReply: async payload => {
            response = payload;
        }
    };

    await matchCommand.execute(interaction);

    assert.equal(deferred, true);
    assert.ok(
        response.content.includes(
            'Akane needs View Channel'
        )
    );

    console.log('PASS: Missing permissions handled');
}

async function main() {
    const options = matchCommand.data.toJSON().options;

    assert.equal(options.length, 2);
    assert.equal(matchCommand.data.name, 'match');

    await testServerRestriction();
    await testChannelRestriction();
    await testMissingPermissions();

    console.log('');
    console.log('ALL MATCH COMMAND TESTS PASSED');
}

main().catch(error => {
    console.error('MATCH COMMAND TEST FAILED');
    console.error(error);
    process.exitCode = 1;
});