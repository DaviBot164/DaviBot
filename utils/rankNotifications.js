const {
    AttachmentBuilder
} = require('discord.js');

const channels =
    require('../config/channels');

const {
    createEmbed
} = require('./embeds');

const {
    createRankCard
} = require('./cards/rankCard');

async function sendRankPromotion(
    member,
    faction,
    rank
) {
    const channel =
        member.guild.channels.cache.get(
            channels.rankPromotions
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const image = await createRankCard(
        member,
        faction,
        rank
    );

    const attachment =
        new AttachmentBuilder(
            image,
            {
                name: 'rank-promotion.png'
            }
        );

    const embed = createEmbed(
        'Rank Ascension',
        `${member} has ascended to **${rank.name}**.`
    )
        .setImage(
            'attachment://rank-promotion.png'
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
    sendRankPromotion
};