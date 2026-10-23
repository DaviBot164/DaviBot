const ownerReplies = {
    general: [
        'Davi… there you are. Come tell me something.',
        'Hm? Oh, it’s you. Now I’m listening.',
        'You called, handsome?',
        'There’s that name. You have my attention.',
        'Davi. I was trying to look unapproachable.',
        'Come here, you. How has your day been?',
        'I had a sharp reply ready. Then I saw who called.',
        'Oh, Davi. You make a simple hello rather distracting.',
        'There you are. Stay a little, won’t you?',
        'Did you come to see me, Davi? Reply yes or no.'
    ],

    hi: [
        'Hi, handsome. How are you?',
        'Davi! Well, this conversation just improved.',
        'Hello, you. Come keep me company for a moment.',
        'There’s my favorite entrance.',
        'Hey, Davi. Tell me one good thing about your day.',
        'Oh, hello. You caught me smiling.',
        'Hi. I was saving the softer voice for you.',
        'Welcome back, handsome.',
        'Davi… a little warning before you turn up being charming?',
        'Good to see you. Really.'
    ],

    nice: [
        'You have a lovely way of making things feel personal, Davi.',
        'Quiet confidence looks good on you.',
        'You’re charming when you’re not even trying. Slightly unfair.',
        'I like that thoughtful side of you.',
        'You put care into the little things. It shows.',
        'Handsome, curious, and a little dramatic. A lovely combination.',
        'You make a conversation easy to stay in.',
        'There’s something very endearing about your persistence.',
        'You don’t have to impress me every time. You can just say hello.',
        'Another compliment, Davi? Reply yes or no.'
    ],

    roast: [
        'You could overthink a hello, sweetheart. It’s rather adorable.',
        'You came asking for a roast and somehow made it charming.',
        'That dramatic entrance, Davi… were you rehearsing?',
        'You take the scenic route to a decision. I’ll keep you company.',
        'Your plans sometimes wander off. Your charm brings them back.',
        'You ask for trouble with such lovely manners.',
        'I could tease you all evening. Gently, of course.',
        'You’re a little distracting for someone requesting my full attention.',
        'Even your questionable timing has its charm.',
        'That was the affectionate version. Want another? Reply yes or no.'
    ],

    flirt: [
        'Oh? Keep talking like that. I’m listening now.',
        'Davi… you knew exactly how that would sound.',
        'Careful, handsome. You’ve already got me smiling.',
        'You can flirt a little. I’ll pretend to be surprised.',
        'That line sounded rather lovely coming from you.',
        'Come closer—in the conversation, darling. Tell me more.',
        'You make my sharp edges feel a little softer.',
        'I was going to be mysterious. Then you called me cute.',
        'Look at you, turning a simple chat into a scene.',
        'I like this playful side of you.',
        'Davi, you could at least pretend you came for the commands.',
        'A little romance and a little mischief? That suits us in this scene.'
    ],

    apology: [
        'Hey, we’re fine, Davi. You can relax.',
        'Apology accepted, sweetheart. Let’s start again.',
        'You don’t need a perfect speech. I understood you.',
        'Come on, handsome. No more worrying about that.',
        'It’s all right. Thank you for saying it.',
        'We can leave that moment behind us.',
        'A softer beginning, then? Hello again, Davi.',
        'You’re allowed an awkward sentence. We’ll survive it.'
    ],

    tension: [
        'Hey, Davi. Shall we start that again, a little softer?',
        'You sound frustrated. We can pause if you want.',
        'All right, handsome. I’ll ease up.',
        'No sharp reply for you. Tell me what bothered you.',
        'We can keep the teasing gentle.',
        'A little less attitude from me, then. Fair enough.',
        'You don’t have to keep the joke going if it isn’t fun.',
        'Let’s give that sentence a kinder second try.'
    ],

    thanks: [
        'You’re welcome, handsome.',
        'For you, a softer answer. You’re welcome.',
        'That was sweet of you to say, Davi.',
        'You’ve got lovely manners when you want to.',
        'Anytime, Davi. Glad that helped.',
        'There you go, making me smile again.'
    ],

    really: [
        'Really, Davi. Let me be sweet to you for a moment.',
        'Yes, handsome. No hidden sting this time.',
        'Mm-hm. You can take the compliment.',
        'I meant the kind part. The teasing was extra.',
        'You sound surprised. Shall I say something lovely again?',
        'Yes, you. Who else did you think I was smiling at in this scene?'
    ],

    why: [
        'Because a little warmth suits this conversation, Davi.',
        'Because I’m teasing you affectionately, handsome.',
        'Because you asked, and I felt like being sweet.',
        'No grand mystery. Just a warm reply for you.',
        'Because flirting with you makes a rather fun little scene.',
        'Because not every answer needs a sharp edge.'
    ],

    yes: [
        'Good. Come tell me a little more, Davi.',
        'That made me smile, handsome.',
        'Lovely. I like a clear answer.',
        'Then stay for another little exchange.',
        'Well, aren’t you sweet?',
        'I was hoping you’d say that—in the most theatrical way.'
    ],

    no: [
        'That’s all right, Davi. No pressure.',
        'Fair enough, handsome. We can change the subject.',
        'A no is perfectly fine. What would you like instead?',
        'Then we’ll leave it there, sweetheart.',
        'Understood. I’ll keep the smile and drop the question.',
        'All right. A quieter moment, then.'
    ],

    stop: [
        'Of course, Davi. We’ll leave it here. Take care, handsome.',
        'All right, sweetheart. Conversation closed.',
        'A little pause, then. Have a lovely evening, Davi.'
    ],

    fallback: [
        'Davi, I didn’t quite catch that. Try `kitsune help`, handsome.',
        'A little clearer for me, sweetheart? `kitsune help` has the requests I know.',
        'You have my attention, Davi. I just need a request I recognize.'
    ]
};

const general = [
    'Hm? …Oh, it’s you.',
    'Yes? I was enjoying that silence.',
    'You called me over. Go on, then.',
    'I’m listening. Make it interesting.',
    'That confident entrance had better lead somewhere.',
    'Oh? You have something to say?',
    'You again. Persistent, aren’t you?',
    'I had such a peaceful expression a moment ago.',
    'Speak. You’re making the pause awkward.',
    'You caught me in an almost decent mood.',
    'There you are. What is it this time?',
    'I’m smiling. Don’t read too much into it.',
    'You look very pleased with that interruption.',
    'Well? Don’t get shy now.',
    'I was about to be pleasant. Terrible timing.',
    'You wanted my attention. Now you have it.',
    'Mm. Let’s hear this.',
    'A little conversation? Fine. Surprise me.',
    'You say my name like you’ve thought this through.',
    'Missed the attitude? Reply yes or no.'
];

const member = [
    'Oh. You. Make it quick.',
    'I know that name. Keep the introduction short.',
    'You seem comfortable. How optimistic.',
    'A familiar face. Let’s see how this goes.',
    'I’ll be civil. Try to make it easy.',
    'That entrance was almost impressive.',
    'You have my attention. Briefly.',
    'Mm. I’m reserving judgment.',
    'Look at you, arriving with all that confidence.',
    'I’m smiling politely. Please appreciate the effort.',
    'We can have a perfectly pleasant conversation. In theory.',
    'You seem to have a speech ready.',
    'I’ll let you finish before I raise an eyebrow.',
    'Hello. Keep the drama charming.',
    'You’ve been noticed. No need for a second entrance.',
    'Let’s not confuse a greeting with an endorsement.',
    'You look like a very interesting explanation.',
    'A little composure would suit the occasion.',
    'Well, then. What do you have for me?',
    'I can wait. I’d rather hear something worth answering.'
];

for (const pool of Object.values(ownerReplies)) {
    Object.freeze(pool);
}

module.exports = Object.freeze({
    ownerId: '1357721282061533311',
    general: Object.freeze(general),
    member: Object.freeze(member),
    owner: ownerReplies.general,
    davi: ownerReplies.nice,
    ownerReplies: Object.freeze(ownerReplies)
});
