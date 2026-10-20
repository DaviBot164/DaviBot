const {
    PermissionFlagsBits,
    escapeMarkdown
} = require('discord.js');

const { randomInt } = require('node:crypto');
const { createEmbed } = require('../utils/embeds');

const baseReplies = require('../config/akaneReplies');
const personality = require('../config/akanePersonality');

const {
    pools: reactionPools,
    detectReaction
} = require('../config/akaneReactions');

const OWNER_ID = personality.ownerId;

const USER_COOLDOWN = 10_000;
const CHANNEL_COOLDOWN = 5_000;
const SESSION_TTL = 120_000;

const users = new Map();
const channels = new Map();
const sessions = new Map();

const ownerExtra = {
    mood: [
        'A little softer now that you’re here, Davi.',
        'In the mood for a nice conversation with you, handsome.',
        'Trying to look mysterious. You’re making that difficult.',
        'Quite lovely, Davi. What about you?',
        'Feeling playful. You arrived at a good moment.'
    ],

    rate: [
        '{score}/10, handsome. Entirely random, so don’t let it steal your confidence.',
        'The imaginary judges gave you {score}/10. I gave you a smile.',
        '{score}/10 for the game, Davi. Your charm wasn’t part of the calculation.',
        'A playful {score}/10. Come on, handsome—no arguing with imaginary numbers.',
        '{score}/10. A random number, a very deliberate warm welcome.'
    ],

    luck: [
        'My little prediction? You’ll find a reason to smile today, Davi.',
        'A playful forecast: one small victory and a well-earned break, handsome.',
        'Good timing, a little patience, and a smile. That’s my wish for you today.',
        'I predict a charming entrance. Oh, you already made it.',
        'A pretend prediction, Davi: something ordinary may turn into a lovely moment.'
    ],

    secret: [
        'A secret? I find it terribly easy to soften my tone around you.',
        'I was going to act unimpressed. Then you said hello.',
        'Your name makes a rather good entrance, Davi.',
        'I rehearse being mysterious. You keep making me smile instead.',
        'I rather like this gentle little side of our conversations.'
    ],

    identity: [
        'Akane, handsome. A Discord bot with a little drama and a soft reply for you.',
        'I’m Akane, Davi—a fictional character brought to life through preset replies.',
        'Your server’s Akane. A bot, a little attitude, and some very deliberate charm.'
    ],

    bot: [
        'I am, Davi. We can still have a sweet little exchange.',
        'Yes, handsome—a bot playing a character. The playful tone is intentional.',
        'A bot, Davi. No mystery there. Shall we keep the conversation lovely?'
    ],

    question: [
        'Davi, I don’t quite know that one. Shall we try something from `akane help`?',
        'A little clearer for me, handsome? I only understand the phrases written for me.',
        'I’d rather be honest with you, Davi: I can’t answer that freely. Try `akane help`.'
    ],

    rude: [
        'Then I’ll soften the teasing, Davi.',
        'All right, handsome. A gentler answer for you.',
        'A little less mischief from me, then. Thank you for saying it.',
        'Let’s make the next exchange sweeter, Davi.'
    ]
};

const replies = {
    ...baseReplies,
    general: personality.general,
    member: personality.member,
    davi: personality.davi,

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

const DAVI_NAMES = new Set([
    'davi',
    'daviti',
    'დავი',
    'დავითი'
]);

const ALIASES = new Map([
    ['hi', 'hi'],
    ['hello', 'hi'],
    ['გამარჯობა', 'hi'],

    ['mood', 'mood'],
    ['how are you', 'mood'],
    ['როგორ ხარ', 'mood'],
    ['განწყობა', 'mood'],

    ['nice', 'nice'],
    ['compliment', 'nice'],
    ['კომპლიმენტი', 'nice'],

    ['roast', 'roast'],
    ['გამეხუმრე', 'roast'],

    ['tip', 'tip'],
    ['advice', 'tip'],
    ['რჩევა', 'tip'],

    ['pick', 'pick'],
    ['აირჩიე', 'pick'],

    ['rate', 'rate'],
    ['შეფასება', 'rate'],

    ['luck', 'luck'],
    ['იღბალი', 'luck'],

    ['secret', 'secret'],
    ['საიდუმლო', 'secret'],

    ['help', 'help'],
    ['დახმარება', 'help'],

    ['stop', 'stop'],
    ['გაჩერდი', 'stop']
]);

const FOLLOWUPS = new Map([
    ['yes', 'yes'],
    ['კი', 'yes'],
    ['დიახ', 'yes'],

    ['no', 'no'],
    ['არა', 'no'],

    ['rude', 'rude'],
    ['უხეში ხარ', 'rude'],

    ['thanks', 'thanks'],
    ['thank you', 'thanks'],
    ['მადლობა', 'thanks'],

    ['really', 'really'],
    ['მართლა', 'really'],

    ['why', 'why'],
    ['რატომ', 'why'],

    ['stop', 'stop'],
    ['გაჩერდი', 'stop']
]);

function normalize(text) {
    return String(text ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .trim()
        .replace(/[!?.,…:;]+$/u, '')
        .trim()
        .replace(/\s+/g, ' ');
}

function cleanExpired(now) {
    for (const [key, expiry] of users) {
        if (expiry <= now) users.delete(key);
    }

    for (const [key, session] of sessions) {
        if (session.expiresAt <= now) sessions.delete(key);
    }
}

function closeSessions(userId, channelId) {
    for (const [key, session] of sessions) {
        if (
            session.userId === userId &&
            session.channelId === channelId
        ) {
            sessions.delete(key);
        }
    }
}

function drawReply(state, category) {
    const pool = replies[category];

    if (!pool?.length) {
        throw new Error(`Missing Akane reply category: ${category}`);
    }

    let bag = state.bags.get(category);

    if (!bag?.remaining.length) {
        const remaining = pool.map((_, index) => index);

        for (let i = remaining.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);

            [remaining[i], remaining[j]] = [
                remaining[j],
                remaining[i]
            ];
        }

        if (
            remaining.length > 1 &&
            remaining.at(-1) === bag?.last
        ) {
            const end = remaining.length - 1;

            [remaining[0], remaining[end]] = [
                remaining[end],
                remaining[0]
            ];
        }

        bag = { remaining, last: bag?.last };
        state.bags.set(category, bag);
    }

    const index = bag.remaining.pop();

    bag.last = index;

    return pool[index];
}

function parseRequest(message, now) {
    const content = message.content.trim();

    const trigger = content.match(
        /^(?:akane|აკანე)(?=$|[\s!?.,…:;♡♥❤🩸👋🔪🌙])[\s!?.,…:;]*(.*)$/iu
    );

    if (!trigger) {
        const session = sessions.get(message.reference?.messageId);

        if (
            !session ||
            session.userId !== message.author.id ||
            session.channelId !== message.channelId ||
            session.expiresAt <= now
        ) {
            return null;
        }

        const category = FOLLOWUPS.get(normalize(content));

        if (category) {
            if (
                ['yes', 'no'].includes(category) &&
                !session.question
            ) {
                return null;
            }

            return {
                category,
                followup: true,
                context: session.category
            };
        }

        const reaction = detectReaction(content);

        if (reaction) {
            return { category: `reaction_${reaction}` };
        }

        if (/[?？]/u.test(content)) {
            return { category: 'reaction_question' };
        }

        return null;
    }

    const raw = trigger[1].trim();
    const text = normalize(raw);

    if (!text || /^[\s\p{P}\p{S}\uFE0F]*$/u.test(text)) {
        return { category: 'general' };
    }

    if (DAVI_NAMES.has(text)) {
        return { category: 'davi' };
    }

    const direct = ALIASES.get(text);

    if (direct) return { category: direct };

    const [first, ...rest] = text.split(' ');
    const category = ALIASES.get(first);
    const argument = rest.join(' ');

    if (category === 'pick') {
        return {
            category,
            argument: raw.slice(first.length).trim()
        };
    }

    if (
        ['nice', 'roast', 'rate'].includes(category) &&
        ['me', 'მე'].includes(argument)
    ) {
        return { category };
    }

    const mention = text.match(/^<@!?(\d+)>$/u);

    if (mention) {
        const member = message.mentions.members?.get(mention[1]);

        if (!member) return { category: 'fallback' };

        return {
            category: member.id === OWNER_ID ? 'davi' : 'member',
            target: member.displayName
        };
    }

    const followup = FOLLOWUPS.get(text);

    if (followup === 'thanks' || followup === 'rude') {
        return { category: followup };
    }

    const reaction = detectReaction(raw);

    if (reaction) {
        return { category: `reaction_${reaction}` };
    }

    if (/[?？]/u.test(raw)) {
        return { category: 'reaction_question' };
    }

    if (
        !category &&
        /^[\p{L}\p{N}_ -]{1,64}$/u.test(text)
    ) {
        return { category: 'member', target: raw };
    }

    return { category: 'fallback' };
}

function buildHelp(message, owner) {
    return createEmbed(
        '🩸 Akane • Chat Help',
        [
            owner
                ? 'Hello, Davi. Here is the short version, handsome.'
                : 'Call my name. Then tell me what you want.',
            'Use **akane** or **აკანე**. Replies are in English.'
        ].join('\n')
    ).setThumbnail(
        message.client.user.displayAvatarURL({ size: 256 })
    ).addFields(
        {
            name: 'BASIC',
            value: [
                '`akane` — Get my attention',
                '`akane hi` — Say hello',
                '`akane nice` — Get a compliment',
                '`akane roast` — Get a playful roast',
                '`akane tip` — Get advice',
                '`akane help` — Show this guide'
            ].join('\n')
        },
        {
            name: 'PEOPLE & CHOICES',
            value: [
                '`akane @member` — Hear my reaction to a member',
                '`akane davi` — Ask about Davi',
                '`akane pick pvp / training` — Let me choose',
                'Davi aliases: `davi`, `daviti`, `დავი`, `დავითი`.'
            ].join('\n')
        },
        {
            name: 'MORE',
            value: [
                '`akane mood` — My fictional mood',
                '`akane rate` — A random score for fun',
                '`akane luck` — A pretend prediction',
                '`akane secret` — A little character secret',
                '`akane stop` — End your current conversation'
            ].join('\n')
        },
        {
            name: 'TALK TO ME',
            value: [
                '`akane who are you?`',
                '`akane are you angry?`',
                '`akane be my gf`',
                '`akane you are just a bot`',
                '`აკანე ბოდიში`'
            ].join('\n')
        },
        {
            name: 'USE REPLY',
            value: [
                'Reply to my latest response to **you** within **2 minutes**.',
                '`thanks` / `მადლობა` · `rude` / `უხეში ხარ`',
                '`really?` / `მართლა?` · `why?` / `რატომ?`',
                '`yes` / `no` or `კი` / `არა` — when I ask.',
                'Recognized flirting, apologies and jokes also work.',
                '`stop` / `გაჩერდი` — close the conversation.'
            ].join('\n')
        },
        {
            name: 'GOOD TO KNOW',
            value: [
                '**10 seconds** between your requests.',
                '**5 seconds** between channel responses.',
                'Stop clears your session immediately;',
                'the confirmation still follows the cooldown.',
                'This is a fictional character using preset dialogue.'
            ].join('\n')
        }
    );
}

function contextualReply(request) {
    const category = request.context ?? 'general';

    if (request.category === 'really') {
        const answers = {
            davi: 'Yes, Davi. Let me say something lovely without cross-examination.',
            nice: 'Yes. Take the compliment. You’re making this difficult.',
            roast: 'You asked for a joke. Don’t turn it into a biography.',
            rate: 'The number is random. The dramatic pause was mine.',
            luck: 'It’s a little pretend prediction. Don’t book a flight over it.',
            reaction_apology: 'We’re fine. You can stop rehearsing the apology.',
            reaction_romance: 'You heard me. Bold entrance, questionable outcome.',
            reaction_affection: 'Mm-hm. I accepted the compliment. Try to stay composed.',
            reaction_anger: 'We’re joking. No real grudge behind the expression.'
        };

        return answers[category]
            ?? 'Mm-hm. That was the answer. The raised eyebrow was extra.';
    }

    const reasons = {
        davi: 'Because I can be sweet about Davi. Let me enjoy the moment.',
        nice: 'You asked for something nice. I decided not to make you work for it.',
        roast: 'Because you asked me to tease you. Gently, by my standards.',
        rate: 'It’s a random score for fun. There isn’t a secret judgment behind it.',
        luck: 'A little theatre. Nothing you should mistake for a real forecast.',
        tip: 'It’s a suggestion, not an order. Keep what fits your situation.',
        member: 'That’s the cold greeting. It isn’t a serious judgment of them.',
        mood: 'A little dramatic mood suits the conversation.',
        secret: 'Because some things sound better whispered theatrically.',
        reaction_apology: 'Because you apologized. We can move on.',
        reaction_romance: 'A little flirting can stay a joke without becoming a commitment.',
        reaction_affection: 'Because you said something sweet. I noticed.',
        reaction_insult: 'We can tease each other without making it personal.',
        reaction_dismissive: 'You can end the conversation. No argument needed.',
        reaction_possessive: 'Attention is one thing. Ownership is another.',
        reaction_bot: 'Because I am a bot playing a character. You asked directly.',
        reaction_identity: 'You asked who I am. I gave you the introduction.',
        reaction_anger: 'The sharp tone is part of the character, not actual anger.',
        reaction_question: 'I don’t know that answer. Better to say so than invent one.'
    };

    return reasons[category]
        ?? 'A little teasing, a little theatre. Nothing personal.';
}

function ownerCategory(category) {
    if (category.startsWith('owner_')) return category;

    const mapping = {
        general: 'general',
        hi: 'hi',
        nice: 'nice',
        davi: 'nice',
        roast: 'roast',
        mood: 'mood',
        rate: 'rate',
        luck: 'luck',
        secret: 'secret',
        thanks: 'thanks',
        rude: 'rude',
        yes: 'yes',
        no: 'no',
        really: 'really',
        why: 'why',
        fallback: 'fallback',

        reaction_romance: 'flirt',
        reaction_affection: 'flirt',
        reaction_possessive: 'flirt',
        reaction_ownerFlirt: 'flirt',

        reaction_apology: 'apology',
        reaction_insult: 'tension',
        reaction_dismissive: 'tension',
        reaction_anger: 'tension',

        reaction_identity: 'identity',
        reaction_bot: 'bot',
        reaction_question: 'question'
    };

    return `owner_${mapping[category] ?? 'general'}`;
}

function buildResponse(message, request, state) {
    const owner = message.author.id === OWNER_ID;
    let category = request.category;

    if (category === 'help') {
        return {
            payload: { embeds: [buildHelp(message, owner)] },
            category,
            session: false
        };
    }

    if (category === 'stop') {
        return {
            payload: {
                content: owner
                    ? drawReply(state, 'owner_stop')
                    : 'All right. We’ll leave it there.'
            },
            category,
            session: false
        };
    }

    if (category === 'pick') {
        const options = [
            ...new Set(
                (request.argument ?? '')
                    .split('/')
                    .map(option => option.trim())
                    .filter(Boolean)
            )
        ];

        const valid =
            options.length >= 2 &&
            options.length <= 10 &&
            options.every(option => option.length <= 100);

        let content;

        if (valid) {
            const choice = escapeMarkdown(
                options[randomInt(options.length)]
            );

            content = owner
                ? `**${choice}**, handsome. That’s my pick. What do you think?`
                : `**${choice}**. There. Someone made a decision.`;
        } else {
            content = owner
                ? 'Give me 2–10 choices, Davi, separated by `/`.\n' +
                  'Like this: `akane pick pvp / training`'
                : 'Give me 2–10 choices separated by `/`.\n' +
                  '`akane pick pvp / training`';
        }

        return {
            payload: { content },
            category,
            session: false
        };
    }

    if (
        request.followup &&
        ['really', 'why'].includes(category)
    ) {
        return {
            payload: {
                content: owner
                    ? drawReply(state, ownerCategory(category))
                    : contextualReply(request)
            },
            category: request.context,
            session: true,
            question: false
        };
    }

    if (
        request.followup &&
        category === 'yes' &&
        [
            'nice',
            'roast',
            'davi',
            'owner_nice',
            'owner_roast'
        ].includes(request.context)
    ) {
        category = request.context;
    }

    let poolCategory = category;

    if (owner && category !== 'member' && category !== 'tip') {
        poolCategory = ownerCategory(category);
    }

    let content = drawReply(state, poolCategory);

    if (category === 'rate') {
        content = content.replace('{score}', String(randomInt(1, 11)));
    }

    if (owner && category === 'tip') {
        content = `A little thought for you, handsome:\n\n${content}`;
    }

    if (owner && category === 'member') {
        content = `For you, Davi, an introduction—with a little attitude:\n\n${content}`;
    }

    if (request.target) {
        content = `**${escapeMarkdown(
            request.target.slice(0, 80)
        )}**\n${content}`;
    }

    return {
        payload: { content },
        category,
        session: category !== 'fallback',
        question: content.includes('Reply yes or no.')
    };
}

async function handleAkaneReply(message) {
    if (
        !message.inGuild() ||
        message.author.bot ||
        message.webhookId
    ) {
        return false;
    }

    const now = Date.now();

    cleanExpired(now);

    const request = parseRequest(message, now);

    if (!request) return false;

    if (request.category === 'stop') {
        closeSessions(message.author.id, message.channelId);
    }

    const bot = message.guild.members.me;
    const permissions = bot
        ? message.channel.permissionsFor(bot)
        : null;

    const sendPermission = message.channel.isThread()
        ? PermissionFlagsBits.SendMessagesInThreads
        : PermissionFlagsBits.SendMessages;

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            sendPermission
        ])
    ) {
        return false;
    }

    const userKey = `${message.guildId}:${message.author.id}`;

    let state = channels.get(message.channelId);

    if (!state) {
        state = {
            until: 0,
            busy: false,
            bags: new Map()
        };

        channels.set(message.channelId, state);
    }

    if (
        state.busy ||
        now < state.until ||
        now < (users.get(userKey) ?? 0)
    ) {
        return false;
    }

    state.busy = true;
    users.set(userKey, now + USER_COOLDOWN);

    try {
        const response = buildResponse(message, request, state);

        if (
            response.payload.embeds &&
            !permissions.has(PermissionFlagsBits.EmbedLinks)
        ) {
            response.payload = {
                content: response.payload.embeds
                    .map(embed => [
                        embed.data.title,
                        embed.data.description,
                        ...(embed.data.fields ?? []).map(field =>
                            `**${field.name}**\n${field.value}`
                        )
                    ].filter(Boolean).join('\n\n'))
                    .join('\n\n')
            };
        }

        const sent = await message.reply({
            ...response.payload,
            allowedMentions: {
                parse: [],
                repliedUser: false
            }
        });

        closeSessions(message.author.id, message.channelId);

        if (response.session) {
            sessions.set(sent.id, {
                userId: message.author.id,
                channelId: message.channelId,
                category: response.category,
                question: response.question ?? false,
                expiresAt: Date.now() + SESSION_TTL
            });
        }

        return true;
    } catch (error) {
        console.error('Akane reply failed:', error);
        return false;
    } finally {
        state.busy = false;
        state.until = Date.now() + CHANNEL_COOLDOWN;
    }
}

module.exports = { handleAkaneReply };