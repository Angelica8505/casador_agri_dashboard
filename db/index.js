   const mysql = require('mysql2/promise');

   const pool = mysql.createPool({
     host: 'localhost',
     user: 'root', 
     password: '', 
     database: 'casador_agri_market',
     waitForConnections: true,
     connectionLimit: 10,
   });

   const dbConfig = {
       host: 'localhost',
       user: 'root',
       password: '',
       database: 'casador_agri_market'
   };

   module.exports = pool;
   