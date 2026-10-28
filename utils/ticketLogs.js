const {getTicketCategory}=require('../config/tickets');
const channels =
    require('../config/channels');

const {
    createEmbed
} = require('./embeds');

async function sendTicketLog(
    guild,
    {
        title,
        ticket,
        actor,
        description
    }
) {
    if(!require('./guildContext').enabled('logging'))return null;
    const channel =
        guild.channels.cache.get(
            channels.staffLogs
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const fields = [
        {
            name: 'Ticket',
            value: `#${ticket.id}`,
            inline: true
        },
        {
            name: 'Member',
            value: `<@${ticket.userId}>`,
            inline: true
        },
        {
            name: 'Action By',
            value: actor
                ? `<@${actor.id}>`
                : 'Kitsune',
            inline: true
        }
    ];

    if (ticket.category) {
        fields.push({
            name: 'Category',
            value: getTicketCategory(ticket.category)?.name??ticket.category,
            inline: true
        });
    }

    const embed =
        createEmbed(
            title,
            description
        )
            .addFields(fields);

    await channel.send({
        embeds: [embed],
        allowedMentions:{parse:[]}
    });
}

module.exports = {
    sendTicketLog
};
