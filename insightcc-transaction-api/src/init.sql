/*
This MySQL script creates a data model to support the application programming interface (API)
that fulfills the requirements of "Insight Coding Challenge: Transactions at the Bank"
(https://github.com/Samariya57/coding_challenges/blob/master/transactions.md)

Note: in accordance with Generally Accepted Accounting Principles (GAAP) rules,
monetary columns must have at least 4 decimal places to ensure that the rounding value 
does not exceed $0.01 (Source: http://www.mysqltutorial.org/mysql-decimal/).

David Lee, Insight Data Engineering Fellow, New York City, 2019
*/

USE insightcc;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS balances;

-- Create the balances and transactions tables as specified in the coding challenge
CREATE TABLE balances (
	account_nr INTEGER UNSIGNED NOT NULL,
	balance NUMERIC(13,4) DEFAULT 0 NOT NULL,
  PRIMARY KEY (account_nr)
) ENGINE=INNODB;

CREATE TABLE transactions (
  reference int(10) unsigned NOT NULL AUTO_INCREMENT,
  amount decimal(13,4) NOT NULL,
  account_nr int(10) unsigned NOT NULL,
  PRIMARY KEY (reference),
  FOREIGN KEY (account_nr) REFERENCES balances(account_nr)
) ENGINE=INNODB;

-- Throw an exception if someone attempts to set a negative balance via UPDATE or INSERT
DELIMITER //
CREATE TRIGGER trigger_prevent_negative_balances_update BEFORE UPDATE on balances 
FOR EACH ROW BEGIN
  DECLARE msg VARCHAR(128);
  IF new.balance < 0 THEN
      SET msg = concat('Error: you cannot set a negative balance. Account number: ', CAST(new.account_nr AS CHAR));
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
  END IF;
END //

CREATE TRIGGER trigger_prevent_negative_balances_insert BEFORE INSERT on balances 
FOR EACH ROW BEGIN
  DECLARE msg VARCHAR(128);
  IF new.balance < 0 THEN
      SET msg = concat('Error: you cannot set a negative balance. Account number: ', CAST(new.account_nr AS CHAR));
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
  END IF;
END //
delimiter ;

-- Add initial sample data for development & testing
INSERT INTO balances (account_nr, balance) VALUES(1, 9500.00);
INSERT INTO balances (account_nr, balance) VALUES(2, 10500.00);
INSERT INTO balances (account_nr, balance) VALUES(3, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(4, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(5, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(6, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(7, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(8, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(9, 10000.00);
INSERT INTO balances (account_nr, balance) VALUES(10, 10000.00);

INSERT INTO transactions (amount, account_nr) VALUES(-500.0000, 1);
INSERT INTO transactions (amount, account_nr) VALUES(500.0000, 2);
