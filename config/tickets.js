module.exports = {
    channelPrefix: 'ticket',

    panel: {
        title:
            '🎫 Evelynn Support',

        description:
            [
                'Need help from TTS Staff?',
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
            '🎫 THE Ⅹ SINS Support',

        description:
            [
                'Your ticket has been opened.',
                '',
                'Describe your issue and include any relevant details.',
                '',
                'TTS Staff will assist you as soon as possible.'
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