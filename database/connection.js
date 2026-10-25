const { Pool } = require('pg');

const {connectionOptions}=require('./connectionOptions');
const pool = new Pool(connectionOptions());

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
    pool,
    query,
    testConnection,
    closeConnection
};
