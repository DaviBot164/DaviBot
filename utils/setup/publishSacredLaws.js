const channels = require('../../config/channels');
const { guide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishSacredLaws(guild) {
    return publishGuide(guild, channels.sacredLaws, guide('sacred_laws'));
}
module.exports = { publishSacredLaws };
