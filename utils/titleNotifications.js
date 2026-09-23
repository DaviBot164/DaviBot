const channels =
    require('../config/channels');

const brand =
    require('../config/brand');

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

    if (
        !channel?.isTextBased()
    ) {
        return;
    }

    const embed =
        createEmbed(
            'New Title Unlocked',
            [
                `${member} unlocked **${title.name}**.`,
                '',
                title.description
            ].join('\n')
        )
            .setThumbnail(
                member.user
                    .displayAvatarURL({
                        size: 256
                    })
            )
            .setFooter({
                text:
                    brand.footer
            });

    await channel.send({
        embeds: [
            embed
        ]
    });
}

module.exports = {
    sendTitleUnlock
};