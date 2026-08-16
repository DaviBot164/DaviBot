const {
    query
} = require('./connection');

/**
 * Convert one PostgreSQL Incident row
 * into a clean JavaScript object.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapTerminalIncidentRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        id:
            row.id,

        guildId:
            row.guild_id,

        serviceKey:
            row.service_key,

        incidentType:
            row.incident_type,

        severity:
            row.severity,

        title:
            row.title,

        message:
            row.message,

        fields:
            row.fields ??
            [],

        errorName:
            row.error_name,

        errorMessage:
            row.error_message,

        errorStack:
            row.error_stack,

        createdAt:
            row.created_at
    };
}

/**
 * Normalize an unknown diagnostic value
 * before storing it inside PostgreSQL.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeDatabaseText(
    value
) {
    if (
        value ===
        null ||
        value ===
        undefined
    ) {
        return null;
    }

    if (
        value instanceof Error
    ) {
        return (
            value.message ||
            value.name ||
            'Unknown Error'
        );
    }

    if (
        typeof value ===
        'string'
    ) {
        return value;
    }

    try {
        return JSON.stringify(
            value,
            null,
            2
        );
    } catch {
        return String(
            value
        );
    }
}

/**
 * Normalize one unknown error before
 * storing its diagnostic information.
 *
 * @param {unknown} error
 * @returns {{
 *     name: string|null,
 *     message: string|null,
 *     stack: string|null
 * }}
 */
function normalizeStoredError(
    error
) {
    if (!error) {
        return {
            name:
                null,

            message:
                null,

            stack:
                null
        };
    }

    if (
        error instanceof Error
    ) {
        return {
            name:
                error.name ||
                'Error',

            message:
                error.message ||
                null,

            stack:
                error.stack ||
                null
        };
    }

    return {
        name:
            'UnknownError',

        message:
            normalizeDatabaseText(
                error
            ),

        stack:
            null
    };
}

/**
 * Normalize a Black Box service key
 * before database storage.
 *
 * Old or global Incidents may not belong
 * to one specific service.
 *
 * @param {unknown} serviceKey
 * @returns {string|null}
 */
function normalizeServiceKey(
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
 * Save one Evelynn Incident inside
 * the PostgreSQL Incident Archive.
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
async function createTerminalIncident({
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
    const normalizedError =
        normalizeStoredError(
            error
        );

    const normalizedServiceKey =
        normalizeServiceKey(
            serviceKey
        );

    const result =
        await query(
            `
                INSERT INTO terminal_incidents (
                    guild_id,
                    service_key,
                    incident_type,
                    severity,
                    title,
                    message,
                    fields,
                    error_name,
                    error_message,
                    error_stack
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7::jsonb,
                    $8,
                    $9,
                    $10
                )
                RETURNING *;
            `,
            [
                guildId,

                normalizedServiceKey,

                incidentType,

                severity,

                title,

                message,

                JSON.stringify(
                    Array.isArray(
                        fields
                    )
                        ? fields
                        : []
                ),

                normalizedError.name,

                normalizedError.message,

                normalizedError.stack
            ]
        );

    return mapTerminalIncidentRow(
        result.rows[0]
    );
}/**
 * Load the most recent Incidents
 * for one Discord server.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentTerminalIncidents(
    guildId,
    limit =
        10
) {
    const safeLimit =
        Math.min(
            Math.max(
                Number(
                    limit
                ) ||
                10,
                1
            ),
            50
        );

    const result =
        await query(
            `
                SELECT *
                FROM terminal_incidents

                WHERE guild_id = $1
                   OR guild_id IS NULL

                ORDER BY created_at DESC

                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapTerminalIncidentRow
    );
}

/**
 * Load recent Incident history for
 * one specific Black Box service.
 *
 * @param {string} guildId
 * @param {string} serviceKey
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getServiceTerminalIncidents(
    guildId,
    serviceKey,
    limit =
        10
) {
    const normalizedServiceKey =
        normalizeServiceKey(
            serviceKey
        );

    if (
        !guildId ||
        !normalizedServiceKey
    ) {
        return [];
    }

    const safeLimit =
        Math.min(
            Math.max(
                Number(
                    limit
                ) ||
                10,
                1
            ),
            50
        );

    const result =
        await query(
            `
                SELECT *
                FROM terminal_incidents

                WHERE guild_id = $1
                  AND service_key = $2

                ORDER BY created_at DESC

                LIMIT $3;
            `,
            [
                guildId,
                normalizedServiceKey,
                safeLimit
            ]
        );

    return result.rows.map(
        mapTerminalIncidentRow
    );
}

/**
 * Load the newest Incident recorded
 * for one specific Black Box service.
 *
 * @param {string} guildId
 * @param {string} serviceKey
 * @returns {Promise<Object|null>}
 */
async function getLatestServiceTerminalIncident(
    guildId,
    serviceKey
) {
    const normalizedServiceKey =
        normalizeServiceKey(
            serviceKey
        );

    if (
        !guildId ||
        !normalizedServiceKey
    ) {
        return null;
    }

    const result =
        await query(
            `
                SELECT *
                FROM terminal_incidents

                WHERE guild_id = $1
                  AND service_key = $2

                ORDER BY created_at DESC

                LIMIT 1;
            `,
            [
                guildId,
                normalizedServiceKey
            ]
        );

    return mapTerminalIncidentRow(
        result.rows[0]
    );
}

/**
 * Load one Incident by its database ID.
 *
 * @param {string|number} incidentId
 * @returns {Promise<Object|null>}
 */
async function getTerminalIncidentById(
    incidentId
) {
    const result =
        await query(
            `
                SELECT *
                FROM terminal_incidents

                WHERE id = $1

                LIMIT 1;
            `,
            [
                incidentId
            ]
        );

    return mapTerminalIncidentRow(
        result.rows[0]
    );
}

/**
 * Return Incident statistics for one
 * Black Box service.
 *
 * @param {string} guildId
 * @param {string} serviceKey
 * @returns {Promise<{
 *     total: number,
 *     critical: number,
 *     warning: number,
 *     success: number,
 *     info: number,
 *     lastIncidentAt: Date|null
 * }>}
 */
async function getServiceTerminalIncidentStatistics(
    guildId,
    serviceKey
) {
    const normalizedServiceKey =
        normalizeServiceKey(
            serviceKey
        );

    if (
        !guildId ||
        !normalizedServiceKey
    ) {
        return {
            total:
                0,

            critical:
                0,

            warning:
                0,

            success:
                0,

            info:
                0,

            lastIncidentAt:
                null
        };
    }

    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER AS total,

                    COUNT(*) FILTER (
                        WHERE severity = 'critical'
                    )::INTEGER AS critical,

                    COUNT(*) FILTER (
                        WHERE severity = 'warning'
                    )::INTEGER AS warning,

                    COUNT(*) FILTER (
                        WHERE severity = 'success'
                    )::INTEGER AS success,

                    COUNT(*) FILTER (
                        WHERE severity = 'info'
                    )::INTEGER AS info,

                    MAX(created_at) AS last_incident_at

                FROM terminal_incidents

                WHERE guild_id = $1
                  AND service_key = $2;
            `,
            [
                guildId,
                normalizedServiceKey
            ]
        );

    const row =
        result.rows[0];

    return {
        total:
            Number(
                row.total
            ) || 0,

        critical:
            Number(
                row.critical
            ) || 0,

        warning:
            Number(
                row.warning
            ) || 0,

        success:
            Number(
                row.success
            ) || 0,

        info:
            Number(
                row.info
            ) || 0,

        lastIncidentAt:
            row.last_incident_at
    };
}/**
 * Return simple Incident statistics
 * for one Discord server.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getTerminalIncidentStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER AS total,

                    COUNT(*) FILTER (
                        WHERE severity = 'critical'
                    )::INTEGER AS critical,

                    COUNT(*) FILTER (
                        WHERE severity = 'warning'
                    )::INTEGER AS warning,

                    COUNT(*) FILTER (
                        WHERE severity = 'success'
                    )::INTEGER AS success,

                    COUNT(*) FILTER (
                        WHERE severity = 'info'
                    )::INTEGER AS info,

                    MAX(created_at) AS last_incident_at

                FROM terminal_incidents

                WHERE guild_id = $1
                   OR guild_id IS NULL;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0];

    return {
        total:
            Number(
                row.total
            ) || 0,

        critical:
            Number(
                row.critical
            ) || 0,

        warning:
            Number(
                row.warning
            ) || 0,

        success:
            Number(
                row.success
            ) || 0,

        info:
            Number(
                row.info
            ) || 0,

        lastIncidentAt:
            row.last_incident_at
    };
}

/**
 * Delete old Incident records.
 *
 * @param {number} days
 * @returns {Promise<number>}
 */
async function purgeTerminalIncidents(
    days =
        30
) {
    const safeDays =
        Math.max(
            Number(
                days
            ) ||
            30,
            1
        );

    const result =
        await query(
            `
                DELETE
                FROM terminal_incidents

                WHERE created_at <
                    NOW() -
                    ($1 * INTERVAL '1 day');
            `,
            [
                safeDays
            ]
        );

    return result.rowCount;
}

module.exports = {
    mapTerminalIncidentRow,

    normalizeDatabaseText,
    normalizeStoredError,
    normalizeServiceKey,

    createTerminalIncident,

    getRecentTerminalIncidents,

    getServiceTerminalIncidents,
    getLatestServiceTerminalIncident,
    getServiceTerminalIncidentStatistics,

    getTerminalIncidentById,
    getTerminalIncidentStatistics,

    purgeTerminalIncidents
};