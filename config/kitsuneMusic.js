const publicPools={
 music_chat:['Music, then. What do you usually put on?','A soundtrack is a respectable topic. Quiet music or something louder?','What kind of music have you been coming back to lately?'],
 music_time:['A late-night soundtrack, then. Do you go for something quiet or something with more energy?','Music at night has its own atmosphere. What kind do you usually choose?','The evening gets a soundtrack. Does the choice depend on your mood?'],
 music_mood:['Mood picks the soundtrack, then. What does a quiet evening sound like for you?','That makes sense. Sometimes the same song fits, and sometimes it really does not.','So there is no single playlist for every mood. What have you been in the mood for lately?'],
 music_mix:['Quiet sometimes, heavier other times. A soundtrack with range; I approve.','Both sides, then: something calm or something with a little more force.','A soft evening or a dramatic entrance. Your playlist appears to understand both.'],
 music_preferences:['Something atmospheric with a little tension suits my style. Even an imaginary soundtrack needs standards.','For my style: quiet melodies, with room for a dramatic track now and then.','A calm melody with a sharp edge. That seems suitably fox-like.'],
 music_curiosity:['Just comparing tastes, understood. A quiet melody with a dramatic edge fits my style.','Curiosity, not a request for suggestions. Got it. Atmospheric music suits the character.','Understood. We are talking about taste; no playlist assignment required.']
};
const ownerPools={
 music_time:['Music at night... that sounds like a nice setting for a conversation. What kind do you choose?','A quieter hour and a little music. Is it usually calm, or does that depend on your mood?'],
 music_mix:['Quiet sometimes, heavier other times... I like the contrast.','A little calm and a little drama. That gives the conversation a soundtrack.'],
 music_preferences:['Something quiet, with a little drama... it suits my style.','For my style, a soft melody with a slightly darker edge. What would you choose?']
};
const explanations={
 music_chat:'We chose music as a new topic.',
 music_time:'You said you usually listen to music at night. I followed that listening habit.',
 music_mood:'You said your music choice depends on your mood. I kept the conversation about music, not a new mood check.',
 music_mix:'You described liking calm music sometimes and heavier music at other times. I acknowledged both.',
 music_preferences:'You asked about my music taste in the current conversation. I described a preference that fits the character.',
 music_curiosity:'You clarified that you were curious rather than asking for advice. I kept the conversation about taste.'
};
module.exports={pools:{public:publicPools,owner:{...publicPools,...ownerPools},mae:{...publicPools}},explanations};
