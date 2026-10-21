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

const extension = {
  "aliases": {
    "uncertain": [
      "idk",
      "i dunno",
      "dunno",
      "not sure",
      "i am not sure",
      "i have no idea",
      "no clue",
      "maybe",
      "perhaps",
      "არ ვიცი",
      "არვიცი",
      "რავი",
      "არ ვარ დარწმუნებული",
      "შეიძლება"
    ],
    "agree": [
      "ikr",
      "i agree",
      "agreed",
      "exactly",
      "true",
      "fair enough",
      "makes sense",
      "you are right",
      "fair",
      "same",
      "same here",
      "i guess so",
      "მართალი ხარ",
      "გეთანხმები",
      "ზუსტად",
      "ეგრეა",
      "გასაგებია"
    ],
    "disagree": [
      "i disagree",
      "not really",
      "i do not think so",
      "i don't think so",
      "nah not really",
      "that is not true",
      "that's not true",
      "არ გეთანხმები",
      "არ მგონია",
      "არა მგონია",
      "ეგრე არ არის"
    ],
    "bored": [
      "i am bored",
      "i'm bored",
      "im bored",
      "bored",
      "so bored",
      "nothing to do",
      "entertain me",
      "მომბეზრდა",
      "მოვიწყინე",
      "ვერ ვერთობ"
    ],
    "busy": [
      "i am busy",
      "i'm busy",
      "im busy",
      "busy rn",
      "i am working",
      "at work",
      "got work",
      "ვმუშაობ",
      "სამსახურში ვარ",
      "დაკავებული ვარ"
    ],
    "returning": [
      "i am back",
      "i'm back",
      "im back",
      "back",
      "back again",
      "დავბრუნდი",
      "ისევ აქ ვარ"
    ],
    "pause": [
      "brb",
      "be right back",
      "afk",
      "away for a bit",
      "one sec",
      "one second",
      "wait a sec",
      "wait a minute",
      "ცოტა ხნით გავალ",
      "ახლავე მოვალ",
      "წუთით"
    ],
    "goodnight": [
      "gn",
      "good night",
      "goodnight",
      "going to sleep",
      "off to bed",
      "sleep well",
      "ტკბილი ძილი",
      "ღამე მშვიდობის",
      "დასაძინებლად მივდივარ"
    ],
    "morning": [
      "gm",
      "good morning",
      "morning",
      "დილა მშვიდობის",
      "დილამშვიდობის"
    ],
    "listen": [
      "listen",
      "can we talk",
      "can i talk to you",
      "hear me out",
      "i need to talk",
      "მომისმინე",
      "შეიძლება ვილაპარაკოთ",
      "საუბარი მინდა"
    ],
    "curious": [
      "tell me something",
      "say something",
      "talk to me",
      "what are you thinking",
      "what is on your mind",
      "რამე მითხარი",
      "მელაპარაკე",
      "რაზე ფიქრობ"
    ],
    "challenge": [
      "bet",
      "try me",
      "prove it",
      "i dare you",
      "bring it on",
      "შეგიძლია",
      "აბა ვნახოთ",
      "დამიმტკიცე"
    ],
    "confused": [
      "huh",
      "what",
      "i am confused",
      "i'm confused",
      "im confused",
      "i do not understand",
      "i don't understand",
      "i dont understand",
      "ვერ გავიგე",
      "ვერ გავიგე რას ამბობ",
      "დავიბენი"
    ],
    "feeling_bad": [
      "rough day",
      "today was awful",
      "i feel down",
      "i am upset",
      "im sad",
      "i'm upset",
      "ძალიან ცუდად ვარ",
      "დღეს ცუდი დღეა"
    ],
    "feeling_good": [
      "all good",
      "pretty good",
      "doing great",
      "im good",
      "im fine",
      "i'm doing well",
      "happy today",
      "ძაან კარგად ვარ",
      "მიხარია"
    ],
    "laugh": [
      "lmfao",
      "rofl",
      "lolol",
      "hehe",
      "hehehe",
      "ahaha",
      "ahahaha",
      "xd",
      "xddd",
      "that is hilarious",
      "😂",
      "🤣",
      "ჰაჰაჰ",
      "აჰაჰა"
    ],
    "explain": [
      "wdym",
      "wym",
      "wsym",
      "what do u mean",
      "what do you mean by that",
      "elaborate",
      "explain pls",
      "explain please",
      "რას გულისხმობ ამაში"
    ],
    "mood": [
      "wbu",
      "hbu",
      "how about you",
      "what about you",
      "hru",
      "how r u",
      "how are u",
      "u good",
      "you good",
      "როგორახარ",
      "შენ როგორ",
      "შენ როგორ ხარ"
    ],
    "hi": [
      "yo",
      "sup",
      "wassup",
      "what's up",
      "whats up",
      "heya",
      "hiya",
      "hey hey",
      "გამარჯობათ",
      "სალამ"
    ],
    "again": [
      "another",
      "one more please",
      "again pls",
      "more please",
      "კიდევ მითხარი"
    ],
    "no": [
      "nah",
      "na",
      "no thanks",
      "no ty",
      "არა მადლობა"
    ],
    "yes": [
      "yep",
      "yup",
      "ye",
      "yea",
      "y",
      "კი კი"
    ],
    "thanks": [
      "thx",
      "tyvm",
      "thank u",
      "thanks bro",
      "cheers",
      "მადლობ",
      "მადლობაა"
    ],
    "stop": [
      "gtg",
      "g2g",
      "gotta go",
      "ttyl",
      "cya",
      "see ya",
      "later",
      "nvm",
      "never mind",
      "nevermind",
      "აღარ მინდა",
      "წავედი"
    ],
    "really": [
      "fr",
      "frfr",
      "srsly",
      "rly",
      "really really"
    ],
    "rude": [
      "chill",
      "chill out",
      "too much",
      "ease up",
      "be gentle",
      "რბილად",
      "დამშვიდდი"
    ],
    "reaction_apology": [
      "sry",
      "soz",
      "mb",
      "my mistake"
    ],
    "reaction_affection": [
      "ily",
      "ily too",
      "ur cute",
      "you're cute",
      "ur sweet",
      "u are cute"
    ],
    "agree_extra": [
      "np",
      "no problem",
      "dw",
      "do not worry",
      "don't worry",
      "dont worry",
      "არაუშავს"
    ]
  },
  "pools": {
    "public": {
      "uncertain": [
        "Fair. We can work with uncertainty. What are you choosing between?",
        "No idea? Then give me two options. I will lend you a decision.",
        "You can say you do not know. The ceiling will remain intact.",
        "Then start smaller. What part are you sure about?",
        "Mm. Leave it undecided for a moment. Not every pause needs a verdict."
      ],
      "agree": [
        "Good. A rare moment of coordination.",
        "Exactly. Let us enjoy this before someone complicates it.",
        "Mm. We appear to have reached the same conclusion.",
        "Fair enough. I will spare you the victory speech."
      ],
      "disagree": [
        "Go on. Which part do you see differently?",
        "Fair. Give me your version before I raise the other eyebrow.",
        "You can disagree. A reason would make it more interesting.",
        "All right. Was it the point, or the way I said it?"
      ],
      "bored": [
        "Bored? Ask for a roast. At least one of us will enjoy it.",
        "A compliment, a roast, or a random choice. Pick your distraction.",
        "You brought boredom to me like a formal complaint. Charming. Try `akane secret`.",
        "We could make a decision. Give me two choices with `akane pick tea / coffee`."
      ],
      "busy": [
        "Then handle that first. My dramatic pause can last.",
        "Go do the thing. Procrastination already has enough staff.",
        "A short conversation, then. No grand entrance required."
      ],
      "returning": [
        "Back already? The plot has found its recurring character.",
        "There you are. I had almost perfected the silence.",
        "Welcome back. Bring a better excuse than boredom.",
        "Mm. A familiar interruption."
      ],
      "pause": [
        "All right. I will let the silence have a turn.",
        "Go on. No need to announce a full expedition.",
        "Take a moment. The dramatic tension will cope."
      ],
      "goodnight": [
        "Good night. Let tomorrow handle its own nonsense.",
        "Off to bed, then. Even your dramatic timing needs rest.",
        "Sleep well. That was the pleasant version. Keep it."
      ],
      "morning": [
        "Morning. A bold time to require conversation.",
        "Good morning. Keep the chaos at a manageable volume.",
        "A fresh day. Your questionable ideas can form an orderly queue."
      ],
      "listen": [
        "Go on. You have my attention.",
        "All right. Tell me the important part first.",
        "I can follow familiar phrases. If I miss your point, say it another way."
      ],
      "curious": [
        "I was arranging a perfectly innocent expression. You have interrupted the delicate process.",
        "My grand fictional plan? Look composed. Deliver one devastatingly timed eyebrow.",
        "Imagine a moonlit hallway and someone smiling a little too calmly. That is the atmosphere.",
        "A small confession: mystery is easier when nobody asks follow-up questions."
      ],
      "challenge": [
        "Bold. We are still only playing with words. Try `akane roast`.",
        "Such confidence. I hope you brought a second sentence.",
        "Mm. Shall we make this a harmless contest of dramatic timing?"
      ],
      "confused": [
        "Which part lost you? Try `wdym` to hear the last point more plainly.",
        "I may have wrapped the point in too much theatre. Try `explain`.",
        "A little clearer, then. Tell me which part you meant."
      ],
      "agree_extra": [
        "All right. We can leave that little moment behind us.",
        "Noted. An unexpectedly civilized exchange.",
        "Good. No need to keep that moment alive."
      ],
      "feeling_bad": [
        "A quiet conversation is allowed. You do not have to be entertaining right now.",
        "No clever comeback for that. Would a small distraction help?"
      ]
    },
    "owner": {
      "uncertain": [
        "That is all right, handsome. Tell me the part you are unsure about.",
        "No perfect answer needed, Davi. We can start with two choices.",
        "Then take your time, sweetheart. I am not grading this conversation."
      ],
      "agree": [
        "We agree, handsome. A lovely little development.",
        "I like when we understand each other, Davi.",
        "Exactly, sweetheart. No dramatic debate required."
      ],
      "disagree": [
        "Tell me your side, Davi. I would rather hear it than guess.",
        "Fair enough, handsome. Which part felt wrong?",
        "We can disagree gently, sweetheart. What do you think?"
      ],
      "bored": [
        "Come keep me company, handsome. A compliment or a little mischief?",
        "Bored, Davi? I have a softer reply and a terrible sense of timing. Try `akane roast`.",
        "Let us find a little distraction, sweetheart. A secret or a compliment?"
      ],
      "busy": [
        "Handle your work first, handsome. No need to rush a reply.",
        "Take your time, Davi. A little conversation can wait.",
        "Then one small task at a time, sweetheart."
      ],
      "returning": [
        "There you are, handsome. Good to see your name again.",
        "Welcome back, Davi. You have my attention.",
        "Hello again, sweetheart. How did it go?"
      ],
      "pause": [
        "Take your time, handsome.",
        "Of course, Davi. Handle what you need to.",
        "A little pause, sweetheart. See you when you are ready."
      ],
      "goodnight": [
        "Good night, handsome. Let the day go for a while.",
        "Sleep well, Davi. A softer ending for you.",
        "Sweet dreams, sweetheart. Be kind to yourself tonight."
      ],
      "morning": [
        "Good morning, handsome. A lovely name to start the chat with.",
        "Morning, Davi. How is your day starting?",
        "Hello, sweetheart. Ease into the day."
      ],
      "listen": [
        "Of course, Davi. Tell me what is on your mind.",
        "You have my attention, handsome. Start wherever feels easiest.",
        "Go on, sweetheart. No perfect opening line needed."
      ],
      "curious": [
        "I was considering a sharp reply. Then you arrived, handsome.",
        "A fictional little thought, Davi: you would ruin my attempt to look unapproachable.",
        "Something sweet or something mischievous, sweetheart? Try `akane nice` or `akane secret`."
      ],
      "challenge": [
        "A little challenge, handsome? I will keep the teasing gentle.",
        "You do enjoy testing my mysterious expression, Davi.",
        "Bold of you, sweetheart. Try `akane roast` for the affectionate version."
      ],
      "confused": [
        "Which part, handsome? `wdym` will ask me to explain the last reply.",
        "I may have been too theatrical, Davi. Let us make it simpler.",
        "Tell me where I lost you, sweetheart."
      ],
      "agree_extra": [
        "Thank you, handsome. Let us keep the next exchange lovely.",
        "That is sweet of you, Davi.",
        "All right, sweetheart. A fresh subject?"
      ],
      "feeling_bad": [
        "No performance needed, Davi. A little quiet or a light distraction is enough.",
        "A gentler moment, handsome. Take the day one piece at a time."
      ]
    },
    "mae": {
      "uncertain": [
        "That is okay, Mae. What part are you unsure about?",
        "We can narrow it down, Mae. Two choices might help.",
        "No rush, Mae. You do not need an answer immediately."
      ],
      "agree": [
        "Agreed, Mae.",
        "Glad that made sense, Mae.",
        "We seem to be on the same page, Mae."
      ],
      "disagree": [
        "That is fair, Mae. What is your take?",
        "Tell me which part you disagree with, Mae.",
        "We can see it differently, Mae. Go on."
      ],
      "bored": [
        "A little distraction, Mae? Try a compliment, a joke, or a random choice.",
        "We can do something light, Mae. `akane secret` is a start.",
        "Bored, Mae? Give me two choices and I can pick one."
      ],
      "busy": [
        "Take your time, Mae.",
        "Work first, Mae. There is no rush to reply.",
        "We can keep this brief, Mae."
      ],
      "returning": [
        "Welcome back, Mae.",
        "Hi again, Mae. How did it go?",
        "Good to see you back, Mae."
      ],
      "pause": [
        "Take your time, Mae.",
        "Of course, Mae. See you in a bit.",
        "No rush, Mae."
      ],
      "goodnight": [
        "Good night, Mae. Rest well.",
        "Sleep well, Mae. Hope tomorrow is a good one.",
        "Have a peaceful night, Mae."
      ],
      "morning": [
        "Good morning, Mae.",
        "Morning, Mae. Hope your day starts well.",
        "Hi, Mae. How is the morning going?"
      ],
      "listen": [
        "Of course, Mae. What is on your mind?",
        "Go ahead, Mae.",
        "You have my attention, Mae."
      ],
      "curious": [
        "A small character secret, Mae: I take my dramatic entrances far too seriously.",
        "Something light, Mae? Try `akane secret` or `akane nice`.",
        "I was perfecting the mysterious expression, Mae. It is harder than it looks."
      ],
      "challenge": [
        "A harmless challenge, Mae? Try `akane roast`.",
        "We can keep it playful, Mae.",
        "Confidence noted, Mae."
      ],
      "confused": [
        "Which part was unclear, Mae?",
        "Try `wdym`, Mae, and I can explain the last response.",
        "I may have been unclear, Mae. Let us simplify it."
      ],
      "agree_extra": [
        "Thanks, Mae.",
        "All right, Mae. A fresh subject?",
        "Glad we are okay, Mae."
      ],
      "feeling_bad": [
        "A quieter conversation is fine, Mae.",
        "Sorry it has been difficult, Mae. Take things one step at a time."
      ]
    }
  },
  "explanations": {
    "uncertain": "I understood that as uncertain, and answered in character.",
    "agree": "I understood that as agree, and answered in character.",
    "disagree": "I understood that as disagree, and answered in character.",
    "bored": "I understood that as bored, and answered in character.",
    "busy": "I understood that as busy, and answered in character.",
    "returning": "I understood that as returning, and answered in character.",
    "pause": "I understood that as pause, and answered in character.",
    "goodnight": "I understood that as goodnight, and answered in character.",
    "morning": "I understood that as morning, and answered in character.",
    "listen": "I understood that as listen, and answered in character.",
    "curious": "I understood that as curious, and answered in character.",
    "challenge": "I understood that as challenge, and answered in character.",
    "confused": "I understood that as confused, and answered in character.",
    "agree_extra": "I understood that as agree extra, and answered in character."
  }
};
for (const [key, values] of Object.entries(extension.aliases)) {
    aliases[key] = [...new Set([...(aliases[key] ?? []), ...values])];
}
for (const [tone, categories] of Object.entries(extension.pools)) {
    for (const [key, values] of Object.entries(categories)) {
        pools[tone][key] = [...new Set([...(pools[tone][key] ?? []), ...values])];
    }
}
Object.assign(explanations, extension.explanations);
