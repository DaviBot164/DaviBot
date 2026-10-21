const channels = require('../../config/channels');
const { guide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishMoonGuide(guild) {
    return publishGuide(guild, channels.moonGuide, guide('moon_guide'));
}
module.exports = { publishMoonGuide };
