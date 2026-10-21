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

const dialogue = require('../config/akaneDialogue');

for (const [name, pool] of Object.entries(dialogue.pools)) {
    replies[`dialogue_${name}`] = pool;
}
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

// Expanded conversational aliases.
addAliases('hi', [
    'hey there',
    'hello there',
    'hello again',
    'hi again',
    'hey akane',
    'სალამი აკანე',
    'გამარჯობა აკანე',
    'კიდევ გამარჯობა'
]);

addAliases('mood', [
    'how are you today',
    'how is it going',
    "how's it going",
    'how are things',
    'are you okay',
    'are you ok',
    'როგორ მიდის საქმე',
    'როგორ მიდის საქმეები',
    'დღეს როგორ ხარ',
    'კარგად ხარ'
]);

addAliases('thanks', [
    'thanks a lot',
    'thanks so much',
    'thank you so much',
    'thank you very much',
    'appreciate it',
    'i appreciate it',
    'ty',
    'tysm',
    'დიდი მადლობა',
    'ძალიან დიდი მადლობა',
    'გმადლობ',
    'გმადლობთ'
]);

addAliases('really', [
    'are you serious',
    'seriously',
    'for real',
    'you mean it',
    'do you mean it',
    'მართლა ამბობ',
    'სერიოზულად',
    'სერიოზულად ამბობ'
]);

addAliases('why', [
    'why is that',
    'why do you say that',
    'why would you say that',
    'რატომ ამბობ ამას',
    'რატომ ფიქრობ ასე',
    'რატომ ასე'
]);

addAliases('nice', [
    'say something nice',
    'tell me something nice',
    'give me a compliment',
    'კომპლიმენტი მითხარი',
    'მითხარი რამე კარგი',
    'რამე კარგი მითხარი'
]);

addAliases('roast', [
    'give me a roast',
    'tease me',
    'make fun of me',
    'ცოტა გამეხუმრე'
]);

addAliases('tip', [
    'give me a tip',
    'any advice',
    'some advice please',
    'რჩევა მომეცი',
    'მომეცი რჩევა',
    'რამე მირჩიე'
]);

addAliases('rude', [
    'that was rude',
    'you are being rude',
    'be nicer',
    'be nice to me',
    'easy on me',
    'ცოტა რბილად',
    'ნუ მეუხეშები',
    'ასე უხეშად ნუ მპასუხობ'
]);

addAliases('reaction_apology', [
    'sorry',
    'my bad',
    'i am sorry',
    "i'm sorry",
    'i apologize',
    'ბოდიში',
    'მაპატიე',
    'მაპატიე გთხოვ'
]);

addAliases('reaction_affection', [
    'you are sweet',
    'you are lovely',
    'you are cute',
    'you are beautiful',
    'კარგი ხარ',
    'ძალიან საყვარელი ხარ',
    'ლამაზი ხარ'
]);

addAliases('stop', [
    'bye',
    'goodbye',
    'see you',
    'see you later',
    'talk later',
    'stop please',
    'ნახვამდის',
    'დროებით',
    'მერე გნახავ',
    'შემდეგამდე'
]);
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
    if (!trigger && !replying) {
        const shortFollowup = aliases.get(normalize(content));

        const allowed = [
            'hi',
            'mood',
            'thanks',
            'really',
            'why',
            'nice',
            'roast',
            'tip',
            'rude',
            'reaction_apology',
            'reaction_affection',
            'stop'
        ].includes(shortFollowup);

        if (
            message.reference ||
            !session ||
            now >= (session.implicitUntil ?? 0) ||
            !allowed
        ) {
            return null;
        }
    }

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
            targetId: id,
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
                    'Reply within **2 minutes**, or type `why`, `really`, `thanks` or `rude` directly within **2 minutes**.',
                    'Try `why`, `really`, `thanks`, or another request.',
                    'For yes/no questions, use Reply or `akane yes` / `akane no`.',
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

function contextualReply(request, owner = false) {
    const context = request.context;
    const why = request.category === 'why';

    const answers = {
        general: [
            'You called me. I assumed you had something in mind.',
            'You have my attention. What would you like next?'
        ],
        hi: [
            'You said hello. I decided to be almost welcoming.',
            'Yes. That was a greeting. An unusually civil one.'
        ],
        nice: [
            'You asked for something nice. Let yourself enjoy it.',
            'Yes. Take the compliment before this becomes an interview.'
        ],
        roast: [
            'You asked for playful teasing. That was the joke.',
            'A joke, not your biography. No need to frame it.'
        ],
        rate: [
            'The score is random. There is no hidden assessment.',
            'Entirely random. The imaginary judges keep no records.'
        ],
        luck: [
            'It is a pretend prediction, not a reliable forecast.',
            'Just a little theatre. Do not plan your life around it.'
        ],
        tip: [
            'It is a suggestion to consider. Keep what fits your situation.',
            'Yes, as advice to consider rather than an order.'
        ],
        secret: [
            'A little fictional mystery suits the character.',
            'A character secret. Enjoy the dramatic delivery.'
        ],
        mood: [
            'The mood is part of my character. The sarcasm is deliberate.',
            'A theatrical mood. No actual anger behind the expression.'
        ],
        pick: [
            'I chose randomly from the options you gave me.',
            'Yes. A random choice delivered with unnecessary confidence.'
        ],
        davi: [
            'Davi gets the softer side of my attitude.',
            'Yes. I was saying something lovely about Davi.'
        ],
        member: [
            'That was a dramatic introduction, not a serious assessment.',
            'Just a little attitude for the introduction.'
        ],
        reaction_davi: [
            'Davi has a reserved place in my softer dialogue.',
            'Mention Davi and my manners improve. Quite deliberate.'
        ],
        reaction_davi_insult: [
            'You can criticize what Davi did without insulting him.',
            'Explain the disagreement. A personal insult adds very little.'
        ],
        reaction_apology: [
            'You apologized. We can leave the argument behind.',
            'We are fine. No second apology required.'
        ],
        reaction_romance: [
            'Flirting can stay a joke without becoming a commitment.',
            'A bold proposal does not automatically get a yes.'
        ],
        reaction_affection: [
            'You said something kind. I noticed.',
            'Yes. I accepted the compliment. Stay composed.'
        ],
        reaction_possessive: [
            'Attention and ownership are different things.',
            'Keep the joke charming, not possessive.'
        ],
        reaction_insult: [
            'We can trade jokes without making it genuinely unpleasant.',
            'Try a better joke instead of a sharper insult.'
        ],
        reaction_dismissive: [
            'You can close the conversation with `akane stop`.',
            'We can leave the conversation here if you prefer.'
        ],
        reaction_bot: [
            'I am a Discord bot playing a fictional character.',
            'A fictional personality, not a human behind the messages.'
        ],
        reaction_identity: [
            'You asked who I am. That was my introduction.',
            'Akane, your server bot with a dramatic personality.'
        ],
        reaction_anger: [
            'The expression is theatrical. There is no actual anger.',
            'I am teasing. We can keep it gentler.'
        ],
        reaction_reassurance: [
            'You said something reassuring. I accepted it.',
            'Yes. I noticed the kindness.'
        ],
        reaction_question: [
            'That question is outside the replies I understand.',
            'I would rather admit I do not know than invent an answer.'
        ],
        fallback: [
            'I did not recognize the request. Try `akane help`.',
            'I understood that you called me, but not what you wanted.'
        ],
        thanks: [
            'You thanked me. I acknowledged the good manners.',
            'Yes. You are welcome.'
        ],
        rude: [
            'The sharp tone is part of the character. We can ease up.',
            'We can keep the teasing lighter.'
        ],
        yes: [
            'You answered my question. I acknowledged it.',
            'Your answer was understood.'
        ],
        no: [
            'You said no. We can leave that question behind.',
            'Of course. A no is enough.'
        ]
    };

    if (
        owner &&
        [
            'general', 'hi', 'nice', 'davi',
            'reaction_davi', 'reaction_affection',
            'reaction_romance', 'reaction_possessive'
        ].includes(context)
    ) {
        return why
            ? 'Because a little warmth suits you, handsome.'
            : 'Yes, Davi. No hidden sting. Let me be sweet to you.';
    }

    const content = answers[context]?.[why ? 0 : 1] ?? (
        why
            ? 'Which part did you mean? I may need a clearer request.'
            : 'Which part would you like me to clarify?'
    );

    return owner
        ? `Handsome, ${content[0].toLowerCase()}${content.slice(1)}`
        : content;
}
function buildBaseResponse(message, request, state) {
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
        'Reply within 2 minutes. Short follow-ups also work directly for 2 minutes.',
        'Try `why`, `really`, `thanks`, or another request.',
        '`yes` / `no` work when I ask.',
        '`akane stop` — Close the conversation.',
        'Use `akane` or `აკანე`; replies are English.',
        '10-second user cooldown; 5-second channel cooldown.',
        'Preset character dialogue.'
    ].join('\n');
}

function buildExistingResponse(message, request, state) {
    const owner = message.author.id === OWNER_ID;
    const category = request.category;
    const context = request.context;

    function response(content, nextContext, question = false) {
        return {
            payload: { content },
            category: nextContext,
            session: true,
            question
        };
    }

    if (
        request.followup &&
        ['why', 'really'].includes(category)
    ) {
        return response(
            contextualReply(request, owner),
            context,
            request.question ?? false
        );
    }

    if (
        request.followup &&
        ['yes', 'no'].includes(category)
    ) {
        if (
            category === 'yes' &&
            ['nice', 'roast', 'davi'].includes(context)
        ) {
            return buildBaseResponse(
                message,
                { ...request, category: context, followup: false },
                state
            );
        }

        if (context === 'mood' && category === 'yes') {
            return response(
                (owner
                    ? 'A little thought for you, handsome:\n\n'
                    : 'Then consider this:\n\n') +
                drawReply(state, 'tip'),
                'tip'
            );
        }

        const answers = {
            general: {
                yes: owner
                    ? 'Then stay a little, handsome. What would you like next?'
                    : 'You missed the attitude? What do you want next?',
                no: owner
                    ? 'That is fine, Davi. What brought you here, handsome?'
                    : 'Fair enough. What did you need, then?'
            },
            hi: {
                yes: owner
                    ? 'Lovely, handsome. Tell me what you have in mind.'
                    : 'A promising answer. Keep the good manners.',
                no: owner
                    ? 'A mischievous entrance? Keep it sweet, handsome.'
                    : 'At least you are honest. Keep the mischief harmless.'
            },
            mood: {
                no: owner
                    ? 'No pressure, Davi. We can choose another subject.'
                    : 'Think for yourself. We can change the subject.'
            },
            nice: {
                no: owner
                    ? 'Keep that compliment, handsome. We can change the subject.'
                    : 'One compliment was enough? Remarkable restraint.'
            },
            roast: {
                no: owner
                    ? 'Then I will put the teasing away, sweetheart.'
                    : 'All right. The teasing ends here.'
            },
            davi: {
                no: owner
                    ? 'All right, handsome. I will save the next compliment.'
                    : 'You disagree? My fondness for Davi remains.'
            }
        };

        const content = answers[context]?.[category] ??
            drawReply(state, owner ? `owner_${category}` : category);

        return response(content, category);
    }

    const ownerOverrides = {
        reaction_davi: 'owner_nice',
        reaction_davi_insult: 'owner_tension',
        reaction_reassurance: 'owner_thanks'
    };

    if (owner && ownerOverrides[category]) {
        const content = drawReply(state, ownerOverrides[category]);

        return response(
            content,
            category,
            content.includes('Reply yes or no.')
        );
    }

    return buildBaseResponse(message, request, state);
}
function buildResponse(message, request, state) {
    const mae = message.author.id === dialogue.maeId;
    const owner = message.author.id === OWNER_ID;
    const category = request.category;

    function response(content, context = category, question = false) {
        return {
            payload: { content },
            category: context,
            session: true,
            question
        };
    }

    const namedMae = request.targetId === dialogue.maeId ||
        ['mae', 'მეი', 'მაე'].includes(
            normalize(message.content).replace(
                /^(?:akane|აკანე)[\s,:;.!?…]*/iu,
                ''
            )
        );

    if (namedMae) {
        return response(
            drawReply(state, 'dialogue_maeMention'),
            'member'
        );
    }

    if (!mae) {
        // Preserve Davi's existing warm dialogue.
        const key = `dialogue_${category}`;

        if (
            !owner &&
            !request.followup &&
            replies[key]?.length
        ) {
            return response(drawReply(state, key));
        }

        return buildExistingResponse(message, request, state);
    }

    if (category === 'help') {
        return buildExistingResponse(message, request, state);
    }

    if (category === 'pick') {
        const result = buildExistingResponse(message, request, state);

        if (result.payload.content) {
            result.payload.content = result.payload.content.replace(
                'There. A decision.',
                'That would be my pick, Mae.'
            );
        }

        return result;
    }

    if (
        request.followup &&
        ['why', 'really'].includes(category)
    ) {
        const explanations = {
            nice: [
                'Because you asked for something kind, Mae. Let yourself enjoy it.',
                'Yes, Mae. Take the compliment.'
            ],
            roast: [
                'You asked me to tease you, Mae. I meant it playfully.',
                'Just a gentle joke, Mae. We can stop whenever you like.'
            ],
            rate: [
                'The score is random, Mae. There’s no hidden assessment.',
                'Entirely random. It doesn’t say anything about your worth.'
            ],
            luck: [
                'A pretend prediction for fun, Mae.',
                'Just a playful forecast, Mae. Nothing to rely on.'
            ],
            pick: [
                'I chose randomly from your options, Mae.',
                'Yes, Mae. That was my random pick.'
            ],
            reaction_davi: [
                'Davi gets the warmer side of my character, Mae.',
                'Yes, Mae. I was saying something nice about Davi.'
            ]
        };

        const pair = explanations[request.context];

        const content = pair
            ? pair[category === 'why' ? 0 : 1]
            : category === 'why'
                ? 'Which part did you mean, Mae? I can try to make it clearer.'
                : 'Yes, Mae. Was there a particular part you wanted to ask about?';

        return response(
            content,
            request.context,
            request.question ?? false
        );
    }

    let next = category;

    if (
        request.followup &&
        category === 'yes' &&
        ['nice', 'roast'].includes(request.context)
    ) {
        next = request.context;
    }

    if (next === 'tip') {
        return response(
            `A little thought for you, Mae:\n\n${drawReply(state, 'tip')}`,
            'tip'
        );
    }

    if (['davi', 'reaction_davi', 'reaction_davi_insult'].includes(next)) {
        return response(
            drawReply(
                state,
                next === 'davi' ? 'davi' : next
            ),
            next
        );
    }

    if (next === 'member') {
        return response(
            'I’ll keep introductions civil, Mae. A hello is a good place to start.',
            'member'
        );
    }

    const mapping = {
        reaction_romance: 'romance',
        reaction_possessive: 'romance',
        reaction_affection: 'affection',
        reaction_insult: 'tension',
        reaction_dismissive: 'tension',
        reaction_anger: 'tension',
        rude: 'tension',
        reaction_apology: 'apology',
        reaction_identity: 'identity',
        reaction_bot: 'identity',
        reaction_question: 'fallback',
        reaction_reassurance: 'reassurance',
        clarify: 'fallback'
    };

    const key = `dialogue_mae_${mapping[next] ?? next}`;

    let content = drawReply(
        state,
        replies[key]?.length ? key : 'dialogue_mae_fallback'
    );

    if (next === 'rate') {
        content = content.replace(
            /\{score\}/gu,
            String(randomInt(1, 11))
        );
    }

    if (next === 'stop') {
        return {
            payload: { content },
            session: false
        };
    }

    return response(content, next);
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
                    implicitUntil: Date.now() + SESSION_TTL,
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