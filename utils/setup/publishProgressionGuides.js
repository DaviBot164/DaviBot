const channels = require('../../config/channels');
const { pathGuide } = require('../../config/setupGuides');
const { publishGuide } = require('./guidePresentation');
async function publishSlayerGuide(guild){return publishGuide(guild,channels.factionProgression,pathGuide('slayer'));}
async function publishDemonGuide(guild){return publishGuide(guild,channels.factionProgression,pathGuide('demon'));}
async function publishProgressionGuides(guild){const slayer=await publishSlayerGuide(guild);const demon=await publishDemonGuide(guild);return {slayer,demon};}
module.exports={publishSlayerGuide,publishDemonGuide,publishProgressionGuides};
