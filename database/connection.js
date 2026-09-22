const { Pool } = require('pg');

const pool = new Pool({
    connectionString:
        process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
});

function query(text, params) {
    return pool.query(text, params);
}

async function testConnection() {
    await pool.query('SELECT 1');
}

async function closeConnection() {
    await pool.end();
}

module.exports = {
    query,
    testConnection,
    closeConnection
};