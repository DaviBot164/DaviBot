const { getUser, setRank } = require('../database/users');
const { addRankHistory } = require('../database/rankHistory');

const {
    getRanks,
    getRankForLevel
} = require('../config/progression');

const { getRank, isRank } = require('./factionHandler');

const {
    syncProgressionRole,
    clearProgressionRoles
} = require('./progressionRoles');

const {
    refreshProgressionUnlocks
} = require('./progressionUnlocks');

const { sendRankPromotion } = require('../utils/rankNotifications');

const pending = new Map();

async function applyRankChange(
    member,
    requestedRankId,
    {
        changedBy = null,
        reason = null,
        announce = true,
        automatic = false,
        refreshUnlocks = true
    } = {}
) {
    const guildId = member.guild.id;
    const userId = member.id;

    const user = await getUser(guildId, userId);

    if (!user?.faction) {
        if (automatic) {
            return { changed: false, user, rank: null };
        }

        throw new Error('Member has not chosen a faction.');
    }

    let rankId = requestedRankId;

    if (automatic) {
        const level = Number(user.level);

        if (!Number.isSafeInteger(level) || level < 1) {
            throw new Error('Player has an invalid level.');
        }

        const target = getRankForLevel(user.faction, level);
        const ranks = getRanks(user.faction);

        const heldRank=getRank(user.faction,user.rank);
        if(heldRank&&target&&target.level<heldRank.level)return{changed:false,user,rank:heldRank};
        const currentIndex = ranks.findIndex(
            rank => rank.id === user.rank
        );

        const targetIndex = ranks.findIndex(
            rank => rank.id === target?.id
        );

        // Never automatically demote or award prestige ranks.
        if (
            !target?.automatic ||
            targetIndex < 0 ||
            targetIndex <= currentIndex
        ) {
            return {
                changed: false,
                user,
                rank: getRank(user.faction, user.rank)
            };
        }

        rankId = target.id;
        reason = `Reached Level ${level}`;
    }

    if (!isRank(user.faction, rankId)) {
        throw new Error('Rank does not belong to this faction.');
    }

    const rank = getRank(user.faction, rankId);

    if (user.rank === rankId) {
        // Repair missing roles without duplicate history or announcements.
        await syncProgressionRole(member, user.faction, rankId);

        return { changed: false, user, rank };
    }

    const previousRankId = user.rank;

    // A Discord role failure must not commit a new database rank.
    await syncProgressionRole(member, user.faction, rankId);

    let updated;

    try {
        updated = await setRank(guildId, userId, rankId);

        if (!updated) {
            throw new Error('Player profile disappeared during rank update.');
        }
    } catch (error) {
        try {
            const latest = await getUser(guildId, userId);

            if (latest?.faction && latest.rank) {
                await syncProgressionRole(
                    member,
                    latest.faction,
                    latest.rank
                );
            } else if (latest) {
                await clearProgressionRoles(member);
            }
        } catch (rollbackError) {
            console.error(
                'Rank role recovery failed:',
                rollbackError
            );
        }

        throw error;
    }

    // Rank and role changes already succeeded at this point.
    try {
        await addRankHistory({
            guildId,
            userId,
            faction: user.faction,
            previousRank: previousRankId,
            newRank: rankId,
            changedBy,
            reason
        });
    } catch (error) {
        console.error('Rank history recording failed:', error);
    }

    if (announce) {
        try {
            await sendRankPromotion(member, user.faction, rank);
        } catch (error) {
            console.error('Rank announcement failed:', error);
        }
    }

    try {
        if(refreshUnlocks) await refreshProgressionUnlocks(member);
    } catch (error) {
        console.error('Progression unlock refresh failed:', error);
    }

    return {
        changed: true,
        user: updated,
        rank,
        previousRank: previousRankId
            ? getRank(user.faction, previousRankId)
            : null
    };
}

async function changeRank(member, rankId, options = {}) {
    const key = `${member.guild.id}:${member.id}`;
    const previous = pending.get(key) ?? Promise.resolve();

    const task = previous
        .catch(() => undefined)
        .then(() => applyRankChange(member, rankId, options));

    pending.set(key, task);

    try {
        return await task;
    } finally {
        if (pending.get(key) === task) {
            pending.delete(key);
        }
    }
}

module.exports = { changeRank };
