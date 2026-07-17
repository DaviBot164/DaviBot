const { Events } = require("discord.js");

const {
    createWelcomeEmbed,
} = require("../utils/welcomeEmbed");

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member) {
        console.log("======================================");
        console.log(`👋 New Member Joined: ${member.user.tag}`);
        console.log(`🏰 Server: ${member.guild.name}`);
        console.log("======================================");

        try {
            const welcomeChannel = member.guild.channels.cache.find(
                channel =>
                    channel.name === "👋・welcome" &&
                    channel.isTextBased()
            );

            if (!welcomeChannel) {
                console.error(
                    '❌ Welcome channel "👋・welcome" was not found.'
                );
                return;
            }

            const welcomeEmbed = createWelcomeEmbed(member);

            await welcomeChannel.send({
                content: `👋 Welcome ${member}!`,
                embeds: [welcomeEmbed],
            });

            console.log(
                `✅ Welcome message sent for ${member.user.tag}`
            );
        } catch (error) {
            console.error(
                `❌ Failed to welcome ${member.user.tag}:`
            );
            console.error(error);
        }
    },
};