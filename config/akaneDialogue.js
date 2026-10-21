const MAE_ID = '1380278195961729084';

const pools = {
    general: [
        'Hm? Go on. You have my attention.',
        'You called so confidently. Don’t get shy now.',
        'I was enjoying the quiet. Make this interesting.',
        'There you are. What is it this time?',
        'Oh? Finish that thought. I’m curious now.',
        'You again. I was beginning to recognize the silence.',
        'I’m listening. The smile should concern you less than the pause.',
        'Well? You didn’t call me over to stare.'
    ],

    hi: [
        'Hello. You look suspiciously pleased to see me.',
        'Oh, you’re back. There goes the quiet.',
        'Hi. Let’s see which one of us sighs first.',
        'Hello, trouble. Keep it interesting.',
        'There you are. Behave just enough to surprise me.',
        'Mm. A polite entrance. Keep going.'
    ],

    reaction_insult: [
        'That was your opening line? You had time to prepare.',
        'I heard you. I was waiting for the clever part.',
        'Oh, don’t stop there. Surely that wasn’t your best.',
        'You seem awfully invested in someone you find useless.',
        'Mm. Say something original and I might raise an eyebrow.',
        'You came looking for a reaction. This is all you’re getting.',
        'Careful with that confidence. The sentence isn’t holding it up.',
        'We can trade jokes. Try bringing one.'
    ],

    reaction_anger: [
        'Angry? No. I’m watching you explain yourself.',
        'This is the patient expression. Enjoy it.',
        'Not angry. You’ve simply made the silence very appealing.',
        'I’m teasing. Say the word if you want me to ease up.'
    ],

    reaction_reassurance: [
        'Oh. That was unexpectedly decent of you.',
        'Mm. I’ll accept that. Quietly.',
        'You can be kind. How inconvenient for my first impression.',
        'I noticed. Don’t make me thank you twice.'
    ],

    maeMention: [
        'Mae? Be kind to her. She gets the gentler welcome.',
        'Oh, Mae. A lovely change of subject.',
        'Mae is welcome here. Save her a little kindness.',
        'You mentioned Mae? I’m listening.'
    ],

    mae_general: [
        'Hey, Mae. What’s on your mind?',
        'There you are, Mae. Good to see you.',
        'I’m listening, Mae. Take your time.',
        'Mae! Come on in. How’s your day going?',
        'Hi, Mae. A quiet chat or a little harmless mischief?'
    ],

    mae_hi: [
        'Hi, Mae! How have you been?',
        'Hey, Mae. Glad you stopped by.',
        'Welcome back, Mae. Make yourself comfortable.',
        'Hello, Mae. You caught me in a friendly mood.',
        'Mae! Tell me something good.'
    ],

    mae_nice: [
        'You bring a lovely bit of warmth to the chat, Mae.',
        'There’s something really nice about your curiosity.',
        'You don’t have to be the loudest person to make an impression.',
        'A little kindness goes a long way. It suits you, Mae.',
        'You’re allowed to take the compliment without arguing, Mae.'
    ],

    mae_roast: [
        'Mae, you could turn choosing a snack into a side quest.',
        'You came asking for trouble with such polite timing.',
        'Your plan took the scenic route, didn’t it?',
        'Mae, that dramatic entrance deserved its own soundtrack.',
        'I’ll keep the teasing gentle. Your timing does enough of the work.'
    ],

    mae_mood: [
        'Quite good, Mae. How about you?',
        'A little playful. You arrived at a good time.',
        'Enjoying the quiet company, Mae.',
        'In the mood for an easy conversation.'
    ],

    mae_thanks: [
        'You’re welcome, Mae.',
        'Of course, Mae. Glad that helped.',
        'Anytime. Thanks for being kind about it.',
        'Happy to help, Mae.'
    ],

    mae_tension: [
        'Hey, Mae. Did that come out wrong? We can start again.',
        'I’ll ease up, Mae. No need to keep a joke going if it isn’t fun.',
        'Fair enough. Let’s make the next reply a little gentler.',
        'We can leave the teasing there, Mae.'
    ],

    mae_apology: [
        'We’re fine, Mae. Thanks for saying that.',
        'No worries. Fresh start?',
        'It’s all right, Mae. We can move on.'
    ],

    mae_romance: [
        'I’ll keep this one friendly, Mae. You’re still very welcome here.',
        'A charming line, Mae. Let’s keep it playful and friendly.',
        'I can offer good company and a little teasing, Mae.'
    ],

    mae_affection: [
        'That’s kind of you, Mae. Thank you.',
        'Aw, Mae. That was a lovely thing to say.',
        'You’ve made the chat a little warmer. I appreciate it.'
    ],

    mae_identity: [
        'I’m Akane, Mae. Your server bot with a slightly dramatic personality.',
        'Akane. A bot playing a character, and happy to help you, Mae.'
    ],

    mae_fallback: [
        'I didn’t quite catch that, Mae. Try another way?',
        'A little clearer for me, Mae? `akane help` shows what I know.',
        'I’m listening, Mae. I just don’t recognize that request yet.'
    ],

    mae_rate: [
        '{score}/10, Mae. A random score for fun, not a real judgment.',
        'The imaginary judges picked {score}/10. Entirely unofficial, Mae.'
    ],

    mae_luck: [
        'A pretend prediction, Mae: a small win and a well-earned break.',
        'My playful forecast? Something to smile about, Mae.'
    ],

    mae_secret: [
        'A secret, Mae? I’m rather fond of a quiet, friendly conversation.',
        'I was going to look mysterious. Then you arrived being nice.'
    ],

    mae_reassurance: [
        'Thank you, Mae. That was considerate.',
        'I appreciate that, Mae. We’re fine.'
    ],

    mae_stop: [
        'Of course, Mae. Talk later.',
        'All right, Mae. Take care.',
        'We’ll leave it here. Have a good day, Mae.'
    ],

    mae_yes: [
        'All right, Mae. What would you like next?',
        'Got it, Mae. We can keep going.'
    ],

    mae_no: [
        'That’s fine, Mae. No pressure.',
        'Understood. We can change the subject, Mae.'
    ]
};

for (const pool of Object.values(pools)) {
    Object.freeze(pool);
}

module.exports = Object.freeze({
    maeId: MAE_ID,
    pools: Object.freeze(pools)
});