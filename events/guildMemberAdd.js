const {
    Events,
    PermissionFlagsBits
} = require('discord.js');

const channels =
    require('../config/channels');

const {
    createWelcomeBanner,
    createWelcomeEmbed,
    createWelcomeComponents
} = require('../utils/welcomeEmbed');

module.exports = {
    name:
        Events.GuildMemberAdd,

    async execute(
        member
    ) {
        if(!require('../utils/guildContext').enabled('welcome'))return;
        try {
            const welcomeChannel =
                member.guild.channels.cache.get(
                    channels.welcome
                );

            if (
                !welcomeChannel?.isTextBased()
            ) {
                console.warn(
                    'Welcome channel unavailable.'
                );

                return;
            }

            const botMember =
                member.guild.members.me;

            const permissions =
                welcomeChannel.permissionsFor(
                    botMember
                );

            if (
                !permissions?.has([
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.AttachFiles
                ])
            ) {
                console.warn(
                    'Missing Welcome channel permissions.'
                );

                return;
            }

            const banner =
                createWelcomeBanner(member);

            const embed =
                createWelcomeEmbed(
                    member
                );

            await welcomeChannel.send({
                content:
                    `${member}`,
                embeds: [
                    embed
                ],
                components: createWelcomeComponents(member),
                files: [
                    banner
                ],
                allowedMentions: {
                    parse: [],
                    users: [
                        member.id
                    ]
                }
            });
        } catch (error) {
            console.error(
                'Welcome System failed:',
                error
            );
        }
    }
};
