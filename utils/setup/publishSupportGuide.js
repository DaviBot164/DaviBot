const channels = require('../../config/channels');
const { guide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishSupportGuide(guild) {
    return publishGuide(guild, channels.supportGuide, guide('support_guide'));
}
module.exports = { publishSupportGuide };
