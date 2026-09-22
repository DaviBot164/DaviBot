const {
    getRankForLevel,
    getRanks
} = require('../config/progression');

const {
    changeRank
} = require('./rankService');

function getRankIndex(
    faction,
    rankId
) {
    if (!rankId) {
        return -1;
    }

    return getRanks(faction)
        .findIndex(
            rank =>
                rank.id === rankId
        );
}

async function checkAutoPromotion(
    member,
    user
) {
    if (!user?.faction) {
        return null;
    }

    const targetRank =
        getRankForLevel(
            user.faction,
            user.level
        );

    if (!targetRank) {
        return null;
    }

    const currentIndex =
        getRankIndex(
            user.faction,
            user.rank
        );

    const targetIndex =
        getRankIndex(
            user.faction,
            targetRank.id
        );

    if (
        targetIndex < 0 ||
        targetIndex <= currentIndex
    ) {
        return null;
    }

    const result = await changeRank(
        member,
        targetRank.id,
        {
            reason:
                `Reached Level ${user.level}`
        }
    );

    return result.changed
        ? result
        : null;
}

module.exports = {
    checkAutoPromotion
};