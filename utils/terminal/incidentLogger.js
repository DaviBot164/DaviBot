const {
    logTerminal
} = require('./terminalLogger');

const {
    logAlert
} = require('./alertLogger');

const {
    terminalIncidents
} = require('../../database');

/**
 * Official Evelynn Incident types.
 */
const INCIDENT_TYPES = {
    DATABASE_DISCONNECTED: {
        level:
            'critical',

        title:
            'PostgreSQL Connection Lost',

        message:
            'Evelynn can no longer communicate with the PostgreSQL database.',

        emoji:
            '🗄️'
    },

    DATABASE_RESTORED: {
        level:
            'success',

        title:
            'PostgreSQL Connection Restored',

        message:
            'Database communication has been restored successfully.',

        emoji:
            '✅'
    },

    GATEWAY_DISCONNECTED: {
        level:
            'critical',

        title:
            'Discord Gateway Disconnected',

        message:
            'Evelynn lost its connection to the Discord Gateway.',

        emoji:
            '📡'
    },

    GATEWAY_RESTORED: {
        level:
            'success',

        title:
            'Discord Gateway Restored',

        message:
            'Evelynn successfully restored its Discord Gateway connection.',

        emoji:
            '✅'
    },

    HIGH_GATEWAY_LATENCY: {
        level:
            'warning',

        title:
            'High Gateway Latency',

        message:
            'Discord Gateway latency exceeded the configured warning threshold.',

        emoji:
            '⚠️'
    },

    GATEWAY_LATENCY_NORMALIZED: {
        level:
            'success',

        title:
            'Gateway Latency Normalized',

        message:
            'Discord Gateway latency returned to a normal operating range.',

        emoji:
            '✅'
    },

    HIGH_MEMORY_USAGE: {
        level:
            'warning',

        title:
            'High Memory Usage',

        message:
            'Evelynn process memory exceeded the configured warning threshold.',

        emoji:
            '🧠'
    },

    MEMORY_USAGE_NORMALIZED: {
        level:
            'success',

        title:
            'Memory Usage Normalized',

        message:
            'Evelynn process memory returned to a normal operating range.',

        emoji:
            '✅'
    },

    COMMAND_FAILURE: {
        level:
            'critical',

        title:
            'Slash Command Failure',

        message:
            'Evelynn encountered an unexpected error while executing a Slash Command.',

        emoji:
            '⚙️'
    },

    GUARDIAN_FAILURE: {
        level:
            'critical',

        title:
            'Guardian System Failure',

        message:
            'Evelynn Guardian encountered a critical protection error.',

        emoji:
            '🛡️'
    },

    GUARDIAN_RESTORED: {
        level:
            'success',

        title:
            'Guardian System Restored',

        message:
            'Evelynn Guardian protection systems are operational again.',

        emoji:
            '✅'
    },

    TICKET_FAILURE: {
        level:
            'critical',

        title:
            'Ticket System Failure',

        message:
            'Evelynn encountered a critical error inside the Ticket System.',

        emoji:
            '🎫'
    },

    SYSTEM_WARNING: {
        level:
            'warning',

        title:
            'Evelynn System Warning',

        message:
            'Evelynn detected a degraded system condition that requires investigation.',

        emoji:
            '⚠️'
    },

    SYSTEM_CRITICAL: {
        level:
            'critical',

        title:
            'Evelynn Critical System Failure',

        message:
            'Evelynn detected a critical system condition requiring immediate investigation.',

        emoji:
            '🚨'
    },

    SYSTEM_RECOVERED: {
        level:
            'success',

        title:
            'Evelynn System Recovered',

        message:
            'Evelynn successfully recovered from the recorded incident.',

        emoji:
            '✅'
    },

    DEPLOYMENT_STARTED: {
        level:
            'info',

        title:
            'Evelynn Deployment Detected',

        message:
            'A new Evelynn deployment or container restart was detected.',

        emoji:
            '📦'
    },

    DEPLOYMENT_COMPLETED: {
        level:
            'success',

        title:
            'Evelynn Deployment Completed',

        message:
            'The latest Evelynn deployment completed successfully.',

        emoji:
            '✅'
    }
};

/**
 * Convert an unknown value into
 * safe diagnostic text.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeIncidentValue(
    value
) {
    if (
        value ===
        null ||
        value ===
        undefined
    ) {
        return 'Not provided';
    }

    if (
        value instanceof Error
    ) {
        return (
            value.stack ||
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
 * Limit incident diagnostic text
 * for Discord Embed safety.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function limitIncidentText(
    text,
    maxLength =
        900
) {
    if (
        typeof text !==
            'string' ||
        text.length ===
            0
    ) {
        return 'No diagnostic information available.';
    }

    if (
        text.length <=
        maxLength
    ) {
        return text;
    }

    return (
        text.slice(
            0,
            maxLength -
                20
        ) +
        '\n... truncated'
    );
}

/**
 * Build one Incident field.
 *
 * @param {Object} field
 * @param {string} field.name
 * @param {unknown} field.value
 * @param {boolean} [field.inline]
 * @param {boolean} [field.codeBlock]
 * @returns {{
 *     name: string,
 *     value: string,
 *     inline: boolean
 * }}
 */
function buildIncidentField({
    name,
    value,
    inline =
        false,
    codeBlock =
        false
}) {
    const normalizedValue =
        limitIncidentText(
            normalizeIncidentValue(
                value
            )
        );

    return {
        name,

        value:
            codeBlock
                ? [
                    '```',
                    normalizedValue,
                    '```'
                ].join('\n')
                : normalizedValue,

        inline
    };
}

/**
 * Convert Incident fields into a safe
 * PostgreSQL JSON structure.
 *
 * @param {Array<{
 *     name: string,
 *     value: unknown,
 *     inline?: boolean,
 *     codeBlock?: boolean
 * }>} fields
 * @returns {Array<{
 *     name: string,
 *     value: string,
 *     inline: boolean,
 *     codeBlock: boolean
 * }>}
 */
function normalizeStoredIncidentFields(
    fields
) {
    if (
        !Array.isArray(
            fields
        )
    ) {
        return [];
    }

    return fields.map(
        field => ({
            name:
                typeof field.name ===
                    'string'
                    ? field.name
                    : 'Unnamed Field',

            value:
                limitIncidentText(
                    normalizeIncidentValue(
                        field.value
                    )
                ),

            inline:
                Boolean(
                    field.inline
                ),

            codeBlock:
                Boolean(
                    field.codeBlock
                )
        })
    );
}

/**
 * Resolve the most relevant Guild ID
 * connected to one Incident.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {string|null}
 */
function resolveIncidentGuildId(
    client
) {
    if (
        !client ||
        !client.guilds
    ) {
        return null;
    }

    const firstGuild =
        client.guilds.cache.first();

    return (
        firstGuild?.id ??
        null
    );
}/**
 * Save an Incident inside PostgreSQL.
 *
 * A database failure must never prevent
 * the Incident from being published in
 * the Evelynn Terminal channel.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} options
 * @param {string} options.type
 * @param {Object} options.incident
 * @param {string} options.title
 * @param {string} options.message
 * @param {Array<Object>} options.fields
 * @param {unknown} options.error
 * @returns {Promise<boolean>}
 */
async function storeIncident(
    client,
    {
        type,
        incident,
        title,
        message,
        fields,
        error
    }
) {
    try {
        if (
            !terminalIncidents ||
            typeof terminalIncidents
                .createTerminalIncident !==
                'function'
        ) {
            console.warn(
                '⚠️ Evelynn Incident Archive is unavailable.'
            );

            return false;
        }

        await terminalIncidents
            .createTerminalIncident({
                guildId:
                    resolveIncidentGuildId(
                        client
                    ),

                incidentType:
                    type,

                severity:
                    incident.level,

                title,

                message,

                fields:
                    normalizeStoredIncidentFields(
                        fields
                    ),

                error
            });

        console.log(
            `🗄️ Incident archived in PostgreSQL: ${type}`
        );

        return true;
    } catch (databaseError) {
        console.error(
            `⚠️ Failed to archive Evelynn Incident "${type}" in PostgreSQL:`
        );

        console.error(
            databaseError
        );

        return false;
    }
}

/**
 * Publish one standardized Evelynn
 * system Incident.
 *
 * Every Incident is first archived in
 * PostgreSQL and then published inside
 * the Evelynn Terminal channel.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} options
 * @param {keyof typeof INCIDENT_TYPES} options.type
 * @param {string} [options.message]
 * @param {Array<{
 *     name: string,
 *     value: unknown,
 *     inline?: boolean,
 *     codeBlock?: boolean
 * }>} [options.fields]
 * @param {unknown} [options.error]
 * @returns {Promise<boolean>}
 */
async function logIncident(
    client,
    {
        type,
        message,
        fields =
            [],
        error =
            null
    }
) {
    const incident =
        INCIDENT_TYPES[
            type
        ];

    if (!incident) {
        console.warn(
            `⚠️ Unknown Evelynn Incident type: ${type}`
        );

        return false;
    }

    const detectedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    const title =
        `${incident.emoji} ${incident.title}`;

    const incidentMessage =
        message ||
        incident.message;

    await storeIncident(
        client,
        {
            type,
            incident,
            title,

            message:
                incidentMessage,

            fields,
            error
        }
    );

    const incidentFields = [
        {
            name:
                '🆔 Incident Type',

            value:
                `\`${type}\``,

            inline:
                true
        },
        {
            name:
                '🕒 Detected At',

            value:
                `<t:${detectedAt}:F>\n<t:${detectedAt}:R>`,

            inline:
                true
        },
        ...fields.map(
            field =>
                buildIncidentField(
                    field
                )
        )
    ];

    if (error) {
        incidentFields.push(
            buildIncidentField({
                name:
                    '🔍 Diagnostic Error',

                value:
                    error,

                inline:
                    false,

                codeBlock:
                    true
            })
        );
    }

    if (
        incident.level ===
        'critical'
    ) {
        return logAlert(
            client,
            {
                title,

                message:
                    incidentMessage,

                severity:
                    'critical',

                fields:
                    incidentFields
            }
        );
    }

    if (
        incident.level ===
        'warning'
    ) {
        return logAlert(
            client,
            {
                title,

                message:
                    incidentMessage,

                severity:
                    'warning',

                fields:
                    incidentFields
            }
        );
    }

    return logTerminal(
        client,
        {
            level:
                incident.level,

            title,

            message:
                incidentMessage,

            fields:
                incidentFields
        }
    );
}

module.exports = {
    INCIDENT_TYPES,

    normalizeIncidentValue,
    limitIncidentText,
    buildIncidentField,

    normalizeStoredIncidentFields,
    resolveIncidentGuildId,
    storeIncident,

    logIncident
};