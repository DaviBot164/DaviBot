const { changeRank } = require('./rankService');

async function checkAutoPromotion(member, user) {
    if (!member) return null;

    // The service reads the current profile itself.
    const result = await changeRank(member, null, {
        automatic: true
    });

    return result.changed ? result : null;
}

module.exports = { checkAutoPromotion };