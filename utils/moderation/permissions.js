const { PermissionFlagsBits } = require('discord.js');

/**
 * Check if the bot has a required permission.
 * @param {GuildMember} botMember
 * @param {bigint} permission
 * @returns {boolean}
 */
function hasBotPermission(botMember, permission) {
    return botMember.permissions.has(permission);
}

/**
 * Check if the user has a required permission.
 * @param {GuildMember} member
 * @param {bigint} permission
 * @returns {boolean}
 */
function hasUserPermission(member, permission) {
    return member.permissions.has(permission);
}

/**
 * Check if the moderator is targeting themselves.
 * @param {GuildMember} moderator
 * @param {GuildMember} target
 * @returns {boolean}
 */
function isSelf(moderator, target) {
    return moderator.id === target.id;
}

/**
 * Check if the target is the bot.
 * @param {Client} client
 * @param {GuildMember} target
 * @returns {boolean}
 */
function isBot(client, target) {
    return client.user.id === target.id;
}

/**
 * Check if the target has an equal or higher role than the moderator.
 * Server Owner bypasses this check.
 * @param {GuildMember} moderator
 * @param {GuildMember} target
 * @returns {boolean}
 */
function hasHigherRole(moderator, target) {
    if (moderator.guild.ownerId === moderator.id) {
        return false;
    }

    return (
        target.roles.highest.position >= moderator.roles.highest.position
    );
}

/**
 * Check if the target is the server owner.
 * @param {GuildMember} target
 * @returns {boolean}
 */
function isOwner(target) {
    return target.guild.ownerId === target.id;
}

/**
 * Check if the bot can moderate the target.
 * @param {GuildMember} botMember
 * @param {GuildMember} target
 * @returns {boolean}
 */
function canBotModerate(botMember, target) {
    return botMember.roles.highest.position > target.roles.highest.position;
}

module.exports = {
    PermissionFlagsBits,
    hasBotPermission,
    hasUserPermission,
    isSelf,
    isBot,
    hasHigherRole,
    isOwner,
    canBotModerate
};