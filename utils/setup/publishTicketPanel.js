const {serverText}=require("../guildContext");
const channels = require('../../config/channels');
const brand = require('../../config/brand');
const { createEmbed } = require('../embeds');
const { buildTicketPanelComponents } = require('../ticketComponents');
const { publishSetupMessage } = require('./publishSetupMessage');
const { publishGuide } = require('./guidePresentation');
function ticketSpec(){return {
        key:'ticket_panel', title: serverText('🎫 Blood Moon Support'),
        intro: '**Need a hand? Start with the right ticket.**\nChoose a category below and describe the issue in your first message.',
        fields: [{ name: 'Choose your route', value: '🛟 **Support** — Questions, verification or bot issues\n🚨 **Report** — A member, message or community concern\n⚖️ **Appeal** — Request a moderation review\n📜 **Other** — A request that does not fit elsewhere' },
            { name: 'A little preparation helps', value: 'Bring relevant message links or screenshots. Keep related information in one ticket. Never send passwords, tokens or verification codes.' }],
        quote: 'A clear explanation makes a much better entrance than ten pings.'
    };}
async function publishTicketPanel(guild){return publishGuide(guild,channels.openTicket,ticketSpec(),buildTicketPanelComponents());}
module.exports = { publishTicketPanel,ticketSpec };
