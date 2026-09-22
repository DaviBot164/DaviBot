const {
    getUser,
    setRank
} = require('../database/users');

const {
    addRankHistory
} = require('../database/rankHistory');

const {
    getRank,
    isRank
} = require('./factionHandler');

const {
    syncProgressionRole
} = require('./progressionRoles');

const {
    sendRankPromotion
} = require('../utils/rankNotifications');

async function changeRank(
    member,
    rankId,
    {
        changedBy = null,
        reason = null,
        announce = true
    } = {}
) {
    const user = await getUser(
        member.guild.id,
        member.id
    );

    if (!user?.faction) {
        throw new Error(
            'Member has not chosen a faction.'
        );
    }

    if (!isRank(user.faction, rankId)) {
        throw new Error(
            'Rank does not belong to this faction.'
        );
    }

    const rank = getRank(
        user.faction,
        rankId
    );

    if (user.rank === rankId) {
        return {
            changed: false,
            user,
            rank
        };
    }

    const previousRank = user.rank;

    const updated = await setRank(
        member.guild.id,
        member.id,
        rankId
    );

    try {
        await syncProgressionRole(
            member,
            user.faction,
            rankId
        );
    } catch (error) {
        await setRank(
            member.guild.id,
            member.id,
            previousRank
        );

        throw error;
    }

    await addRankHistory({
        guildId: member.guild.id,
        userId: member.id,
        faction: user.faction,
        previousRank,
        newRank: rankId,
        changedBy,
        reason
    });

    if (announce) {
        try {
            await sendRankPromotion(
                member,
                user.faction,
                rank
            );
        } catch (error) {
            console.error(
                'Rank announcement failed:',
                error
            );
        }
    }

    return {
        changed: true,
        user: updated,
        rank,
        previousRank: previousRank
            ? getRank(
                user.faction,
                previousRank
            )
            : null
    };
}

module.exports = {
    changeRank
};