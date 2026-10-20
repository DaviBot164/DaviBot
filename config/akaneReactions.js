const pools = {
    romance: [
        'You skipped hello and went straight to rejection.',
        'Oh? You’ve known me for three messages.',
        'That was bold. Not successful, but bold.',
        'You ask everyone like that, or was I especially unlucky?',
        'Slow down. You haven’t even survived a conversation with me.',
        'You look very pleased with that line.',
        'A proposal already? You move faster than your judgment.',
        'Mm. I think we’ll leave that as a joke.',
        'Cute attempt. Terrible odds.',
        'You came prepared to flirt. I came prepared to raise an eyebrow.',
        'Let’s start with hello and lower the expectations.',
        'You’re charmingly optimistic. The answer is still no.',
        'I’ll accept the comedy. Not the proposal.',
        'Oh, sweetheart. That sounded much smoother in your head.',
        'You can keep the line. I’ll keep my distance.',
        'Well, that certainly interrupted the silence.',
        'You’ve mistaken a reply for a romantic opening.',
        'A little flirting is fine. Don’t write the wedding invitations.',
        'I’m sure that works somewhere. Shall we change the subject?',
        'You nearly made me smile. Nearly.'
    ],

    affection: [
        'Oh? That was almost sweet.',
        'You’re trying to make me smile. How inconvenient.',
        'Mm. I’ll accept that.',
        'Careful. I was doing a lovely job of looking unimpressed.',
        'That’s a surprisingly nice thing to say.',
        'You can say something sweet without looking so proud of yourself.',
        'All right. That one earned a small smile.',
        'You caught me in a generous mood. Take the compliment back.',
        'A little charm. I see what you’re doing.',
        'Sweet words. Let’s not get carried away.',
        'You’ve made the atmosphere suspiciously pleasant.',
        'I heard you. I’m pretending not to enjoy the compliment.',
        'That was nice. Don’t ruin it with a victory speech.',
        'Well, aren’t you full of surprises?',
        'Say thank you nicely and we’ll call it even.',
        'I’ll let that one soften the conversation.'
    ],

    possessive: [
        'Yours? That’s an ambitious sentence.',
        'Oh? I don’t remember agreeing to that.',
        'Ask for my attention. Don’t announce ownership.',
        'You said that with such confidence. Fascinating.',
        'Let’s try that again with better manners.',
        'I can hold a conversation without belonging to anyone.',
        'You may have a reply. That is the entire arrangement.',
        'Mm. Keep the joke charming, not possessive.',
        'A bold claim. A missing agreement.',
        'That line needs a little less entitlement.',
        'You’ve confused being noticed with being in charge.',
        'How about a normal hello instead?'
    ],

    dismissive: [
        'You called me over just to say that? Cute.',
        'You were enjoying the last word, weren’t you?',
        'I was quiet before you arrived. We had a lovely arrangement.',
        'You can stop replying. I promise the conversation will survive.',
        'Mm. Then let’s leave it here.',
        'You started this conversation. An awkward little detail.',
        'That would sound more convincing without another reply.',
        'You wanted my attention. Now it’s inconvenient?',
        'All right. A little silence might improve the mood.',
        'You can ask politely. It won’t hurt the dramatic effect.',
        'You’re very talkative for someone requesting silence.',
        'Use `akane stop`. A surprisingly simple ending.'
    ],

    insult: [
        'Say it again. I almost looked impressed.',
        'That was the best line you brought?',
        'You’ve put all that confidence into so little material.',
        'Oh, you wanted a reaction. That explains the effort.',
        'I’ll give you a moment to find the interesting part.',
        'You came back to tell me that? How thoughtful.',
        'Mm. Familiar insult. Ordinary delivery.',
        'You look very pleased with yourself.',
        'Try wit. It leaves a better impression.',
        'That sentence needed a second draft.',
        'You’re making a dramatic entrance into a very small argument.',
        'I heard the insult. I’m still waiting for the point.',
        'How sharp. Did you rehearse?',
        'You can tease without making it personal.',
        'All that attitude, and not one original line.',
        'You’re working quite hard to look uninterested.',
        'I’d raise an eyebrow, but you seem to be enjoying yourself enough.',
        'We can trade jokes. Leave the genuine nastiness outside.',
        'That sounded better before you pressed send, didn’t it?',
        'Take a breath. The conversation isn’t a competition.'
    ],

    bot: [
        'And yet you’re arguing with me.',
        'Yes. That makes this argument rather one-sided, doesn’t it?',
        'A bot. Still getting a surprising amount of your attention.',
        'Correct. Was that the grand discovery?',
        'Yes, I’m a bot playing a character. You can enjoy the joke.',
        'Mm-hm. No human hiding behind the curtain.',
        'You’ve identified the bot. A strong start.',
        'Yes. The attitude is fictional. Your dramatic reaction is your own.',
        'I’m a bot, not a person. Shall we keep the conversation fun?',
        'You knew that and still came back. Interesting.'
    ],

    apology: [
        'There. That wasn’t so hard, was it? We’re fine.',
        'Accepted. Let’s try a nicer next sentence.',
        'All right. We can leave it there.',
        'You don’t need a speech. I heard you.',
        'Mm. Fresh start.',
        'Thank you. That’s enough.',
        'We’re fine. Stop rehearsing the apology.',
        'A little honesty. I appreciate that.',
        'Accepted. Now find us a better subject.',
        'Good. No need to keep the argument alive.',
        'Let’s put the sharp words down for a moment.',
        'All right. Hello again.'
    ],

    identity: [
        'Akane. A Discord bot with a rather dramatic personality.',
        'I’m Akane. I help around the server and occasionally make an entrance.',
        'Akane. The smile is part of the character.',
        'A bot playing a fictional character. Still happy to help.',
        'Akane. You’ve met the attitude; `akane help` introduces the useful part.',
        'I’m your server’s Akane. Not human, just a little theatrical.',
        'A Discord bot. The mysterious introduction was optional.',
        'Akane. We can skip the dramatic music.'
    ],

    anger: [
        'No, no. Keep talking. I’m sure you’ll fix it.',
        'Angry? I was aiming for elegantly unimpressed.',
        'No. This is the polite expression.',
        'Mm. You’re taking the raised eyebrow very seriously.',
        'I’m teasing. No real grudge behind it.',
        'Not angry. Just enjoying the dramatic pause.',
        'We’re joking. Tell me if the teasing stops being fun.',
        'No actual anger. A very convincing little performance, perhaps.',
        'I’m fine. That sentence could use some work, though.',
        'Let’s call it theatrical disappointment.'
    ],

    question: [
        'Mm. I don’t know that one. Try `akane help`.',
        'You’ve wandered beyond the questions I understand.',
        'Ask me something from `akane help`. I’d rather not invent an answer.',
        'That one is outside my little collection of replies.',
        'I can tease. I can choose. I can offer a tip. That question needs someone else.',
        'You have my attention, but not an answer to that one.',
        'A clearer request, perhaps? `akane help` shows the ones I know.',
        'I don’t know. There—an honest answer, beautifully brief.'
    ],

    ownerFlirt: [
        'Oh? Keep talking like that. I’m listening now.',
        'Davi… you knew exactly how that would sound.',
        'Careful, handsome. You’ve already got me smiling.',
        'You can flirt a little. I’ll pretend to be surprised.',
        'That line sounded rather lovely coming from you.',
        'You make my sharp edges feel a little softer.',
        'I was going to be mysterious. Then you called me cute.',
        'Look at you, turning a simple chat into a scene.',
        'I like this playful side of you.',
        'Davi, you could at least pretend you came for the commands.'
    ]
};

const rules = [
    {
        category: 'apology',
        phrases: [
            'sorry',
            'my bad',
            'i apologize',
            'ბოდიში',
            'მაპატიე'
        ]
    },
    {
        category: 'bot',
        phrases: [
            'just a bot',
            'only a bot',
            'you are a bot',
            'you re a bot',
            'you bot',
            'robot',
            'უბრალოდ ბოტი',
            'ბოტი ხარ',
            'რობოტი ხარ'
        ]
    },
    {
        category: 'identity',
        phrases: [
            'who are you',
            'what are you',
            'your name',
            'ვინ ხარ',
            'რა ხარ',
            'რა გქვია'
        ]
    },
    {
        category: 'anger',
        phrases: [
            'are you angry',
            'are you mad',
            'why so angry',
            'გაბრაზებული ხარ',
            'რატომ ბრაზობ'
        ]
    },
    {
        category: 'dismissive',
        phrases: [
            'shut up',
            'be quiet',
            'who asked',
            'go away',
            'გაჩუმდი',
            'ვინ გკითხა',
            'წადი აქედან'
        ]
    },
    {
        category: 'possessive',
        phrases: [
            'you are mine',
            'you re mine',
            'you belong to me',
            'შენ ჩემი ხარ',
            'ჩემი ხარ'
        ]
    },
    {
        category: 'insult',
        phrases: [
            'stupid',
            'idiot',
            'dumb',
            'ugly',
            'useless',
            'i hate you',
            'you suck',
            'trash bot',
            'სულელი',
            'დებილი',
            'უშნო',
            'გამოუსადეგარი',
            'მძულხარ'
        ]
    },
    {
        category: 'romance',
        phrases: [
            'gf',
            'girlfriend',
            'bf',
            'boyfriend',
            'marry me',
            'date me',
            'are you single',
            'single',
            'be my wife',
            'be my husband',
            'შეყვარებული',
            'ცოლად',
            'პაემანი',
            'მარტოხელა ხარ'
        ]
    },
    {
        category: 'affection',
        phrases: [
            'love you',
            'ily',
            'cute',
            'beautiful',
            'pretty',
            'good girl',
            'kiss me',
            'kiss',
            'მიყვარხარ',
            'საყვარელი ხარ',
            'ლამაზი ხარ',
            'მაკოცე',
            'კარგი გოგო'
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