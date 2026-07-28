const {
    Pool
} = require('pg');

/**
 * Northflank PostgreSQL connection string.
 *
 * The Addon currently exposes:
 * NF_DAVIBOT_DATABASE_POSTGRES_URI
 */
const databaseUrl =
    process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI ||
    process.env.DATABASE_URL;

/**
 * Detect whether the database connection
 * comes from the Northflank PostgreSQL Addon.
 */
const isNorthflank =
    Boolean(
        process.env
            .NF_DAVIBOT_DATABASE_POSTGRES_URI
    );

let pool = null;

/**
 * Create and return the PostgreSQL connection pool.
 *
 * @returns {Pool|null}
 */
function getPool() {
    if (!databaseUrl) {
        return null;
    }

    if (!pool) {
        pool = new Pool({
            connectionString:
                databaseUrl,

            /*
             * Northflank PostgreSQL connections
             * require TLS.
             */
            ssl:
                isNorthflank
                    ? {
                        rejectUnauthorized:
                            false
                    }
                    : undefined,

            max:
                10,

            idleTimeoutMillis:
                30_000,

            connectionTimeoutMillis:
                10_000
        });

        pool.on(
            'error',
            error => {
                console.error(
                    '❌ Unexpected PostgreSQL pool error:'
                );

                console.error(
                    error
                );
            }
        );
    }

    return pool;
}

/**
 * Execute a PostgreSQL query.
 *
 * @param {string} text
 * @param {Array} params
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(
    text,
    params = []
) {
    const databasePool =
        getPool();

    if (!databasePool) {
        throw new Error(
            [
                'PostgreSQL connection is not configured.',
                '',
                'Expected one of these environment variables:',
                'NF_DAVIBOT_DATABASE_POSTGRES_URI',
                'DATABASE_URL'
            ].join('\n')
        );
    }

    return databasePool.query(
        text,
        params
    );
}

/**
 * Test the PostgreSQL connection.
 *
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    const databasePool =
        getPool();

    if (!databasePool) {
        return false;
    }

    const client =
        await databasePool.connect();

    try {
        await client.query(
            'SELECT NOW();'
        );

        return true;
    } finally {
        client.release();
    }
}

/**
 * Close all PostgreSQL connections.
 *
 * @returns {Promise<void>}
 */
async function closeConnection() {
    if (!pool) {
        return;
    }

    await pool.end();

    pool = null;
}

module.exports = {
    getPool,
    query,
    testConnection,
    closeConnection
};