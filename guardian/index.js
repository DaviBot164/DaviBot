const {
    PermissionFlagsBits
} = require('discord.js');

const guardianConfig =
    require('../config/guardian');

const {
    handleSpamProtection
} = require('./spamProtection');

/**
 * Check whether a message should bypass Guardian.
 *
 * @param {import('discord.js').Message} message
 * @returns {boolean}
 */
function shouldIgnoreMessage(message) {
    if (
        !guardianConfig.enabled ||
        !message.guild ||
        !message.member ||
        message.author.bot ||
        message.webhookId
    ) {
        return true;
    }

    if (
        guardianConfig.ignoredChannelIds.includes(
            message.channel.id
        )
    ) {
        return true;
    }

    const hasIgnoredRole =
        message.member.roles.cache.some(role =>
            guardianConfig.ignoredRoleIds.includes(
                role.id
            )
        );

    if (hasIgnoredRole) {
        return true;
    }

    if (
        message.member.permissions.has(
            PermissionFlagsBits.Administrator
        ) ||
        message.member.permissions.has(
            PermissionFlagsBits.ManageMessages
        )
    ) {
        return true;
    }

    return false;
}

/**
 * Process one server message through Guardian.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<void>}
 */
async function handleGuardianMessage(message) {
    if (shouldIgnoreMessage(message)) {
        return;
    }

    try {
        await handleSpamProtection(
            message,
            guardianConfig
        );
    } catch (error) {
        console.error(
            '❌ Guardian failed to process a message:'
        );
        console.error(error);
    }
}

module.exports = {
    handleGuardianMessage
};