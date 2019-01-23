--
-- tobedeleted
--
DROP TABLE IF EXISTS tobedeleted CASCADE;

CREATE TABLE tobedeleted
(
   account    VARCHAR,
   address  VARCHAR,
   slave_id INTEGER
);

GRANT ALL PRIVILEGES ON tobedeleted TO postgres;


--
-- connections
--
DROP TABLE IF EXISTS connections CASCADE;

CREATE TABLE connections
(
   user_id    VARCHAR,
   slave_id  INTEGER
);

GRANT ALL PRIVILEGES ON connections TO postgres;


--
-- eulaandtcaccepted
--
DROP TABLE IF EXISTS eulaandtcaccepted CASCADE;

CREATE TABLE eulaandtcaccepted
(
   user_id    VARCHAR
);

GRANT ALL PRIVILEGES ON eulaandtcaccepted TO postgres;


--
-- notificationsettings
--
DROP TABLE IF EXISTS notificationsettings CASCADE;

CREATE TABLE notificationsettings
(
   user_id    VARCHAR,
   stake BOOLEAN,
   login BOOLEAN,
   mobil BOOLEAN
);

GRANT ALL PRIVILEGES ON notificationsettings TO postgres;


--
-- runningexporter
--
DROP TABLE IF EXISTS runningexporter CASCADE;

CREATE TABLE runningexporter
(
   slave_id    INTEGER
);

GRANT ALL PRIVILEGES ON runningexporter TO postgres;


--
-- slaves
--
DROP TABLE IF EXISTS slaves CASCADE;

CREATE TABLE slaves
(
   id SERIAL PRIMARY KEY,
   ip VARCHAR,
   password VARCHAR
);

GRANT ALL PRIVILEGES ON slaves TO postgres;


--
-- balances
--
DROP TABLE IF EXISTS balances CASCADE;

CREATE TABLE balances
(
   user_id VARCHAR,
   balance FLOAT,
   emptycount INTEGER

);

GRANT ALL PRIVILEGES ON balances TO postgres;


--
-- dumpedkeys
--
DROP TABLE IF EXISTS dumpedkeys CASCADE;

CREATE TABLE dumpedkeys
(
   user_id VARCHAR,
   privkey VARCHAR

);

GRANT ALL PRIVILEGES ON dumpedkeys TO postgres;

--
-- emailverification
--
DROP TABLE IF EXISTS emailverification CASCADE;

CREATE TABLE emailverification
(
    user_id VARCHAR,
    uuid VARCHAR,
    type VARCHAR,
    ip VARCHAR
);

GRANT ALL PRIVILEGES ON emailverification TO postgres;


--
-- combinedtx
--
DROP TABLE IF EXISTS combinedtx CASCADE;

CREATE TABLE combinedtx
(
    txid VARCHAR,
    address VARCHAR,
    amount FLOAT,
    fee FLOAT
);

GRANT ALL PRIVILEGES ON combinedtx TO postgres;


--
-- slavemaintenance
--
DROP TABLE IF EXISTS slavemaintenance CASCADE;

CREATE TABLE slavemaintenance
(
    slave_id INTEGER
);

GRANT ALL PRIVILEGES ON slavemaintenance TO postgres;


--
-- deletedaccounts
--
DROP TABLE IF EXISTS deletedaccounts CASCADE;

CREATE TABLE deletedaccounts
(
    user_id VARCHAR,
    slave_ip VARCHAR,
    balance FLOAT,
    addresses VARCHAR
);

GRANT ALL PRIVILEGES ON deletedaccounts TO postgres;