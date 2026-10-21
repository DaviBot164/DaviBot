const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const discord = require('discord.js');
const channels = require('../config/channels');
const tracking = require('../utils/logTracking');
const logs = require('../utils/staffLogs');
const { avatarSnapshots } = require('../utils/avatarSnapshot');
const sent = [];
let checks = 0;
function check(value, expected) { assert.deepEqual(value, expected); checks++; }
const guild = {
    id: 'test-guild', client: { user: { id: 'akane-test' } },
    members: { me: { id: 'akane-test' } },
    channels: { fetch: async id => ({
        id, guild, isTextBased: () => true,
        permissionsFor: () => ({ has: () => true }),
        send: async payload => { sent.push({ id, payload }); }
    }) }
};
const message = id => ({
    id, guild, channelId: 'ordinary-channel', content: 'Test content',
    author: { id: 'member' }, embeds: [], attachments: new discord.Collection()
});
function isolated(relative, dependencies) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
        module, exports: module.exports, console, Date,
        require: name => {
            if (!(name in dependencies)) throw new Error(`Unexpected test dependency: ${name}`);
            return dependencies[name];
        }
    }, { filename: relative });
    return module.exports;
}

(async () => {
    await logs.logMessageDelete(message('ordinary'));
    check(sent.length, 1);
    check(sent[0].id, channels.staffLogs);
    sent.length = 0;
    tracking.markDeletion(guild.id, 'managed');
    await logs.logMessageDelete(message('managed'));
    check(sent.length, 0);
    const batch = new discord.Collection([['managed', message('managed')]]);
    await logs.logBulkDelete(batch, { id: 'ordinary-channel', guild });
    check(sent.length, 0);
    tracking.forgetDeletion(guild.id, 'managed');
    check(tracking.isManagedDeletion(guild.id, 'managed'), false);

    const audit = action => ({
        id: 'audit-test', action, executorId: 'human-moderator',
        targetId: 'member', createdTimestamp: Date.now(), changes: []
    });
    await logs.logAuditEntry(audit(discord.AuditLogEvent.MessageDelete), guild);
    check(sent.length, 0);
    await logs.logAuditEntry(audit(discord.AuditLogEvent.MemberBanAdd), guild);
    check(sent.length, 1);
    check(sent[0].id, channels.moderation);
    sent.length = 0;

    tracking.recordAction({ guild, userId: 'member', action: 'ban' });
    const own = { ...audit(discord.AuditLogEvent.MemberBanAdd), executorId: guild.client.user.id };
    await logs.logAuditEntry(own, guild);
    check(sent.length, 0);
    await logs.logAuditEntry({ ...own, targetId: 'untracked-member' }, guild);
    check(sent.length, 1);
    sent.length = 0;
    await logs.logAuditEntry(audit(discord.AuditLogEvent.MemberRoleUpdate), guild);
    check(sent.length, 1);
    check(sent[0].id, channels.staffLogs);
    sent.length = 0;

    let cases = 0;
    const service = isolated('handlers/moderationService.js', {
        'discord.js': discord, '../config/channels': channels,
        '../utils/embeds': { createEmbed: () => new discord.EmbedBuilder().setDescription('test') },
        '../database/moderationCases': { createCase: async data => ({ ...data, id: ++cases }) },
        '../utils/logTracking': tracking
    });
    await service.recordModerationAction({ guild, userId: 'member', action: 'guardian', log: false });
    check(cases, 1);
    check(sent.length, 0);
    await service.recordModerationAction({ guild, userId: 'member', action: 'warn' });
    check(cases, 2);
    check(sent.length, 1);
    sent.length = 0;

    const beforeFetch = global.fetch;
    let fetched = 0;
    global.fetch = async () => {
        fetched++;
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } });
    };
    try {
        const channel = { guild, permissionsFor: () => ({ has: () => true }) };
        const snapshots = await avatarSnapshots(channel, 'https://cdn.discordapp.com/old.png', 'https://cdn.discordapp.com/new.png');
        check(snapshots.files.length, 2);
        check(snapshots.after, 'attachment://avatar-after.png');
        check(fetched, 2);
        await logs.logAvatarChange(guild, { id: 'member' }, 'https://cdn.discordapp.com/old.png', 'https://cdn.discordapp.com/new.png');
        check(sent.length, 1);
        check(sent[0].id, channels.staffLogs);
        check(sent[0].payload.files.length, 2);
        sent.length = 0;
        global.fetch = async () => { throw new Error('Simulated CDN error'); };
        const fallback = await avatarSnapshots(channel, null, 'https://cdn.discordapp.com/new.png');
        check(fallback.files.length, 0);
        check(fallback.after, 'https://cdn.discordapp.com/new.png');
    } finally { global.fetch = beforeFetch; }

    let deletedCount = 0;
    const clear = isolated('commands/moderation/clear.js', {
        'discord.js': discord,
        '../../utils/embeds': { successEmbed: () => ({}), errorEmbed: () => ({}) },
        '../../handlers/moderationService': { recordModerationAction: async () => ({ id: 1 }) },
        '../../utils/logTracking': tracking
    });
    const recent = new discord.Collection(Array.from({ length: 6 }, (_, i) => [String(i), {
        id: String(i), author: { id: 'target' }, createdTimestamp: Date.now()
    }]));
    const channel = {
        isTextBased: () => true, permissionsFor: () => ({ has: () => true }),
        messages: { fetch: async () => recent },
        bulkDelete: async candidates => {
            assert.ok(candidates instanceof discord.Collection);
            check(candidates.size, 3);
            for (const id of candidates.keys()) check(tracking.isManagedDeletion(guild.id, id), true);
            deletedCount += candidates.size;
            return candidates;
        }
    };
    await clear.execute({
        inGuild: () => true, memberPermissions: { has: () => true },
        guild, guildId: guild.id, channel, channelId: 'ordinary-channel', user: { id: 'staff' },
        options: { getInteger: () => 3, getUser: () => ({ id: 'target' }), getString: () => 'test' },
        deferReply: async () => {}, editReply: async () => {}
    });
    check(deletedCount, 3);
    console.log(`Akane logging: ${checks} checks passed. Mocked Discord, CDN and database; no live actions.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
