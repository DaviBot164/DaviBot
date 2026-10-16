const {
    expireRecruitingMatches,
    BATCH_SIZE
} = require('../database/matchExpiry');

const {
    refreshMatchPanel
} = require('../utils/matches/refreshMatchPanel');

const CHECK_INTERVAL = 60 * 60 * 1000;

let interval = null;
let running = false;

async function runExpiryCheck(client) {
    if (running) return;

    running = true;

    try {
        let expired;
        let total = 0;
        let refreshFailures = 0;

        do {
            expired = await expireRecruitingMatches();
            total += expired.length;

            for (const match of expired) {
                try {
                    const updated = await refreshMatchPanel(
                        client,
                        match.guildId,
                        match.matchId
                    );

                    if (!updated) {
                        refreshFailures++;
                    }
                } catch (error) {
                    refreshFailures++;

                    console.error(
                        `PvP: Failed to refresh match #${match.matchId}:`,
                        error
                    );
                }
            }
        } while (expired.length === BATCH_SIZE);

        if (total > 0) {
            console.log(
                `PvP: Expired ${total} abandoned match(es).`
            );

            if (refreshFailures > 0) {
                console.warn(
                    `PvP: ${refreshFailures} panel(s) could not be refreshed.`
                );
            }
        }
    } catch (error) {
        console.error(
            'PvP match expiration failed:',
            error
        );
    } finally {
        running = false;
    }
}

function startMatchExpiryScheduler(client) {
    if (interval) return;

    if (!client?.channels) {
        throw new Error(
            'A Discord client is required for match expiration.'
        );
    }

    runExpiryCheck(client);

    interval = setInterval(
        () => runExpiryCheck(client),
        CHECK_INTERVAL
    );

    interval.unref();
}

function stopMatchExpiryScheduler() {
    if (!interval) return;

    clearInterval(interval);
    interval = null;
}

module.exports = {
    startMatchExpiryScheduler,
    stopMatchExpiryScheduler
};