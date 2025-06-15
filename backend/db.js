const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,        // Baca dari process.env.DB_USER
    host: process.env.DB_HOST,        // Baca dari process.env.DB_HOST
    database: process.env.DB_NAME,    // Baca dari process.env.DB_NAME
    password: process.env.DB_PASSWORD,// Baca dari process.env.DB_PASSWORD
    port: process.env.DB_PORT,        // Baca dari process.env.DB_PORT
});

module.exports = pool;