module.exports = {
    channelPrefix: 'ticket',

    panel: {
        title: '🎫 Support Tickets',

        description:
            'Need assistance from our staff team?\n\n' +
            'Click the button below to create a private support ticket.\n\n' +
            'Please create a ticket only when you genuinely need help.',

        buttonLabel: 'Create Ticket',
        buttonEmoji: '🎫'
    },

    ticket: {
        title: '🎫 Support Ticket',

        description:
            'Thank you for contacting our staff team.\n\n' +
            'Please describe your issue clearly and provide all relevant information. ' +
            'A staff member will assist you as soon as possible.',

        closeButtonLabel: 'Close Ticket',
        closeButtonEmoji: '🔒'
    },

    permissions: {
        user: [
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'AttachFiles',
            'EmbedLinks'
        ],

        staff: [
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'AttachFiles',
            'EmbedLinks',
            'ManageMessages'
        ],

        bot: [
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'AttachFiles',
            'EmbedLinks',
            'ManageChannels',
            'ManageMessages'
        ]
    }
};