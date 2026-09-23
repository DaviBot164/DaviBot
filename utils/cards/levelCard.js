const {
    createCanvas,
    loadImage
} = require('@napi-rs/canvas');

const brand =
    require('../../config/brand');

const WIDTH = 1000;
const HEIGHT = 320;

function fillRoundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {
    ctx.beginPath();
    ctx.roundRect(
        x,
        y,
        width,
        height,
        radius
    );
    ctx.fill();
}

function fitName(
    ctx,
    name,
    maxWidth
) {
    if (
        ctx.measureText(name).width <=
        maxWidth
    ) {
        return name;
    }

    let trimmed = name;

    while (
        trimmed.length > 1 &&
        ctx.measureText(
            `${trimmed}…`
        ).width > maxWidth
    ) {
        trimmed =
            trimmed.slice(0, -1);
    }

    return `${trimmed}…`;
}

async function createLevelCard(
    member,
    level
) {
    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );

    const ctx =
        canvas.getContext('2d');

    const background =
        ctx.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    background.addColorStop(
        0,
        '#08090B'
    );

    background.addColorStop(
        0.55,
        '#151014'
    );

    background.addColorStop(
        1,
        '#350A12'
    );

    ctx.fillStyle =
        background;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    const moonGlow =
        ctx.createRadialGradient(
            860,
            35,
            10,
            860,
            35,
            190
        );

    moonGlow.addColorStop(
        0,
        'rgba(155, 28, 49, 0.35)'
    );

    moonGlow.addColorStop(
        1,
        'rgba(155, 28, 49, 0)'
    );

    ctx.fillStyle =
        moonGlow;

    ctx.fillRect(
        650,
        0,
        350,
        260
    );

    ctx.fillStyle =
        'rgba(0, 0, 0, 0.32)';

    fillRoundRect(
        ctx,
        28,
        28,
        944,
        264,
        28
    );

    ctx.fillStyle =
        '#9B1C31';

    fillRoundRect(
        ctx,
        28,
        28,
        7,
        264,
        4
    );

    const avatar =
        await loadImage(
            member.user
                .displayAvatarURL({
                    extension: 'png',
                    size: 256
                })
        );

    ctx.save();

    ctx.beginPath();
    ctx.arc(
        165,
        160,
        91,
        0,
        Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
        avatar,
        74,
        69,
        182,
        182
    );

    ctx.restore();

    ctx.strokeStyle =
        '#9B1C31';

    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.arc(
        165,
        160,
        96,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle =
        '#C8A45D';

    ctx.font =
        '600 20px sans-serif';

    ctx.fillText(
        `${brand.server.toUpperCase()} • ${brand.name.toUpperCase()}`,
        305,
        77
    );

    ctx.fillStyle =
        '#F5F5F5';

    ctx.font =
        '700 42px sans-serif';

    const displayName =
        fitName(
            ctx,
            member.displayName,
            570
        );

    ctx.fillText(
        displayName,
        305,
        133
    );

    ctx.fillStyle =
        '#A7ADB5';

    ctx.font =
        '600 19px sans-serif';

    ctx.fillText(
        'LEVEL UP',
        307,
        171
    );

    ctx.fillStyle =
        '#FFFFFF';

    ctx.font =
        '700 58px sans-serif';

    ctx.fillText(
        `LEVEL ${level}`,
        305,
        238
    );

    const line =
        ctx.createLinearGradient(
            305,
            0,
            835,
            0
        );

    line.addColorStop(
        0,
        '#9B1C31'
    );

    line.addColorStop(
        1,
        '#C8A45D'
    );

    ctx.fillStyle =
        line;

    ctx.fillRect(
        305,
        258,
        530,
        3
    );

    ctx.fillStyle =
        '#8F949C';

    ctx.font =
        '400 17px sans-serif';

    ctx.fillText(
        'Your activity has earned you a new level.',
        305,
        284
    );

    return canvas.toBuffer(
        'image/png'
    );
}

module.exports = {
    createLevelCard
};