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
    publishRoleGuide
} = require('./publishRoleGuide');

const {
    publishProgressionGuides
} = require('./publishProgressionGuides');

const {
    publishPathSelection
} = require('./publishPathSelection');

const {
    publishSupportGuide
} = require('./publishSupportGuide');

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
        await publishRoleGuide(
            guild
        )
    );

    const progression =
        await publishProgressionGuides(
            guild
        );

    results.push(
        progression.slayer,
        progression.demon
    );

    results.push(
        await publishPathSelection(
            guild
        )
    );

    results.push(
        await publishSupportGuide(
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