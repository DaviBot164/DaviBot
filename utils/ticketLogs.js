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
                : 'Akane',
            inline: true
        }
    ];

    if (ticket.category) {
        fields.push({
            name: 'Category',
            value: ticket.category,
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
        embeds: [embed]
    });
}

module.exports = {
    sendTicketLog
};