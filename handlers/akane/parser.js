const { OWNER_ID, reactionPools, dialogue } = require('./settings');
const { normalize, aliases, DAVI_NAMES } = require('./aliases');
const { getSession } = require('./state');
const { detectReaction } = require('../../config/akaneReactions');
const conversation = require('../../config/akaneConversation');

const { recognize } = require('./language');

function parseRequest(message, now) {
    const content = String(message.content ?? '').trim();
    const trigger = content.match(
        /^(?:akane|აკანე)(?=$|[\s\p{P}\p{S}])[\s,:;.!?…]*(.*)$/isu
    );
    const previous = getSession(message, now);
    const replying = Boolean(previous && message.reference?.messageId === previous.messageId);
    // A reply to someone else's message must not borrow Akane's context.
    const session = !message.reference || replying ? previous : null;
    const raw = trigger ? trigger[1].trim() : content;
    const text = normalize(raw);
    const category = recognize(raw);

    if (!trigger && !replying) {
        if (
            message.reference || !session ||
            now >= (session.implicitUntil ?? 0) || !category
        ) return null;
    }

    const context = session?.category ?? null;
    const followup = {
        context,
        followup: Boolean(context),
        question: session?.question ?? false
    };

    if (!text || /^[\s\p{P}\p{S}]*$/u.test(text)) return { category: 'general' };
    if (DAVI_NAMES.has(text)) return { category: 'davi' };
    if (['mae', 'მეი', 'მაე'].includes(text)) return { category: 'mae' };

    const mention = raw.match(/^<@!?(\d+)>[.!?…]*$/u);
    if (mention) {
        const id = mention[1];
        const member = message.mentions?.members?.get(id);
        const user = message.mentions?.users?.get(id);
        if (!member && !user) return { category: 'fallback' };
        return {
            category: id === OWNER_ID ? 'davi' : id === dialogue.maeId ? 'mae' : 'member',
            targetId: id,
            target: member?.displayName ?? user.username
        };
    }

    const choice = raw.match(/^(?:pick|choose|აირჩიე)\s+(.+)$/isu);
    if (choice) return { category: 'pick', argument: choice[1] };

    if (category) {
        if (['yes', 'no'].includes(category)) {
            return session?.question
                ? { category, ...followup }
                : { category: 'clarify' };
        }
        if (['why', 'really', 'explain', 'again'].includes(category)) {
            return context ? { category, ...followup } : { category: 'clarify' };
        }
        return { category, ...followup };
    }

    const reaction = detectReaction(raw);
    if (reaction && reactionPools[reaction]?.length) return { category: `reaction_${reaction}` };
    return { category: /[?？]/u.test(raw) ? 'reaction_question' : 'fallback' };
}

module.exports = { parseRequest };