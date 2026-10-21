const { OWNER_ID, reactionPools, dialogue } = require('./settings');
const { normalize, aliases, DAVI_NAMES } = require('./aliases');
const { getSession } = require('./state');

const { recognize, extractChoice } = require('./language');
const { contextualCategory } = require('./context');

function parseRequest(message, now) {
    const content = String(message.content ?? '').trim();
    const namedTrigger = content.match(
        /^akane(?=$|[\s\p{P}\p{S}])[\s,:;.!?…]*(.*)$/isu
    );
    const botMention = content.match(/^<@!?(\d+)>[\s,:;.!?…]*(.*)$/su);
    const trigger = namedTrigger ?? (botMention && botMention[1] === message.client?.user?.id
        ? [botMention[0], botMention[2]] : null);
    const previous = getSession(message, now);
    const replying = Boolean(previous && message.reference?.messageId === previous.messageId);
    // A reply to someone else's message must not borrow Akane's context.
    const session = !message.reference || replying ? previous : null;
    const raw = trigger ? trigger[1].trim() : content;
    const text = normalize(raw);
    const englishOnly = !/[\p{L}]/u.test(raw.replace(/[a-z]/giu, ''));
    const category = englishOnly ? (contextualCategory(raw, session) ?? recognize(raw)) : null;
    const choice = englishOnly ? extractChoice(raw) : null;

    if (!trigger && !replying) {
        if (
            message.reference || !session ||
            now >= (session.implicitUntil ?? 0) || (!category && !choice)
        ) return null;
    }

    const context = session?.category ?? null;
    const followup = {
        context,
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
    if (['context_choices','repair_detail'].includes(category)) return { category, argument: raw, ...followup };

    if (category) {
        if (['yes', 'no'].includes(category)) {
            return session?.question
                ? { category, ...followup }
                : { category: 'clarify', ...followup };
        }
        if (['why', 'really', 'explain', 'again'].includes(category)) {
            return context ? { category, ...followup } : { category: 'clarify', ...followup };
        }
        return { category, ...followup };
    }

    return { category: /[?？]/u.test(raw) ? 'reaction_question' : 'fallback', ...followup };
}

module.exports = { parseRequest };
