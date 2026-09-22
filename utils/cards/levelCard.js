const {
    createCanvas,
    loadImage
} = require('@napi-rs/canvas');

const WIDTH = 1000;
const HEIGHT = 320;

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
}

async function createLevelCard(member, level) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    const background = ctx.createLinearGradient(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    background.addColorStop(0, '#09090B');
    background.addColorStop(0.55, '#171014');
    background.addColorStop(1, '#310B12');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.arc(850, 55, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    roundRect(ctx, 30, 30, 940, 260, 28);

    const avatar = await loadImage(
        member.user.displayAvatarURL({
            extension: 'png',
            size: 256
        })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(165, 160, 92, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
        avatar,
        73,
        68,
        184,
        184
    );

    ctx.restore();

    ctx.strokeStyle = '#C8A45D';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(165, 160, 95, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#C8A45D';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(
        'BLOOD MOON • AKANE',
        305,
        82
    );

    ctx.fillStyle = '#F5F5F5';
    ctx.font = '700 42px sans-serif';

    const name =
        member.displayName.length > 20
            ? `${member.displayName.slice(0, 20)}…`
            : member.displayName;

    ctx.fillText(
        name,
        305,
        137
    );

    ctx.fillStyle = '#B8B8B8';
    ctx.font = '500 20px sans-serif';
    ctx.fillText(
        'SOUL ASCENDED',
        307,
        175
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 54px sans-serif';
    ctx.fillText(
        `LEVEL ${level}`,
        305,
        238
    );

    ctx.fillStyle = '#C8A45D';
    ctx.fillRect(
        305,
        258,
        500,
        3
    );

    ctx.fillStyle = '#8F8F8F';
    ctx.font = '400 17px sans-serif';
    ctx.fillText(
        'Your soul grows stronger beneath the Blood Moon.',
        305,
        285
    );

    return canvas.toBuffer('image/png');
}

module.exports = {
    createLevelCard
};