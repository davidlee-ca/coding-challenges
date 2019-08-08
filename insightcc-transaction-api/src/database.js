/*
This Node.js script implements the MySQL query architecture to fulfill the high-concurrency requirement 
for the application programming interface (API), which was developed in response to 
"Insight Coding Challenge: Transactions at the Bank"
(https://github.com/Samariya57/coding_challenges/blob/master/transactions.md)

For a detailed discussion on the code's rationale, please refer to Karl Düüna's blog post 
"Concurrency, MySQL and Node.js: A journey of discovery" (February 6, 2018).
(https://blog.nodeswat.com/concurrency-mysql-and-node-js-a-journey-of-discovery-31281e53572e)

David Lee, Insight Data Engineering Fellow, New York City, 2019
*/

module.exports.query = query;
var mysql = require('mysql');

// Fetch the configuration parameters for the MySQL connection
require('dotenv').config();

// Connect to MySQL
var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database : process.env.DB_NAME,
    multipleStatements: true
});

connection.connect(function(err){
    if(!err) {
        console.log("MySQL is connected.");    
    } else {
        console.log("Error connecting MySQL database.");    
    }
});

// MySQL query wrapper to correctly handle rollbacks in a highly concurrent use case 
function query(input) {
    const _defaults = {
        params: []
    };
    const {sql, params, autorollback} = Object.assign(_defaults, input);
  
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, resp) => {
            if(err && autorollback) {
                return resolve(rollback(err));
            }
            else if (err) {
                return reject(err);
            }
        resolve(resp);
        });
    });
}
  
function rollback(err) {
    return new Promise((resolve, reject) => {
        connection.query('ROLLBACK;', [], (rollbackErr) => {
            if(rollbackErr) {
                // Fall back to torching the connection
                connection.destroy();  
                console.error(rollbackErr);
            }
        reject(err);
        });
    });
}
