const {followThroughMemory}=require('./followThrough');
const {recognizeBrief}=require('./briefConversation');
const {nextTopic} = require('./understandingResult');
const {recognizeDayConversation} = require('./dayConversation');
const {recognizeMusicConversation} = require('./musicConversation');
const {recognizeGameConversation} = require('./gameConversation');
const { followupCategory } = require('./followups');
const { acknowledge } = require('./socialIntent');
// Bounded, temporary topics and choice labels; no full-message transcript is retained.
const { normalize } = require('./aliases');
const { canonical, prepareInput } = require('./language');
const { randomInt } = require('node:crypto');
const controls = new Map();
for (const [category, values] of Object.entries({
    topic_change: ['something else','change the subject','change topic','new topic','another topic','different topic','სხვა თემა','თემა შეცვალე','სხვა რამე'],
    tone_gentle: ['be nice','be nicer please','please be nicer','gentle please','be nicer','be nice to me','be gentle','stop teasing','less teasing','easy on me','ცოტა რბილად','ნუ მეუხეშები','ნუ მეხუმრები'],
    tone_serious: ['be serious','serious mode','no jokes','no jokes please','be serious please','seriously please','სერიოზულად მიპასუხე','ხუმრობის გარეშე'],
    tone_reset: ['normal mode','back to normal','tease me again','ჩვეულებრივად','ისევ გამეხუმრე'],
    repair: ['you misunderstood me','you got me wrong there',"that's not what i meant",'that is not what i meant','you misunderstood','you got me wrong','not what i meant','wrong meaning','ეგ არ მიგულისხმია','არასწორად გაიგე','სხვას ვგულისხმობდი']
})) for (const value of values) controls.set(normalize(value), category);
function contextualCategory(raw, session, suppliedFrame=null) {
    const frame=suppliedFrame?.raw===String(raw??'')?suppliedFrame:prepareInput(raw);
    if(!frame.valid)return String(raw??'').length<=2000 ? controls.get(normalize(raw))??null : null;
    const text=frame.sentence;
    const brief=recognizeBrief(frame.plainSentence,session)??recognizeBrief(text,session);if(brief)return brief;
    if (session?.pickOptions?.length >= 2 && /^(?:actually )?i (?:meant|wanted) something (?:cold|hot|warm|different|else)$/u.test(text)) return 'choice_preference';
    const topicSession=session?.topicCategory?{...session,category:session.topicCategory}:session;
    const day=recognizeDayConversation(text,session)??(topicSession!==session?recognizeDayConversation(text,topicSession):null);if(day)return day;
    const music=recognizeMusicConversation(text,topicSession);if(music)return music;
    const game=recognizeGameConversation(text,topicSession);if(game)return game;
    if (controls.has(text)) return controls.get(text);
    const plain = canonical(raw).replace(/(?:[,\s]+(?:please|right now|at the moment))+$/u, '').trim();
    if (controls.has(plain)) return controls.get(plain);
    if (session?.pending?.kind === 'mood') {
        if (['fine','okay','ok','all right','alright','not bad','so so'].includes(text)) return 'feeling_neutral';
        if (['bad','not good','not okay','not ok','awful','terrible','ცუდად','ცუდი'].includes(text)) return 'feeling_bad';
        if (['good','great','pretty good','really good','კარგად','კარგი'].includes(text)) return 'feeling_good';
        if (['tired','sleepy','დაღლილი'].includes(text)) return 'tired';
    }
    if (session && ['same','same here','me too','me neither','so do i','so am i'].includes(text)) {
        // The session category records Kitsune's last topic, not necessarily the user's mood.
        const last = session.history?.at(-1);
        const ownMood = ['feeling_good','feeling_bad','feeling_neutral','tired','bored','hungry','lonely'];
        if (ownMood.includes(session.category) && last?.request === session.category && !['me neither'].includes(text)) return session.category;
        return 'context_echo';
    }
    if (session && ['not anymore','not any more','no longer','not now anymore'].includes(text)) return 'context_changed';
    if (session && ['maybe','perhaps','possibly','i guess','not sure','i am not sure'].includes(text)) return ['mood','choices'].includes(session.pending?.kind) ? 'uncertain' : 'context_hesitant';
    if (session && (['feeling_bad','not_well','emotional_detail','bad_day_context'].includes(session.category) || ['mood','mood_support','wellbeing'].includes(session.pending?.kind)) && /^(?:because|because of) (?:i (?:had|have) (?:a )?(?:bad|rough|terrible|awful) day|my (?:bad|rough|terrible|awful) day)$/u.test(text)) return 'bad_day_context';
    if(session?.pending?.kind==='repair' && /^(?:i meant (?:your|the) (?:answer|reply|response) not you|your (?:answer|reply|response) not you)$/u.test(text)) return 'repair_answer';
    if(session && ['tired','mental_tired','emotional_detail'].includes(session.category) && /^(?:not physically mentally|mentally not physically|mentally|mental tiredness|my mind)$/u.test(text)) return 'mental_tired';
    const detail = followupCategory(text,session); if(detail) return detail;
    const acceptance = acknowledge(text,session); if(acceptance) return acceptance;
    if (session?.pending?.kind === 'repair' && ['topic','tone','request','თემა','ტონი','თხოვნა'].includes(text)) return 'repair_detail';
    if (session?.pending?.kind === 'choices' && raw.includes('/')) return 'context_choices';
    return null;
}
function memoryAfter(previous, request, response) {
    const old = previous ?? {};
    const mode = response.modeChange === 'normal' ? null : response.modeChange
        ? { name: response.modeChange, remaining: 4 }
        : old.mode?.remaining > 1 ? { ...old.mode, remaining: old.mode.remaining - 1 } : null;
    const restarted=request.category==='restart_chat';
    const paused=['pause','flow_hold'].includes(request.category);
    return {
        ...followThroughMemory(old,request,response),
        topicCategory: nextTopic(old,request,response),
        core: response.core ?? (['pause','flow_hold','flow_resume','thanks','reaction_thanks','why','explain','core_listen','core_listen_quiet','core_gratitude','core_apology','core_reassurance','tone_gentle','tone_serious','tone_reset','core_opinion'].includes(request.category)?old.core??null:null),
        templateRef: response.templateRef ?? (['pause','flow_hold','flow_resume','why','explain','simplify','core_explain','thanks','reaction_thanks'].includes(request.category)?old.templateRef??null:null),
        preferredName: response.preferredName ?? old.preferredName ?? null,
        moodTurns: ((old.moodTurns??0)+(request.category==='mood'?1:0))%3,
        shortChat: response.shortChat ?? ((['pause','flow_hold','flow_resume','bored','thanks','reaction_thanks'].includes(request.category) || (old.topicCategory?.startsWith('music') && ['music_time','music_relax','music_mood','music_mix','music_preferences','music_curiosity'].includes(request.category))) ? old.shortChat ?? null : null),
        mood: request.recovery?.kind==='state' && request.recovery.data.target==='self' ? request.understanding.mood : restarted||['topic_change','light_topic','game_chat'].includes(request.category)?null:request.understanding?.mood??old.mood??null,
        explanationStep: response.explanationStep ?? 0,
        emojiTurns: response.emojiTurns ?? old.emojiTurns ?? 0,
        emojiLast: response.emojiLast ?? old.emojiLast ?? null,
        emojiRecent: response.emojiLast && response.emojiTurns===0
            ? [...(old.emojiRecent??[]),response.emojiLast].slice(-2) : old.emojiRecent??[],
        emojiCount: (old.emojiCount ?? 0) + (response.emojiAdded ? 1 : 0),
        noPetNames: ['nickname_boundary','core_no_nickname','core_name'].includes(request.category) || Boolean(old.noPetNames),
        ownerTurns: (old.ownerTurns??0)+(response.ownerStyle?1:0),
        ownerAddressUsed: Boolean(response.ownerAddressUsed),
        mode: restarted?null:mode,
        pickSelected: !restarted && (response.category==='pick' || ['pause','flow_hold','flow_resume','thanks','reaction_thanks','why','really','explain','core_choice_info','fallback','clarify','tone_gentle','tone_serious','tone_reset','core_gratitude','core_listen','core_listen_quiet'].includes(request.category) || response.category==='fallback') ? (response.pickSelected ?? old.pickSelected ?? null) : null,
        pickOptions: !restarted && (response.category==='pick' || ['pause','flow_hold','flow_resume','thanks','reaction_thanks','why','really','explain','core_choice_info','fallback','clarify','tone_gentle','tone_serious','tone_reset','core_gratitude','core_listen','core_listen_quiet'].includes(request.category) || response.category==='fallback') ? (response.pickOptions ?? old.pickOptions ?? null) : null,
        noAdviceRemaining: restarted ? 0 : (['decline_advice','music_curiosity','core_listen','core_listen_quiet','core_peace'].includes(request.category) || request.declineAdvice) ? 4 : ['tip','advice_resume'].includes(request.category) ? 0 : Math.max(0, (old.noAdviceRemaining ?? 0) - 1),
        pending: restarted ? null : paused ? old.pending??null : response.pending ?? null,
        history: [...(restarted ? [] : old.history ?? []), { request: request.category, topic: response.category }].slice(-4)
    };
}
function decorate(base, tone, request, roll=randomInt) {
    const previous = request.conversation ?? {};
    const control = request.category;
    if (['help','stop'].includes(control)) return base;
    const label = tone === 'owner' ? 'handsome' : tone === 'mae' ? 'Mae' : null;
    const address = text => label ? `${label === 'handsome' ? 'Of course, handsome' : 'Mae'}. ${text}` : text;
    const result = (content, category, extra={}) => ({payload:{content:address(content)},category,session:true,question:false,...extra});
    if (control === 'rude') {
        return result('Understood. I will soften the next four replies.', request.context ?? 'general', {modeChange:'gentle',pending:previous.pending??null,question:previous.question??false});
    }
    if (control.startsWith('tone_')) {
        const name = control === 'tone_gentle' ? 'gentle' : control === 'tone_serious' ? 'serious' : 'normal';
        const content = name === 'normal' ? 'Back to the usual playful tone.'
            : name === 'gentle' ? 'I will keep the next four replies gentle. No sharp teasing.'
            : 'I will keep the next four replies straightforward. No jokes.';
        return result(content,request.context ?? 'general',{modeChange:name,pending:previous.pending??null,question:previous.question??false});
    }
    if (control === 'topic_change') {
        const options = tone === 'owner'
            ? ['Of course... we can leave that behind. What is on your mind?', 'A fresh subject, then. What would you like to talk about?']
            : tone === 'mae' ? ['Sure, Mae. We can leave that topic behind. What is on your mind?', 'A new subject is fine, Mae. Go ahead.']
            : ['Sure. We can leave that behind. What is on your mind?', 'New subject, then. What would you like to talk about?'];
        const content = options[roll(options.length)];
        return {payload:{content},category:'general',session:true,question:false,pending:null};
    }
    if (control === 'repair') {
        return result('I may have misread that. What did you mean?',request.context??'general',{pending:{kind:'repair'}});
    }
    if (control === 'repair_detail') {
        const detail = normalize(request.argument ?? '');
        if (['tone','ტონი'].includes(detail)) {
            return result('I will ease up. The next four replies will be gentler. You can also say `be serious` or `normal mode`.', request.context ?? 'general', {modeChange:'gentle',pending:null});
        }
        if (['topic','თემა'].includes(detail)) {
            return result('Let us leave that topic behind. Try a compliment, a secret, advice, or `kitsune pick tea / coffee`.', 'general', {pending:null});
        }
        return result('Tell me what you wanted me to do: `nice`, `roast`, `tip`, `secret`, or `kitsune pick tea / coffee`. I will start from that request.', 'general', {pending:null});
    }
    if (control === 'context_choices') {
        return {...base, pending:base.category === 'fallback' ? {kind:'choices'} : null};
    }
    if (control === 'mood') {
        const choices=tone==='owner'
            ? ['A little softer now that you are here. How are you doing?','A quiet chat with you sounds nice. How are things?','You caught me trying to look composed. How are you doing?']
            : tone==='mae'||tone==='ash'
            ? ['A quiet moment for a friendly chat. How are you doing?','Here and happy to chat. How are things with you?','A little fox mischief, kept friendly. How are you doing?']
            : ['Suspiciously composed. We will see how long that lasts. How are you doing?','Here, keeping the fox drama manageable. How are you doing?','Ready for a conversation. How are things with you?'];
        const content=previous.mode?.remaining>0?address('I will keep this calm. How are you doing?'):choices[previous.moodTurns??0];
        return {...base,payload:{content},question:false,pending:{kind:'mood'}};
    }
    if (control === 'uncertain') {
        const mood = previous.pending?.kind === 'mood';
        return result(mood ? 'You do not have to put a name to the mood. We can keep this light. Try a compliment, a secret, or a little advice.'
            : request.context === 'pick' ? 'Not convinced by the random pick? You can send `kitsune pick` with your options again, or tell me two new choices separated by `/`.'
            : 'Let us narrow it down. Send 2–10 choices separated by `/`, and I can make a random pick.', 'uncertain', mood ? {} : {pending:{kind:'choices'}});
    }
    const mode = previous.mode?.remaining > 0 ? previous.mode.name : 'normal';
    if (mode !== 'normal') {
        // Replace only attitude-bearing categories; factual helpers and explanations stay intact.
        const softened = {
            thanks: 'You are welcome. I am glad it helped.',
            reaction_thanks: 'You are welcome. I am glad it helped.',
            yes: 'Understood. What would you like next?',
            no: 'That is fine. We can change the subject.',
            agree: 'Agreed.',
            returning: 'Welcome back. How are you doing?',
            busy: 'Take your time. There is no rush to reply.',
            pause: 'Of course. Take your time.',
            goodnight: 'Good night. Rest well.',
            morning: 'Good morning. How is your day starting?',
            stop: 'Of course. We can leave it here.',
            general: 'You have my attention. What would you like to talk about?',
            hi: 'Hello. How are you doing?',
            roast: 'I will skip the sharp roast while the gentler tone is active. Try a compliment or a little advice.',
            joke_challenge: 'We can keep the conversation calm. What did you mean?',
            verbal_challenge: 'I can keep this straightforward. What is the question?',
            transaction_bait: 'No offer is needed. Please ask the question directly.',
            reaction_davi_insult: 'Please keep criticism of Davi respectful. Tell me the issue without the insults.',
            ambiguous_tease: 'I can keep this straightforward. What would you like to ask?',
            answer_confusing: 'I understand. The answer was unclear. I can try a simpler version.',
            sarcastic_challenge: 'I can try again. Tell me the specific question.',
            answer_feedback: 'I understand that you mean the answer. I can rephrase it.',
            reaction_insult: 'We can reset this conversation. Tell me what bothered you.',
            reaction_dismissive: 'We can pause. Use `kitsune stop` to end the conversation.',
            reaction_anger: 'The dramatic tone is fictional. I can keep this calm.',
            rude: 'Understood. I will ease up.',
            challenge: 'Let us keep this straightforward. A choice, a compliment, or advice?',
            laugh: 'Glad that made you smile.',
            bored: 'Would you prefer a compliment, a secret, or some advice?',
            curious: 'I can offer a compliment, a random choice, a character secret, or a little advice.'
        };
        const effective = control === 'again' ? base.category : control;
        if (effective === 'joke' && mode === 'serious') return result('I will skip jokes while the straightforward tone is active. Say `normal mode` to restore the playful tone.', 'joke');
        if (effective === 'rate') {
            const score = base.payload.content.match(/(?:^|\s)(10|[1-9])\/10/u)?.[1];
            if (score) return result(`${score}/10. A random score for fun, not a judgment.`, 'rate');
        }
        if (softened[effective]) return result(softened[effective],effective,['hi','returning'].includes(effective) ? {pending:{kind:'mood'}} : {});
    }
    // Explanations preserve the question which was actually asked.
    if (request.followup && ['why','really','explain'].includes(control)) {
        return {...base, pending:previous.pending??null};
    }
    return base;
}
module.exports = { contextualCategory, memoryAfter, decorate };
