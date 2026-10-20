const {
    PermissionFlagsBits,
    escapeMarkdown
} = require('discord.js');

const { randomInt } = require('node:crypto');
const { createEmbed } = require('../utils/embeds');

const baseReplies = require('../config/akaneReplies');
const personality = require('../config/akanePersonality');

const replies = {
    ...baseReplies,
    general: personality.general,
    member: personality.member,
    owner: personality.owner,
    davi: [...baseReplies.davi, ...personality.davi]
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
    return text
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

        if (!category) return null;

        if (
            ['yes', 'no'].includes(category) &&
            !session.question
        ) {
            return null;
        }

        return {
            category,
            followup: true,
            context: session.category,
            sessionId: message.reference.messageId
        };
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
            category: member.id === personality.ownerId
                ? 'davi'
                : 'member',
            target: member.displayName
        };
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
    const embed = createEmbed(
        '🩸 Akane • Chat Help',
        [
            'Type these in chat — no `/` needed.',
            'Use **akane** or **აკანე**. Replies are in English.'
        ].join('\n')
    ).addFields(
        {
            name: 'START HERE',
            value: [
                '`akane` — Get my attention',
                '`akane hi` — Say hello',
                '`akane nice` — Get a compliment',
                '`akane roast` — Get a playful roast',
                '`akane tip` — Get advice'
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
                '`akane mood` — Check my mood',
                '`akane rate` — Get a playful random score',
                '`akane luck` — Get a pretend prediction',
                '`akane secret` — Hear a secret',
                '`akane stop` — End your current conversation',
                '`akane help` — Show this guide'
            ].join('\n')
        },
        {
            name: 'CONTINUE WITH REPLY',
            value: [
                'Reply directly to **your own Akane response** within 2 minutes.',
                '`thanks` / `მადლობა`',
                '`rude` / `უხეში ხარ`',
                '`really?` / `მართლა?`',
                '`why?` / `რატომ?`',
                '`yes` / `no` or `კი` / `არა` — only when I ask.',
                '`stop` / `გაჩერდი` — end the conversation.'
            ].join('\n')
        },
        {
            name: 'EXAMPLES & TIMING',
            value: [
                '`აკანე გამარჯობა` · `აკანე რჩევა` · `აკანე დავითი`',
                'Wait **10 seconds** between your requests.',
                'The channel also has a **5-second** cooldown.',
                'I use preset dialogue, not free-form AI chat.'
            ].join('\n')
        }
    ).setThumbnail(
        message.client.user.displayAvatarURL({ size: 256 })
    );

    return { embeds: [embed] };
}

function contextualReply(request) {
    const warm = ['owner', 'davi'].includes(request.context);

    if (request.category === 'really') {
        if (warm) {
            return 'Yes, Davi. You make my favoritism embarrassingly easy.';
        }

        if (request.context === 'nice') {
            return 'Yes. Take the compliment before I make it awkward.';
        }

        if (request.context === 'roast') {
            return 'It was a joke you requested, not a serious assessment.';
        }

        if (request.context === 'rate') {
            return 'The score is random. My dramatic delivery is intentional.';
        }

        if (request.context === 'luck') {
            return 'It is a pretend prediction. Please do not plan your life around it.';
        }

        return 'Really. The attitude was included at no extra charge.';
    }

    if (warm) {
        return 'Because you get the softer version, Davi. Do not ruin my reputation.';
    }

    const reasons = {
        nice: 'Because you asked for a compliment. Accept it without an investigation.',
        roast: 'Because you requested a playful roast. It is not a judgment of your worth.',
        rate: 'Because this is a randomly chosen score for fun, not a real evaluation.',
        luck: 'Because theatrical predictions are entertaining. They are not reliable forecasts.',
        tip: 'The advice is meant as a practical suggestion, not a universal rule. Use it only when it fits your situation.',
        member: 'Because this is my theatrical cold greeting, not a claim about that person.',
        mood: 'Because my mood is part of the character. The sarcasm is scripted.',
        secret: 'Because a little fictional mystery suits the character.'
    };

    return reasons[request.context]
        ?? 'Because a little sarcasm suits me. This is preset character dialogue.';
}

function buildResponse(message, request, state) {
    let category = request.category;

    if (category === 'help') {
        return {
            payload: buildHelp(message),
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

        const content = valid
            ? `My choice: **${escapeMarkdown(
                options[randomInt(options.length)]
            )}**. The committee is dismissed.`
            : 'Use 2–10 options separated by `/`.\n' +
              'Example: `akane pick pvp / training`';

        return {
            payload: { content },
            category,
            session: false
        };
    }

    if (request.followup && ['really', 'why'].includes(category)) {
        return {
            payload: { content: contextualReply(request) },
            category: request.context,
            session: true
        };
    }

    if (
        request.followup &&
        category === 'yes' &&
        ['nice', 'roast', 'davi', 'owner'].includes(request.context)
    ) {
        category = request.context;
    }

    const owner = message.author.id === personality.ownerId;

    if (owner && ['general', 'hi', 'nice'].includes(category)) {
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
        session: category !== 'fallback'
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

    if (
        request.category === 'help' &&
        !permissions.has(PermissionFlagsBits.EmbedLinks)
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
                question: response.payload.content.includes(
                    'Reply yes or no.'
                ),
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