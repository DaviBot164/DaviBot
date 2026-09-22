const roles = require('./roles');

const ACHIEVEMENTS = Object.freeze({
    first_blood: {
        id: 'first_blood',
        name: 'First Blood',
        description:
            'Send your first message beneath the Blood Moon.',
        points: 10,
        requirement: {
            type: 'messages',
            value: 1
        }
    },

    awakened: {
        id: 'awakened',
        name: 'Awakened',
        description:
            'Reach level 5.',
        points: 15,
        requirement: {
            type: 'level',
            value: 5
        }
    },

    moon_walker: {
        id: 'moon_walker',
        name: 'Moon Walker',
        description:
            'Reach level 10.',
        points: 20,
        requirement: {
            type: 'level',
            value: 10
        }
    },

    hundred_souls: {
        id: 'hundred_souls',
        name: 'Hundred Souls',
        description:
            'Send 100 messages.',
        points: 20,
        requirement: {
            type: 'messages',
            value: 100
        }
    },

    path_chosen: {
        id: 'path_chosen',
        name: 'Path Chosen',
        description:
            'Choose the path of a Slayer or Demon.',
        points: 20,
        requirement: {
            type: 'faction'
        }
    },

    blood_veteran: {
        id: 'blood_veteran',
        name: 'Blood Veteran',
        description:
            'Reach level 25.',
        points: 30,
        requirement: {
            type: 'level',
            value: 25
        }
    },

    voice_of_the_moon: {
        id: 'voice_of_the_moon',
        name: 'Voice of the Moon',
        description:
            'Send 500 messages.',
        points: 35,
        requirement: {
            type: 'messages',
            value: 500
        }
    },

    nightborn: {
        id: 'nightborn',
        name: 'Nightborn',
        description:
            'Reach level 50.',
        points: 50,
        requirement: {
            type: 'level',
            value: 50
        }
    },

    thousand_echoes: {
        id: 'thousand_echoes',
        name: 'Thousand Echoes',
        description:
            'Send 1,000 messages.',
        points: 50,
        requirement: {
            type: 'messages',
            value: 1000
        }
    },

    trial_victor: {
        id: 'trial_victor',
        name: 'Trial Victor',
        description:
            'Earn a prestige rank through a Trial.',
        points: 75,
        requirement: {
            type: 'prestige_rank'
        }
    },

    eternal_echo: {
        id: 'eternal_echo',
        name: 'Eternal Echo',
        description:
            'Send 5,000 messages.',
        points: 100,
        requirement: {
            type: 'messages',
            value: 5000
        }
    }
});

const ACHIEVEMENT_RANKS = Object.freeze([
    {
        id: 'moonbound',
        name: 'Moonbound',
        points: 10,
        roleId: roles.moonbound
    },
    {
        id: 'crimson_bloom',
        name: 'Crimson Bloom',
        points: 50,
        roleId: roles.crimsonBloom
    },
    {
        id: 'bloodbound',
        name: 'Bloodbound',
        points: 125,
        roleId: roles.bloodbound
    },
    {
        id: 'night_ascendant',
        name: 'Night Ascendant',
        points: 250,
        roleId: roles.nightAscendant
    },
    {
        id: 'eternal_moon',
        name: 'Eternal Moon',
        points: 400,
        roleId: roles.eternalMoon
    }
]);

function getAchievement(id) {
    return ACHIEVEMENTS[id] ?? null;
}

function getAchievements() {
    return Object.values(ACHIEVEMENTS);
}

function meetsRequirement(
    achievement,
    user
) {
    if (!achievement || !user) {
        return false;
    }

    const requirement =
        achievement.requirement;

    switch (requirement.type) {
        case 'messages':
            return user.messages >=
                requirement.value;

        case 'level':
            return user.level >=
                requirement.value;

        case 'faction':
            return Boolean(user.faction);

        case 'prestige_rank':
            return (
                user.rank === 'hashira' ||
                user.rank === 'upper_moon'
            );

        default:
            return false;
    }
}

function getAchievementRank(points) {
    return ACHIEVEMENT_RANKS
        .filter(rank => points >= rank.points)
        .at(-1) ?? null;
}

module.exports = {
    ACHIEVEMENTS,
    ACHIEVEMENT_RANKS,
    getAchievement,
    getAchievements,
    meetsRequirement,
    getAchievementRank
};