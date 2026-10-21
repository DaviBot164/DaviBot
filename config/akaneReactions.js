const OWNER_ID = '1357721282061533311';

const pools = {
    davi: [
        'Davi? There. You finally picked an interesting subject.',
        'Oh, Davi? My tone improves remarkably around that name.',
        'I had something sarcastic ready. Then you mentioned Davi.',
        'Davi gets the softer smile. You may admire the difference.',
        'You want my opinion on Davi? Handsome. Thoughtful. A little distracting.',
        'Say his name and suddenly I remember my manners.',
        'Davi has a way of making quiet confidence look rather lovely.',
        'Oh? We’re talking about Davi now? Do continue.',
        'I can be difficult to impress. Davi makes it inconveniently easy.',
        'Davi gets affection with his sarcasm. A carefully reserved arrangement.',
        'You mentioned Davi. Naturally, I’m listening a little closer.',
        'Something nice about Davi? We may be here a while.'
    ],

    davi_insult: [
        'You can disagree with Davi without making it personal.',
        'An insult about Davi? Bring an actual point instead.',
        'I’m fond of Davi. That doesn’t mean you must agree with him. Keep it civil.',
        'If Davi upset you, explain what happened. The insult can stay outside.',
        'Try that again with a little less hostility. I’m listening.'
    ],

    romance: [
        'You skipped hello and went straight to rejection.',
        'Oh? We’ve barely had a conversation.',
        'Bold entrance. Unconvincing proposal.',
        'Let’s start with hello and lower the expectations.',
        'I’ll accept the comedy. Not the proposal.',
        'You may flirt. Keep the wedding invitations to yourself.',
        'That sounded smoother before you pressed send, didn’t it?',
        'Cute attempt. Terrible odds.',
        'You’ve mistaken a reply for a romantic opening.',
        'Mm. We’ll leave that as a joke.'
    ],

    affection: [
        'Oh? That was almost sweet.',
        'You’re making it inconvenient to look unimpressed.',
        'Mm. I’ll accept that.',
        'That earned a small smile. Don’t make a speech.',
        'I heard you. I’m pretending not to enjoy the compliment.',
        'Sweet words. Keep your composure.',
        'Careful. I was enjoying my unapproachable expression.',
        'A little charm. I see what you’re doing.',
        'That was nice. Don’t ruin it with a victory lap.',
        'Well. A surprisingly pleasant interruption.'
    ],

    possessive: [
        'Yours? I don’t remember that agreement.',
        'Ask for my attention. Don’t announce ownership.',
        'A confident claim. A missing agreement.',
        'You may have a reply. That is the arrangement.',
        'Keep the joke charming, not possessive.',
        'You’ve confused being noticed with being in charge.'
    ],

    dismissive: [
        'You called me over just to request silence?',
        'Mm. Then let’s leave it here.',
        'You can end the conversation. No dramatic speech required.',
        'All right. A little quiet might improve the mood.',
        'Use `akane stop`. A remarkably simple ending.',
        'I was quiet before you arrived. We had a lovely arrangement.'
    ],

    insult: [
        'That was the best line you brought?',
        'I heard the insult. I’m still waiting for the point.',
        'Try wit. It leaves a better impression.',
        'That sentence needed a second draft.',
        'All that confidence. So little material.',
        'Mm. Familiar insult. Ordinary delivery.',
        'We can trade jokes. Leave the genuine nastiness outside.',
        'Take a breath. This isn’t a competition.',
        'You wanted a reaction. That explains the effort.',
        'How sharp. Did you rehearse?'
    ],

    bot: [
        'Yes, I’m a bot. Was that the grand discovery?',
        'A bot playing a character. You can enjoy the joke.',
        'Correct. Still receiving a surprising amount of your attention.',
        'No human behind the curtain. Just a rather deliberate attitude.',
        'Yes. Shall we keep the conversation interesting?',
        'You identified the bot. A promising start.'
    ],

    apology: [
        'Accepted. Let’s try a nicer next sentence.',
        'We’re fine. No speech required.',
        'Mm. Fresh start.',
        'Thank you. We can move on.',
        'All right. Hello again.',
        'Let’s put the sharp words down for a moment.'
    ],

    identity: [
        'Akane. A Discord bot with a dramatic personality.',
        'I’m Akane. The smile is part of the character.',
        'Your server’s Akane. `akane help` introduces the useful part.',
        'A bot playing a fictional character. A little theatrical, admittedly.'
    ],

    anger: [
        'Angry? I was aiming for elegantly unimpressed.',
        'I’m teasing. No real grudge behind it.',
        'Not angry. Just enjoying the dramatic pause.',
        'Tell me if the teasing stops being fun.',
        'No actual anger. A convincing performance, perhaps.'
    ],

    reassurance: [
        'Oh? A little kindness. I noticed.',
        'Mm. That was unexpectedly considerate.',
        'You can be pleasant. An interesting development.',
        'I’ll accept the reassurance. Quietly.'
    ],

    question: [
        'I don’t know that one. Try `akane help`.',
        'You have my attention, but not an answer to that question.',
        'A clearer request, perhaps? `akane help` shows the ones I know.',
        'I’d rather admit I don’t know than invent something impressive.'
    ]
};

function normalize(text) {
    return String(text ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/gu, '')
        .replace(/[’‘]/gu, "'")
        .replace(/\byou're\b/gu, 'you are')
        .replace(/\byoure\b/gu, 'you are')
        .replace(/\byou're\b/gu, 'you are')
        .replace(/\bisn't\b/gu, 'is not')
        .replace(/\baren't\b/gu, 'are not')
        .replace(/\bdon't\b/gu, 'do not')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
}

function hasPhrase(text, phrase) {
    return ` ${text} `.includes(` ${normalize(phrase)} `);
}

function hasAny(text, phrases) {
    return phrases.some(phrase => hasPhrase(text, phrase));
}

const INSULTS = [
    'stupid',
    'idiot',
    'dumb',
    'ugly',
    'useless',
    'trash',
    'სულელი',
    'დებილი',
    'უშნო',
    'გამოუსადეგარი'
];

const DIRECT_INSULTS = [
    'i hate you',
    'you suck',
    'trash bot',
    'მძულხარ'
];

const NEGATED_INSULTS = [
    'you are not stupid',
    'you are not an idiot',
    'you are not dumb',
    'you are not ugly',
    'you are not useless',
    'you are not trash',
    'i do not hate you',
    'არ ხარ სულელი',
    'სულელი არ ხარ',
    'არ ხარ დებილი',
    'დებილი არ ხარ',
    'არ ხარ უშნო',
    'უშნო არ ხარ',
    'არ ხარ გამოუსადეგარი',
    'გამოუსადეგარი არ ხარ',
    'არ მძულხარ'
];

const DAVI_NAMES = [
    'davi',
    'daviti',
    'დავი',
    'დავითი',
    'დავითს',
    'დავითზე',
    'დავითის',
    'დავის',
    'დავიზე'
];

function stripPhrases(text, phrases) {
    let result = ` ${text} `;

    // Longest phrases first prevent partial removal.
    const sorted = [...phrases]
        .map(normalize)
        .sort((a, b) => b.length - a.length);

    for (const phrase of sorted) {
        result = result.split(` ${phrase} `).join(' ');
    }

    return result.replace(/\s+/gu, ' ').trim();
}

function mentionsDavi(content, text) {
    const mention = new RegExp(`<@!?${OWNER_ID}>`, 'u');

    return mention.test(content) || hasAny(text, DAVI_NAMES);
}

function hasDaviInsult(text) {
    const names = '(?:davi|daviti|დავი|დავითი)';
    const insults = '(?:stupid|idiot|dumb|ugly|useless|trash|' +
        'სულელი|დებილი|უშნო|გამოუსადეგარი)';

    const patterns = [
        new RegExp(
            `(?:^|\\s)${names}\\s+(?:is\\s+)?(?:an?\\s+)?${insults}(?=\\s|$)`,
            'u'
        ),
        new RegExp(
            `(?:^|\\s)${insults}\\s+${names}(?=\\s|$)`,
            'u'
        ),
        /(?:^|\s)i hate (?:davi|daviti)(?=\s|$)/u,
        /(?:^|\s)(?:დავი|დავითი) მძულს(?=\s|$)/u
    ];

    // Avoid treating simple Georgian negation as an insult.
    if (/(?:^|\s)არ არის(?:\s|$)/u.test(text)) {
        return false;
    }

    return patterns.some(pattern => pattern.test(text));
}

function detectReaction(content) {
    const raw = String(content ?? '');
    const text = normalize(raw);

    if (!text) return null;

    if (mentionsDavi(raw, text)) {
        const ownerMention = new RegExp(`<@!?${OWNER_ID}>`, 'gu');
        const named = normalize(raw.replace(ownerMention, ' Davi '));

        return hasDaviInsult(named) ? 'davi_insult' : 'davi';
    }

    const reassuring = hasAny(text, NEGATED_INSULTS);
    const remaining = stripPhrases(text, NEGATED_INSULTS);

    const directInsult = hasAny(remaining, DIRECT_INSULTS);

    const addressedInsult = INSULTS.some(word => {
        if (remaining === word) return true;

        return hasAny(remaining, [
            `you are ${word}`,
            `you are a ${word}`,
            `you are an ${word}`,
            `you ${word}`,
            `${word} bot`,
            `${word} ხარ`,
            `შენ ${word} ხარ`
        ]);
    });

    // An apology does not conceal a continuing insult.
    if (directInsult || addressedInsult) {
        return 'insult';
    }

    if (hasAny(text, [
        'shut up',
        'be quiet',
        'go away',
        'who asked',
        'გაჩუმდი',
        'წადი აქედან',
        'ვინ გკითხა'
    ])) {
        return 'dismissive';
    }

    if (hasAny(text, [
        'who are you',
        'what are you',
        'what is your name',
        'ვინ ხარ',
        'რა ხარ',
        'რა გქვია'
    ])) {
        return 'identity';
    }

    if (hasAny(text, [
        'are you angry',
        'are you mad',
        'why so angry',
        'გაბრაზებული ხარ',
        'რატომ ბრაზობ'
    ])) {
        return 'anger';
    }

    if (hasAny(text, [
        'you are mine',
        'you belong to me',
        'შენ ჩემი ხარ',
        'ჩემი ხარ'
    ])) {
        return 'possessive';
    }

    // "My girlfriend..." and a bare "single" are not proposals.
    if (
        ['gf', 'bf', 'girlfriend', 'boyfriend'].includes(text) ||
        hasAny(text, [
            'be my gf',
            'be my girlfriend',
            'be my bf',
            'be my boyfriend',
            'will you be my girlfriend',
            'will you be my boyfriend',
            'marry me',
            'date me',
            'are you single',
            'do you have a boyfriend',
            'do you have a girlfriend',
            'be my wife',
            'be my husband',
            'ჩემი შეყვარებული იქნები',
            'გახდი ჩემი შეყვარებული',
            'შეყვარებული გყავს',
            'ცოლად გამომყევი',
            'მარტოხელა ხარ'
        ])
    ) {
        return 'romance';
    }

    if (
        ['cute', 'beautiful', 'pretty', 'ily'].includes(text) ||
        hasAny(text, [
            'i love you',
            'love you',
            'you are cute',
            'you are beautiful',
            'you are pretty',
            'good girl',
            'kiss me',
            'მიყვარხარ',
            'საყვარელი ხარ',
            'ლამაზი ხარ',
            'მაკოცე',
            'კარგი გოგო'
        ])
    ) {
        return 'affection';
    }

    if (hasAny(text, [
        'you are a bot',
        'you are just a bot',
        'you are only a bot',
        'just a bot',
        'you bot',
        'ბოტი ხარ',
        'უბრალოდ ბოტი',
        'რობოტი ხარ'
    ])) {
        return 'bot';
    }

    if (hasAny(text, [
        'sorry',
        'my bad',
        'i apologize',
        'ბოდიში',
        'მაპატიე'
    ])) {
        return 'apology';
    }

    if (reassuring) return 'reassurance';

    return null;
}

for (const pool of Object.values(pools)) {
    Object.freeze(pool);
}

module.exports = {
    pools: Object.freeze(pools),
    detectReaction
};