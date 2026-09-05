const brand =
    require('./brand');

const channels =
    require('./channels');

const VELDRATH_GUILD_ID =
    '1528399924218298368';

function createProfile(
    profile
) {
    return Object.freeze({
        ...profile,

        channels:
            Object.freeze({
                ...profile.channels
            }),

        roles:
            Object.freeze({
                ...profile.roles
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
                'Member'
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
                        'Oathbound'
                },

                assets: {
                    welcomeBannerName:
                        'welcome-banner.png'
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