const baseReplies = require('../../config/kitsuneReplies');
const personality = require('../../config/kitsunePersonality');

const {
    pools: reactionPools
} = require('../../config/kitsuneReactions');

const OWNER_ID = personality.ownerId;
const USER_COOLDOWN = 3_000;
const CHANNEL_COOLDOWN = 2_000;
const SESSION_TTL = 120_000;
const STATE_TTL = 30 * 60_000;

const ownerExtra = {
    mood: [
        'Better now that you’re here, handsome. How was your day?',
        'Trying to look unapproachable. You’re making that difficult.',
        'A little distracted, Davi. You can take the credit.'
    ],

    rate: [
        '{score}/10 from the imaginary judges. A smile from me, handsome.',
        'A random {score}/10, Davi. My fondness wasn’t part of the calculation.',
        '{score}/10 for the game. Come here, handsome—no arguing with imaginary numbers.'
    ],

    luck: [
        'A little pretend prediction, Davi: a small victory and a reason to smile.',
        'My wish for you? Good timing, a quiet moment, and something lovely.',
        'I predict a charming entrance. Oh, you already made it.'
    ],

    secret: [
        'I had a sharp reply ready. Then I saw your name.',
        'You make that softer voice far too easy to find, Davi.',
        'I try to look mysterious. You keep catching me smiling.'
    ],

    identity: [
        'Kitsune, handsome. Your Discord bot with a dramatic streak.',
        'I’m Kitsune, Davi. A fictional character using preset replies.'
    ],

    bot: [
        'Yes, handsome. A bot playing a character—and saving a warm reply for you.',
        'I am, Davi. Shall we keep our little exchange sweet?'
    ],

    question: [
        'I don’t know that one, handsome. Give me a request from `kitsune help`.',
        'You have my attention, Davi. I just don’t have an answer to that question.'
    ],

    rude: [
        'Then I’ll soften the teasing, handsome.',
        'All right, Davi. A gentler answer for you.',
        'Tell me what bothered you. No sharp reply from me.'
    ]
};

const replies = {
    ...baseReplies,
    general: personality.general,
    member: personality.member,

    // These lines talk ABOUT Davi rather than addressing the caller as Davi.
    davi: baseReplies.davi,

    ...Object.fromEntries(
        Object.entries(reactionPools).map(([name, pool]) => [
            `reaction_${name}`,
            pool
        ])
    ),

    ...Object.fromEntries(
        Object.entries({
            ...personality.ownerReplies,
            ...ownerExtra
        }).map(([name, pool]) => [
            `owner_${name}`,
            pool
        ])
    )
};

const dialogue = require('../../config/kitsuneDialogue');

for (const [name, pool] of Object.entries(dialogue.pools)) {
    replies[`dialogue_${name}`] = pool;
}
module.exports = {
    OWNER_ID,
    USER_COOLDOWN,
    CHANNEL_COOLDOWN,
    SESSION_TTL,
    STATE_TTL,
    replies,
    reactionPools,
    dialogue
};
