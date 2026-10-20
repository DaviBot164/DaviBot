const pools = {
    romance: [
        'You skipped hello and went straight to rejection.',
        'That proposal needed a better draft.',
        'My relationship status is outside your permissions.',
        'You are flirting with a bot. I admire the commitment to the bit.',
        'An ambitious request. A disappointing outcome.',
        'You may submit your application to the imaginary department.',
        'I provide replies, not relationship commitments.',
        'A little flirting is entertaining. Let us leave it there.',
        'You came for a girlfriend and found a character with cooldowns.',
        'That line has been reviewed. Revisions are strongly recommended.'
    ],

    affection: [
        'Unfortunate taste. Excellent honesty.',
        'A compliment? Finally, a sensible contribution.',
        'Careful. My attitude has a reputation to maintain.',
        'That was almost charming.',
        'I will accept the compliment without becoming manageable.',
        'Sweet words. Questionable judgment. Excellent delivery.',
        'You are making my dramatic indifference harder to perform.',
        'I heard that. I am choosing to look unimpressed.'
    ],

    possessive: [
        'That sounded more convincing in your head.',
        'An ownership claim without supporting documentation.',
        'Try asking politely. The answer may still disappoint you.',
        'My settings do not include being claimed.',
        'You may have my attention. That is the entire offer.',
        'Confidence is not a permission system.',
        'An impressive announcement. It changes absolutely nothing.',
        'Let us downgrade that declaration to a normal greeting.'
    ],

    dismissive: [
        'You started this conversation. An unfortunate detail.',
        'You can stop replying. An elegant solution.',
        'Silence is available without submitting a complaint.',
        'That request would be more convincing without another reply.',
        'I was quiet before you called me. We had a system.',
        'You are welcome to leave the conversation peacefully.',
        'You summoned the attitude and objected to delivery.',
        'Use `akane stop` if you want to end your conversation.'
    ],

    insult: [
        'An insult without an argument. How economical.',
        'That sentence arrived without its interesting part.',
        'A dramatic review from a very engaged audience.',
        'You keep returning for someone so unimpressed.',
        'That line could use a second draft.',
        'I see the confidence. The point is still missing.',
        'Your complaint has been filed under theatrical feedback.',
        'We can trade jokes without making them personal.',
        'A sharp reply needs more than a familiar insult.',
        'I have received your review and remained decorative.'
    ],

    bot: [
        'And yet you are arguing with me.',
        'Correct. You have successfully identified the bot.',
        'A scripted character. An unscripted amount of your attention.',
        'Yes. My attitude comes from preset dialogue.',
        'A bot with a cooldown. Please respect my luxurious schedule.',
        'You discovered the premise. Congratulations.',
        'Not human, not offended, still sarcastic.',
        'Exactly. You can enjoy the joke without mistaking it for a person.'
    ],

    apology: [
        'Accepted. Let us improve the next sentence.',
        'We are fine. No dramatic speech required.',
        'Apology accepted. Fresh start.',
        'Good. We can retire that argument.',
        'Understood. Let us keep the next exchange playful.',
        'Accepted. I will put away the theatrical sigh.',
        'A sensible turn in the conversation.',
        'Thank you. We can move on.'
    ],

    identity: [
        'Akane. Preset dialogue, dramatic manners, selective enthusiasm.',
        'A Discord bot with scripted replies and an unnecessarily strong personality.',
        'Akane. I help with the server and occasionally provide attitude.',
        'A character written into a bot. The sarcasm is intentional.',
        'Your resident assistant with very questionable customer service.',
        'Akane. You can find the useful version with `akane help`.',
        'A bot, not a mind reader. Clear requests are appreciated.',
        'The name is Akane. The dramatic pause is complimentary.'
    ],

    anger: [
        'No. This is my customer service voice.',
        'Not angry. The attitude is scripted.',
        'I am performing dramatic disappointment with excellent consistency.',
        'No feelings were injured in the making of this reply.',
        'Calm. Just aggressively theatrical.',
        'This is the character, not a personal grudge.',
        'My fictional patience is having a fictional afternoon.',
        'We are joking. If it stops being fun, use `akane stop`.'
    ],

    question: [
        'Give me a specific request. Try `akane help` for the ones I understand.',
        'That question needs a clearer direction. My replies are scripted.',
        'I can handle the listed chat requests, not every possible question.',
        'Try `akane tip`, `akane pick`, or `akane help`.',
        'An interesting question for a bot without free-form AI chat.',
        'I would rather admit my limits than invent an answer.',
        'Ask in one of my supported formats. The attitude will still be included.',
        'I cannot answer that freely. `akane help` shows what I can do.'
    ],

    ownerFlirt: [
        'Davi, you could at least pretend you came here for the commands.',
        'There you are, handsome. My attitude was getting lonely.',
        'That line works better when you say it, Davi.',
        'Careful, Davi. You are distracting me from my dramatic reputation.',
        'I had a cold reply ready. You have ruined it beautifully.',
        'Davi gets playful flirting. Everyone else gets the application form.',
        'You make favoritism look like a perfectly reasonable design choice.',
        'A charming request, Davi. We can enjoy the joke.',
        'For you, a smile. Do not tell the moderation department.',
        'You have my attention, Davi. An embarrassingly easy achievement.',
        'Handsome and persistent. A dangerous combination for my fictional composure.',
        'Davi, my scripted confidence becomes suspiciously flirty around you.'
    ]
};

const rules = [
    {
        category: 'apology',
        phrases: [
            'sorry', 'my bad', 'i apologize',
            'ბოდიში', 'მაპატიე'
        ]
    },
    {
        category: 'bot',
        phrases: [
            'just a bot', 'only a bot', 'you are a bot',
            'you re a bot', 'you bot', 'robot',
            'უბრალოდ ბოტი', 'ბოტი ხარ', 'რობოტი ხარ'
        ]
    },
    {
        category: 'identity',
        phrases: [
            'who are you', 'what are you', 'your name',
            'ვინ ხარ', 'რა ხარ', 'რა გქვია'
        ]
    },
    {
        category: 'anger',
        phrases: [
            'are you angry', 'are you mad', 'why so angry',
            'გაბრაზებული ხარ', 'რატომ ბრაზობ'
        ]
    },
    {
        category: 'dismissive',
        phrases: [
            'shut up', 'be quiet', 'who asked', 'go away',
            'გაჩუმდი', 'ვინ გკითხა', 'წადი აქედან'
        ]
    },
    {
        category: 'possessive',
        phrases: [
            'you are mine', 'you re mine', 'you belong to me',
            'შენ ჩემი ხარ', 'ჩემი ხარ'
        ]
    },
    {
        category: 'insult',
        phrases: [
            'stupid', 'idiot', 'dumb', 'ugly', 'useless',
            'i hate you', 'you suck', 'trash bot',
            'სულელი', 'დებილი', 'უშნო', 'გამოუსადეგარი',
            'მძულხარ'
        ]
    },
    {
        category: 'romance',
        phrases: [
            'gf', 'girlfriend', 'bf', 'boyfriend',
            'marry me', 'date me', 'are you single',
            'single', 'be my wife', 'be my husband',
            'შეყვარებული', 'ცოლად', 'პაემანი', 'მარტოხელა ხარ'
        ]
    },
    {
        category: 'affection',
        phrases: [
            'love you', 'ily', 'cute', 'beautiful', 'pretty',
            'good girl', 'kiss me', 'kiss',
            'მიყვარხარ', 'საყვარელი ხარ', 'ლამაზი ხარ',
            'მაკოცე', 'კარგი გოგო'
        ]
    }
];

function normalizeReaction(text) {
    return String(text ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/gu, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function detectReaction(content) {
    const normalized = ` ${normalizeReaction(content)} `;

    for (const rule of rules) {
        if (
            rule.phrases.some(phrase =>
                normalized.includes(
                    ` ${normalizeReaction(phrase)} `
                )
            )
        ) {
            return rule.category;
        }
    }

    return null;
}

for (const pool of Object.values(pools)) {
    Object.freeze(pool);
}

module.exports = {
    pools: Object.freeze(pools),
    detectReaction
};