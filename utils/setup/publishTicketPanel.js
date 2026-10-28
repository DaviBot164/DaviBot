const channels=require('../../config/channels');
const brand=require('../../config/brand');
const {TICKET_CATEGORIES}=require('../../config/tickets');
const {buildTicketPanelComponents}=require('../ticketComponents');
const {publishGuide}=require('./guidePresentation');
function ticketSpec(){return{key:'ticket_panel',title:`🎫 ${brand.server} Support`,intro:'Need a hand? Open a private ticket and choose the category that fits.',fields:[{name:'Choose your category',value:Object.values(TICKET_CATEGORIES).map(c=>`${c.emoji} **${c.name}** — ${c.description}`).join('\n')},{name:'How it works',value:'**1.** Choose Get support.\n**2.** Select a category.\n**3.** Describe your request in the new private channel.'},{name:'Keep it clear and safe',value:'One open ticket per member. Include relevant message links or screenshots; never share passwords, tokens or verification codes.'}]};}
async function publishTicketPanel(guild){return publishGuide(guild,channels.openTicket,ticketSpec(),buildTicketPanelComponents());}
module.exports={publishTicketPanel,ticketSpec};
