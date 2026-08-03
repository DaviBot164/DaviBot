const {
    logTerminal
} = require('./terminalLogger');

const {
    logAlert
} = require('./alertLogger');

/**
 * Official Umbra Incident types.
 */
const INCIDENT_TYPES = {
    DATABASE_DISCONNECTED: {
        level:
            'critical',

        title:
            'PostgreSQL Connection Lost',

        message:
            'Umbra can no longer communicate with the PostgreSQL database.',

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
            'Umbra lost its connection to the Discord Gateway.',

        emoji:
            '📡'
    },

    GATEWAY_RESTORED: {
        level:
            'success',

        title:
            'Discord Gateway Restored',

        message:
            'Umbra successfully restored its Discord Gateway connection.',

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
            'Umbra process memory exceeded the configured warning threshold.',

        emoji:
            '🧠'
    },

    MEMORY_USAGE_NORMALIZED: {
        level:
            'success',

        title:
            'Memory Usage Normalized',

        message:
            'Umbra process memory returned to a normal operating range.',

        emoji:
            '✅'
    },

    COMMAND_FAILURE: {
        level:
            'critical',

        title:
            'Slash Command Failure',

        message:
            'Umbra encountered an unexpected error while executing a Slash Command.',

        emoji:
            '⚙️'
    },

    GUARDIAN_FAILURE: {
        level:
            'critical',

        title:
            'Guardian System Failure',

        message:
            'Umbra Guardian encountered a critical protection error.',

        emoji:
            '🛡️'
    },

    GUARDIAN_RESTORED: {
        level:
            'success',

        title:
            'Guardian System Restored',

        message:
            'Umbra Guardian protection systems are operational again.',

        emoji:
            '✅'
    },

    TICKET_FAILURE: {
        level:
            'critical',

        title:
            'Ticket System Failure',

        message:
            'Umbra encountered a critical error inside the Ticket System.',

        emoji:
            '🎫'
    },

    SYSTEM_WARNING: {
        level:
            'warning',

        title:
            'Umbra System Warning',

        message:
            'Umbra detected a system condition that requires investigation.',

        emoji:
            '⚠️'
    },

    SYSTEM_RECOVERED: {
        level:
            'success',

        title:
            'Umbra System Recovered',

        message:
            'Umbra successfully recovered from the recorded incident.',

        emoji:
            '✅'
    },

    DEPLOYMENT_STARTED: {
        level:
            'info',

        title:
            'Umbra Deployment Detected',

        message:
            'A new Umbra deployment or container restart was detected.',

        emoji:
            '📦'
    },

    DEPLOYMENT_COMPLETED: {
        level:
            'success',

        title:
            'Umbra Deployment Completed',

        message:
            'The latest Umbra deployment completed successfully.',

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
 * Publish one standardized Umbra
 * system incident.
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
            `⚠️ Unknown Umbra Incident type: ${type}`
        );

        return false;
    }

    const detectedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    const incidentFields =
        [
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

    const title =
        `${incident.emoji} ${incident.title}`;

    const incidentMessage =
        message ||
        incident.message;

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
    logIncident
};