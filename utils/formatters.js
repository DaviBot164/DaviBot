function formatTimestamp(timestamp) {
    return `<t:${Math.floor(timestamp / 1000)}:F>`;
}

module.exports = {
    formatTimestamp
};