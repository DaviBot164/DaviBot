const {
    Events
} = require('discord.js');

const {
    giveaways:
        giveawayDatabase
} = require('../database');

const {
    scheduleGiveaway
} = require('./giveawayInteraction');

module.exports = {
    name:
        Events.ClientReady,

    once:
        true,

    /**
     * Restore active Giveaway timers
     * after Evelynn starts or redeploys.
     *
     * @param {import('discord.js').Client<true>} client
     * @returns {Promise<void>}
     */
    async execute(
        client
    ) {
        try {
            const activeGiveaways =
                await giveawayDatabase
                    .getActiveGiveaways();

            if (
                activeGiveaways.length ===
                0
            ) {
                console.log(
                    '🎁 Giveaway Restore: No active giveaways'
                );

                return;
            }

            let restoredCount =
                0;

            for (
                const giveawayData
                of activeGiveaways
            ) {
                if (
                    !giveawayData.id ||
                    !giveawayData.guildId ||
                    !giveawayData.endsAt
                ) {
                    console.warn(
                        '⚠️ Skipped invalid Giveaway record'
                    );

                    continue;
                }

                scheduleGiveaway(
                    client,
                    giveawayData
                );

                restoredCount +=
                    1;
            }

            console.log(
                `🎁 Giveaways Restored: ${restoredCount}`
            );
        } catch (error) {
            console.error(
                '❌ Giveaway restoration failed:',
                error
            );
        }
    }
};