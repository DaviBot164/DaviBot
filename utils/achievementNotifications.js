const {
    AttachmentBuilder
} = require('discord.js');

const channels =
    require('../config/channels');

const {
    createEmbed
} = require('./embeds');

const {
    createAchievementCard
} = require('./cards/achievementCard');

async function sendAchievementUnlock(
    member,
    achievement
) {
    const channel =
        member.guild.channels.cache.get(
            channels.soulProgression
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const image =
        await createAchievementCard(
            member,
            achievement
        );

    const attachment =
        new AttachmentBuilder(
            image,
            {
                name: 'achievement.png'
            }
        );

    const embed =
        createEmbed(
            'Achievement Unlocked',
            `${member} unlocked **${achievement.name}**.\n` +
            `+${achievement.points} Achievement Points`
        )
            .setImage(
                'attachment://achievement.png'
            )
            .setFooter({
                text: 'AKANE • BLOOD MOON'
            });

    await channel.send({
        embeds: [embed],
        files: [attachment]
    });
}

module.exports = {
    sendAchievementUnlock
};