const aliases = {
    laugh: ['haha', 'hahaha', 'lol', 'lmao', 'that was funny', 'you are funny', 'ჰაჰა', 'ჰაჰაჰა', 'სასაცილოა', 'გამაცინე'],
    feeling_good: ['i am fine', "i'm fine", 'i am good', "i'm good", 'i feel good', 'doing well', 'კარგად ვარ', 'ძალიან კარგად ვარ'],
    feeling_bad: ['i am sad', "i'm sad", 'i feel sad', 'bad day', 'i had a bad day', 'i feel bad', 'ცუდად ვარ', 'ცუდი დღე მქონდა', 'მოწყენილი ვარ'],
    tired: ['i am tired', "i'm tired", 'so tired', 'i am sleepy', 'დავიღალე', 'დაღლილი ვარ', 'მეძინება'],
    explain: ['what do you mean', 'explain', 'explain that', 'რას გულისხმობ', 'ამიხსენი'],
    again: ['again', 'another one', 'one more', 'კიდევ', 'კიდევ ერთი'],
    stop: ['bye', 'goodbye', 'see you later', 'talk later', 'ნახვამდის', 'დროებით']
};

const pools = {
    public: {
        laugh: ['There. You found the joke. I was starting to worry.', 'Oh, you laughed. My innocent expression survives another minute.', 'Enjoying yourself? How inconvenient for my reputation.'],
        feeling_good: ['Good. Keep a little of that mood for the next inconvenience.', 'An unusually pleasant update. I will allow it.', 'Then enjoy it. You do not need my permission.'],
        feeling_bad: ['Rough day? We can put the teasing aside.', 'All right. No sharp reply for that. Take a moment.', 'You do not have to turn a bad day into a good performance.'],
        tired: ['Then stop trying to win an argument with exhaustion. Take a break.', 'Even dramatic entrances can wait. Rest a little.', 'A quieter moment, then. You sound like you need one.'],
        stop: ['All right. Enjoy the suspicious peace.', 'Off you go. Try to make the next entrance interesting.', 'We will leave it here.'],
        fallback: ['I caught my name. The rest needs a clearer request. Try `akane help`.', 'A little clearer. I have attitude, not telepathy.', 'You have my attention. Give me something I recognize.'],
        again: ['Another what? Try `akane nice`, `akane roast`, or `akane tip`.'],
        no: ['Understood. We can leave that there.', 'A no is enough. Pick another subject.'],
        yes: ['All right. What would you like next?', 'Noted. Go on, then.']
    },
    owner: {
        laugh: ['There is that laugh. You are making it difficult to look mysterious, handsome.', 'I like that playful side of you, Davi.', 'Good. I was hoping that would make you smile.'],
        feeling_good: ['Good, handsome. Tell me the best part.', 'That is lovely to hear, Davi. Keep a little of that feeling.', 'Now that is an update I like.'],
        feeling_bad: ['Oh, Davi. We can drop the teasing. Want a little distraction or some quiet?', 'A rough day, handsome? You do not have to pretend otherwise.', 'Let us make this a gentler conversation, Davi.'],
        tired: ['A little rest would suit you, handsome. The conversation can wait.', 'Then be kind to yourself, Davi. You have done enough for a moment.', 'No need for a charming entrance tonight. Take a breath, sweetheart.'],
        again: ['Another what, handsome? A compliment, a joke, or a little advice?']
    },
    mae: {
        laugh: ['Glad that made you laugh, Mae.', 'There we go. A little harmless mischief.', 'I will count that as a successful joke, Mae.'],
        feeling_good: ['Glad to hear it, Mae. Anything nice happen?', 'That is a good update, Mae.', 'Lovely. Enjoy the good moment, Mae.'],
        feeling_bad: ['Sorry it has been a rough day, Mae. We can keep this gentle.', 'You do not have to sound cheerful here, Mae.', 'Take a moment, Mae. A little break is allowed.'],
        tired: ['Take a break if you can, Mae. No rush here.', 'A quiet moment might help, Mae.', 'Rest a little, Mae. We can talk another time.'],
        again: ['Another what, Mae? A compliment, a joke, or some advice?']
    }
};

const explanations = {
    nice: 'That was a compliment. You asked for something kind, and I meant the kind part.',
    roast: 'That was playful teasing you requested, not a serious judgment of you.',
    rate: 'The score is random, from 1 to 10. It is not an assessment of you.',
    luck: 'That was a pretend prediction for fun, not something to rely on.',
    pick: 'I randomly selected one of the options you supplied.',
    tip: 'That was a suggestion. Keep what fits your situation.',
    davi: 'I was talking about Davi. He gets the warmer side of my character.',
    mae: 'I was talking about Mae. She gets a friendly welcome.',
    member: 'That was a theatrical introduction, not a claim about that person.',
    reaction_davi_insult: 'You can disagree with Davi without making the disagreement a personal insult.',
    reaction_romance: 'I am keeping the flirting playful rather than making a relationship commitment.',
    reaction_possessive: 'You can ask for attention without claiming ownership.',
    reaction_apology: 'I accepted the apology. We can move on.',
    reaction_affection: 'You said something kind, and I acknowledged it.',
    reaction_insult: 'I answered the insult with a little sarcasm. We can keep it civil.',
    reaction_dismissive: 'You can end this conversation with `akane stop`.',
    reaction_reassurance: 'You said something reassuring. I appreciated it.',
    reaction_identity: 'I am Akane, a Discord bot playing a fictional character.',
    reaction_bot: 'I am a bot, not a person behind the messages.',
    reaction_anger: 'The sharp tone is part of the character. There is no actual anger.',
    reaction_question: 'I did not recognize a question I can answer. `akane help` shows examples.',
    fallback: 'I did not recognize the request. Try a clearer phrase or `akane help`.',
    general: 'You called my name, so I answered.',
    hi: 'That was my greeting. You can ask for a compliment, a joke, or advice next.',
    mood: 'That was my fictional mood. How are you doing?',
    secret: 'That was a little fictional detail about my character.',
    laugh: 'I took that as laughter and joined the joke.',
    feeling_good: 'You said you were doing well. I was acknowledging that.',
    feeling_bad: 'You said things were rough, so I eased off the teasing.',
    tired: 'You said you were tired. I suggested taking a break.',
    thanks: 'You thanked me. I acknowledged it.',
    rude: 'You asked for a gentler tone. I can ease up.'
};

module.exports = { aliases, pools, explanations };
