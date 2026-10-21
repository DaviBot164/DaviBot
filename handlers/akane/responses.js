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
    'davi', 'mae', 'laugh', 'general', 'hi'
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

function buildResponse(message, request) {
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

module.exports = { buildResponse, toneFor };
