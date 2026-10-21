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
const STATE_TTL = 30 * 60_000;

const users = new Map();
const channels = new Map();
const sessions = new Map();

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
        'Akane, handsome. Your Discord bot with a dramatic streak.',
        'I’m Akane, Davi. A fictional character using preset replies.'
    ],

    bot: [
        'Yes, handsome. A bot playing a character—and saving a warm reply for you.',
        'I am, Davi. Shall we keep our little exchange sweet?'
    ],

    question: [
        'I don’t know that one, handsome. Give me a request from `akane help`.',
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

const DAVI_NAMES = new Set([
    'davi',
    'daviti',
    'დავი',
    'დავითი'
]);

const aliases = new Map();

function normalize(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/gu, '')
        .replace(/[’‘]/gu, "'")
        .trim()
        .replace(/[!?.,…:;]+$/u, '')
        .trim()
        .replace(/\s+/gu, ' ');
}

function addAliases(category, values) {
    for (const value of values) {
        aliases.set(normalize(value), category);
    }
}

addAliases('hi', [
    'hi', 'hello', 'hey', 'გამარჯობა', 'სალამი'
]);

addAliases('mood', [
    'mood', 'how are you', 'how are you doing',
    'როგორ ხარ', 'განწყობა'
]);

addAliases('nice', [
    'nice', 'compliment', 'compliment me',
    'კომპლიმენტი', 'კომპლიმენტი მითხარი'
]);

addAliases('roast', [
    'roast', 'roast me', 'გამეხუმრე'
]);

addAliases('tip', [
    'tip', 'advice', 'give me advice', 'რჩევა'
]);

addAliases('pick', ['pick', 'choose', 'აირჩიე']);
addAliases('rate', ['rate', 'rate me', 'შეფასება', 'შემაფასე']);
addAliases('luck', ['luck', 'იღბალი']);
addAliases('secret', ['secret', 'საიდუმლო']);
addAliases('help', ['help', 'დახმარება']);
addAliases('stop', ['stop', 'გაჩერდი']);
addAliases('thanks', ['thanks', 'thank you', 'მადლობა']);
addAliases('rude', ['rude', 'you are rude', 'უხეში ხარ']);
addAliases('really', ['really', 'მართლა']);
addAliases('why', ['why', 'რატომ']);
addAliases('yes', ['yes', 'yeah', 'კი', 'დიახ']);
addAliases('no', ['no', 'nope', 'არა']);

function sessionKey(message) {
    return `${message.guildId}:${message.channelId}:${message.author.id}`;
}

function cleanExpired(now) {
    for (const [key, expiry] of users) {
        if (expiry <= now) users.delete(key);
    }

    for (const [key, session] of sessions) {
        if (session.expiresAt <= now) sessions.delete(key);
    }

    for (const [key, state] of channels) {
        if (!state.busy && now - state.lastUsed >= STATE_TTL) {
            channels.delete(key);
        }
    }
}

function drawReply(state, category) {
    const requested = replies[category];
    const key = requested?.length ? category : 'fallback';
    const pool = replies[key];

    if (!Array.isArray(pool) || !pool.length) {
        throw new Error(`Missing Akane reply pool: ${key}`);
    }

    let bag = state.bags.get(key);

    if (!bag?.remaining.length) {
        const remaining = pool.map((_, index) => index);

        for (let i = remaining.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
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
        state.bags.set(key, bag);
    }

    const index = bag.remaining.pop();
    bag.last = index;

    return pool[index];
}

function getSession(message, now) {
    const session = sessions.get(sessionKey(message));

    return session?.expiresAt > now ? session : null;
}

function parseRequest(message, now) {
    const content = String(message.content ?? '').trim();

    const trigger = content.match(
        /^(?:akane|აკანე)(?=$|[\s\p{P}\p{S}])[\s,:;.!?…]*(.*)$/isu
    );

    const session = getSession(message, now);

    const replying = Boolean(
        session &&
        message.reference?.messageId === session.messageId
    );

    // Ordinary server messages do not start a conversation.
    if (!trigger && !replying) return null;

    const raw = trigger ? trigger[1].trim() : content;
    const text = normalize(raw);

    const context = session?.category ?? null;

    if (!text || /^[\s\p{P}\p{S}]*$/u.test(text)) {
        return { category: 'general' };
    }

    if (DAVI_NAMES.has(text)) {
        return { category: 'davi' };
    }

    const mention = raw.match(/^<@!?(\d+)>[.!?…]*$/u);

    if (mention) {
        const id = mention[1];
        const target = message.mentions.members?.get(id);
        const user = message.mentions.users?.get(id);

        if (!target && !user) {
            return { category: 'fallback' };
        }

        return {
            category: id === OWNER_ID ? 'davi' : 'member',
            target: target?.displayName ?? user.username
        };
    }

    const choice = raw.match(/^(?:pick|choose|აირჩიე)\s+(.+)$/isu);

    if (choice) {
        return {
            category: 'pick',
            argument: choice[1]
        };
    }

    const category = aliases.get(text);

    if (category) {
        if (['yes', 'no'].includes(category)) {
            if (!session?.question) {
                return { category: 'clarify' };
            }

            return {
                category,
                context,
                followup: true
            };
        }

        if (['why', 'really'].includes(category)) {
            return {
                category: context ? category : 'clarify',
                context,
                followup: Boolean(context),
                question: session?.question ?? false
            };
        }

        return { category };
    }

    const reaction = detectReaction(raw);

    if (reaction && reactionPools[reaction]?.length) {
        return { category: `reaction_${reaction}` };
    }

    // Unknown sentences are never treated as people's names.
    return {
        category: /[?？]/u.test(raw)
            ? 'reaction_question'
            : 'fallback'
    };
}

function buildHelp(message) {
    return createEmbed(
        '🩸 Akane • Chat',
        [
            'Start with **akane** or **აკანე**.',
            'English and Georgian requests • English replies'
        ].join('\n')
    )
        .setThumbnail(
            message.client.user.displayAvatarURL({ size: 256 })
        )
        .addFields(
            {
                name: 'QUICK REQUESTS',
                value: [
                    '`akane hi` — Hello',
                    '`akane nice` — Compliment',
                    '`akane roast` — Playful teasing',
                    '`akane tip` — Advice',
                    '`akane mood` — Mood',
                    '`akane rate` — Random score',
                    '`akane luck` — Pretend prediction',
                    '`akane secret` — Character secret'
                ].join('\n')
            },
            {
                name: 'PEOPLE & CHOICES',
                value: [
                    '`akane @member` — Reaction to a member',
                    '`akane davi` — About Davi',
                    '`akane pick pvp / training` — Choose',
                    'Also: `daviti`, `დავი`, `დავითი`'
                ].join('\n')
            },
            {
                name: 'CONTINUE',
                value: [
                    'Reply to my latest answer to you within **2 minutes**.',
                    'Try `why`, `really`, `thanks`, or another request.',
                    '`yes` / `no` work when I ask a yes-or-no question.',
                    '`akane stop` — Close your conversation',
                    '`აკანე როგორ ხარ` · `აკანე მადლობა`',
                    'Wait **10 seconds** between requests; channel cooldown: **5 seconds**.',
                    'Preset character dialogue; unfamiliar questions may need a clearer request.'
                ].join('\n')
            }
        );
}

function ownerCategory(category) {
    const mapping = {
        davi: 'nice',
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

    const key = `owner_${mapping[category] ?? category}`;

    return replies[key]?.length ? key : 'owner_general';
}

function contextualReply(request, owner) {
    const context = request.context;

    const answers = {
        nice: [
            'You asked for something nice. I decided to oblige.',
            'Yes. Accept the compliment before you turn it into an interview.'
        ],
        roast: [
            'You asked me to tease you. That was the playful version.',
            'It was a joke, not your biography. You’re allowed to laugh.'
        ],
        rate: [
            'The score is random. There is no hidden assessment behind it.',
            'Really random. The imaginary judges don’t keep records.'
        ],
        luck: [
            'A little pretend prediction. Enjoy it without planning around it.',
            'It’s theatre, not a forecast. A charming distinction.'
        ],
        tip: [
            'It’s a suggestion. Keep what fits your situation.',
            'Yes—as advice to consider, rather than an order.'
        ],
        davi: [
            'Because Davi gets the softer side of my attitude.',
            'Yes. I was saying something lovely about Davi.'
        ],
        member: [
            'A dramatic introduction. Not a serious assessment of that member.',
            'Just a little attitude for the introduction.'
        ],
        reaction_apology: [
            'You apologized. We can leave the argument behind.',
            'We’re fine. You don’t need a second apology.'
        ],
        reaction_romance: [
            'A little flirting can stay a joke without becoming a commitment.',
            'Yes. A bold line doesn’t automatically get a yes.'
        ],
        reaction_possessive: [
            'Attention and ownership are different things.',
            'Yes. Keep the joke charming.'
        ],
        reaction_bot: [
            'Because I am a Discord bot playing a character.',
            'Yes. A fictional personality, not a human behind the messages.'
        ],
        reaction_identity: [
            'You asked who I am. That was my introduction.',
            'Yes. Akane, your server’s rather dramatic bot.'
        ],
        reaction_question: [
            'I don’t know that answer. I’d rather say so than invent one.',
            'Yes. That question is outside the replies I understand.'
        ]
    };

    const pair = answers[context];
    const index = request.category === 'why' ? 0 : 1;

    let content = pair?.[index] ?? (
        request.category === 'why'
            ? 'A little teasing is part of the character. Nothing personal.'
            : 'Mm-hm. The dramatic delivery was extra.'
    );

    if (owner) {
        if (['nice', 'davi', 'general', 'hi'].includes(context)) {
            content = request.category === 'why'
                ? 'Because being sweet to you comes rather easily, handsome.'
                : 'Yes, Davi. Let me be sweet to you without an interrogation.';
        } else {
            content = `Handsome, ${content[0].toLowerCase()}${content.slice(1)}`;
        }
    }

    return content;
}

function buildResponse(message, request, state) {
    const owner = message.author.id === OWNER_ID;
    let category = request.category;

    if (category === 'help') {
        return {
            payload: { embeds: [buildHelp(message)] },
            session: false
        };
    }

    if (category === 'stop') {
        return {
            payload: {
                content: owner
                    ? drawReply(state, 'owner_stop')
                    : 'All right. We’ll leave it here.'
            },
            session: false
        };
    }

    if (category === 'clarify') {
        return {
            payload: {
                content: owner
                    ? 'Which part, handsome? Start a request with `akane`, or reply to my latest answer.'
                    : 'Which part? Give me a request, or reply to my latest answer to you.'
            },
            session: false
        };
    }

    if (category === 'pick') {
        const options = [...new Set(
            (request.argument ?? '')
                .split('/')
                .map(value => value.trim())
                .filter(Boolean)
        )];

        const valid = options.length >= 2 &&
            options.length <= 10 &&
            options.every(value => value.length <= 100);

        const choice = valid
            ? escapeMarkdown(options[randomInt(options.length)])
            : null;

        return {
            payload: {
                content: valid
                    ? owner
                        ? `**${choice}**, handsome. That’s my pick.`
                        : `**${choice}**. There. A decision.`
                    : 'Give me 2–10 choices separated by `/`.\n' +
                      '`akane pick pvp / training`'
            },
            category: 'pick',
            session: valid,
            question: false
        };
    }

    if (
        request.followup &&
        ['why', 'really'].includes(category)
    ) {
        return {
            payload: {
                content: contextualReply(request, owner)
            },
            category: request.context,
            session: true,
            question: request.question
        };
    }

    if (
        request.followup &&
        category === 'yes' &&
        ['nice', 'roast', 'davi'].includes(request.context)
    ) {
        category = request.context;
    }

    const pool = owner && !['tip', 'member'].includes(category)
        ? ownerCategory(category)
        : category;

    let content = drawReply(state, pool);

    if (category === 'rate') {
        content = content.replace(
            /\{score\}/gu,
            String(randomInt(1, 11))
        );
    }

    if (owner && category === 'tip') {
        content = `A little thought for you, handsome:\n\n${content}`;
    }

    if (owner && category === 'member') {
        content = `For you, Davi, a little dramatic introduction:\n\n${content}`;
    }

    if (request.target) {
        content = `**${escapeMarkdown(
            request.target.slice(0, 80)
        )}**\n${content}`;
    }

    return {
        payload: { content },
        category,
        session: true,
        question: content.includes('Reply yes or no.')
    };
}

function plainHelp() {
    return [
        '**Akane • Chat**',
        '`akane hi` · `nice` · `roast` · `tip` · `mood`',
        '`akane rate` · `luck` · `secret`',
        '`akane @member` · `akane davi`',
        '`akane pick pvp / training`',
        'Reply to my latest answer within 2 minutes.',
        'Try `why`, `really`, `thanks`, or another request.',
        '`yes` / `no` work when I ask.',
        '`akane stop` — Close the conversation.',
        'Use `akane` or `აკანე`; replies are English.',
        '10-second user cooldown; 5-second channel cooldown.',
        'Preset character dialogue.'
    ].join('\n');
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

    try {
        const request = parseRequest(message, now);

        if (!request) return false;

        const key = sessionKey(message);

        // Stop always clears context, even during cooldown.
        if (request.category === 'stop') {
            sessions.delete(key);
        }

        const bot = message.guild.members.me;
        const permissions = bot
            ? message.channel.permissionsFor(bot)
            : null;

        const sendPermission = message.channel.isThread()
            ? PermissionFlagsBits.SendMessagesInThreads
            : PermissionFlagsBits.SendMessages;

        if (!permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            sendPermission
        ])) {
            return false;
        }

        let state = channels.get(message.channelId);

        if (!state) {
            state = {
                busy: false,
                until: 0,
                lastUsed: now,
                bags: new Map()
            };

            channels.set(message.channelId, state);
        }

        const userKey = `${message.guildId}:${message.author.id}`;

        if (
            state.busy ||
            now < state.until ||
            now < (users.get(userKey) ?? 0)
        ) {
            return false;
        }

        state.busy = true;
        state.lastUsed = now;

        const expiry = now + USER_COOLDOWN;
        users.set(userKey, expiry);

        try {
            const response = buildResponse(message, request, state);

            if (
                response.payload.embeds &&
                !permissions.has(PermissionFlagsBits.EmbedLinks)
            ) {
                response.payload = { content: plainHelp() };
            }

            const sent = await message.reply({
                ...response.payload,
                allowedMentions: {
                    parse: [],
                    repliedUser: false
                }
            });

            sessions.delete(key);

            if (response.session) {
                sessions.set(key, {
                    messageId: sent.id,
                    category: response.category,
                    question: response.question ?? false,
                    expiresAt: Date.now() + SESSION_TTL
                });
            }

            return true;
        } catch (error) {
            // A failed send does not consume the user's cooldown.
            if (users.get(userKey) === expiry) {
                users.delete(userKey);
            }

            throw error;
        } finally {
            state.busy = false;
            state.lastUsed = Date.now();
            state.until = state.lastUsed + CHANNEL_COOLDOWN;
        }
    } catch (error) {
        console.error('Akane reply failed:', error);
        return false;
    }
}

module.exports = { handleAkaneReply };