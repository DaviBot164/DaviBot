const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const setupChannels =
    require('../../config/setupChannels');

/**
 * Get and validate the main
 * Las Noches Information channel.
 *
 * Royal Laws, Server Guide,
 * Role Information and FAQ are
 * published inside this channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getInformationChannel(
    interaction
) {
    const informationChannel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .informationChannelId
            )
            .catch(
                () => null
            );

    if (
        !informationChannel ||
        !informationChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Kingdom Archive Missing',
                    [
                        'Umbra could not find the configured Las Noches Information channel.',
                        '',
                        `Configured Channel ID: \`${setupChannels.informationChannelId}\``
                    ].join('\n')
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
                    '❌ Umbra Unavailable',
                    'Umbra could not access its Las Noches member record.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const channelPermissions =
        informationChannel.permissionsFor(
            botMember
        );

    if (
        !channelPermissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Umbra Permissions',
                    [
                        `Umbra cannot publish the Royal Laws in ${informationChannel}.`,
                        '',
                        'Required permissions:',
                        '• **View Channel**',
                        '• **Send Messages**',
                        '• **Embed Links**'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return null;
    }

    return informationChannel;
}

/**
 * Publish the Royal Laws of Las Noches
 * inside the main Information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishSacredLaws(
    interaction
) {
    const informationChannel =
        await getInformationChannel(
            interaction
        );

    if (!informationChannel) {
        return;
    }

    const rulesEmbed =
        createEmbed({
            title:
                '📜 Royal Laws of Las Noches',

            description:
                [
                    '## Welcome to the kingdom of eternal night.',
                    '',
                    'Every **Soul** who enters **Las Noches** is expected to respect its laws, its people, and its authority.',
                    '',
                    'These decrees preserve order, fairness, safety, and unity throughout the kingdom.'
                ].join('\n'),

            color:
                '#6F42C1',

            thumbnail:
                interaction.guild.iconURL({
                    size:
                        512,

                    forceStatic:
                        false
                }) ??
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            512,

                        forceStatic:
                            false
                    }),

            fields: [
                {
                    name:
                        '╭・⚖️ I — HONOR EVERY SOUL',

                    value:
                        [
                            'Every member of Las Noches must be treated with dignity.',
                            '',
                            '• No harassment or targeted bullying',
                            '• No hate speech or discrimination',
                            '• No personal attacks or humiliation',
                            '• No excessive toxicity',
                            '• No deliberate attempts to provoke conflict',
                            '',
                            '> Strength without respect has no place in Las Noches.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚔️ II — FORBIDDEN ARTS',

                    value:
                        [
                            'All Souls must compete and play fairly.',
                            '',
                            '• No scripting',
                            '• No exploiting',
                            '• No cheating',
                            '• No unauthorized third-party tools',
                            '• No abusing glitches against other players',
                            '• No assisting others in unfair gameplay',
                            '',
                            '**The use of forbidden techniques may result in immediate and permanent exile from Las Noches.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・💬 III — DISCIPLINE OF SPEECH',

                    value:
                        [
                            'Communication within the kingdom must remain safe, readable, and appropriate.',
                            '',
                            '• No spam or message flooding',
                            '• No NSFW or disturbing content',
                            '• No scam, phishing, or malicious links',
                            '• No unauthorized advertising',
                            '• No excessive mentions',
                            '• Use every channel for its intended purpose',
                            '',
                            '-# Umbra may automatically remove messages that violate these protections.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🛡️ IV — AUTHORITY OF LAS NOCHES',

                    value:
                        [
                            'The judgement of Las Noches authorities must be respected.',
                            '',
                            '• Do not insult or harass staff members',
                            '• Do not evade warnings, timeouts, kicks, or bans',
                            '• Do not create public arguments about punishments',
                            '• Use the ticket system for appeals or questions',
                            '• Provide evidence when disputing a moderation decision',
                            '',
                            'Administrators, Captains, Lieutenants, Espada, and moderators are also required to follow these laws.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });            rulesEmbed.addFields(
                {
                    name:
                        '├・🎫 V — SEEK ASSISTANCE WISELY',

                    value:
                        [
                            'Umbra provides a private support system for every Soul.',
                            '',
                            '• Open tickets only when genuine help is needed.',
                            '• Do not create false or joke tickets.',
                            '• Clearly explain your issue.',
                            '• Provide screenshots or evidence whenever possible.',
                            '• Remain patient while awaiting a response.',
                            '',
                            '> Abuse of the ticket system may result in moderation.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🌙 VI — PROTECT THE KINGDOM',

                    value:
                        [
                            'Every Soul shares responsibility for preserving Las Noches.',
                            '',
                            '• Welcome new members.',
                            '• Report serious rule violations.',
                            '• Never expose private information.',
                            '• Do not spread false accusations.',
                            '• Help maintain a respectful community.',
                            '',
                            '> A kingdom stands because its Souls stand together.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚖️ JUDGEMENT OF UMBRA',

                    value:
                        [
                            'Umbra and the Las Noches staff enforce these laws according to the severity of each violation.',
                            '',
                            '⚠️ Warning',
                            '🔇 Timeout',
                            '👢 Kick',
                            '🔨 Temporary Ban',
                            '⛔ Permanent Exile',
                            '',
                            'Severe violations may receive immediate punishment without previous warnings.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '╰・📜 FINAL ROYAL DECREE',

                    value:
                        [
                            'By remaining within **Las Noches**, every Soul accepts these Royal Laws.',
                            '',
                            'Honor the kingdom.',
                            'Respect your fellow Souls.',
                            'Grow stronger through discipline.',
                            '',
                            '> **Only those worthy shall stand beneath the eternal night.**'
                        ].join('\n'),

                    inline:
                        false
                }
            );

    rulesEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    rulesEmbed.setFooter({
        text:
            'Las Noches • Royal Laws',

        iconURL:
            interaction.guild.iconURL({
                size: 128,
                forceStatic: false
            }) ??
            interaction.client.user.displayAvatarURL({
                size: 128,
                forceStatic: false
            })
    });

    rulesEmbed.setTimestamp();

    await informationChannel.send({
        embeds: [
            rulesEmbed
        ],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Royal Laws Published',
                `Umbra successfully published the Royal Laws in ${informationChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📜 Royal Laws Published'
    );

    console.log(
        `📍 Channel: ${informationChannel.name}`
    );

    console.log(
        `🛡️ Published By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Kingdom: ${interaction.guild.name}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    publishSacredLaws
};