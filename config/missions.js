const DAY = 86_400_000;
const STREAK_BONUSES = Object.freeze({3:25,7:50,14:75,30:100});
function streakInfo(value) {
    const streak = Number(value);
    if (!Number.isSafeInteger(streak) || streak < 1) throw new Error('Invalid daily streak.');
    const day = (streak - 1) % 30 + 1;
    const next = [3,7,14,30].find(n => n > day) ?? 33;
    return {
        day, base: Math.min(200, 50 + (streak - 1) * 25),
        bonus: STREAK_BONUSES[day] ?? 0,
        nextIn: next - day,
        nextBonus: STREAK_BONUSES[next === 33 ? 3 : next]
    };
}
const QUESTS = Object.freeze({
    active_soul: Object.freeze({name:'Signal Boost',required:15,reward:75}),
    dedicated_warrior: Object.freeze({name:'After Hours',required:30,reward:125}),
    blood_moon_devotion: Object.freeze({name:'Daily Drop',required:1,reward:50})
});
const THEMES = Object.freeze([
    ['Neon Nights','Signal Boost','After Hours','Daily Drop','A little activity. A little discipline. Try to make it look effortless.'],
    ['Midnight Circuit','First Contact','Night Shift','Supply Run','The board is open. Leave the excuses outside.'],
    ['Foxfire Dispatch','Spark Starter','Keep It Burning','Foxfire Drop','Three assignments. I expect a more impressive finish than entrance.'],
    ['Moonlight Protocol','Open Channel','Full Frequency','Check In','Clear the board at your own pace. Good timing beats empty noise.']
]);
function themeFor(cycleId) {
    let hash=0;for(const char of String(cycleId))hash=(hash*31+char.charCodeAt(0))>>>0;
    const row=THEMES[hash%THEMES.length];
    return {name:row[0],names:{active_soul:row[1],dedicated_warrior:row[2],blood_moon_devotion:row[3]},quote:row[4]};
}
const BOARD_BONUS=50;
module.exports={DAY,STREAK_BONUSES,streakInfo,QUESTS,themeFor,BOARD_BONUS};
