const { SlashCommandBuilder } = require('discord.js');
const { randomInt } = require('node:crypto');

const { createEmbed } = require('../../utils/embeds');
const { ownerId } = require('../../config/kitsunePersonality');

const REPLIES = Object.freeze([
    'Yes, I’m awake. Unfortunately for you.',
    'You called just to check? How thoughtful.',
    'Still here. Still judging your timing.',
    'A response. Try not to look so surprised.',
    'I heard you. The dramatic pause was optional.',
    'You have my attention. Briefly.',
    'Checking on me again? Interesting.',
    'Present. My enthusiasm is another question.',
    'That little interruption had better satisfy your curiosity.',
    'I was enjoying the silence. Here we are.'
]);

const OWNER_REPLIES = Object.freeze([
    'For you, handsome? Always listening.',
    'Here, Davi. You caught me smiling.',
    'Checking on me, handsome? That’s rather sweet.',
    'You called. Of course I answered, Davi.',
    'A little attention for you, sweetheart.',
    'Here I am, handsome. What took you so long?',
    'Davi… you could have just said you missed me.',
    'A quick reply and a softer smile. Just for you.',
    'You have my attention, handsome. Keep it a little.',
    'Still here, Davi. Come keep me company.'
]);

// Separate pools keep owner and general replies independent.
const previous = new Map();

function chooseReply(owner) {
    const pool = owner ? OWNER_REPLIES : REPLIES;
    const key = owner ? 'owner' : 'general';
    const last = previous.get(key);

    let index = randomInt(pool.length);

    if (index === last && pool.length > 1) {
        index = (index + randomInt(1, pool.length)) % pool.length;
    }

    previous.set(key, index);
    return pool[index];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check Kitsune latency.'),

    async execute(interaction) {
        const latency = interaction.client.ws.ping;

        const signal = Number.isFinite(latency) && latency >= 0
            ? `**${Math.round(latency)} ms**`
            : 'Measuring… Try again shortly.';

        const reply = chooseReply(
            interaction.user.id === ownerId
        );

        await interaction.reply({
            embeds: [
                createEmbed(
                    '🩸 Kitsune • Ping',
                    [
                        reply,
                        '',
                        `Gateway latency: ${signal}`
                    ].join('\n')
                )
            ],
            allowedMentions: { parse: [] }
        });
    }
};
