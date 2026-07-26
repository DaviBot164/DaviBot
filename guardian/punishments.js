const {
    PermissionFlagsBits
} = require('discord.js');

const {
    query
} = require('../database/connection');

/**
 * Save an automatic Umbra Guardian warning.
 *
 * Database structure and warning logic
 * must remain unchanged.
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
            '❌ Failed to save Umbra Guardian warning:'
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
async function deleteViolatingMessage(
    message
) {
    if (!message.deletable) {
        return false;
    }

    try {
        await message.delete();

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to delete Umbra Guardian violation message:'
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
                    [
                        `${message.author}, 🌑 **Umbra Guardian** blocked your message.`,
                        `**Violation:** ${reason}`,
                        '',
                        'Respect the laws of Crimson Eclipse.'
                    ].join('\n')
            });

        const warningTimer = setTimeout(
            async () => {
                try {
                    if (
                        notification.deletable
                    ) {
                        await notification.delete();
                    }
                } catch {
                    /*
                     * The notification may already
                     * have been deleted.
                     */
                }
            },
            deleteAfterMs
        );

        if (
            typeof warningTimer.unref ===
            'function'
        ) {
            warningTimer.unref();
        }
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra Guardian warning message:'
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
            '❌ Failed to timeout Umbra Guardian offender:'
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