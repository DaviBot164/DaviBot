const channels =
    require('../config/channels');

const {
    createEmbed
} = require('./embeds');

async function sendTitleUnlock(
    member,
    title
) {
    const channel =
        member.guild.channels.cache.get(
            channels.soulProgression
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const embed =
        createEmbed(
            'New Title Unlocked',
            [
                `${member} unlocked **${title.name}**.`,
                '',
                title.description,
                '',
                'Use `/titles` to equip it.'
            ].join('\n')
        )
            .setThumbnail(
                member.user.displayAvatarURL({
                    size: 256
                })
            )
            .setFooter({
                text: 'AKANE • BLOOD MOON'
            });

    await channel.send({
        embeds: [embed]
    });
}

module.exports = {
    sendTitleUnlock
};