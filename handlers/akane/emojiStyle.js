const config = require('../../config/akaneEmoji');
const emoji = /[\p{Extended_Pictographic}\p{Regional_Indicator}]|[#*0-9]\uFE0F?\u20E3/u;
// Pure presentation: only memoryAfter commits cadence after a successful send.
function applyEmojiStyle(response, tone, request) {
    const content = response.payload?.content;
    if (typeof content !== 'string' || !content || response.session === false) return response;
    const previous = request.conversation ?? {};
    const existing = content.match(emoji)?.[0];
    if (existing) return {...response, emojiTurns: 0, emojiLast: existing};
    const turns = Math.min(config.interval, (previous.emojiTurns ?? 0) + 1);
    const plain = {...response, emojiTurns: turns, emojiLast: previous.emojiLast ?? null};
    const mode = response.modeChange ?? (previous.mode?.remaining > 0 ? previous.mode.name : null);
    if (mode && mode !== 'normal') return plain;
    if (response.payload.embeds?.length || response.payload.files?.length || content.length > 1900 || previous.noAdviceRemaining > 0) return plain;
    // Both meanings must be light: an explanation of sadness must stay plain too.
    const allowed = category => config.warm.includes(category) || (tone === 'public' && config.sharp.includes(category));
    if (turns < config.interval || !allowed(request.category) || !allowed(response.category)) return plain;
    const pool = tone === 'owner' ? config.pools.owner : tone === 'mae' ? config.pools.mae
        : config.sharp.includes(request.category) ? config.pools.public : config.pools.publicWarm;
    const candidates = pool.filter(value => value !== previous.emojiLast);
    // Rotate deterministically; no random state or failed-send mutation.
    const index = (previous.emojiCount ?? 0) % candidates.length;
    const selected = candidates[index];
    return {...plain, payload: {...response.payload, content: `${content} ${selected}`}, emojiTurns: 0, emojiLast: selected, emojiAdded: true};
}
module.exports = {applyEmojiStyle};
