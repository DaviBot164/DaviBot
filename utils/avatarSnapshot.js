const { AttachmentBuilder, PermissionFlagsBits } = require('discord.js');

const MAX_BYTES = 2 * 1024 * 1024;

async function snapshot(url, name) {
    if (!url) return null;
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !['cdn.discordapp.com', 'media.discordapp.net'].includes(parsed.hostname)) return null;

    const response = await fetch(parsed, {
        signal: AbortSignal.timeout(5000),
        redirect: 'error'
    });
    if (!response.ok || !/^image\/(png|jpeg|webp|gif)(?:;|$)/i.test(response.headers.get('content-type') ?? '')) return null;
    if (Number(response.headers.get('content-length')) > MAX_BYTES) {
        await response.body?.cancel();
        return null;
    }
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_BYTES) {
                await reader.cancel();
                return null;
            }
            chunks.push(Buffer.from(value));
        }
    } finally {
        reader.releaseLock();
    }
    if (!size) return null;
    const mime = response.headers.get('content-type').split(';')[0].toLowerCase();
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[mime];
    return { file: new AttachmentBuilder(Buffer.concat(chunks), { name: `${name}.${extension}` }), url: `attachment://${name}.${extension}` };
}

async function avatarSnapshots(channel, oldURL, newURL) {
    const me = channel.guild.members.me;
    if (!me || !channel.permissionsFor(me)?.has(PermissionFlagsBits.AttachFiles)) return { files: [], before: oldURL, after: newURL };
    const results = await Promise.allSettled([
        snapshot(oldURL, 'avatar-before'),
        snapshot(newURL, 'avatar-after')
    ]);
    const before = results[0].status === 'fulfilled' ? results[0].value : null;
    const after = results[1].status === 'fulfilled' ? results[1].value : null;
    return {
        files: [before?.file, after?.file].filter(Boolean),
        before: before?.url ?? oldURL,
        after: after?.url ?? newURL
    };
}

module.exports = { avatarSnapshots };
