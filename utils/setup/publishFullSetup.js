const {
    publishSacredLaws
} = require('./publishSacredLaws');

const {
    publishMoonGuide
} = require('./publishMoonGuide');

const {
    publishVerificationGuide
} = require('./publishVerificationGuide');

const {
    publishPathSelection
} = require('./publishPathSelection');

const {
    publishTicketPanel
} = require('./publishTicketPanel');

async function publishFullSetup(guild) {
    const results = [];

    results.push(
        await publishSacredLaws(
            guild
        )
    );

    results.push(
        await publishMoonGuide(
            guild
        )
    );

    results.push(
        await publishVerificationGuide(
            guild
        )
    );

    results.push(
        await publishPathSelection(
            guild
        )
    );

    results.push(
        await publishTicketPanel(
            guild
        )
    );

    return results;
}

module.exports = {
    publishFullSetup
};