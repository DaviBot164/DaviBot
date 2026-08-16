const {
    createTerminalIncident
} = require('../../database/terminalIncidents');

const {
    upsertTerminalService,
    getTerminalService
} = require('../../database/terminalServices');

/**
 * Active Incident cache.
 *
 * Prevents Evelynn from repeatedly
 * logging the same Incident.
 *
 * Key format:
 * guildId:serviceKey
 */
const ACTIVE_INCIDENTS =
    new Map();

/**
 * Valid service statuses.
 */
const SERVICE_STATUS = {
    ONLINE:
        'ONLINE',

    OFFLINE:
        'OFFLINE',

    DEGRADED:
        'DEGRADED',

    STARTING:
        'STARTING',

    STOPPED:
        'STOPPED'
};

/**
 * Valid Incident severities.
 */
const INCIDENT_SEVERITY = {
    INFO:
        'info',

    SUCCESS:
        'success',

    WARNING:
        'warning',

    CRITICAL:
        'critical'
};

/**
 * Build one cache key.
 *
 * @param {string|null} guildId
 * @param {string} serviceKey
 * @returns {string}
 */
function createIncidentKey(
    guildId,
    serviceKey
) {
    return `${guildId ?? 'GLOBAL'}:${serviceKey}`;
}

/**
 * Returns true when the Incident
 * is already active.
 *
 * @param {string|null} guildId
 * @param {string} serviceKey
 * @returns {boolean}
 */
function isIncidentActive(
    guildId,
    serviceKey
) {
    return ACTIVE_INCIDENTS.has(
        createIncidentKey(
            guildId,
            serviceKey
        )
    );
}

/**
 * Mark one Incident as active.
 *
 * @param {string|null} guildId
 * @param {string} serviceKey
 */
function activateIncident(
    guildId,
    serviceKey
) {
    ACTIVE_INCIDENTS.set(
        createIncidentKey(
            guildId,
            serviceKey
        ),
        Date.now()
    );
}

/**
 * Remove one active Incident.
 *
 * @param {string|null} guildId
 * @param {string} serviceKey
 */
function clearIncident(
    guildId,
    serviceKey
) {
    ACTIVE_INCIDENTS.delete(
        createIncidentKey(
            guildId,
            serviceKey
        )
    );
}

/**
 * Safely convert Incident metadata
 * into a PostgreSQL-friendly object.
 *
 * @param {unknown} metadata
 * @returns {Object}
 */
function normalizeIncidentMetadata(
    metadata
) {
    if (
        !metadata ||
        typeof metadata !==
            'object' ||
        Array.isArray(
            metadata
        )
    ) {
        return {};
    }

    return metadata;
}

/**
 * Normalize one service key before
 * storing it inside Incident History.
 *
 * @param {unknown} serviceKey
 * @returns {string|null}
 */
function normalizeIncidentServiceKey(
    serviceKey
) {
    if (
        typeof serviceKey !==
            'string'
    ) {
        return null;
    }

    const normalized =
        serviceKey
            .trim()
            .toLowerCase();

    if (
        normalized.length ===
        0
    ) {
        return null;
    }

    return normalized.slice(
        0,
        100
    );
}

/**
 * Create a historical Incident record.
 *
 * Archive failures must never stop the
 * live service-state update.
 *
 * @param {Object} options
 * @param {string|null} options.guildId
 * @param {string|null} [options.serviceKey]
 * @param {string} options.incidentType
 * @param {string} options.severity
 * @param {string} options.title
 * @param {string} options.message
 * @param {Array<Object>} [options.fields]
 * @param {unknown} [options.error]
 * @returns {Promise<Object|null>}
 */
async function archiveIncident({
    guildId =
        null,

    serviceKey =
        null,

    incidentType,

    severity,

    title,

    message,

    fields =
        [],

    error =
        null
}) {
    try {
        return await createTerminalIncident({
            guildId,

            serviceKey:
                normalizeIncidentServiceKey(
                    serviceKey
                ),

            incidentType,

            severity,

            title,

            message,

            fields:
                Array.isArray(
                    fields
                )
                    ? fields
                    : [],

            error
        });
    } catch (archiveError) {
        console.error(
            `⚠️ Evelynn Black Box could not archive Incident "${incidentType}":`
        );

        console.error(
            archiveError
        );

        return null;
    }
}

/**
 * Open or escalate one service Incident.
 *
 * Duplicate protection:
 * - If the same service already has the
 *   same state, no duplicate Incident is
 *   archived.
 *
 * Escalation:
 * - DEGRADED -> OFFLINE creates another
 *   Incident archive record.
 *
 * @param {Object} options
 * @returns {Promise<{
 *     changed: boolean,
 *     archived: boolean,
 *     service: Object|null,
 *     incident: Object|null
 * }>}
 */
async function openIncident({
    guildId,

    serviceKey,

    displayName,

    status,

    severity,

    incidentType,

    title,

    message,

    fields =
        [],

    metadata =
        {},

    error =
        null
}) {
    if (
        !guildId ||
        !serviceKey ||
        !displayName ||
        !status ||
        !severity ||
        !incidentType ||
        !title ||
        !message
    ) {
        throw new TypeError(
            'Evelynn Black Box openIncident received incomplete Incident data.'
        );
    }

    let previousService =
        null;

    try {
        previousService =
            await getTerminalService(
                guildId,
                serviceKey
            );
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not load service "${serviceKey}":`
        );

        console.error(
            databaseError
        );
    }

    const sameState =
        previousService?.status ===
            status &&
        previousService?.severity ===
            severity &&
        previousService?.incidentType ===
            incidentType;

    if (
        sameState &&
        isIncidentActive(
            guildId,
            serviceKey
        )
    ) {
        try {
            const service =
                await upsertTerminalService({
                    guildId,
                    serviceKey,
                    displayName,
                    status,
                    severity,

                    statusMessage:
                        message,

                    incidentType,

                    metadata:
                        normalizeIncidentMetadata(
                            metadata
                        ),

                    startedAt:
                        previousService
                            ?.startedAt ??
                        new Date()
                });

            return {
                changed:
                    false,

                archived:
                    false,

                service,

                incident:
                    null
            };
        } catch (databaseError) {
            console.error(
                `⚠️ Evelynn Black Box could not refresh service "${serviceKey}":`
            );

            console.error(
                databaseError
            );

            return {
                changed:
                    false,

                archived:
                    false,

                service:
                    previousService,

                incident:
                    null
            };
        }
    }

    const incident =
        await archiveIncident({
            guildId,

            serviceKey,

            incidentType,

            severity,

            title,

            message,

            fields,

            error
        });

    let service =
        null;

    try {
        service =
            await upsertTerminalService({
                guildId,
                serviceKey,
                displayName,
                status,
                severity,

                statusMessage:
                    message,

                incidentType,

                metadata:
                    normalizeIncidentMetadata(
                        metadata
                    ),

                startedAt:
                    previousService
                        ?.startedAt ??
                    new Date()
            });
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not update service "${serviceKey}":`
        );

        console.error(
            databaseError
        );
    }

    activateIncident(
        guildId,
        serviceKey
    );

    return {
        changed:
            true,

        archived:
            Boolean(
                incident
            ),

        service,

        incident
    };
}/**
 * Recover one service and return it
 * to ONLINE status.
 *
 * Recovery is archived only when the
 * previous state was not already ONLINE.
 *
 * @param {Object} options
 * @returns {Promise<{
 *     changed: boolean,
 *     archived: boolean,
 *     service: Object|null,
 *     incident: Object|null
 * }>}
 */
async function recoverIncident({
    guildId,

    serviceKey,

    displayName,

    incidentType,

    title,

    message,

    fields =
        [],

    metadata =
        {}
}) {
    if (
        !guildId ||
        !serviceKey ||
        !displayName ||
        !incidentType ||
        !title ||
        !message
    ) {
        throw new TypeError(
            'Evelynn Black Box recoverIncident received incomplete recovery data.'
        );
    }

    let previousService =
        null;

    try {
        previousService =
            await getTerminalService(
                guildId,
                serviceKey
            );
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not load recovery state for "${serviceKey}":`
        );

        console.error(
            databaseError
        );
    }

    const alreadyOnline =
        previousService?.status ===
            SERVICE_STATUS.ONLINE &&
        previousService?.severity ===
            INCIDENT_SEVERITY.SUCCESS;

    if (
        alreadyOnline &&
        !isIncidentActive(
            guildId,
            serviceKey
        )
    ) {
        try {
            const service =
                await upsertTerminalService({
                    guildId,
                    serviceKey,
                    displayName,

                    status:
                        SERVICE_STATUS.ONLINE,

                    severity:
                        INCIDENT_SEVERITY.SUCCESS,

                    statusMessage:
                        message,

                    incidentType:
                        null,

                    metadata:
                        normalizeIncidentMetadata(
                            metadata
                        ),

                    startedAt:
                        previousService
                            ?.startedAt ??
                        new Date()
                });

            return {
                changed:
                    false,

                archived:
                    false,

                service,

                incident:
                    null
            };
        } catch (databaseError) {
            console.error(
                `⚠️ Evelynn Black Box could not refresh recovered service "${serviceKey}":`
            );

            console.error(
                databaseError
            );

            return {
                changed:
                    false,

                archived:
                    false,

                service:
                    previousService,

                incident:
                    null
            };
        }
    }

    const incident =
        await archiveIncident({
            guildId,

            serviceKey,

            incidentType,

            severity:
                INCIDENT_SEVERITY.SUCCESS,

            title,

            message,

            fields
        });

    let service =
        null;

    try {
        service =
            await upsertTerminalService({
                guildId,
                serviceKey,
                displayName,

                status:
                    SERVICE_STATUS.ONLINE,

                severity:
                    INCIDENT_SEVERITY.SUCCESS,

                statusMessage:
                    message,

                incidentType:
                    null,

                metadata:
                    normalizeIncidentMetadata(
                        metadata
                    ),

                startedAt:
                    previousService
                        ?.startedAt ??
                    new Date()
            });
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not mark service "${serviceKey}" as recovered:`
        );

        console.error(
            databaseError
        );
    }

    clearIncident(
        guildId,
        serviceKey
    );

    return {
        changed:
            true,

        archived:
            Boolean(
                incident
            ),

        service,

        incident
    };
}

/**
 * Register or refresh one healthy service.
 *
 * This does not create a recovery Incident.
 * Use recoverIncident() when an unhealthy
 * service has actually recovered.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.serviceKey
 * @param {string} options.displayName
 * @param {string} [options.message]
 * @param {Object} [options.metadata]
 * @param {Date|string|null} [options.startedAt]
 * @returns {Promise<Object|null>}
 */
async function markServiceOnline({
    guildId,

    serviceKey,

    displayName,

    message =
        'Service is operating normally.',

    metadata =
        {},

    startedAt =
        null
}) {
    if (
        !guildId ||
        !serviceKey ||
        !displayName
    ) {
        throw new TypeError(
            'Evelynn Black Box markServiceOnline received incomplete service data.'
        );
    }

    try {
        const previousService =
            await getTerminalService(
                guildId,
                serviceKey
            );

        const service =
            await upsertTerminalService({
                guildId,
                serviceKey,
                displayName,

                status:
                    SERVICE_STATUS.ONLINE,

                severity:
                    INCIDENT_SEVERITY.SUCCESS,

                statusMessage:
                    message,

                incidentType:
                    null,

                metadata:
                    normalizeIncidentMetadata(
                        metadata
                    ),

                startedAt:
                    previousService
                        ?.startedAt ??
                    startedAt ??
                    new Date()
            });

        clearIncident(
            guildId,
            serviceKey
        );

        return service;
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not mark service "${serviceKey}" as ONLINE:`
        );

        console.error(
            databaseError
        );

        return null;
    }
}

/**
 * Mark one service as STARTING.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.serviceKey
 * @param {string} options.displayName
 * @param {string} [options.message]
 * @param {Object} [options.metadata]
 * @returns {Promise<Object|null>}
 */
async function markServiceStarting({
    guildId,

    serviceKey,

    displayName,

    message =
        'Service initialization is in progress.',

    metadata =
        {}
}) {
    if (
        !guildId ||
        !serviceKey ||
        !displayName
    ) {
        throw new TypeError(
            'Evelynn Black Box markServiceStarting received incomplete service data.'
        );
    }

    try {
        const previousService =
            await getTerminalService(
                guildId,
                serviceKey
            );

        return await upsertTerminalService({
            guildId,
            serviceKey,
            displayName,

            status:
                SERVICE_STATUS.STARTING,

            severity:
                INCIDENT_SEVERITY.INFO,

            statusMessage:
                message,

            incidentType:
                null,

            metadata:
                normalizeIncidentMetadata(
                    metadata
                ),

            startedAt:
                previousService
                    ?.startedAt ??
                new Date()
        });
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not mark service "${serviceKey}" as STARTING:`
        );

        console.error(
            databaseError
        );

        return null;
    }
}

/**
 * Mark one service as STOPPED.
 *
 * A stopped service is not necessarily
 * considered a failure.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.serviceKey
 * @param {string} options.displayName
 * @param {string} [options.message]
 * @param {Object} [options.metadata]
 * @returns {Promise<Object|null>}
 */
async function markServiceStopped({
    guildId,

    serviceKey,

    displayName,

    message =
        'Service has been stopped.',

    metadata =
        {}
}) {
    if (
        !guildId ||
        !serviceKey ||
        !displayName
    ) {
        throw new TypeError(
            'Evelynn Black Box markServiceStopped received incomplete service data.'
        );
    }

    try {
        const previousService =
            await getTerminalService(
                guildId,
                serviceKey
            );

        const service =
            await upsertTerminalService({
                guildId,
                serviceKey,
                displayName,

                status:
                    SERVICE_STATUS.STOPPED,

                severity:
                    INCIDENT_SEVERITY.INFO,

                statusMessage:
                    message,

                incidentType:
                    null,

                metadata:
                    normalizeIncidentMetadata(
                        metadata
                    ),

                startedAt:
                    previousService
                        ?.startedAt ??
                    null
            });

        clearIncident(
            guildId,
            serviceKey
        );

        return service;
    } catch (databaseError) {
        console.error(
            `⚠️ Evelynn Black Box could not mark service "${serviceKey}" as STOPPED:`
        );

        console.error(
            databaseError
        );

        return null;
    }
}/**
 * Restore the active Incident cache
 * from PostgreSQL service states.
 *
 * This is useful after a deployment
 * or container restart.
 *
 * @param {string} guildId
 * @param {Array<Object>} services
 * @returns {number}
 */
function restoreActiveIncidentCache(
    guildId,
    services
) {
    if (
        !guildId ||
        !Array.isArray(
            services
        )
    ) {
        return 0;
    }

    let restoredCount =
        0;

    for (
        const service
        of services
    ) {
        if (
            !service?.serviceKey
        ) {
            continue;
        }

        const unhealthy =
            service.status ===
                SERVICE_STATUS.OFFLINE ||
            service.status ===
                SERVICE_STATUS.DEGRADED;

        if (!unhealthy) {
            continue;
        }

        activateIncident(
            guildId,
            service.serviceKey
        );

        restoredCount +=
            1;
    }

    return restoredCount;
}

/**
 * Return a snapshot of active
 * in-memory Incident keys.
 *
 * @returns {string[]}
 */
function getActiveIncidentKeys() {
    return Array.from(
        ACTIVE_INCIDENTS.keys()
    );
}

/**
 * Clear every active Incident
 * from the in-memory cache.
 *
 * Mostly useful during testing
 * or graceful shutdown.
 *
 * @returns {number}
 */
function clearAllActiveIncidents() {
    const activeCount =
        ACTIVE_INCIDENTS.size;

    ACTIVE_INCIDENTS.clear();

    return activeCount;
}

/**
 * Official Evelynn service definitions.
 */
const UMBRA_SERVICES = {
    POSTGRESQL: {
        key:
            'postgresql',

        name:
            'PostgreSQL'
    },

    GATEWAY: {
        key:
            'gateway',

        name:
            'Discord Gateway'
    },

    MEMORY: {
        key:
            'memory',

        name:
            'Memory'
    },

    GUARDIAN: {
        key:
            'guardian',

        name:
            'Guardian'
    },

    KINGDOM_FEED: {
        key:
            'kingdom_feed',

        name:
            'Kingdom Feed'
    },

    RANK_TRIALS: {
        key:
            'rank_trials',

        name:
            'Rank Trials'
    },

    TICKET_SYSTEM: {
        key:
            'ticket_system',

        name:
            'Ticket System'
    },

    VERIFICATION: {
        key:
            'verification',

        name:
            'Verification'
    },

    SETUP_WIZARD: {
        key:
            'setup_wizard',

        name:
            'Setup Wizard'
    },

    LEVELS: {
        key:
            'levels',

        name:
            'Levels'
    },

    ACHIEVEMENTS: {
        key:
            'achievements',

        name:
            'Achievements'
    },

    TITLES: {
        key:
            'titles',

        name:
            'Chronicle Titles'
    },

    SIN_RANKS: {
        key:
            'sin_ranks',

        name:
            'Sin Ranks'
    },

    EVENTS: {
        key:
            'events',

        name:
            'Events'
    },

    GIVEAWAYS: {
        key:
            'giveaways',

        name:
            'Giveaways'
    },

    SOUL_RECORDS: {
        key:
            'soul_records',

        name:
            'Soul Records'
    }
};

/**
 * Return every official Evelynn service.
 *
 * @returns {Array<{
 *     key: string,
 *     name: string
 * }>}
 */
function getEvelynnServices() {
    return Object.values(
        UMBRA_SERVICES
    );
}

/**
 * Find one official service definition.
 *
 * Accepts either:
 *
 * POSTGRESQL
 * postgresql
 *
 * @param {string} serviceIdentifier
 * @returns {{
 *     key: string,
 *     name: string
 * }|null}
 */
function getEvelynnService(
    serviceIdentifier
) {
    if (
        typeof serviceIdentifier !==
            'string' ||
        serviceIdentifier.length ===
            0
    ) {
        return null;
    }

    const normalizedIdentifier =
        serviceIdentifier.trim();

    const directService =
        UMBRA_SERVICES[
            normalizedIdentifier
                .toUpperCase()
        ];

    if (directService) {
        return directService;
    }

    return (
        getEvelynnServices().find(
            service =>
                service.key ===
                normalizedIdentifier
                    .toLowerCase()
        ) ||
        null
    );
}/**
 * Register every official Evelynn service
 * as STARTING.
 *
 * Existing service start times are
 * preserved by markServiceStarting().
 *
 * @param {string} guildId
 * @returns {Promise<{
 *     registered: number,
 *     failed: number
 * }>}
 */
async function initializeTerminalServices(
    guildId
) {
    if (!guildId) {
        throw new TypeError(
            'Evelynn Black Box initializeTerminalServices requires a Guild ID.'
        );
    }

    let registered =
        0;

    let failed =
        0;

    for (
        const service
        of getEvelynnServices()
    ) {
        const result =
            await markServiceStarting({
                guildId,

                serviceKey:
                    service.key,

                displayName:
                    service.name,

                message:
                    'Evelynn is initializing this service.',

                metadata: {
                    initializedBy:
                        'Evelynn Black Box',

                    registeredAt:
                        new Date()
                            .toISOString()
                }
            });

        if (result) {
            registered +=
                1;
        } else {
            failed +=
                1;
        }
    }

    return {
        registered,
        failed
    };
}

/**
 * Mark every official Evelynn service
 * as STOPPED.
 *
 * Intended for graceful shutdown.
 *
 * @param {string} guildId
 * @param {string} [message]
 * @returns {Promise<{
 *     stopped: number,
 *     failed: number
 * }>}
 */
async function stopTerminalServices(
    guildId,
    message =
        'Evelynn is shutting down this service.'
) {
    if (!guildId) {
        throw new TypeError(
            'Evelynn Black Box stopTerminalServices requires a Guild ID.'
        );
    }

    let stopped =
        0;

    let failed =
        0;

    for (
        const service
        of getEvelynnServices()
    ) {
        const result =
            await markServiceStopped({
                guildId,

                serviceKey:
                    service.key,

                displayName:
                    service.name,

                message,

                metadata: {
                    stoppedBy:
                        'Evelynn Black Box',

                    stoppedAt:
                        new Date()
                            .toISOString()
                }
            });

        if (result) {
            stopped +=
                1;
        } else {
            failed +=
                1;
        }
    }

    return {
        stopped,
        failed
    };
}

module.exports = {
    ACTIVE_INCIDENTS,

    SERVICE_STATUS,
    INCIDENT_SEVERITY,
    UMBRA_SERVICES,

    createIncidentKey,
    isIncidentActive,
    activateIncident,
    clearIncident,

    normalizeIncidentMetadata,
    normalizeIncidentServiceKey,
    archiveIncident,

    openIncident,
    recoverIncident,

    markServiceOnline,
    markServiceStarting,
    markServiceStopped,

    restoreActiveIncidentCache,
    getActiveIncidentKeys,
    clearAllActiveIncidents,

    getEvelynnServices,
    getEvelynnService,

    initializeTerminalServices,
    stopTerminalServices
};