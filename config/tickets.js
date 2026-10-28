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
        description: 'Questions, verification or technical help.'
    },
    report: {
        id: 'report',
        name: 'Report',
        emoji: '🚨',
        description: 'Report a member, message or safety concern.'
    },
    appeal: {
        id: 'appeal',
        name: 'Appeal',
        emoji: '⚖️',
        description: 'Ask staff to review a moderation action.'
    },
    other: {
        id: 'other',
        name: 'Other',
        emoji: '📜',
        description: 'A request that does not fit the other categories.'
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
