const {followThroughResponse}=require('./followThrough');
const {recoveryResponse}=require('./recoveryResponses');
const {briefResponse}=require('./briefConversation');
const {repairExplanation} = require('./explanationRepair');
const { applyEmojiStyle } = require('./emojiStyle');
const { applySpeechStyle } = require('./speechStyle');
const { attachExpectation } = require('./followups');
const { escapeMarkdown } = require('discord.js');
const { randomInt } = require('node:crypto');
const { OWNER_ID, replies, dialogue } = require('./settings');
const { drawReply, getReplyState, randomFor } = require('./state');
const { buildHelp } = require('./help');
const friends = require('../../config/kitsuneFriends');
const conversation = require('../../config/kitsuneConversation');

for (const [tone, categories] of Object.entries(conversation.pools)) {
    for (const [category, pool] of Object.entries(categories)) {
        replies[`conversation_${tone}_${category}`] = pool;
    }
}

const english = require('../../config/kitsuneEnglish');
for (const [tone, categories] of Object.entries(english.pools)) {
    for (const [category, pool] of Object.entries(categories)) {
        replies[`conversation_${tone}_${category}`] = pool;
    }
}

// Extend existing bags rather than replacing the established dialogue.
const expansion = require('../../config/kitsuneDialogueExpansion');
for (const [tone, categories] of Object.entries(expansion)) {
    for (const [category, pool] of Object.entries(categories)) {
        const key = `conversation_${tone}_${category}`;
        replies[key] = [...new Set([...(replies[key] ?? []), ...pool])];
    }
}

const everyday = require('../../config/kitsuneEveryday');
for (const [tone, categories] of Object.entries(everyday.pools)) {
    for (const [category, pool] of Object.entries(categories)) {
        const key = `conversation_${tone}_${category}`;
        replies[key] = [...new Set([...(replies[key] ?? []), ...pool])];
    }
}

const repairs = require('../../config/kitsuneConversationRepairs');
for (const [tone, categories] of Object.entries(repairs.pools)) {
    for (const [category,pool] of Object.entries(categories)) {
        const key = `conversation_${tone}_${category}`;
        replies[key] = [...new Set([...(replies[key] ?? []), ...pool])];
    }
}

const practical = require('../../config/kitsunePractical');
for (const [tone,categories] of Object.entries(practical.pools)) {
    for (const [category,pool] of Object.entries(categories)) replies[`conversation_${tone}_${category}`]=pool;
}
const social = require('../../config/kitsuneSocialReplies');
for (const [tone,categories] of Object.entries(social.pools)) {
    for (const [category,pool] of Object.entries(categories)) {
        const key=`conversation_${tone}_${category}`;
        replies[key]=[...new Set([...(replies[key] ?? []),...pool])];
    }
}

const voice = require('../../config/kitsuneVoice');
for (const [tone,categories] of Object.entries(voice.pools)) {
    for (const [category,pool] of Object.entries(categories)) replies[`conversation_${tone}_${category}`]=pool;
}
for(const category of ['reaction_possessive','reaction_ownerFlirt']) replies[`conversation_owner_${category}`]=voice.pools.owner.reaction_romance;
const pragmatics = require('../../config/kitsunePragmatics');
for(const [tone,categories]of Object.entries(pragmatics.pools)){
    for(const [category,pool]of Object.entries(categories))replies[`conversation_${tone}_${category}`]=pool;
}
const chatAbuse = require('../../config/kitsuneChatAbuse');
replies.conversation_public_reaction_insult = [...new Set([...(replies.conversation_public_reaction_insult??[]),...chatAbuse.publicReplies])];
const dayConversation = require('../../config/kitsuneDayConversation');
const musicConversation = require('../../config/kitsuneMusic');
const gameConversation = require('../../config/kitsuneGames');
for(const [tone,categories]of Object.entries(gameConversation.pools)){
    for(const [category,pool]of Object.entries(categories))replies[`conversation_${tone}_${category}`]=pool;
}
for(const [tone,categories]of Object.entries(musicConversation.pools)){
    for(const [category,pool]of Object.entries(categories))replies[`conversation_${tone}_${category}`]=pool;
}
for(const [tone,categories] of Object.entries(dayConversation.pools)) {
    for(const [category,pool] of Object.entries(categories)) replies[`conversation_${tone}_${category}`]=pool;
}
const memberBoundaries = require('../../config/kitsuneMemberBoundaries');
for (const [tone,categories] of Object.entries(memberBoundaries.pools)) {
    for (const [category,pool] of Object.entries(categories)) replies[`conversation_${tone}_${category}`]=pool;
}
const boundaries = require('../../config/kitsuneBoundaries');
for(const [tone,categories]of Object.entries(boundaries.pools)) {
    for(const [category,pool]of Object.entries(categories))replies[`conversation_${tone}_${category}`]=pool;
}
// Share friendly dialogue while keeping each friend's name and tone separate.
for (const [key, pool] of Object.entries(replies)) {
    if (!/^(?:conversation|dialogue)_mae_/.test(key)) continue;
    replies[key.replace('_mae_', '_ash_')] = pool.map(line => line.replace(/\bMae\b/g, 'Ash'));
}
const OWNER_MAP = {
    davi: 'nice', reaction_davi: 'nice', reaction_davi_insult: 'tension',
    reaction_romance: 'flirt', reaction_affection: 'flirt',
    reaction_possessive: 'flirt', reaction_ownerFlirt: 'flirt',
    reaction_apology: 'apology', reaction_insult: 'tension',
    reaction_dismissive: 'tension', reaction_anger: 'tension',
    reaction_identity: 'identity', reaction_bot: 'bot',
    reaction_question: 'question', reaction_reassurance: 'thanks',
    clarify: 'fallback'
};
const MAE_MAP = {
    reaction_romance: 'romance', reaction_affection: 'affection',
    reaction_possessive: 'romance', reaction_ownerFlirt: 'romance',
    reaction_apology: 'apology', reaction_insult: 'tension',
    reaction_dismissive: 'tension', reaction_anger: 'tension', rude: 'tension',
    reaction_identity: 'identity', reaction_bot: 'identity',
    reaction_question: 'fallback', reaction_reassurance: 'reassurance',
    clarify: 'fallback'
};
const REPEATABLE = new Set([
    'nice', 'roast', 'tip', 'mood', 'secret', 'luck', 'rate',
    'davi', 'mae', 'laugh', 'general', 'hi', 'joke'
]);

function toneFor(id) {
    return id === OWNER_ID ? 'owner' : id === dialogue.maeId ? 'mae' : friends[id]?.tone ?? 'public';
}

function choosePool(tone, category) {
    const fresh = `conversation_${tone}_${category}`;
    if (replies[fresh]?.length) return fresh;

    // References to people use third-person dialogue, independent of the caller.
    if (category === 'mae') return 'dialogue_maeMention';
    if (tone !== 'owner' && ['davi', 'reaction_davi', 'reaction_davi_insult'].includes(category)) {
        return category;
    }
    if (category === 'member') return 'member';
    if (category === 'tip') return 'tip';

    if (tone === 'owner') {
        const key = `owner_${OWNER_MAP[category] ?? category}`;
        return replies[key]?.length ? key : 'owner_fallback';
    }
    if (tone === 'ash') {
        const key = `dialogue_ash_${MAE_MAP[category] ?? category}`;
        return replies[key]?.length ? key : 'dialogue_ash_fallback';
    }
    if (tone === 'mae') {
        const key = `dialogue_mae_${MAE_MAP[category] ?? category}`;
        return replies[key]?.length ? key : 'dialogue_mae_fallback';
    }
    const key = `dialogue_${category}`;
    if (replies[key]?.length) return key;
    return replies[category]?.length ? category : 'conversation_public_fallback';
}

function contextualReply(request, tone) {
    const context = request.context;
    const explanationKey = context === 'reaction_davi' ? 'davi' : context;
    let content = conversation.explanations[explanationKey] ??
        'Which part did you mean? Give me a little more detail.';

    if (request.category !== 'explain') {
        if (['nice', 'davi', 'reaction_davi'].includes(context) && tone === 'owner') {
            content = request.category === 'why'
                ? 'Because being sweet to you comes easily, handsome.'
                : 'Yes, Davi. You can take the compliment. The smile was meant for you.';
        } else if (context === 'nice' && request.category === 'really') {
            content = tone === 'mae'
                ? 'Yes, Mae. That was a compliment. You can let yourself enjoy it.'
                : 'Yes. Take the compliment before I regret being pleasant.';
        }
    }
    if (tone === 'owner' && !/Davi|handsome|sweetheart/u.test(content)) {
        content = `Of course, handsome. ${content}`;
    }
    if (tone === 'mae' && !/\bMae\b/u.test(content)) content = `Mae, ${content}`;
    return content;
}

function buildBaseResponse(message, request) {
    const tone = toneFor(message.author.id);
    const state = getReplyState(message);
    const roll=randomFor?.(message)??randomInt;
    let category = request.category;

    function response(content, context = category, question = false, session = true) {
        return { payload: { content }, category: context, question, session };
    }

    if (category === 'help') {
        return { payload: { embeds: [buildHelp(message)] }, session: false };
    }
    if (category === 'stop') {
        return response(drawReply(state, choosePool(tone, 'stop')), 'stop', false, false);
    }

    if (request.followup && ['why', 'really', 'explain'].includes(category)) {
        return response(contextualReply(request, tone), request.context, request.question ?? false);
    }
    if (category === 'again' && request.context === 'pick') {
        const options=request.conversation?.pickOptions;
        if (!Array.isArray(options) || options.length < 2) return response('I do not have the previous options here. Send `kitsune pick` with the options separated by `/`.', 'fallback');
        return buildBaseResponse(message,{...request,category:'pick',argument:options.join('/'),followup:false});
    }
    if (category === 'again') {
        category = REPEATABLE.has(request.context) ? request.context : 'again';
    }

    if (request.followup && ['yes', 'no'].includes(category)) {
        if (category === 'yes' && ['nice', 'roast', 'davi', 'reaction_davi'].includes(request.context)) {
            category = request.context === 'reaction_davi' ? 'davi' : request.context;
        } else if (category === 'yes' && request.context === 'mood') {
            category = 'tip';
        } else {
            return response(drawReply(state, choosePool(tone, category)), category);
        }
    }

    if (category === 'pick') {
        const options = [...new Set((request.argument ?? '').split('/').map(x => x.trim()).filter(Boolean))];
        if (options.length < 2 || options.length > 10 || options.some(x => x.length > 100)) {
            return response('Give me 2–10 choices separated by `/`.\n`kitsune pick pvp / training`', 'fallback');
        }
        const selected = options[roll(options.length)];
        const choice = escapeMarkdown(selected);
        const suffix = tone === 'owner' ? ', handsome. A random pick for you.'
            : tone === 'mae' ? '. A random pick, Mae.' : '. Randomly chosen. The imaginary committee has spoken.';
        return {...response(`**${choice}**${suffix}`, 'pick'),pickOptions:options,pickSelected:selected};
    }

    // Do not deliver a cold introduction to Mae, even when she asks about someone.
    if (category === 'member' && tone === 'mae') {
        return response('A friendly hello seems a good place to start, Mae.', 'member');
    }

    const poolName=choosePool(tone,category);
    let content=drawReply(state,poolName);
    const templateRef=['secret','tip','joke'].includes(category)?{pool:poolName,index:replies[poolName].indexOf(content),topic:category}:null;
    if (category === 'rate') content = content.replace(/\{score\}/gu, String(roll(1, 11)));
    if (category === 'tip' && tone !== 'public') {
        content = `${tone === 'owner' ? 'A little thought for you, handsome' : 'A little thought for you, Mae'}:\n\n${content}`;
    }
    if (category === 'member' && tone === 'owner') {
        content = `For you, Davi, a dramatic introduction:\n\n${content}`;
    }
    if (request.target) content = `**${escapeMarkdown(request.target.slice(0, 80))}**\n${content}`;

    const question = content.includes('Reply yes or no.');
    // Keep the instructions short and consistent with the parser.
    content = content.replace('Reply yes or no.', 'Reply yes/no, or use `kitsune yes` / `kitsune no`.');
    return {...response(content,category,question),...(templateRef?{templateRef}:{})};
}

const { decorate } = require('./context');
function buildUnstyledResponse(message, request) {
    const continued=followThroughResponse(request,randomFor?.(message)??randomInt);if(continued)return continued;
    const recovered=recoveryResponse(message,request,replies);if(recovered)return recovered;
    const brief=briefResponse(request);if(brief)return brief;
    if(request.category==='light_topic') {
        return {payload:{content:'Music, then. What is a song you keep coming back to?'},category:'music_chat',session:true,question:false,pending:null};
    }
    if(request.category==='day_limits') {
        const adviceAllowed=!(request.conversation?.noAdviceRemaining>0) && request.conversation?.history?.some(turn=>['advice_resume','tip'].includes(turn.request));
        if(adviceAllowed)return {payload:{content:'It does not have to be no to everyone. You could offer a smaller commitment or a later time. Is there one request you could adjust?'},category:'day_limits',session:true,question:false};
    }
    if(['day_more_time','day_reaction_worry'].includes(request.category)) {
        const adviceAllowed=!(request.conversation?.noAdviceRemaining>0) && request.conversation?.history?.some(turn=>['advice_resume','tip'].includes(turn.request));
        if(adviceAllowed){
            const content=request.category==='day_more_time'
                ?'Asking for more time is one option. You could name a realistic date rather than promise everything at once.'
                :'They might be disappointed, but we cannot know in advance. You can acknowledge that and still be clear about what you can realistically do.';
            return {payload:{content},category:request.category,session:true,question:false};
        }
    }
    if(request.category==='advice_resume') {
        const work=['day_work','day_work_stress','day_people','day_privacy'].includes(request.context);
        const pressure=['day_pressure','day_fairness'].includes(request.context);
        const study=/^study_/u.test(request.context??'');
        const content=pressure?'If I were handling those expectations, I would separate what I can realistically do from what others want, then say that clearly. What are they expecting from you?'
            :work?'Advice is welcome now, understood. Start with one specific interaction you want to handle differently. What happened?'
            :study?'Advice is welcome now. Choose one part of the material you are stuck on. What is the topic?'
            :'Advice is welcome now, understood. What are you trying to do, and which part is not working?';
        return {payload:{content},category:'help_offer',session:true,question:false,pending:{kind:'help_topic'}};
    }
    if(request.category==='explain_serious')return {...repairExplanation({...request,category:'explain_fresh'}),modeChange:'serious'};
    if(['explain_fresh','repetition_feedback'].includes(request.category))return repairExplanation(request);
    if(request.category==='decline_advice') {
        const base=buildBaseResponse(message,request);
        return {...base,category:request.context??'decline_advice',pending:request.conversation?.pending??null};
    }
    if(request.conversation?.noAdviceRemaining>0 && /^study_/u.test(request.category)) {
        return attachExpectation({payload:{content:'That part is difficult, understood. I can listen without turning this into another task.'},category:request.category,session:true,question:false},request);
    }
    if(request.category==='normal_chat')return {...buildBaseResponse(message,request),modeChange:'serious'};
    if(request.declineAdvice && ['feeling_bad','tired','mental_tired','lonely','bored','feeling_good','feeling_neutral'].includes(request.category)) {
        const meaning={feeling_bad:'You are having a low moment',tired:'You are feeling worn out',lonely:'You want a little company',mental_tired:'You are mentally worn out',bored:'You are feeling bored',feeling_good:'You are feeling good',feeling_neutral:'You are feeling okay'}[request.category];
        return {payload:{content:meaning+'. No advice; I am listening.'},category:request.category,session:true,question:false};
    }
    if(request.category==='choice_preference') {
        return {payload:{content:'A different kind of option, got it. Send me two new choices, like `kitsune pick iced tea / cold water`.'},category:'choice_preference',session:true,question:false,pending:{kind:'choices'}};
    }
    if(request.category==='pick_other') {
        const options=request.conversation?.pickOptions;
        const selected=request.conversation?.pickSelected;
        if(!Array.isArray(options)||options.length!==2||!options.includes(selected)) {
            return {payload:{content:'I need two options and a previous choice to know which one you mean. Try `kitsune pick tea / coffee`.'},category:'clarify',session:true,question:false};
        }
        const other=options.find(option=>option!==selected);
        return {payload:{content:`**${escapeMarkdown(other)}**. The other option.`},category:'pick',session:true,question:false,pickOptions:options,pickSelected:other};
    }
    if(request.category==='explain_wait') {
        const base=buildBaseResponse(message,request);
        return {...base,category:request.context??'general',pending:{kind:'repair'}};
    }
    if(request.category==='confirm_request') {
        if(request.context)return buildUnstyledResponse(message,{...request,category:'really',followup:true});
        return {payload:{content:'Which part are you asking about?'},category:'clarify',session:true,question:false};
    }
    if(request.category==='feedback_better' && /^study_/u.test(request.context??'')) {
        return {payload:{content:'That method sounds more useful, then. We can continue with it.'},category:'feedback_better',session:true,question:false,pending:request.conversation?.pending??null};
    }
    if(request.category==='repair_answer') {
        const tone=toneFor(message.author.id);
        return {payload:{content:(tone==='owner'?'Handsome, ':tone==='mae'?'Mae, ':'')+'you meant my answer, not me. Understood. I can rephrase the answer.'},category:request.context??'general',session:true,question:false,pending:null};
    }
    if(request.category==='simplify') {
        const short={
            study_start:'Pick one small task to start.',
            study_step:'Read one short section. Then answer one question about it.',
            study_breakdown:'Make the task smaller: one sentence or one exercise.',
            study_alternative:'Try explaining one idea aloud instead of reading it again.',
            pick:'I chose randomly from your options.',
            answer_confusing:'I meant: show me one unclear sentence so I know what to clarify.',
            answer_feedback:'I meant: tell me which part was wrong, and I will try again.',
            target_correction:'You meant something else, rather than me.',
            topic_boundary:'You do not have to discuss that subject.'
        };
        const tone=toneFor(message.author.id);
        const content=short[request.context]??practical.explanations[request.context]??'Which sentence should I simplify? Give me the part you mean.';
        return {payload:{content:(tone==='owner'?'Handsome, ':tone==='mae'?'Mae, ':'')+content},category:request.context??'clarify',session:true,question:false,pending:request.conversation?.pending??null};
    }
    if(request.category==='explain_gentle') {
        const explained=buildUnstyledResponse(message,{...request,category:'explain',followup:Boolean(request.context)});
        return {...explained,modeChange:'gentle'};
    }
    if (request.category === 'reaction_question') request = {...request,category:'clarify'};
    const controls = ['tone_gentle', 'tone_serious', 'tone_reset', 'repair', 'repair_detail', 'topic_change', 'rude'];
    let base;
    if (['why', 'really', 'explain'].includes(request.category) && request.context && (english.pools.public[request.context] || everyday.explanations[request.context] || repairs.explanations[request.context] || social.explanations[request.context] || practical.explanations[request.context] || voice.explanations[request.context] || pragmatics.explanations[request.context] || gameConversation.explanations[request.context] || musicConversation.explanations[request.context] || dayConversation.explanations[request.context] || boundaries.explanations[request.context] || memberBoundaries.explanations[request.context])) {
        const meanings = {...everyday.explanations,...repairs.explanations,...social.explanations,...practical.explanations,...voice.explanations,...pragmatics.explanations,...gameConversation.explanations,...musicConversation.explanations,...dayConversation.explanations,...boundaries.explanations,...memberBoundaries.explanations,hungry:'You said you were hungry, so I suggested a food break.',gaming:'I took that as a gaming update, not a request to control your game.',music:'I understood that as a music-related comment. I cannot play audio.',lonely:'You asked for a little company, so I offered a light conversation.',feeling_neutral:'You described an ordinary or mixed mood, so I kept the reply low key.',conversation_marker:'That sounded like the start of a thought. I asked you to finish it.'};
        const tone=toneFor(message.author.id);
        const content=(tone==='owner'?'Of course, handsome. ':tone==='mae'?'Mae, ':'')+(meanings[request.context] ?? 'I did not understand the exact request. Please give me the main point in a short sentence.');
        return {payload:{content},category:request.context,question:false,session:true,pending:request.conversation?.pending??null};
    }
    if (controls.includes(request.category)) {
        base = { payload: { content: '' }, category: request.category, session: true };
    } else {
        const effective = request.category === 'context_choices'
            ? { ...request, category: 'pick' } : request;
        base = buildBaseResponse(message, request.mixedSocial ? {...effective,category:'mixed_social'} : effective);
    }
    if (request.conversation?.mode?.remaining > 0 && everyday.explanations[request.category]) {
        const calm = {
            location:'I am here in this Discord chat. I do not have a physical location.',
            activity:'I am replying in this chat. What would you like to talk about?',
            game_invite:'I cannot join games as a player. I can help you choose an activity or recruit players with `/match`.',
            availability:'You have my attention here in the chat. Go ahead.',
            plans:'I do not have real plans outside this chat. We can choose a topic or an activity.',
            day_chat:'I do not have a human day outside the chat. How was your day?',
            preferences:'The character likes dark red, moonlit settings and gentle mischief. Those are fictional preferences.',
            gaming_identity:'I do not play games myself. I can help with choices and the server match system.'
        };
        const tone=toneFor(message.author.id);
        base={...base,payload:{content:(tone==='owner'?'Of course, handsome. ':tone==='mae'?'Mae, ':'')+calm[request.category]}};
    }
    if (request.conversation?.mode?.remaining > 0 && ['sexual_boundary','frustration'].includes(request.category)) {
        const tone=toneFor(message.author.id);
        const line=request.category==='sexual_boundary'
            ? 'I will keep this conversation non-explicit. Please choose another subject.'
            : 'That sounds frustrating. We can pause or choose a calmer subject.';
        base={...base,payload:{content:(tone==='owner'?'Of course, handsome. ':tone==='mae'?'Mae, ':'')+line}};
    }
    const final = decorate(base, toneFor(message.author.id), request, randomFor?.(message)??randomInt);
    if (request.category === 'day_chat' && final.payload.content?.includes('?')) final.pending = {kind:'mood'};
    if (['hi','returning','morning'].includes(final.category) && /how (?:are you(?: doing)?|is your day(?: starting| going)?)\?/iu.test(final.payload.content ?? '')) final.pending = {kind:'mood'};
    if ((request.category === 'decline_advice' || request.declineAdvice || request.conversation?.noAdviceRemaining > 0) && request.category !== 'tip' && /\badvice\b/iu.test(final.payload.content ?? '') && request.category !== 'decline_advice') {
        const tone=toneFor(message.author.id);
        const gentle = {
            feeling_bad:'That sounds like a low moment. We can just talk, without trying to fix it.',
            tired:'You sound tired. We can keep the conversation quiet.',
            mixed_feelings:'You described a mix of feelings. We can just talk about it.',
            emotional_detail:'Your mood, understood. We can just talk, without suggestions.',
            mood_and_play:'You feel down and still want to play. I hear both parts.',
            bored:'A slow moment, then. We can keep each other company in the chat.'
        };
        const kept=(final.payload.content ?? '').split(/(?<=[.!?])\s+/u).filter(line=>! /\badvice\b/iu.test(line)).join(' ');
        const content=gentle[final.category] ?? (kept || 'We can just talk. What is on your mind?');
        final.payload={content:(tone==='owner'?'Handsome, ':tone==='mae'?'Mae, ':'')+content};
    }
    if(request.category==='tip_offer')final.pending={kind:'offered_tip'};
    return attachExpectation(final,request);
}
function buildResponse(message,request) {
    return applyEmojiStyle(applySpeechStyle(buildUnstyledResponse(message,request),toneFor(message.author.id),request),toneFor(message.author.id),request);
}
module.exports = { buildResponse, toneFor };
