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
    canModerate
};