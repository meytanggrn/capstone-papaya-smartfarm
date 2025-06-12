// const { Pool } = require('pg');
// const pool = new Pool({
  
//   connectionString: process.env.DATABASE_URL,
// });
// module.exports = pool;


const { Pool } = require('pg');
const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'papayasmart',
    password: 'papayaadm',
    port: 5432
});
module.exports = pool;