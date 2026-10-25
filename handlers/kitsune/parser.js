const {analyzeFollowThrough}=require('./followThrough');
const {recoverIntent}=require('./intentRecovery');
const {namedAddress} = require('./addressing');
const {understandingResult} = require('./understandingResult');
const learningConfig = require('../../config/kitsuneLearning');
const {learningPhrase} = require('./learningPhrases');
const { OWNER_ID, dialogue } = require('./settings');
const { normalize } = require('./aliases');
const { getSession } = require('./state');

const { recognizeDetails, extractChoice, correctedChoice, prepareInput } = require('./language');
const { contextualCategory } = require('./context');
const { reactionClauses } = require('./sentenceParser');
const { recognizeSocial } = require('./socialIntent');

function parseRequestInternal(message, now, learnedAliases = null) {
    const content = String(message.content ?? '').trim();
    const namedTrigger = namedAddress(content);
    const botMention = content.match(/^<@!?(\d+)>[\s,:;.!?…]*(.*)$/su);
    const trigger = namedTrigger ?? (botMention && botMention[1] === message.client?.user?.id
        ? [botMention[0], botMention[2]] : null);
    const previous = getSession(message, now);
    const replying = Boolean(previous && message.reference?.messageId === previous.messageId);
    // A reply to someone else's message must not borrow Kitsune's context.
    const session = !message.reference || replying ? previous : null;
    const raw = trigger ? trigger[1].trim() : content;
    if(raw.length>2000)return null;
    // Empty attachments, stickers and link-only replies are not text requests.
    if (!trigger && (!raw || /^https?:\/\/\S+$/iu.test(raw))) return null;
    const text = normalize(raw);
    const englishOnly = !/[\p{L}]/u.test(raw.replace(/[a-z]/giu, ''));
    const frame=englishOnly?prepareInput(raw):null;
    const details=englishOnly?recognizeDetails(raw,frame):{};
    const contextual=englishOnly?contextualCategory(raw,session,frame):null;
    const flow=englishOnly?analyzeFollowThrough(frame,session):null;
    let category = flow?.category??contextual??details.category??null;
    let recovery=englishOnly&&!flow?recoverIntent(frame,session,value=>recognizeDetails(value).category):null;
    if(recovery && (!category || ['fallback','reaction_question','clarify','question_clarification'].includes(category) || recovery.force)){
        if(!(category && recovery.force && ['jealous','remember','name_question','defend_davi'].includes(recovery.kind)))category=recovery.category;
    }
    else recovery=null;
    if(!flow && session?.templateRef && ['why','explain','simplify'].includes(category)){
        recovery={category,kind:'explain',data:{form:category==='simplify'?'shorter':category},force:true};
    }
    let recognition = contextual?{source:'context',rule:'contextual_followup'}:details.understanding;
    if(flow)recognition={source:'context',rule:'follow_through.'+flow.kind};
    if(recovery && (!recognition || recognition.status==='unmatched'))recognition={source:'recovery',rule:'recovery.'+recovery.kind};
    if(!category && englishOnly && learnedAliases) {
        const learned=learnedAliases.get(learningPhrase(raw));
        if(Object.values(learningConfig.intents).includes(learned)){category=learned;recognition={source:'learned',rule:'approved_alias'};}
    }
    if (!category && englishOnly && session?.pending?.kind==='offered_tip' && /^[a-z][a-z0-9 '\-]{2,250}$/iu.test(raw.trim())) category='tip_received';
    const choice = englishOnly && !flow && recovery?.kind!=='choice_other' ? ((session?.pickOptions?.length >= 2 ? correctedChoice(raw,frame) : null) ?? extractChoice(raw,frame)) : null;

    if (!trigger && !replying) {
        if (
            message.reference || !session ||
            now >= (session.implicitUntil ?? 0) || (!category && !choice)
        ) return null;
    }

    const parts = reactionClauses(frame?.plainSentence??'');
    const meanings = parts.length > 1 && parts.length <= 3 ? parts.map(part => recognizeSocial(part,raw)) : [];
    const mixedSocial = meanings.includes('reaction_affection') && meanings.includes('reaction_insult');
    const context = ['why','explain'].includes(category)&&session?.pickOptions?.length? 'pick':session?.category ?? null;
    const followup = {
        recognition,
        ...(recovery?{recovery}:{}),
        ...(flow?{flow}:{}),
        context,
        declineAdvice: Boolean(details.declineAdvice||recovery?.data?.noAdvice),
        mixedSocial,
        followup: Boolean(context),
        question: session?.question ?? false,
        conversation: session
    };

    if (!category && (!text || /^[\s\p{P}\p{S}]*$/u.test(text))) return { category: 'general', ...followup };
    if (['davi', 'daviti'].includes(text)) return { category: 'davi', ...followup };
    if (['mae'].includes(text)) return { category: 'mae', ...followup };

    const mention = raw.match(/^<@!?(\d+)>[.!?…]*$/u);
    if (mention) {
        const id = mention[1];
        const member = message.mentions?.members?.get(id);
        const user = message.mentions?.users?.get(id);
        if (!member && !user) return { category: 'fallback' };
        return {
            category: id === OWNER_ID ? 'davi' : id === dialogue.maeId ? 'mae' : 'member',
            ...followup,
            targetId: id,
            target: member?.displayName ?? user.username
        };
    }

    if (choice) return { category: 'pick', argument: choice, ...followup };
    if (category==='brief_answer') return {category,argument:frame.sentence,...followup};
    if (['context_choices','repair_detail'].includes(category)) return { category, argument: raw, ...followup };

    if (category) {
        if (['yes', 'no'].includes(category)) {
            return session?.question || category === 'no'
                ? { category, ...followup, followup: Boolean(session?.question) }
                : { category: 'clarify', ...followup };
        }
        if (['why', 'really', 'explain', 'again', 'simplify'].includes(category)) {
            return context ? { category, ...followup } : { category: 'clarify', ...followup };
        }
        return { category, ...followup };
    }

    return { category: /[?？]/u.test(raw) ? 'reaction_question' : 'fallback', ...followup };
}

function parseRequest(message,now,learnedAliases=null){
 const request=parseRequestInternal(message,now,learnedAliases);
 if(!request)return null;
 const {recognition,...rest}=request;
 const source=request.category==='pick'?{source:'choice',rule:'choice_request'}:request.targetId?{source:'mention',rule:'mentioned_member'}:recognition??{source:'parser',rule:'parser_fallback'};
 return {...rest,understanding:understandingResult(request.category,{...source,declineAdvice:request.declineAdvice,recovery:request.recovery,person:request.conversation?.core?.person})};
}
module.exports = { parseRequest };
