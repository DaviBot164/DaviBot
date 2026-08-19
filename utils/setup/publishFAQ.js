const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const brand =
    require('../../config/brand');

const setupChannels =
    require('../../config/setupChannels');

const FAQ_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the FAQ channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getFAQChannel(
    interaction
) {
    const channel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .informationChannelId
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Information Channel Missing',
                    'The configured information channel could not be found.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const botMember =
        interaction.guild.members.me;

    if (!botMember) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Evelynn Unavailable',
                    'Evelynn could not access her server member record.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Permissions',
                    [
                        `Evelynn cannot publish the FAQ in ${channel}.`,
                        '',
                        'Required:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return null;
    }

    return channel;
}

/**
 * Publish the official
 * Lunar Seireitei FAQ.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishFAQ(
    interaction
) {
    const channel =
        await getFAQChannel(
            interaction
        );

    if (!channel) {
        return;
    }

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size:
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const faqEmbed =
        createEmbed({
            title:
                '☾・FAQ',

            description:
                '**Quick answers to common questions.**',

            color:
                FAQ_EMBED_COLOR,

            thumbnail:
                interaction.guild.iconURL({
                    size:
                        512,

                    forceStatic:
                        false
                }) ??
                botAvatar,

            fields: [
                {
                    name:
                        '✦・HOW DO I GET ACCESS?',

                    value:
                        [
                            'Verify your Roblox account through **Bloxlink**.',
                            '',
                            '**◇・WANDERING SOUL** → **✦・SOUL REAPER**'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '📜・WHERE ARE THE RULES?',

                    value:
                        'Read the **Sacred Laws** in the information section.',

                    inline:
                        false
                },

                {
                    name:
                        '🎫・HOW DO I CONTACT STAFF?',

                    value:
                        'Open a private support ticket for reports, appeals or server issues.',

                    inline:
                        false
                },

                {
                    name:
                        '⚖️・CAN I APPEAL?',

                    value:
                        [
                            '**Yes.** Use the Ticket System and explain what happened.',
                            '',
                            '-# Appeals do not guarantee removal of a punishment.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🌙・WHO IS EVELYNN?',

                    value:
                        `**Evelynn** is the Moon Spirit and companion of **${brand.serverName}**.`,

                    inline:
                        false
                },

                {
                    name:
                        '🛡️・WHY WAS MY MESSAGE REMOVED?',

                    value:
                        'Evelynn may automatically remove prohibited language, spam, invites, malicious links or filter bypass attempts.',

                    inline:
                        false
                },

                {
                    name:
                        '⚔️・ARE EXPLOITS ALLOWED?',

                    value:
                        '**No.** Scripts, exploits, cheats and unfair tools are forbidden.',

                    inline:
                        false
                },

                {
                    name:
                        '◆・HOW DO I PROGRESS?',

                    value:
                        [
                            'Stay active to earn Levels, Achievements, Titles and Soul Progression roles.',
                            '',
                            'Numbered **Captain Ranks** are earned separately through the official **Captain Trials**.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '✦・STILL NEED HELP?',

                    value:
                        'For private or moderation-related matters, open a support ticket.',

                    inline:
                        false
                }
            ],

            author: {
                name:
                    `${brand.botName} • ${brand.serverName}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${brand.serverName} • FAQ`,

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
        embeds: [
            faqEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ FAQ Published',
                `The FAQ was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `FAQ published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    FAQ_EMBED_COLOR,
    publishFAQ
};