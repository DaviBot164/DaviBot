const channels = require('../../config/channels');
const { guide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishGameGuide(guild) {
    return publishGuide(guild, channels.slayers2, guide('game_guide'));
}
module.exports = { publishGameGuide };
