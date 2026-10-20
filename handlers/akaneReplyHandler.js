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

const replies = {
    ...baseReplies,
    general: personality.general,
    member: personality.member,
    owner: personality.owner,
    davi: [...baseReplies.davi, ...personality.davi],
    ...Object.fromEntries(
        Object.entries(reactionPools).map(([name, pool]) => [
            `reaction_${name}`,
            pool
        ])
    )
};

const USER_COOLDOWN = 10_000;
const CHANNEL_COOLDOWN = 5_000;
const SESSION_TTL = 120_000;

const users = new Map();
const channels = new Map();
const sessions = new Map();

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

function reactionRequest(content, owner) {
    const reaction = detectReaction(content);

    if (!reaction) return null;

    const flirt = owner && [
        'romance',
        'affection',
        'possessive'
    ].includes(reaction);

    return {
        category: `reaction_${flirt ? 'ownerFlirt' : reaction}`
    };
}

function parseRequest(message, now) {
    const content = message.content.trim();
    const owner = message.author.id === personality.ownerId;

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

        const reaction = reactionRequest(content, owner);

        if (reaction) return reaction;

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

    if (DAVI_NAMES.has(text)) return { category: 'davi' };

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
            category: member.id === personality.ownerId
                ? 'davi'
                : 'member',
            target: member.displayName
        };
    }

    const followup = FOLLOWUPS.get(text);

    if (followup === 'thanks' || followup === 'rude') {
        return { category: followup };
    }

    const reaction = reactionRequest(raw, owner);

    if (reaction) return reaction;

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

function buildHelp(message) {
    return createEmbed(
        '🩸 Akane • Chat Help',
        [
            'Type **akane** or **აკანე** followed by your request.',
            'No slash needed. All replies are in English.'
        ].join('\n')
    ).setThumbnail(
        message.client.user.displayAvatarURL({ size: 256 })
    ).addFields(
        {
            name: 'BASIC REQUESTS',
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
                '`akane secret` — A character secret',
                '`akane stop` — Close your current conversation'
            ].join('\n')
        },
        {
            name: 'TRY TALKING TO ME',
            value: [
                '`akane who are you?`',
                '`akane are you angry?`',
                '`akane be my gf`',
                '`akane you are just a bot`',
                '`აკანე ბოდიში`',
                'These use recognized phrases, not free-form AI.'
            ].join('\n')
        },
        {
            name: 'CONTINUE WITH REPLY',
            value: [
                'Reply to my latest response to **you**, within **2 minutes**.',
                '`thanks` / `მადლობა` · `rude` / `უხეში ხარ`',
                '`really?` / `მართლა?` · `why?` / `რატომ?`',
                '`yes` / `no` or `კი` / `არა` — when I ask.',
                'Recognized flirting, jokes, apologies and questions also work.',
                '`stop` / `გაჩერდი` — close the conversation.'
            ].join('\n')
        },
        {
            name: 'TIMING',
            value: [
                '**10 seconds** between your requests.',
                '**5 seconds** between channel responses.',
                '`akane stop` clears your conversation immediately;',
                'its confirmation still follows the cooldown.'
            ].join('\n')
        }
    );
}

function contextualReply(request) {
    const warm = [
        'owner',
        'davi',
        'reaction_ownerFlirt'
    ].includes(request.context);

    if (request.category === 'really') {
        if (warm) {
            return 'Yes, Davi. You make my favoritism embarrassingly easy.';
        }

        const answers = {
            nice: 'Yes. Take the compliment before I make it awkward.',
            roast: 'It was a joke you requested, not a serious assessment.',
            rate: 'The score is random. My dramatic delivery is intentional.',
            luck: 'It is a pretend prediction, not a forecast.'
        };

        return answers[request.context]
            ?? 'The attitude is part of the character. The reply is scripted.';
    }

    if (warm) {
        return 'Because you get the softer version, Davi. Do not ruin my reputation.';
    }

    const reasons = {
        nice: 'Because you asked for a compliment. No investigation required.',
        roast: 'Because you requested a playful roast. It is not a judgment of your worth.',
        rate: 'Because this is a randomly chosen score for entertainment.',
        luck: 'Because theatrical predictions are fun, not reliable forecasts.',
        tip: 'It is a practical suggestion, not a universal rule. Use it when it fits.',
        member: 'That is my theatrical cold greeting, not a claim about the person.',
        mood: 'My mood is fictional. The sarcasm is scripted.',
        secret: 'A little fictional mystery suits the character.'
    };

    return reasons[request.context]
        ?? 'I matched a recognized phrase to preset character dialogue. No personal grudge included.';
}

function buildResponse(message, request, state) {
    let category = request.category;

    if (category === 'help') {
        return {
            payload: { embeds: [buildHelp(message)] },
            category,
            session: false
        };
    }

    if (category === 'stop') {
        return {
            payload: {
                content: 'Conversation closed. Enjoy the suspicious peace.'
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

        return {
            payload: {
                content: valid
                    ? `My choice: **${escapeMarkdown(
                        options[randomInt(options.length)]
                    )}**. The committee is dismissed.`
                    : 'Use 2–10 options separated by `/`.\n' +
                      'Example: `akane pick pvp / training`'
            },
            category,
            session: false
        };
    }

    if (
        request.followup &&
        ['really', 'why'].includes(category)
    ) {
        return {
            payload: { content: contextualReply(request) },
            category: request.context,
            session: true,
            question: false
        };
    }

    if (
        request.followup &&
        category === 'yes' &&
        ['nice', 'roast', 'davi', 'owner'].includes(request.context)
    ) {
        category = request.context;
    }

    if (
        message.author.id === personality.ownerId &&
        ['general', 'hi', 'nice'].includes(category)
    ) {
        category = 'owner';
    }

    let content = drawReply(state, category);

    if (category === 'rate') {
        content = content.replace('{score}', String(randomInt(1, 11)));
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