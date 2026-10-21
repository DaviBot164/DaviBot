const assert = require('node:assert/strict');
const { parseRequest } = require('../handlers/akane/parser');
const { buildResponse, toneFor } = require('../handlers/akane/responses');
const { sessions, sessionKey, getReplyState, drawReply } = require('../handlers/akane/state');
const { OWNER_ID, dialogue, replies } = require('../handlers/akane/settings');
const { plainHelp } = require('../handlers/akane/help');

let checks = 0;
function check(value, expected) {
    assert.deepEqual(value, expected);
    checks++;
}
function message(content, id = 'test-member', channelId = 'test-channel') {
    return {
        content, guildId: 'test-guild', channelId, author: { id },
        mentions: { members: new Map(), users: new Map() },
        client: { user: { displayAvatarURL: () => 'https://example.com/avatar.png' } }
    };
}
function seed(msg, category = 'nice', question = false) {
    sessions.set(sessionKey(msg), {
        messageId: 'test-reply', category, question,
        implicitUntil: Date.now() + 120_000,
        expiresAt: Date.now() + 120_000
    });
}
function parse(msg) { return parseRequest(msg, Date.now()); }

check(toneFor(OWNER_ID), 'owner');
check(toneFor(dialogue.maeId), 'mae');
check(toneFor('test-member'), 'public');
check(toneFor('Davi'), 'public');
check(toneFor('Mae'), 'public');
check(parse(message('thanks')), null);
check(parse(message('akane hi')).category, 'hi');
check(parse(message('akane mae')).category, 'mae');
check(parse(message('akane davi')).category, 'davi');
check(parse(message('akane hello there')).category, 'hi');
check(parse(message('akane completely unfamiliar sentence')).category, 'fallback');
check(parse(message('akane \u10d9\u10d0\u10e0\u10d2\u10d0\u10d3 \u10d5\u10d0\u10e0')).category, 'feeling_good');

for (const [phrase, category] of [
    ['thanks', 'thanks'], ['haha', 'laugh'], ['I am fine', 'feeling_good'],
    ['I had a bad day', 'feeling_bad'], ['I am tired', 'tired'],
    ['what do you mean?', 'explain'], ['again', 'again']
]) {
    const msg = message(phrase);
    seed(msg);
    check(parse(msg).category, category);
}

const otherReply = message('why?');
seed(otherReply);
otherReply.reference = { messageId: 'someone-else' };
check(parse(otherReply), null);
otherReply.content = 'akane why?';
check(parse(otherReply).category, 'clarify');

const answer = message('yes');
seed(answer, 'nice', true);
check(parse(answer), null);
answer.reference = { messageId: 'test-reply' };
check(parse(answer).category, 'yes');
answer.reference = undefined;
answer.content = 'akane yes';
check(parse(answer).category, 'yes');
seed(answer, 'nice', false);
check(parse(answer).category, 'clarify');

const expired = message('thanks', 'expired-member');
seed(expired);
sessions.get(sessionKey(expired)).expiresAt = Date.now() - 1;
check(parse(expired), null);
check(parse(message('thanks', 'different-member')), null);
check(parse(message('thanks', 'test-member', 'different-channel')), null);

const categories = [
    'general', 'hi', 'nice', 'roast', 'mood', 'tip', 'rate', 'luck', 'secret',
    'thanks', 'rude', 'fallback', 'clarify', 'laugh', 'feeling_good',
    'feeling_bad', 'tired', 'davi', 'mae', 'member', 'reaction_insult',
    'reaction_romance', 'reaction_apology', 'reaction_affection',
    'reaction_reassurance', 'reaction_bot', 'reaction_identity',
    'reaction_dismissive', 'reaction_possessive', 'reaction_anger',
    'reaction_question', 'reaction_davi', 'reaction_davi_insult', 'stop'
];
for (const id of [OWNER_ID, dialogue.maeId, 'test-member']) {
    const msg = message('akane', id);
    for (const category of categories) {
        const result = buildResponse(msg, { category });
        assert.equal(typeof result.payload.content, 'string', `${id}: ${category}`);
        assert.ok(result.payload.content.length > 0 && result.payload.content.length <= 2000);
        assert.ok(!result.payload.content.includes('{score}'));
        checks++;
    }
    for (const category of ['why', 'really', 'explain']) {
        for (const context of ['rate', 'pick', 'mae', 'davi', 'reaction_insult', 'feeling_bad']) {
            const result = buildResponse(msg, { category, context, followup: true });
            check(result.category, context);
        }
    }
    check(buildResponse(msg, { category: 'again', context: 'roast', followup: true }).category, 'roast');
    check(buildResponse(msg, { category: 'yes', context: 'nice', followup: true }).category, 'nice');
    check(buildResponse(msg, { category: 'yes', context: 'mood', followup: true }).category, 'tip');
    check(buildResponse(msg, { category: 'stop' }).session, false);
    const pick = buildResponse(msg, { category: 'pick', argument: 'PvP / Training' });
    assert.match(pick.payload.content, /PvP|Training/);
    checks++;
}

const state = getReplyState(message('akane', 'shuffle-test'));
const pool = [...new Set(replies.dialogue_general)];
const cycle = pool.map(() => drawReply(state, 'dialogue_general'));
check(new Set(cycle).size, pool.length);
if (pool.length > 1) assert.notEqual(drawReply(state, 'dialogue_general'), cycle.at(-1));
assert.notEqual(getReplyState(message('', 'person-a')), getReplyState(message('', 'person-b')));
assert.ok(plainHelp().length <= 2000);
console.log(`Akane dialogue: ${checks} checks passed. No Discord messages or database changes made.`);
