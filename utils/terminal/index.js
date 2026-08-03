const {
    TERMINAL_CHANNEL_ID,
    formatUptime,
    logTerminal
} = require('./terminalLogger');

const {
    logAlert
} = require('./alertLogger');

const {
    INCIDENT_TYPES,
    normalizeIncidentValue,
    limitIncidentText,
    buildIncidentField,
    logIncident
} = require('./incidentLogger');

const {
    DASHBOARD_REFRESH_INTERVAL,
    GATEWAY_WARNING_LATENCY,
    GATEWAY_CRITICAL_LATENCY,
    MEMORY_WARNING_BYTES,
    MEMORY_CRITICAL_BYTES,

    formatBytes,
    getDatabaseHealth,
    getMemoryState,
    getGatewayLatencyState,
    getOverallHealth,
    collectHealthSnapshot,
    buildDashboardEmbed,
    processHealthTransitions,
    updateTerminalDashboard,
    startTerminalDashboard,
    stopTerminalDashboard,
    getDashboardRefreshInterval
} = require('./terminalDashboard');

/**
 * Umbra Core Terminal public API.
 *
 * Other systems should import Terminal
 * functionality through this file instead
 * of requiring individual modules.
 */
module.exports = {
    /**
     * Terminal configuration.
     */
    TERMINAL_CHANNEL_ID,

    DASHBOARD_REFRESH_INTERVAL,

    GATEWAY_WARNING_LATENCY,
    GATEWAY_CRITICAL_LATENCY,

    MEMORY_WARNING_BYTES,
    MEMORY_CRITICAL_BYTES,

    INCIDENT_TYPES,

    /**
     * General Terminal logging.
     */
    log:
        logTerminal,

    info:
        async (
            client,
            options
        ) =>
            logTerminal(
                client,
                {
                    ...options,

                    level:
                        'info'
                }
            ),

    success:
        async (
            client,
            options
        ) =>
            logTerminal(
                client,
                {
                    ...options,

                    level:
                        'success'
                }
            ),

    warning:
        async (
            client,
            options
        ) =>
            logTerminal(
                client,
                {
                    ...options,

                    level:
                        'warning'
                }
            ),

    error:
        async (
            client,
            options
        ) =>
            logTerminal(
                client,
                {
                    ...options,

                    level:
                        'error'
                }
            ),

    /**
     * Alert and Incident systems.
     */
    alert:
        logAlert,

    incident:
        logIncident,

    /**
     * Live Dashboard controls.
     */
    dashboard: {
        start:
            startTerminalDashboard,

        stop:
            stopTerminalDashboard,

        update:
            updateTerminalDashboard,

        getRefreshInterval:
            getDashboardRefreshInterval,

        collectHealth:
            collectHealthSnapshot,

        processTransitions:
            processHealthTransitions,

        buildEmbed:
            buildDashboardEmbed
    },

    /**
     * Shared Terminal helpers.
     */
    formatters: {
        uptime:
            formatUptime,

        bytes:
            formatBytes,

        incidentValue:
            normalizeIncidentValue,

        incidentText:
            limitIncidentText,

        incidentField:
            buildIncidentField
    },

    /**
     * Health utilities.
     */
    health: {
        database:
            getDatabaseHealth,

        memoryState:
            getMemoryState,

        gatewayLatencyState:
            getGatewayLatencyState,

        overall:
            getOverallHealth
    },

    /**
     * Original named exports remain
     * available during migration.
     */
    logTerminal,
    logAlert,
    logIncident,

    startTerminalDashboard,
    stopTerminalDashboard,
    updateTerminalDashboard
};