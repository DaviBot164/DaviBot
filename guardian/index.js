const {
    PermissionFlagsBits
} = require('discord.js');

const guardianConfig =
    require('../config/guardian');

const {
    handleProfanityProtection
} = require('./profanityFilter');

const {
    handleSpamProtection
} = require('./spamProtection');

/**
 * Check whether a message should bypass
 * Umbra Guardian.
 *
 * Umbra Guardian ignores:
 * - Direct messages
 * - Bots
 * - Webhooks
 * - Server owner
 * - Administrator members
 * - Members with Manage Messages
 * - Configured Staff roles
 * - Configured ignored channels
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
        message.author.id ===
        message.guild.ownerId
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
        message.member.roles.cache.some(
            role =>
                guardianConfig.ignoredRoleIds.includes(
                    role.id
                )
        );

    if (hasIgnoredRole) {
        return true;
    }

    const isStaff =
        message.member.permissions.has(
            PermissionFlagsBits.Administrator
        ) ||
        message.member.permissions.has(
            PermissionFlagsBits.ManageMessages
        );

    if (isStaff) {
        return true;
    }

    return false;
}

/**
 * Process one server message through
 * Umbra Guardian.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<void>}
 */
async function handleGuardianMessage(
    message
) {
    if (shouldIgnoreMessage(message)) {
        return;
    }

    try {
        /*
         * Profanity protection runs before
         * spam protection.
         *
         * If profanity protection already
         * handled the message, stop processing
         * so the same message does not receive
         * two Guardian punishments.
         */
        const profanityHandled =
            await handleProfanityProtection(
                message,
                guardianConfig
            );

        if (profanityHandled) {
            return;
        }

        await handleSpamProtection(
            message,
            guardianConfig
        );
    } catch (error) {
        console.error(
            '❌ Umbra Guardian failed to process a message:'
        );

        console.error(error);
    }
}

module.exports = {
    handleGuardianMessage
};