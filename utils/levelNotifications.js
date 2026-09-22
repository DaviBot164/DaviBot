const {
    AttachmentBuilder
} = require('discord.js');

const channels = require('../config/channels');

const {
    createEmbed
} = require('./embeds');

const {
    createLevelCard
} = require('./cards/levelCard');

async function sendLevelUp(message, level) {
    const channel =
        message.guild.channels.cache.get(
            channels.soulProgression
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const image = await createLevelCard(
        message.member,
        level
    );

    const attachment = new AttachmentBuilder(
        image,
        {
            name: 'level-up.png'
        }
    );

    const embed = createEmbed(
        'Soul Ascended',
        `${message.author} has reached **Level ${level}**.`
    )
        .setImage(
            'attachment://level-up.png'
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
    sendLevelUp
};