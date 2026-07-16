const {
    PermissionFlagsBits
} = require('discord.js');

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
 * Check if a member can be moderated.
 * (Kick / Ban / Timeout)
 * @param {GuildMember} member
 * @returns {boolean}
 */
function canModerate(member) {
    return member.moderatable;
}

module.exports = {
    hasBotPermission,
    hasUserPermission,
    canModerate
};