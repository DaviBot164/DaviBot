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
     * after Umbra starts or redeploys.
     *
     * @param {import('discord.js').Client<true>} client
     * @returns {Promise<void>}
     */
    async execute(client) {
        console.log(
            '======================================'
        );

        console.log(
            '🎁 Restoring active Giveaways...'
        );

        try {
            const activeGiveaways =
                await giveawayDatabase
                    .getActiveGiveaways();

            if (
                activeGiveaways.length === 0
            ) {
                console.log(
                    'ℹ️ No active Giveaways require restoration.'
                );

                console.log(
                    '======================================'
                );

                return;
            }

            let restoredCount = 0;

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
                        '⚠️ Skipped an invalid Giveaway database record.'
                    );

                    continue;
                }

                scheduleGiveaway(
                    client,
                    giveawayData
                );

                restoredCount += 1;

                const remainingTime =
                    giveawayData.endsAt -
                    Date.now();

                if (remainingTime <= 0) {
                    console.log(
                        `⏳ Restored expired Giveaway for immediate ending: ${giveawayData.id}`
                    );
                } else {
                    const remainingSeconds =
                        Math.ceil(
                            remainingTime /
                            1000
                        );

                    console.log(
                        `✅ Restored Giveaway: ${giveawayData.id} (${remainingSeconds}s remaining)`
                    );
                }
            }

            console.log(
                `🎁 Active Giveaways Restored: ${restoredCount}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Failed to restore active Giveaways:'
            );

            console.error(
                error
            );

            console.error(
                '======================================'
            );
        }
    }
};