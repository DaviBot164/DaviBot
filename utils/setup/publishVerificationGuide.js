const channels = require('../../config/channels');
const { guide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishVerificationGuide(guild) {
    return publishGuide(guild, channels.verification, guide('verification_guide'));
}
module.exports = { publishVerificationGuide };
