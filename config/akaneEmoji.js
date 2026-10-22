const freeze = values => Object.freeze(values);
module.exports = Object.freeze({
    interval: 4,
    warm: freeze(['hi','returning','morning','general','nice','thanks','laugh','joke','secret','reaction_affection','reaction_romance','chat_open','ambiguous_tease','pick']),
    sharp: freeze(['roast','reaction_insult','reaction_dismissive','sarcastic_challenge']),
    pools: Object.freeze({
        owner: freeze(['🤭','🫣','🦊']),
        mae: freeze(['😌','✨','🦊']),
        public: freeze(['😏','🙄','🥱']),
        publicWarm: freeze(['🦊','😏'])
    })
});
