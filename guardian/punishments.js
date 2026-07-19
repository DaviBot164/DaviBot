const {
    PermissionFlagsBits
} = require('discord.js');

const {
    query
} = require('../database/connection');

/**
 * Save an automatic Guardian warning.
 *
 * @param {import('discord.js').Message} message
 * @param {string} reason
 * @returns {Promise<boolean>}
 */
async function saveGuardianWarning(
    message,
    reason
) {
    try {
        await query(
            `
                INSERT INTO warnings (
                    guild_id,
                    user_id,
                    moderator_id,
                    reason
                )
                VALUES ($1, $2, $3, $4);
            `,
            [
                message.guild.id,
                message.author.id,
                message.client.user.id,
                reason.slice(0, 500)
            ]
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to save Guardian warning:'
        );
        console.error(error);

        return false;
    }
}

/**
 * Attempt to delete the violating message.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<boolean>}
 */
async function deleteViolatingMessage(message) {
    if (!message.deletable) {
        return false;
    }

    try {
        await message.delete();

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to delete Guardian violation message:'
        );
        console.error(error);

        return false;
    }
}

/**
 * Send a temporary public warning.
 *
 * @param {import('discord.js').Message} message
 * @param {string} reason
 * @param {number} deleteAfterMs
 * @returns {Promise<void>}
 */
async function sendTemporaryWarning(
    message,
    reason,
    deleteAfterMs
) {
    try {
        const notification =
            await message.channel.send({
                content:
                    `${message.author}, 🛡️ DaviBot Guardian blocked your message.\n` +
                    `**Reason:** ${reason}`
            });

        setTimeout(async () => {
            try {
                if (notification.deletable) {
                    await notification.delete();
                }
            } catch {
                // The notification may already be deleted.
            }
        }, deleteAfterMs);
    } catch (error) {
        console.error(
            '❌ Failed to send Guardian warning message:'
        );
        console.error(error);
    }
}

/**
 * Timeout a member when possible.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {number} durationMs
 * @param {string} reason
 * @returns {Promise<boolean>}
 */
async function timeoutMember(
    member,
    durationMs,
    reason
) {
    const botMember =
        member.guild.members.me;

    if (
        !botMember ||
        !botMember.permissions.has(
            PermissionFlagsBits.ModerateMembers
        ) ||
        !member.moderatable
    ) {
        return false;
    }

    try {
        await member.timeout(
            durationMs,
            reason
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to timeout Guardian offender:'
        );
        console.error(error);

        return false;
    }
}

module.exports = {
    saveGuardianWarning,
    deleteViolatingMessage,
    sendTemporaryWarning,
    timeoutMember
};