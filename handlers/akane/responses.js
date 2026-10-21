const { escapeMarkdown } = require('discord.js');
const { randomInt } = require('node:crypto');
const { OWNER_ID, replies, dialogue } = require('./settings');
const { drawReply, getReplyState } = require('./state');
const { buildHelp } = require('./help');
const conversation = require('../../config/akaneConversation');

for (const [tone, categories] of Object.entries(conversation.pools)) {
    for (const [category, pool] of Object.entries(categories)) {
        replies[`conversation_${tone}_${category}`] = pool;
    }
}

const english = require('../../config/akaneEnglish');
for (const [tone, categories] of Object.entries(english.pools)) {
    for (const [category, pool] of Object.entries(categories)) {
        replies[`conversation_${tone}_${category}`] = pool;
    }
}

// Extend existing bags rather than replacing the established dialogue.
const expansion = require('../../config/akaneDialogueExpansion');
for (const [tone, categories] of Object.entries(expansion)) {
    for (const [category, pool] of Object.entries(categories)) {
        const key = `conversation_${tone}_${category}`;
        replies[key] = [...new Set([...(replies[key] ?? []), ...pool])];
    }
}

const everyday = require('../../config/akaneEveryday');
for (const [tone, categories] of Object.entries(everyday.pools)) {
    for (const [category, pool] of Object.entries(categories)) {
        const key = `conversation_${tone}_${category}`;
        replies[key] = [...new Set([...(replies[key] ?? []), ...pool])];
    }
}

const repairs = require('../../config/akaneConversationRepairs');
for (const [tone, categories] of Object.entries(repairs.pools)) {
    for (const [category,pool] of Object.entries(categories)) {
        const key = `conversation_${tone}_${category}`;
        replies[key] = [...new Set([...(replies[key] ?? []), ...pool])];
    }
}

const social = require('../../config/akaneSocialReplies');
for (const [tone,categories] of Object.entries(social.pools)) {
    for (const [category,pool] of Object.entries(categories)) {
        const key=`conversation_${tone}_${category}`;
        replies[key]=[...new Set([...(replies[key] ?? []),...pool])];
    }
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
    return id === OWNER_ID ? 'owner' : id === dialogue.maeId ? 'mae' : 'public';
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
            return response('Give me 2–10 choices separated by `/`.\n`akane pick pvp / training`', 'fallback');
        }
        const choice = escapeMarkdown(options[randomInt(options.length)]);
        const suffix = tone === 'owner' ? ', handsome. That is my pick.'
            : tone === 'mae' ? '. That would be my pick, Mae.' : '. There. A decision.';
        return response(`**${choice}**${suffix}`, 'pick');
    }

    // Do not deliver a cold introduction to Mae, even when she asks about someone.
    if (category === 'member' && tone === 'mae') {
        return response('A friendly hello seems a good place to start, Mae.', 'member');
    }

    let content = drawReply(state, choosePool(tone, category));
    if (category === 'rate') content = content.replace(/\{score\}/gu, String(randomInt(1, 11)));
    if (category === 'tip' && tone !== 'public') {
        content = `${tone === 'owner' ? 'A little thought for you, handsome' : 'A little thought for you, Mae'}:\n\n${content}`;
    }
    if (category === 'member' && tone === 'owner') {
        content = `For you, Davi, a dramatic introduction:\n\n${content}`;
    }
    if (request.target) content = `**${escapeMarkdown(request.target.slice(0, 80))}**\n${content}`;

    const question = content.includes('Reply yes or no.');
    // Keep the instructions short and consistent with the parser.
    content = content.replace('Reply yes or no.', 'Reply yes/no, or use `akane yes` / `akane no`.');
    return response(content, category, question);
}

const { decorate } = require('./context');
function buildResponse(message, request) {
    if (request.category === 'reaction_question') request = {...request,category:'clarify'};
    const controls = ['tone_gentle', 'tone_serious', 'tone_reset', 'repair', 'repair_detail', 'topic_change', 'rude'];
    let base;
    if (['why', 'really', 'explain'].includes(request.category) && request.context && (english.pools.public[request.context] || everyday.explanations[request.context] || repairs.explanations[request.context] || social.explanations[request.context])) {
        const meanings = {...everyday.explanations,...repairs.explanations,...social.explanations,hungry:'You said you were hungry, so I suggested a food break.',gaming:'I took that as a gaming update, not a request to control your game.',music:'I understood that as a music-related comment. I cannot play audio.',lonely:'You asked for a little company, so I offered a light conversation.',feeling_neutral:'You described an ordinary or mixed mood, so I kept the reply low key.',conversation_marker:'That sounded like the start of a thought. I asked you to finish it.'};
        const tone=toneFor(message.author.id);
        const content=(tone==='owner'?'Of course, handsome. ':tone==='mae'?'Mae, ':'')+(meanings[request.context] ?? 'I did not understand the exact request. Please give me the main point in a short sentence.');
        return {payload:{content},category:request.context,question:false,session:true,pending:request.conversation?.pending??null};
    }
    if (controls.includes(request.category)) {
        base = { payload: { content: '' }, category: request.category, session: true };
    } else {
        const effective = request.category === 'context_choices'
            ? { ...request, category: 'pick' } : request;
        base = buildBaseResponse(message, effective);
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
    const final = decorate(base, toneFor(message.author.id), request);
    if (request.category === 'day_chat' && final.payload.content?.includes('?')) final.pending = {kind:'mood'};
    if (['hi','returning','morning'].includes(final.category) && /how (?:are you(?: doing)?|is your day(?: starting| going)?)\?/iu.test(final.payload.content ?? '')) final.pending = {kind:'mood'};
    return final;
}
module.exports = { buildResponse, toneFor };
