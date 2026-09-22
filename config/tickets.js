const TICKET_STATUS = Object.freeze({
    OPEN: 'open',
    CLOSED: 'closed'
});

const TICKET_ACTIONS = Object.freeze({
    CREATED: 'created',
    CLOSED: 'closed',
    REOPENED: 'reopened',
    DELETED: 'deleted'
});

const TICKET_CATEGORIES = Object.freeze({
    support: {
        id: 'support',
        name: 'Support',
        emoji: '🛟',
        description:
            'Get help from the Blood Moon staff.'
    },

    report: {
        id: 'report',
        name: 'Report',
        emoji: '🚨',
        description:
            'Report a member or server-related problem.'
    },

    appeal: {
        id: 'appeal',
        name: 'Appeal',
        emoji: '⚖️',
        description:
            'Appeal a moderation action.'
    },

    other: {
        id: 'other',
        name: 'Other',
        emoji: '📜',
        description:
            'Open a ticket for another reason.'
    }
});

const STAFF_ROLE_KEYS = Object.freeze([
    'samurai',
    'hatamoto',
    'daimyo',
    'shogun'
]);

function getTicketCategory(id) {
    return TICKET_CATEGORIES[id] ?? null;
}

module.exports = {
    TICKET_STATUS,
    TICKET_ACTIONS,
    TICKET_CATEGORIES,
    STAFF_ROLE_KEYS,
    getTicketCategory
};