const TITLES = Object.freeze({
    moon_touched: {
        id: 'moon_touched',
        name: 'Moon-Touched',
        description:
            'A soul first noticed by the Blood Moon.',
        requirement: {
            type: 'achievement_rank',
            value: 'moonbound'
        }
    },

    crimson_soul: {
        id: 'crimson_soul',
        name: 'Crimson Soul',
        description:
            'A soul marked by crimson resolve.',
        requirement: {
            type: 'achievement_count',
            value: 3
        }
    },

    blood_walker: {
        id: 'blood_walker',
        name: 'Blood Walker',
        description:
            'One who walks fearlessly beneath the Blood Moon.',
        requirement: {
            type: 'achievement_count',
            value: 5
        }
    },

    nightborn: {
        id: 'nightborn',
        name: 'Nightborn',
        description:
            'A warrior shaped by the darkness of night.',
        requirement: {
            type: 'achievement_count',
            value: 7
        }
    },

    moon_reaver: {
        id: 'moon_reaver',
        name: 'Moon Reaver',
        description:
            'A warrior who conquered a prestige Trial.',
        requirement: {
            type: 'prestige_rank'
        }
    },

    eternal_shadow: {
        id: 'eternal_shadow',
        name: 'Eternal Shadow',
        description:
            'A legendary soul who conquered every achievement.',
        requirement: {
            type: 'all_achievements'
        }
    }
});

function getTitle(id) {
    return TITLES[id] ?? null;
}

function getTitles() {
    return Object.values(TITLES);
}

module.exports = {
    TITLES,
    getTitle,
    getTitles
};