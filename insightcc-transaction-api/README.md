# Insight Data Engineering Coding Challenge: Transactions at the Bank

## Table of Contents

1. [Problem](#problem)
2. [Solution Overview](#solution-overview)
3. [Deployment](#deployment)

## Problem

This is David Lee's solution to Insight Data Engineering Fellowship's [Transactions at the Bank](https://github.com/Samariya57/coding_challenges/blob/master/transactions.md) coding challenge. The task is described as follows:

> Implement the `/transfer` API which transfers X amount of money from account A to account B.

The coding challenge imposes various constraints, including that the solution be implemented using [Node.js](https://nodejs.org/en/) Javascript Runtime.

## Solution Overview

There are two MySQL tables: `transactions` and `balances`.

Transactions | Balances
:----: | :----:
reference (_unique_)<br>amount<br>account nr | account nr (_unique_)<br>balance

### Atomicity imperative

Given an API call to transfer `amount` from one account `from` from another `to`, a transaction has six components:

1. Ensure the `from` account has at least `amount` in `balance`
2. Update the above's `balance` by subtracting the `amount`
3. Insert a row in `transactions` to record a debit of `amount` for the `from` account
4. Insert a **second** row in `transactions` to record a credit of `amount` for the `to` account
5. Update the `to` account's `balance` by adding the `amount`
6. Report the final balances of the two accounts

It is imperative to ensure the **atomicity** of the above transaction. That is, either all components of a single transaction succeed or fail, and the software logic must prevent any and all in-between end states. The most straight-forward approach would lock both tables, carry out the transaction, and unlock them; however, this limits the API's throughput.

### Concurrency to balance atomicity and high availability

One should not need to lock the whole database to carry out a single transaction. Indeed, [MySQL allows row-specific locking](https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-reads.html) with `SELECT ... FOR UPDATE`. This way, a transaction between accounts A and B and between C and D can take place simultaneously. To enable this from Node.js's side, the queries are carried out using a **Promise** construct (See [this Medium post](https://medium.com/platformer-blog/node-js-concurrency-with-async-await-and-promises-b4c4ae8f4510) for an introduction on Node.js Promises).

However, this is not sufficient, as this could cause circular locks on your rows/tables. [Karl Düüna's Medium post](https://blog.nodeswat.com/concurrency-mysql-and-node-js-a-journey-of-discovery-31281e53572e) explains why and how this happens, and demonstrates a way to automatically rollback failed transactions. His solution is adapted in `src/database.js`.

## Deployment

You need Node.js and MySQL. To deploy, clone this repository and run the following commands (with your MySQL credentials):

```bash
echo "create database `insightcc`" | mysql -u username -p
mysql -u username -p password insightcc < ./src/init.sql
npm install
```

Before starting the API, create a file named .env with the following information (again, with your MySQL credentials):

```node.js
DB_HOST=localhost
DB_USER=username
DB_PASS=password
DB_NAME=insightcc
PORT=8080
```

Finally, start the API:
```bash
npm run start
```
