const channels = require('../../config/channels');
const { guide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishRoleGuide(guild) {
    return publishGuide(guild, channels.roles, guide('role_guide'));
}
module.exports = { publishRoleGuide };
