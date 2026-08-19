module.exports = {
    channelPrefix: 'ticket',

    panel: {
        title:
            '🎫 Evelynn Support',

        description:
            [
                'Need help from High Command?',
                '',
                'Open a private ticket below and describe your issue clearly.',
                '',
                'Please create a ticket only when support is genuinely needed.'
            ].join('\n'),

        buttonLabel:
            'Open Ticket',

        buttonEmoji:
            '🎫'
    },

    ticket: {
        title:
            '🎫 LUNAR SEIREITEI Support',

        description:
            [
                'Your ticket has been opened.',
                '',
                'Describe your issue and include any relevant details.',
                '',
                'High Command will assist you as soon as possible.'
            ].join('\n'),

        closeButtonLabel:
            'Close Ticket',

        closeButtonEmoji:
            '🔒'
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