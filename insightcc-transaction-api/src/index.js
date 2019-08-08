/*
This Node.js script implements the application programming interface (API)
that fulfills the requirements of "Insight Coding Challenge: Transactions at the Bank"
(https://github.com/Samariya57/coding_challenges/blob/master/transactions.md)

See also: database.js on how MySQL connections are managed.

David Lee, Insight Data Engineering Fellow, New York City, 2019
*/

const express = require('express');
const {query} = require('./database');
require('dotenv').config();

const app = express();

// Start the transfer API
app.post('/transfer', (req, res) => {

    var my_from_account = req.query.from;
    var my_to_account = req.query.to;
    var my_amount = req.query.money;

    // Validate user input before querying the database 
    if (isNaN(Number(my_from_account)) || isNaN(Number(my_to_account)) || isNaN(Number(my_amount))) {
        console.log(`Bad request entered: ${my_from_account}, ${my_to_account}, ${my_amount}`);
        res.status(400).send({
            success: 'false',
            error_message: 'Invalid data entered. Please provide originating and destination account numbers and the transfer amounts, which must be in numeric.'
        });
        return -1;
    }

    if (Number(my_amount) <= 0) {
        console.log(`Bad request entered: ${my_amount} is less than 0`);
        res.status(400).send({
            success: 'false',
            error_message: 'The transfer amount must be greater than 0.'
        });
        return -1;
    }

    if (my_from_account == my_to_account) {
        console.log(`Bad request entered: ${my_from_account} and ${my_to_account} are the same accounts`);
        res.status(400).send({
            success: 'false',
            error_message: 'The destination account must differ from the originating account.'
        });
        return -1;
    }

    var sql = `
    START TRANSACTION;
    SELECT @balance_from := balance FROM balances WHERE account_nr = ${my_from_account} FOR UPDATE;
    INSERT INTO transactions (account_nr, amount) VALUES (${my_from_account}, ${-1 * my_amount});
    UPDATE balances SET balance = @balance_from - ${my_amount} WHERE account_nr = ${my_from_account};
    SELECT @balance_to := balance FROM balances WHERE account_nr = ${my_to_account} FOR UPDATE;
    INSERT INTO transactions (account_nr, amount) VALUES (${my_to_account}, ${my_amount});
    UPDATE balances SET balance = @balance_to + ${my_amount} WHERE account_nr = ${my_to_account};
    SELECT balance FROM balances WHERE account_nr = ${my_from_account};
    SELECT balance FROM balances WHERE account_nr = ${my_to_account};
    COMMIT;    `;

    query({sql})
    .then(result => {
        var new_from_balance = result[result.length - 3][0].balance;
        var new_to_balance = result[result.length - 2][0].balance;
        res.status(200).send({
            success: 'true',
            id: result[result.length - 5].insertId, 
            from: {
                id: parseInt(my_from_account), 
                balance: new_from_balance 
            },
            to: {
                id: parseInt(my_to_account),
                balance: new_to_balance
            },
            transfered: parseFloat(my_amount)  // [sic]; see the coding challenge's specification, requirement #4
        })
    })
    .catch(err => {
        var my_error_message = '';
        
        if (err.sqlState == '45000') {  
            // User-defined exception thrown by the trigger designed to prevent negative balances
            my_error_message = 'Transaction failed due to insufficient funds.';
            console.error(`Business logic error: ${my_error_message}`);
            res.status(400).send({
                success: 'false',
                error_message: my_error_message
            });
        } else if (err.sqlState == '23000') {
            // Integrity constraint violation, thrown by SELECT ... FOR UPDATE if a specified account isn't found
            my_error_message = 'Either one or both of the accounts do not exist.';
            console.error(`Business logic error: ${my_error_message}`);
            res.status(400).send({
                success: 'false',
                error_message: my_error_message
            });
        } else {
            // Unhandled exception -- throw a HTTP 500 Internal Server Error
            console.error('Unexpected failure', err);
            res.status(500).send();
        }
    });
});

const PORT = process.env.PORT; 
app.listen(PORT, () => {
    console.log(`Server is now running on port ${PORT}.`)
    });
