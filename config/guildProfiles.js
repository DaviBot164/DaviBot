const brand =
    require('./brand');

const channels =
    require('./channels');

const VELDRATH_GUILD_ID =
    '1528399924218298368';

function freezeRoleEntries(
    entries = []
) {
    return Object.freeze(
        entries.map(
            entry =>
                Object.freeze({
                    ...entry
                })
        )
    );
}

function createProfile(
    profile
) {
    const roles =
        profile.roles ??
        {};

    return Object.freeze({
        ...profile,

        channels:
            Object.freeze({
                ...profile.channels
            }),

        roles:
            Object.freeze({
                ...roles,

                authority:
                    freezeRoleEntries(
                        roles.authority
                    ),

                combatRanks:
                    Object.freeze([
                        ...(
                            roles.combatRanks ??
                            []
                        )
                    ]),

                progression:
                    Object.freeze([
                        ...(
                            roles.progression ??
                            []
                        )
                    ])
            }),

        assets:
            Object.freeze({
                ...profile.assets
            })
    });
}

const DEFAULT_GUILD_PROFILE =
    createProfile({
        serverName:
            'Community',

        shortName:
            'Community',

        botName:
            'Evelynn',

        botTitle:
            'Guardian',

        rankSystemName:
            'Ranks',

        trialSystemName:
            'Trials',

        themeColor:
            '#5865F2',

        accentColor:
            '#99AAB5',

        motto:
            'A place to connect, grow, and belong.',

        channels:
            {},

        roles: {
            unverifiedName:
                'Newcomer',

            verifiedName:
                'Member',

            authority:
                [],

            combatRanks:
                [],

            progression:
                []
        },

        assets: {
            welcomeBannerName:
                null
        }
    });

const GUILD_PROFILES =
    Object.freeze({
        [VELDRATH_GUILD_ID]:
            createProfile({
                ...brand,

                channels,

                roles: {
                    unverifiedName:
                        'Wanderer',

                    verifiedName:
                        'Oathbound',

                    authority: [
                        {
                            name:
                                '♛・SOVEREIGN',

                            description:
                                'Highest authority'
                        },
                        {
                            name:
                                '🐉・CROWN KEEPER',

                            description:
                                'Evelynn, guardian of the Crown'
                        },
                        {
                            name:
                                '♜・REGENT',

                            description:
                                'Second authority'
                        },
                        {
                            name:
                                '⚜・HIGH COUNCIL',

                            description:
                                'Administration'
                        },
                        {
                            name:
                                '🛡・ROYAL GUARD',

                            description:
                                'Moderation'
                        }
                    ],

                    combatRanks: [
                        'Ø・DRAGON KNIGHT',
                        'I・DRAGON KNIGHT',
                        'II・DRAGON KNIGHT',
                        'III・DRAGON KNIGHT',
                        'IV・DRAGON KNIGHT',
                        'V・DRAGON KNIGHT',
                        'VI・DRAGON KNIGHT',
                        'VII・DRAGON KNIGHT',
                        'VIII・DRAGON KNIGHT',
                        'IX・DRAGON KNIGHT',
                        'X・DRAGON KNIGHT'
                    ],

                    progression: [
                        '✦・ETERNAL FLAME',
                        '♔・DRAGONLORD',
                        '☾・DRAGON ASCENDANT',
                        '◇・DRAKEBORN',
                        '✧・SCALEBOUND'
                    ]
                },

                assets: {
                    welcomeBannerName:
                        'welcome-banner.gif'
                }
            })
    });

function getGuildProfile(
    guildId
) {
    return (
        GUILD_PROFILES[guildId] ??
        DEFAULT_GUILD_PROFILE
    );
}

module.exports = {
    DEFAULT_GUILD_PROFILE,
    getGuildProfile
};