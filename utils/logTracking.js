const { AuditLogEvent } = require('discord.js');

const deletions = new Map();
const actions = [];
const TTL = 120_000;

function clean(now = Date.now()) {
    for (const [key, expires] of deletions) {
        if (expires <= now) deletions.delete(key);
    }
    for (let i = actions.length - 1; i >= 0; i--) {
        if (now - actions[i].time >= TTL) actions.splice(i, 1);
    }
}

function markDeletion(guildId, messageId) {
    clean();
    deletions.set(`${guildId}:${messageId}`, Date.now() + TTL);
}

function forgetDeletion(guildId, messageId) {
    deletions.delete(`${guildId}:${messageId}`);
}

function isManagedDeletion(guildId, messageId) {
    clean();
    return deletions.has(`${guildId}:${messageId}`);
}

function recordAction({ guild, userId, action, metadata = {} }) {
    clean();
    const kind = action === 'guardian' && metadata.guardianAction === 'timeout'
        ? 'timeout' : action;
    if (!userId || !['ban', 'unban', 'kick', 'timeout', 'untimeout'].includes(kind)) return;
    actions.push({ guildId: guild.id, userId, kind, time: Date.now() });
}

function auditKind(entry) {
    if (entry.action === AuditLogEvent.MemberBanAdd) return ['ban'];
    if (entry.action === AuditLogEvent.MemberBanRemove) return ['unban'];
    if (entry.action === AuditLogEvent.MemberKick) return ['kick'];
    if (entry.action === AuditLogEvent.MemberUpdate) {
        const changes = entry.changes ?? [];
        if (changes.length && changes.every(x => x.key === 'communication_disabled_until')) {
            const value = changes[0].new;
            const until = value ? new Date(value).getTime() : NaN;
            return value && Number.isFinite(until) && until > Number(entry.createdTimestamp)
                ? ['timeout'] : ['untimeout'];
        }
    }
    return [];
}

async function isRecordedModerationAudit(entry, guild) {
    const executor = entry.executorId ?? entry.executor?.id;
    if (!executor || executor !== guild.client.user.id) return false;
    const kinds = auditKind(entry);
    if (!kinds.length) return false;
    const target = entry.targetId ?? entry.target?.id;

    function match() {
        clean();
        const created = Number(entry.createdTimestamp);
        const index = actions.findIndex(x =>
            x.guildId === guild.id && x.userId === target && kinds.includes(x.kind) &&
            Number.isFinite(created) && Math.abs(created - x.time) <= 15_000
        );
        if (index < 0) return false;
        actions.splice(index, 1);
        return true;
    }

    if (match()) return true;
    // The audit event can arrive before the command records its case.
    await new Promise(resolve => setTimeout(resolve, 1200));
    return match();
}

module.exports = {
    markDeletion, forgetDeletion, isManagedDeletion,
    recordAction, isRecordedModerationAudit
};
