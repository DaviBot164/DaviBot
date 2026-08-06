const {
    query
} = require('./connection');

/**
 * Convert one PostgreSQL Service row
 * into a clean JavaScript object.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapTerminalServiceRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        guildId:
            row.guild_id,

        serviceKey:
            row.service_key,

        displayName:
            row.display_name,

        status:
            row.status,

        severity:
            row.severity,

        statusMessage:
            row.status_message,

        incidentType:
            row.incident_type,

        metadata:
            row.metadata ??
            {},

        startedAt:
            row.started_at,

        lastChangedAt:
            row.last_changed_at,

        lastCheckedAt:
            row.last_checked_at,

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at
    };
}

/**
 * Normalize metadata before storing.
 *
 * @param {unknown} metadata
 * @returns {Object}
 */
function normalizeMetadata(
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
}/**
 * Create or update one service state.
 *
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function upsertTerminalService({
    guildId,
    serviceKey,
    displayName,
    status,
    severity,
    statusMessage,
    incidentType = null,
    metadata = {},
    startedAt = null
}) {
    const result =
        await query(
            `
                INSERT INTO terminal_services (
                    guild_id,
                    service_key,
                    display_name,
                    status,
                    severity,
                    status_message,
                    incident_type,
                    metadata,
                    started_at,
                    last_changed_at,
                    last_checked_at,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8::jsonb,
                    $9,
                    NOW(),
                    NOW(),
                    NOW()
                )
                ON CONFLICT (
                    guild_id,
                    service_key
                )
                DO UPDATE
                SET
                    display_name =
                        EXCLUDED.display_name,

                    status =
                        EXCLUDED.status,

                    severity =
                        EXCLUDED.severity,

                    status_message =
                        EXCLUDED.status_message,

                    incident_type =
                        EXCLUDED.incident_type,

                    metadata =
                        EXCLUDED.metadata,

                    started_at =
                        COALESCE(
                            terminal_services.started_at,
                            EXCLUDED.started_at
                        ),

                    last_changed_at =
                        NOW(),

                    last_checked_at =
                        NOW(),

                    updated_at =
                        NOW()

                RETURNING *;
            `,
            [
                guildId,
                serviceKey,
                displayName,
                status,
                severity,
                statusMessage,
                incidentType,
                JSON.stringify(
                    normalizeMetadata(
                        metadata
                    )
                ),
                startedAt
            ]
        );

    return mapTerminalServiceRow(
        result.rows[0]
    );
}

/**
 * Update only the heartbeat of
 * one service.
 *
 * @param {string} guildId
 * @param {string} serviceKey
 * @returns {Promise<void>}
 */
async function touchTerminalService(
    guildId,
    serviceKey
) {
    await query(
        `
            UPDATE terminal_services

            SET
                last_checked_at = NOW(),
                updated_at = NOW()

            WHERE guild_id = $1
              AND service_key = $2;
        `,
        [
            guildId,
            serviceKey
        ]
    );
}

/**
 * Load one service.
 *
 * @param {string} guildId
 * @param {string} serviceKey
 * @returns {Promise<Object|null>}
 */
async function getTerminalService(
    guildId,
    serviceKey
) {
    const result =
        await query(
            `
                SELECT *

                FROM terminal_services

                WHERE guild_id = $1
                  AND service_key = $2

                LIMIT 1;
            `,
            [
                guildId,
                serviceKey
            ]
        );

    return mapTerminalServiceRow(
        result.rows[0]
    );
}/**
 * Load every service ordered by
 * severity and display name.
 *
 * @param {string} guildId
 * @returns {Promise<Object[]>}
 */
async function getTerminalServices(
    guildId
) {
    const result =
        await query(
            `
                SELECT *

                FROM terminal_services

                WHERE guild_id = $1

                ORDER BY
                    CASE severity
                        WHEN 'critical' THEN 1
                        WHEN 'warning' THEN 2
                        WHEN 'info' THEN 3
                        WHEN 'success' THEN 4
                        ELSE 5
                    END,
                    display_name ASC;
            `,
            [
                guildId
            ]
        );

    return result.rows.map(
        mapTerminalServiceRow
    );
}

/**
 * Remove every stored service
 * belonging to one guild.
 *
 * Mostly useful during testing.
 *
 * @param {string} guildId
 * @returns {Promise<number>}
 */
async function clearTerminalServices(
    guildId
) {
    const result =
        await query(
            `
                DELETE
                FROM terminal_services

                WHERE guild_id = $1;
            `,
            [
                guildId
            ]
        );

    return result.rowCount;
}

module.exports = {
    upsertTerminalService,

    touchTerminalService,

    getTerminalService,

    getTerminalServices,

    clearTerminalServices
};