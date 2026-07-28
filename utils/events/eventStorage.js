/**
 * Return Umbra's temporary Event System storage.
 *
 * Events are currently stored in memory.
 * PostgreSQL persistence will be added later.
 *
 * @param {import('discord.js').Client} client
 * @returns {Map<string, Object>}
 */
function getEventStorage(client) {
    if (
        !client.umbraEvents ||
        !(client.umbraEvents instanceof Map)
    ) {
        client.umbraEvents =
            new Map();
    }

    return client.umbraEvents;
}

/**
 * Find an event by its ID.
 *
 * The event must belong to the provided guild.
 *
 * @param {Map<string, Object>} storage
 * @param {string} eventId
 * @param {string} guildId
 * @returns {Object|null}
 */
function findGuildEvent(
    storage,
    eventId,
    guildId
) {
    if (
        !storage ||
        !(storage instanceof Map)
    ) {
        return null;
    }

    const normalizedEventId =
        eventId
            ?.trim()
            .toLowerCase();

    if (!normalizedEventId) {
        return null;
    }

    const eventData =
        storage.get(
            normalizedEventId
        );

    if (
        !eventData ||
        eventData.guildId !== guildId
    ) {
        return null;
    }

    return eventData;
}

/**
 * Store or update an Event System entry.
 *
 * @param {Map<string, Object>} storage
 * @param {Object} eventData
 * @returns {Object}
 */
function saveEvent(
    storage,
    eventData
) {
    if (
        !storage ||
        !(storage instanceof Map)
    ) {
        throw new TypeError(
            'Event storage must be a Map.'
        );
    }

    if (
        !eventData ||
        !eventData.id
    ) {
        throw new TypeError(
            'Event data must contain an ID.'
        );
    }

    const normalizedEventId =
        eventData.id
            .trim()
            .toLowerCase();

    const normalizedEventData = {
        ...eventData,
        id:
            normalizedEventId
    };

    storage.set(
        normalizedEventId,
        normalizedEventData
    );

    return normalizedEventData;
}

/**
 * Remove an event from temporary storage.
 *
 * @param {Map<string, Object>} storage
 * @param {string} eventId
 * @returns {boolean}
 */
function deleteEvent(
    storage,
    eventId
) {
    if (
        !storage ||
        !(storage instanceof Map)
    ) {
        return false;
    }

    const normalizedEventId =
        eventId
            ?.trim()
            .toLowerCase();

    if (!normalizedEventId) {
        return false;
    }

    return storage.delete(
        normalizedEventId
    );
}

module.exports = {
    getEventStorage,
    findGuildEvent,
    saveEvent,
    deleteEvent
};