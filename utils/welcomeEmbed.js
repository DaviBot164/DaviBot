const { EmbedBuilder } = require("discord.js");
const embedConfig = require("../config/embed");

function createWelcomeEmbed(member) {
    const guild = member.guild;

    const serverIcon =
        guild.iconURL({
            extension: "png",
            size: 512
        }) || undefined;

    const memberAvatar = member.user.displayAvatarURL({
        extension: "png",
        size: 512
    });

    const botAvatar = member.client.user.displayAvatarURL({
        extension: "png",
        size: 256
    });

    return new EmbedBuilder()
        .setColor("#8B0000")

        .setAuthor({
            name: guild.name,
            iconURL: serverIcon
        })

        .setTitle("⚔️ A New Commandment Has Arrived")

        .setDescription(
            [
                `Welcome to **${guild.name}**, ${member}!`,
                "",
                "Your journey begins here. Become part of the community,",
                "meet new members and prepare for future events.",
                "",
                "━━━━━━━━━━━━━━━━━━━━━━"
            ].join("\n")
        )

        .addFields(
            {
                name: "📜 Server Guide",
                value: [
                    "• Read the server rules",
                    "• Choose your roles",
                    "• Explore the community"
                ].join("\n"),
                inline: true
            },
            {
                name: "⚔️ Your Journey",
                value: [
                    "• Join server events",
                    "• Meet other members",
                    "• Rise through the ranks"
                ].join("\n"),
                inline: true
            },
            {
                name: "👥 Member Information",
                value: [
                    `**Member:** ${member}`,
                    `**Member Number:** #${guild.memberCount}`,
                    `**Joined:** <t:${Math.floor(Date.now() / 1000)}:R>`
                ].join("\n"),
                inline: false
            }
        )

        .setThumbnail(memberAvatar)

        .setFooter({
            text: `${embedConfig.footer.text} • Welcome System`,
            iconURL: botAvatar
        })

        .setTimestamp();
}

module.exports = {
    createWelcomeEmbed
};