const {
    createCanvas,
    loadImage
} = require('@napi-rs/canvas');

const WIDTH = 1000;
const HEIGHT = 320;

const ACCENT = '#C8A45D';

function fitText(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize
) {
    let size = startSize;

    while (size > minSize) {
        ctx.font =
            `700 ${size}px sans-serif`;

        if (
            ctx.measureText(text).width <=
            maxWidth
        ) {
            break;
        }

        size -= 2;
    }

    return size;
}

async function createAchievementCard(
    member,
    achievement
) {
    const canvas = createCanvas(
        WIDTH,
        HEIGHT
    );

    const ctx =
        canvas.getContext('2d');

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        '#08090B'
    );

    gradient.addColorStop(
        0.55,
        '#121013'
    );

    gradient.addColorStop(
        1,
        '#350A12'
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ctx.globalAlpha = 0.14;
    ctx.fillStyle = ACCENT;

    ctx.beginPath();

    ctx.arc(
        850,
        55,
        150,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.fillStyle =
        'rgba(0, 0, 0, 0.30)';

    ctx.beginPath();

    ctx.roundRect(
        30,
        30,
        940,
        260,
        28
    );

    ctx.fill();

    const avatar =
        await loadImage(
            member.user.displayAvatarURL({
                extension: 'png',
                size: 256
            })
        );

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        165,
        160,
        92,
        0,
        Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
        avatar,
        73,
        68,
        184,
        184
    );

    ctx.restore();

    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
        165,
        160,
        95,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle = ACCENT;
    ctx.font =
        '600 22px sans-serif';

    ctx.fillText(
        'ACHIEVEMENT UNLOCKED',
        305,
        82
    );

    const name =
        member.displayName.length > 20
            ? `${member.displayName.slice(
                0,
                20
            )}…`
            : member.displayName;

    ctx.fillStyle = '#F5F5F5';
    ctx.font =
        '700 38px sans-serif';

    ctx.fillText(
        name,
        305,
        132
    );

    const achievementName =
        achievement.name.toUpperCase();

    const titleSize =
        fitText(
            ctx,
            achievementName,
            610,
            46,
            30
        );

    ctx.fillStyle = '#FFFFFF';
    ctx.font =
        `700 ${titleSize}px sans-serif`;

    ctx.fillText(
        achievementName,
        305,
        205
    );

    ctx.fillStyle = ACCENT;
    ctx.font =
        '600 20px sans-serif';

    ctx.fillText(
        `+${achievement.points} ACHIEVEMENT POINTS`,
        307,
        240
    );

    ctx.fillRect(
        305,
        255,
        500,
        3
    );

    ctx.fillStyle = '#96969C';
    ctx.font =
        '400 16px sans-serif';

    const description =
        achievement.description.length > 65
            ? `${achievement.description.slice(
                0,
                65
            )}…`
            : achievement.description;

    ctx.fillText(
        description,
        305,
        283
    );

    return canvas.toBuffer(
        'image/png'
    );
}

module.exports = {
    createAchievementCard
};