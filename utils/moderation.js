const {
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed
} = require('./embeds');

/**
 * Check bot permission.
 *
 * @param {import('discord.js').GuildMember} botMember
 * @param {bigint} permission
 * @returns {boolean}
 */
function hasBotPermission(
    botMember,
    permission
) {
    return botMember
        .permissions
        .has(
            permission
        );
}

/**
 * Check member permission.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {bigint} permission
 * @returns {boolean}
 */
function hasUserPermission(
    member,
    permission
) {
    return member
        .permissions
        .has(
            permission
        );
}

/**
 * Check moderator role hierarchy.
 *
 * @param {import('discord.js').GuildMember} moderator
 * @param {import('discord.js').GuildMember} target
 * @returns {boolean}
 */
function isTargetAboveModerator(
    moderator,
    target
) {
    return (
        target.roles.highest.position >=
        moderator.roles.highest.position
    );
}

/**
 * Check bot role hierarchy.
 *
 * @param {import('discord.js').GuildMember} botMember
 * @param {import('discord.js').GuildMember} target
 * @returns {boolean}
 */
function isTargetAboveBot(
    botMember,
    target
) {
    return (
        target.roles.highest.position >=
        botMember.roles.highest.position
    );
}

/**
 * Check whether a member
 * can be moderated.
 *
 * @param {import('discord.js').GuildMember} target
 * @returns {boolean}
 */
function canModerate(
    target
) {
    return target.moderatable;
}

/**
 * Validate common moderation restrictions.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {import('discord.js').GuildMember} options.target
 * @param {import('discord.js').GuildMember} options.botMember
 * @returns {string|null}
 */
function getModerationError({
    interaction,
    target,
    botMember
}) {
    const moderator =
        interaction.member;

    if (
        target.id ===
        interaction.user.id
    ) {
        return 'You cannot moderate yourself.';
    }

    if (
        target.id ===
        interaction.client.user.id
    ) {
        return 'You cannot moderate Evelynn.';
    }

    if (
        target.id ===
        interaction.guild.ownerId
    ) {
        return 'The server owner cannot be moderated.';
    }

    if (
        interaction.user.id !==
            interaction.guild.ownerId &&
        isTargetAboveModerator(
            moderator,
            target
        )
    ) {
        return (
            'You cannot moderate a member whose role is equal to or higher than yours.'
        );
    }

    if (
        isTargetAboveBot(
            botMember,
            target
        )
    ) {
        return (
            'Evelynn cannot moderate this member because their role is equal to or higher than hers.'
        );
    }

    return null;
}

/**
 * Handle moderation command errors.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {unknown} options.error
 * @param {string} options.commandName
 * @param {string} options.title
 * @param {string} options.description
 * @returns {Promise<void>}
 */
async function handleModerationCommandError({
    interaction,
    error,
    commandName,
    title,
    description
}) {
    console.error(
        `❌ Evelynn /${commandName} command error:`,
        error
    );

    const errorEmbed =
        createErrorEmbed(
            title,
            description
        );

    if (
        interaction.deferred
    ) {
        await interaction
            .editReply({
                embeds: [
                    errorEmbed
                ]
            })
            .catch(
                () => null
            );

        return;
    }

    if (
        interaction.replied
    ) {
        await interaction
            .followUp({
                embeds: [
                    errorEmbed
                ],

                flags:
                    MessageFlags.Ephemeral
            })
            .catch(
                () => null
            );

        return;
    }

    await interaction
        .reply({
            embeds: [
                errorEmbed
            ],

            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}

module.exports = {
    hasBotPermission,
    hasUserPermission,

    isTargetAboveModerator,
    isTargetAboveBot,

    canModerate,
    getModerationError,

    handleModerationCommandError
};