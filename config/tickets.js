module.exports = {
    channelPrefix: 'ticket',

    panel: {
        title:
            '🌑 Umbra Support',

        description:
            [
                'Do you require assistance from the Shadow Wardens?',
                '',
                'Click the button below to open a private support ticket.',
                '',
                'Please create a ticket only when you genuinely need help.',
                '',
                '*Umbra will guide your request beneath the crimson moon.*'
            ].join('\n'),

        buttonLabel:
            'Open a Ticket',

        buttonEmoji:
            '🎫'
    },

    ticket: {
        title:
            '🎫 Order Support Ticket',

        description:
            [
                'Your request has been received by Umbra.',
                '',
                'Please describe your issue clearly and include all relevant information.',
                '',
                'A Shadow Warden will assist you as soon as possible.',
                '',
                '*Remain patient while the Order reviews your request.*'
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