const brand =
    require('./brand');

module.exports = {
    colors: {
        primary:
            brand.themeColor,

        accent:
            '#9B6DFF',

        success:
            '#57F287',

        error:
            '#ED4245',

        warning:
            '#E7C66A',

        moderation:
            '#E53945',

        archive:
            '#AFC6E9',

        rank:
            '#E7C66A',

        title:
            '#9B6DFF',

        guardian:
            '#6C7CFF',

        event:
            '#75A7E8',

        support:
            '#2FBF8F'
    },

    footer: {
        text:
            `☾ ${brand.botName} • ${brand.serverName}`
    },

    branding: {
        botName:
            brand.botName,

        serverName:
            brand.serverName,

        subtitle:
            `${brand.botTitle} of ${brand.shortName}`,

        archiveName:
            'Lunar Archives',

        divider:
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    }
};