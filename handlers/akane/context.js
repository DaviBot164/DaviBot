// Bounded, temporary conversation context. No user text is retained.
const { normalize } = require('./aliases');
const controls = new Map();
for (const [category, values] of Object.entries({
    tone_gentle: ['be nicer','be nice to me','be gentle','stop teasing','less teasing','easy on me','ცოტა რბილად','ნუ მეუხეშები','ნუ მეხუმრები'],
    tone_serious: ['be serious','serious mode','no jokes','seriously please','სერიოზულად მიპასუხე','ხუმრობის გარეშე'],
    tone_reset: ['normal mode','back to normal','tease me again','ჩვეულებრივად','ისევ გამეხუმრე'],
    repair: ["that's not what i meant",'that is not what i meant','you misunderstood','you got me wrong','not what i meant','wrong meaning','ეგ არ მიგულისხმია','არასწორად გაიგე','სხვას ვგულისხმობდი']
})) for (const value of values) controls.set(normalize(value), category);
function contextualCategory(raw, session) {
    const text = normalize(raw);
    if (controls.has(text)) return controls.get(text);
    if (session?.pending?.kind === 'mood') {
        if (['bad','not good','awful','terrible','ცუდად','ცუდი'].includes(text)) return 'feeling_bad';
        if (['good','fine','great','კარგად','კარგი'].includes(text)) return 'feeling_good';
        if (['tired','sleepy','დაღლილი'].includes(text)) return 'tired';
    }
    if (session?.pending?.kind === 'repair' && ['topic','tone','request','თემა','ტონი','თხოვნა'].includes(text)) return 'repair_detail';
    if (session?.pending?.kind === 'choices' && raw.includes('/')) return 'context_choices';
    return null;
}
function memoryAfter(previous, request, response) {
    const old = previous ?? {};
    const mode = response.modeChange === 'normal' ? null : response.modeChange
        ? { name: response.modeChange, remaining: 4 }
        : old.mode?.remaining > 1 ? { ...old.mode, remaining: old.mode.remaining - 1 } : null;
    return {
        mode,
        pending: response.pending ?? null,
        history: [...(old.history ?? []), { request: request.category, topic: response.category }].slice(-4)
    };
}
function decorate(base, tone, request) {
    const previous = request.conversation ?? {};
    const control = request.category;
    if (['help','stop'].includes(control)) return base;
    const label = tone === 'owner' ? 'handsome' : tone === 'mae' ? 'Mae' : null;
    const address = text => label ? `${label === 'handsome' ? 'Of course, handsome' : 'Mae'}. ${text}` : text;
    const result = (content, category, extra={}) => ({payload:{content:address(content)},category,session:true,question:false,...extra});
    if (control.startsWith('tone_')) {
        const name = control === 'tone_gentle' ? 'gentle' : control === 'tone_serious' ? 'serious' : 'normal';
        const content = name === 'normal' ? 'Back to the usual playful tone.'
            : name === 'gentle' ? 'I will keep the next four replies gentle. No sharp teasing.'
            : 'I will keep the next four replies straightforward. No jokes.';
        return result(content,request.context ?? 'general',{modeChange:name,pending:previous.pending??null,question:previous.question??false});
    }
    if (control === 'repair') {
        return result('I read that the wrong way. Was it the topic, the tone, or the request? Try a clearer request, or say `be nicer` / `be serious`.',request.context??'general',{pending:{kind:'repair'}});
    }
    if (control === 'repair_detail') {
        return result('Understood. Write the request again in a short sentence, or use `be nicer` / `be serious` to change the tone.', request.context ?? 'general', {pending:{kind:'repair'}});
    }
    if (control === 'context_choices') {
        return {...base, pending:base.category === 'fallback' ? {kind:'choices'} : null};
    }
    if (control === 'mood') {
        const content = previous.mode?.remaining > 0 ? address('I will keep this calm. How are you doing?') : tone === 'owner' ? 'A little softer now that you are here, handsome. How are you doing?'
            : tone === 'mae' ? 'A pleasantly quiet fictional mood, Mae. How are you doing?'
            : 'Suspiciously composed. We will see how long that lasts. How are you doing?';
        return {...base,payload:{content},question:false,pending:{kind:'mood'}};
    }
    if (control === 'uncertain') {
        const mood = previous.pending?.kind === 'mood';
        return result(mood ? 'You do not have to put a name to the mood. We can keep this light. Try a compliment, a secret, or a little advice.'
            : request.context === 'pick' ? 'Not convinced by the random pick? You can send `akane pick` with your options again, or tell me two new choices separated by `/`.'
            : 'Let us narrow it down. Send 2–10 choices separated by `/`, and I can make a random pick.', 'uncertain', mood ? {} : {pending:{kind:'choices'}});
    }
    const mode = previous.mode?.remaining > 0 ? previous.mode.name : 'normal';
    if (mode !== 'normal') {
        // Replace only attitude-bearing categories; factual helpers and explanations stay intact.
        const softened = {
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
            reaction_insult: 'We can reset this conversation. Tell me what bothered you.',
            reaction_dismissive: 'We can pause. Use `akane stop` to end the conversation.',
            reaction_anger: 'The dramatic tone is fictional. I can keep this calm.',
            rude: 'Understood. I will ease up.',
            challenge: 'Let us keep this straightforward. A choice, a compliment, or advice?',
            laugh: 'Glad that made you smile.',
            bored: 'Would you prefer a compliment, a secret, or some advice?',
            curious: 'I can offer a compliment, a random choice, a character secret, or a little advice.'
        };
        const effective = control === 'again' ? base.category : control;
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
