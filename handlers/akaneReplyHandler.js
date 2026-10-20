const {
    PermissionFlagsBits,
    escapeMarkdown
} = require('discord.js');

const { randomInt } = require('node:crypto');
const replies = require('../config/akaneReplies');

const USER_COOLDOWN = 10_000;
const CHANNEL_COOLDOWN = 5_000;
const FOLLOWUP_TTL = 2 * 60_000;

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
    ['განწყობა', 'mood'],
    ['როგორ ხარ', 'mood'],

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
    ['დახმარება', 'help']
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
    ['მადლობა', 'thanks']
]);

const HELP = [
    '**AKANE • CHAT GUIDE**',
    '`akane` — Get my attention.',
    '`akane hi` — A greeting. Temper your expectations.',
    '`akane mood` — Check my mood.',
    '`akane nice` — Receive a compliment.',
    '`akane roast` — Request a light roast.',
    '`akane tip` — Get a useful tip.',
    '`akane pick pvp / training` — Let me choose.',
    '`akane davi` — Hear about my favorite exception.',
    '`akane @member` — Request my cold acknowledgment.',
    '`akane rate` — Get a playful random score.',
    '`akane luck` — Get a pretend prediction.',
    '`akane secret` — Hear a little secret.',
    '',
    'Use `აკანე` instead of `akane` if you prefer.',
    'Davi aliases: `davi`, `daviti`, `დავი`, `დავითი`.',
    'Replies are always in English.',
    '',
    'Reply directly to my response within 2 minutes:',
    '`thanks` / `მადლობა` or `rude` / `უხეში ხარ`.',
    'When I ask a question, you can also reply `yes` / `no`',
    'or `კი` / `არა`.',
    '',
    'Cooldown: 10 seconds per member, 5 seconds per channel.'
].join('\n');

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
            const last = remaining.length - 1;

            [remaining[0], remaining[last]] = [
                remaining[last],
                remaining[0]
            ];
        }

        bag = {
            remaining,
            last: bag?.last
        };

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
            sessionId: message.reference.messageId,
            context: session.category
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

    const directAlias = ALIASES.get(text);

    if (directAlias) {
        return { category: directAlias };
    }

    const [first, ...rest] = text.split(' ');
    const category = ALIASES.get(first);
    const argument = rest.join(' ');

    if (category === 'pick') {
        return { category, argument };
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

        return member
            ? {
                category: 'member',
                target: member.displayName
            }
            : { category: 'fallback' };
    }

    if (
        !category &&
        /^[\p{L}\p{N}_ -]{1,64}$/u.test(text)
    ) {
        return {
            category: 'member',
            target: raw
        };
    }

    return { category: 'fallback' };
}

function buildResponse(request, state) {
    if (request.category === 'help') return HELP;

    if (request.category === 'pick') {
        const options = [
            ...new Set(
                (request.argument ?? '')
                    .split('/')
                    .map(option => option.trim())
                    .filter(Boolean)
            )
        ];

        if (
            options.length < 2 ||
            options.length > 10 ||
            options.some(option => option.length > 100)
        ) {
            return 'Give me 2–10 options separated by `/`. ' +
                'Example: `akane pick pvp / training`.';
        }

        return `My choice: **${escapeMarkdown(
            options[randomInt(options.length)]
        )}**. Try not to form a committee about it.`;
    }

    let category = request.category;

    if (category === 'yes' && request.context === 'davi') {
        category = 'davi';
    } else if (
        category === 'yes' &&
        ['nice', 'roast'].includes(request.context)
    ) {
        category = request.context;
    }

    let text = drawReply(state, category);

    if (category === 'rate') {
        text = text.replace('{score}', String(randomInt(1, 11)));
    }

    if (request.target) {
        text = `**${escapeMarkdown(
            request.target.slice(0, 80)
        )}**\n${text}`;
    }

    return { text, category };
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
    const channelKey = message.channelId;

    let state = channels.get(channelKey);

    if (!state) {
        state = {
            until: 0,
            busy: false,
            bags: new Map()
        };

        channels.set(channelKey, state);
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
        const response = buildResponse(request, state);
        const text = typeof response === 'string'
            ? response
            : response.text;

        const sent = await message.reply({
            content: text,
            allowedMentions: {
                parse: [],
                repliedUser: false
            }
        });

        if (request.sessionId) {
            sessions.delete(request.sessionId);
        }

        const category = typeof response === 'string'
            ? request.category
            : response.category;

        if (!['help', 'pick', 'fallback'].includes(category)) {
            sessions.set(sent.id, {
                userId: message.author.id,
                channelId: message.channelId,
                category,
                question: text.includes('Reply yes or no.'),
                expiresAt: Date.now() + FOLLOWUP_TTL
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