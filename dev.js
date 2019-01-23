var request = require('requestretry').defaults({maxAttempts: 50});
var config = require('./config.js');
var path = require('path');
//log4js
var log4js = require('log4js');
log4js.configure(config.log4js);
var logger = log4js.getLogger('DEVWEBWALLET');
//const psList = require('ps-list');
const {Pool} = require('pg');
var speakeasy = require('speakeasy');
var nodemailer = require('nodemailer');
const uuidv4 = require('uuid/v4');

const pool = new Pool({
    user: config.pguser,
    host: config.pghost,
    database: config.pgdb,
    password: config.pgpass,
    port: config.pgport,
})

const poolKey = new Pool({
    user: config.pguser,
    host: config.pghost,
    database: config.pgdbkey,
    password: config.pgpass,
    port: config.pgport,
})


let transporter = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    secure: false,
    auth: {
        user: config.mailUser,
        pass: config.mailPass
    }
});


exports.checkAccount = function (req, res) {
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {
        request({
            url: 'http://' + req.slaveHost + ':' + config.rpcport,
            json: {'method': 'getaddressesbyaccount', 'params': [userid]},
            method: 'POST',
            auth: {user: config.rpcuser, pass: req.slavePass}
        }, function (err, httpResponse, body) {

            //if(err||httpResponse.statusCode!=200){
            //   res.status(500).json({error:'Our coin daemon seems to be offline, please reload the page in a few seconds'});
            //}else{
            if (!body || !body.result) {
                res.redirect(config.poswalletUrl);
            } else {
                if (body.result.length == 0) {
                    checkIfSlaveIsUnderMaintenance(req).then(maintenance => {
                        if (!maintenance) {
                            checkIfExporterIsRunning(req).then(run => {
                                if (!run) {


                                    request({
                                        url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                        json: {'method': 'getnewaddress', 'params': [userid]},
                                        method: 'POST',
                                        auth: {user: config.rpcuser, pass: req.slavePass}
                                    }, function (err, httpResponse, body) {

                                        //  if(err||httpResponse.statusCode!=200){
                                        //  res.status(500).json({error:'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                        // }else{
                                        res.sendFile(path.join(__dirname, './frontend/router.html'))
                                        //  }


                                    });
                                } else {
                                    res.status(200).send({error: 'The export script is currently running, please try again later!'})
                                }
                            })
                        } else {
                            res.status(200).send({error: 'The server you are on is currently under maintenance, please try again later!'})
                        }
                    })


                } else {
                    res.sendFile(path.join(__dirname, './frontend/router.html'))
                }
            }
            // }
        })

    }
}


exports.getDashboard = function (req, res) {
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {
        var txfromExp = [];
        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getaddressesbyaccount', 'params': [userid]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyAddresses) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyAddresses.error.message);
                } else {
                    resolve(bodyAddresses);
                }
            });
        }).then(function (value) {
            var addLength=0;
            //getTransactions(value.result);
            value.result.forEach(function(add){
                if(add.charAt(0)=='L'||add.charAt(0)=='S')
                    addLength++;
            })
            addToDashboard({addresses: addLength});
            /*
                        var loops = 0;
                        var explorerurl = config.explorerurl;
                        var loopsreq = 0;
                        value.result.forEach(function (currAdd, indexAdd, arrayAdd) {

                            reqExplorer();

                            function reqExplorer() {
                                request({
                                    url: explorerurl + 'ext/getaddress/' + currAdd,
                                    method: 'GET',
                                    retryDelay: 500,
                                }, function (err, httpResponse, bodyAdd) {
                                    loops++;
                                    if (bodyAdd && httpResponse.statusCode == 200 && httpResponse.attemps != 10) {
                                        if (!JSON.parse(bodyAdd).error) {
                                            JSON.parse(bodyAdd).last_txs.forEach(function (currTx, indexTx, arrayTx) {
                                                if (currTx.type == 'vin') {
                                                    if (!txfromExp.includes(currTx.addresses)) {
                                                        txfromExp.push(currTx.addresses)
                                                    }
                                                    if (arrayAdd.length == loops && arrayTx.length - 1 == indexTx) {
                                                        getOutgoingTx();
                                                    }

                                                } else {
                                                    if (arrayAdd.length == loops && arrayTx.length - 1 == indexTx) {
                                                        getOutgoingTx();
                                                    }
                                                }
                                            })
                                        } else {
                                            if (arrayAdd.length == loops) {
                                                getOutgoingTx();
                                            }
                                        }


                                    } else {
                                        explorerurl = config.explorerurl2;
                                        if (loopsreq == 2) {
                                            getOutgoingTx();
                                        } else {
                                            reqExplorer();
                                        }
                                        if (arrayAdd.length == loops) {
                                            loopsreq++;
                                            loops = 0;
                                        }
                                        logger.error(err);
                                        //logger.error(JSON.parse(bodyAdd).error);

                                    }

                                })
                            }

                        });

            */
        });

        let reducedTransactions = [];
        /*
                function getOutgoingTx() {
                    var loops = 0;
                    txfromExp.forEach(function (currExTx, indexExTx, arrayExTx) {
                        request({
                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                            json: {'method': 'gettransaction', 'params': [currExTx]},
                            method: 'POST',
                            auth: {user: config.rpcuser, pass: req.slavePass}
                        }, function (err, httpResponse, bodyTransaction) {
                            loops++;
                            if (err || httpResponse.statusCode != 200 && bodyTransaction.error.message != 'Invalid or non-wallet transaction id') {
                                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                logger.error(err);
                                logger.error(bodyTransaction.error.message);
                            } else {
                                if(bodyTransaction.result){
                                if (bodyTransaction.result.details) {
                                    bodyTransaction.result.details.forEach(function (currDetail, indexDetail, arrayDetail) {
                                        if (currDetail.category == 'send') {
                                            reducedTransactions.push({
                                                address: currDetail.address,
                                                amount: currDetail.amount.toFixed(8),
                                                confirmations: bodyTransaction.result.confirmations,
                                                txid: bodyTransaction.result.txid,
                                                time: bodyTransaction.result.time,
                                                category: currDetail.category
                                            })
                                        }
                                        if (loops == arrayExTx.length && indexDetail == arrayDetail.length - 1) {
                                            //addTransactionsToDashboard();
                                        }

                                    });
                                } else {
                                    if (loops == arrayExTx.length) {
                                        //addTransactionsToDashboard();
                                    }
                                }
                                }else{
                                    if (loops == arrayExTx.length) {
                                       //addTransactionsToDashboard();
                                    }
                                }


                            }
                        });

                    });
                    if (txfromExp.length == 0) {
                        //addTransactionsToDashboard();
                    }
                }
        */

        var counter = 0;

        function addTransactionsToDashboard() {
            counter++;
            if (counter == 2) {
                addToDashboard({
                    transactions: reducedTransactions.sort(function (a, b) {
                        return b.time - a.time
                    }).slice(0, 100)
                })
                counter = 0;
            }
        }

        function getOutgoingTxFromWallet(txsFromAnon,txsFromAcc) {
            /*
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getblock', 'params': [blockhash]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyBlock) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyBlock.error.message);
                } else {
                    logger.error(bodyBlock.result.previousblockhash)
                    */
            //request({
            //url: 'http://' + req.slaveHost + ':' + config.rpcport,
            /*json: {'method': 'listsinceblock', 'params': [bodyBlock.result.previousblockhash]},*/
            // json: {'method': 'listtransactions', 'params': ['',9999999]},
            // method: 'POST',
            // auth: {user: config.rpcuser, pass: req.slavePass}
            // }, function (err, httpResponse, bodySinceBlock) {
            //   if (err || httpResponse.statusCode != 200) {
            //      res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
            //      logger.error(err);
            //     logger.error(bodySinceBlock.error.message);
            //  } else {
            //logger.error(bodySinceBlock.result.transactions.length)
            var processedTxs = [];
            var loops = 0;
            if(txsFromAnon.length==0)
                addTransactionsToDashboard();

            /*bodySinceBlock.result.transactions.forEach(function(curr,index,arr){*/
            txsFromAnon.forEach(function (curr, index, arr) {
                if (!processedTxs.includes(curr.txid)) {
                    //var txInAccTxs=txsFromAcc.find(function(tx){return tx.txid==curr.txid})
                    if (/*txInAccTxs&&*/curr.account == '' && curr.category == 'send' && !curr.generated) {
                        processedTxs.push(curr.txid);
                        request({
                            maxAttempts: 1,
                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                            json: {'method': 'getrawtransaction', 'params': [curr.txid, 1]},
                            method: 'POST',
                            auth: {user: config.rpcuser, pass: req.slavePass}
                        }, function (err, httpResponse, bodyTransaction) {
                            loops++;
                            if (err || httpResponse.statusCode != 200) {
                                if (bodyTransaction)
                                    if (bodyTransaction.error.message != 'No information available about transaction') {


                                        res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                        logger.error(err);
                                        logger.error(bodyTransaction.error.message);
                                    }
                            } else {
                                var alreadyProcessed = false;
                                bodyTransaction.result.vin.forEach(function (currVin, indexVin, arrVin) {
                                    var spentTx = incomingTx.find(function (tx) {
                                        return tx.txid == currVin.txid && tx.vout == currVin.vout
                                    });
                                    if (spentTx && !alreadyProcessed) {
                                        alreadyProcessed = true;
                                        bodyTransaction.result.vout.forEach(function (currVout, indexVout, arrVout) {

                                            if (currVout.scriptPubKey.addresses) {
                                                reducedTransactions.push({
                                                    address: currVout.scriptPubKey.addresses[0],
                                                    amount: -currVout.value.toFixed(8),
                                                    confirmations: curr.confirmations,
                                                    txid: bodyTransaction.result.txid,
                                                    time: curr.time,
                                                    category: 'send'
                                                })
                                            }
                                        })

                                    }
                                })

                                if (processedTxs.length == loops) {
                                    addTransactionsToDashboard();
                                }

                            }
                        });


                    }else{
                        if(index==arr.length-1&&processedTxs.length==0){
                            addTransactionsToDashboard();
                        }
                    }
                }
            })

            //    }
            // });


            // }
            // });
        }


        if(req.query.last100){
            getTransactionsFromDaemon();
        }else{
            getTransactions();
        }
function getTransactions(){
    var sinceblockprom= new Promise(function(resolve,reject){
        
        
        
        

    
    request({
        url: 'http://' + req.slaveHost + ':' + config.rpcport,
        json: {'method': 'getblockcount', 'params': []},
        method: 'POST',
        auth: {user: config.rpcuser, pass: req.slavePass}
    }, function (err, httpResponse, bodyBlockCount) {
        if (err || httpResponse.statusCode != 200) {
            res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
            logger.error(err);
            logger.error(bodyBlockCount.error.message);
        } else {

            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getblockhash', 'params': [(bodyBlockCount.result-10000)]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyBlockHash) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyBlockHash.error.message);
                } else {

                    request({
                        url: 'http://' + req.slaveHost + ':' + config.rpcport,
                        json: {'method': 'listsinceblock', 'params': [bodyBlockHash.result]},
                        method: 'POST',
                        auth: {user: config.rpcuser, pass: req.slavePass}
                    }, function (err, httpResponse, bodySinceBlock) {
                        if (err || httpResponse.statusCode != 200) {
                            res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                            logger.error(err);
                            logger.error(bodySinceBlock.error.message);
                        } else {
                            resolve(bodySinceBlock)
                            /*
                        var transactions=[];
                        bodySinceBlock.result.transactions.forEach(function(tx,index,arr){
                            if(tx.account==userid){
                                transactions.push(tx);
                            if (tx.category == 'receive') {
                                incomingTx.push({txid: tx.txid, vout: tx.vout});
                            }
                                if (tx.generated) {
                                    var stakeInReducedTx = reducedTransactions.find(function (reducedTx) {
                                        return reducedTx.txid == tx.txid
                                    })

                                    if (!stakeInReducedTx) {
                                        reducedTransactions.push({
                                            address: tx.address,
                                            amount: tx.time>=config.blocktime300k?config.PoSReward.toFixed(8):config.oldPoSReward.toFixed(8),
                                            confirmations: tx.confirmations,
                                            txid: tx.txid,
                                            time: tx.time,
                                            category: 'minted'
                                        })
                                    }

                                } else {

                                    reducedTransactions.push({
                                        address: tx.address,
                                        amount: tx.amount.toFixed(8),
                                        confirmations: tx.confirmations,
                                        txid: tx.txid,
                                        time: tx.time,
                                        category: tx.category
                                    })
                                }
                            }
                        })
                            addTransactionsToDashboard();
                            getOutgoingTxFromWallet(bodySinceBlock.result.transactions,transactions);
                            */

                        }
                    });



                }
            });




        }
    });
    });

    var transactionsFromAccount = new Promise(function (resolve, reject) {
        request({
            url: 'http://' + req.slaveHost + ':' + config.rpcport,
            json: {'method': 'listtransactions', 'params': [userid, 9999999]},
            method: 'POST',
            auth: {user: config.rpcuser, pass: req.slavePass}
        }, function (err, httpResponse, bodyTransactions) {
            if (err || httpResponse.statusCode != 200) {
                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                logger.error(err);
                logger.error(bodyTransactions.error.message);
            } else {
                resolve(bodyTransactions);
            }
        });
    })
    
    Promise.all([sinceblockprom,transactionsFromAccount]).then(values=>{
        var transactions=[];
        values[1].result.forEach(function(tx,index,arr){
            if (tx.category == 'receive'||tx.category == 'generate'||tx.generated) {
                incomingTx.push({txid: tx.txid, vout: tx.vout});
            }
        });

        values[0].result.transactions.forEach(function(tx,index,arr){
            if(tx.account==userid){
                transactions.push(tx);
                /*
                if (tx.category == 'receive') {
                    incomingTx.push({txid: tx.txid, vout: tx.vout});
                }
                */
                if (tx.generated) {
                    var stakeInReducedTx = reducedTransactions.find(function (reducedTx) {
                        return reducedTx.txid == tx.txid
                    })

                    if (!stakeInReducedTx) {
                        reducedTransactions.push({
                            address: tx.address,
                            amount: tx.time>=config.blocktime300k?config.PoSReward.toFixed(8):config.oldPoSReward.toFixed(8),
                            confirmations: tx.confirmations,
                            txid: tx.txid,
                            time: tx.time,
                            category: 'minted'
                        })
                    }

                } else {

                    reducedTransactions.push({
                        address: tx.address,
                        amount: tx.amount.toFixed(8),
                        confirmations: tx.confirmations,
                        txid: tx.txid,
                        time: tx.time,
                        category: tx.category
                    })
                }
            }
        })
        addTransactionsToDashboard();
        getOutgoingTxFromWallet(values[0].result.transactions,transactions);
        
    })
    

}



        var incomingTx = [];
        //getTransactionsFromDaemon();


function getTransactionsFromDaemon(){
        var transactionsFromAnon = new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listtransactions', 'params': ['', 9999999]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyTransactions) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyTransactions.error.message);
                } else {
                    resolve(bodyTransactions);
                }
            });
        });




        var transactionsFromAccount = new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listtransactions', 'params': [userid, 9999999]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyTransactions) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyTransactions.error.message);
                } else {
                    resolve(bodyTransactions);
                }
            });
        })
        Promise.all([transactionsFromAccount, transactionsFromAnon])
            .then(values => {
                values[0].result.sort(function (a, b) {
                    return b.time - a.time
                });
                if (values[0].result.length > 0) {
                    var loops = 0;
                    var txindex = 0;
                    if (values[0].result.length < 100) {
                        txindex = values[0].result.length - 1;
                    } else {
                        txindex = 99;
                    }
                    values[0].result.forEach(function (curr, index, array) {

                        if (curr.category == 'receive') {
                            incomingTx.push({txid: curr.txid, vout: curr.vout});
                        }
                        if (curr.generated) {
                            /*
                                                    request({
                                                        url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                                        json: {'method': 'gettransaction', 'params': [curr.txid]},
                                                        method: 'POST',
                                                        auth: {user: config.rpcuser, pass: req.slavePass}
                                                    }, function (err, httpResponse, bodyTransaction) {
                                                        if (err || httpResponse.statusCode != 200) {
                                                            res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                            logger.error(err);
                                                            logger.error(bodyTransaction.error.message);
                                                        } else {
                                                        */
                            loops++;
                            var stakeInReducedTx = reducedTransactions.find(function (reducedTx) {
                                return reducedTx.txid == curr.txid
                            })

                            if (!stakeInReducedTx) {
                                reducedTransactions.push({
                                    address: curr.address,
                                    amount: curr.time>=config.blocktime300k?config.PoSReward.toFixed(8):config.oldPoSReward.toFixed(8),
                                    confirmations: curr.confirmations,
                                    txid: curr.txid,
                                    time: curr.time,
                                    category: 'minted'
                                })
                            }
                            if (loops == values[0].result.length) {
                                addTransactionsToDashboard();
                                //getOutgoingTxFromWallet(values[0].result[txindex].blockhash);
                                getOutgoingTxFromWallet(values[1].result,values[0].result);
                            }
                            /*
                        }
                    });
                    */
                        } else {
                            loops++;
                            reducedTransactions.push({
                                address: curr.address,
                                amount: curr.amount.toFixed(8),
                                confirmations: curr.confirmations,
                                txid: curr.txid,
                                time: curr.time,
                                category: curr.category
                            })
                            if (loops == values[0].result.length) {
                                addTransactionsToDashboard();
                                //getOutgoingTxFromWallet(values[0].result[txindex].blockhash);
                                getOutgoingTxFromWallet(values[1].result,values[0].result);
                            }
                        }
                    })
                } else {
                    addToDashboard({
                        transactions: []
                    })
                }

            });

}

        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getinfo'},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyInfo) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyInfo.error.message);
                } else {
                    resolve(bodyInfo);
                }
            });
        }).then(function (value) {
            addToDashboard({
                difficulty: {
                    PoW: value.result.difficulty['proof-of-work'],
                    PoS: value.result.difficulty['proof-of-stake']
                }
            })
        });


        let dashboard = {};

        function addToDashboard(value) {
            dashboard[Object.keys(value)[0]] = value[Object.keys(value)[0]];
            if (Object.keys(dashboard).length == 3) {
                res.status(200).json(dashboard);
            }

        }
    }

}

exports.getBTCValue = function (req, res) {
    var valuesObj = {};

    request({
        maxAttempts: 1,
        url: 'https://www.cryptopia.co.nz/api/GetMarket/DEV_BTC',
        method: 'GET'
    }, function (err, httpResponse, bodyCryptopia) {
        if (err || httpResponse.statusCode != 200 || bodyCryptopia === null || JSON.parse(bodyCryptopia) === null || httpResponse.headers['content-type'].includes('application/json') && (JSON.parse(bodyCryptopia).Data === null || JSON.parse(bodyCryptopia).Data === undefined) || !httpResponse.headers['content-type'].includes('application/json')) {
            logger.error(err);
            logger.error('cryptopia seems to have troubles...');
            addToValuesObj({btcValue: 0.0});
            addToValuesObj({priceChange: 0.0});
        } else {
            addToValuesObj({btcValue: JSON.parse(bodyCryptopia).Data.LastPrice || 0.0});
            addToValuesObj({priceChange: JSON.parse(bodyCryptopia).Data.Change || 0.0});
        }
    })

    request({
        maxAttempts: 1,
        url: 'https://www.cryptopia.co.nz/api/GetMarket/BTC_USDT',
        method: 'GET'
    }, function (err, httpResponse, bodyCryptopia) {

        if (err || httpResponse.statusCode != 200 || bodyCryptopia === null || JSON.parse(bodyCryptopia) === null || httpResponse.headers['content-type'].includes('application/json') && (JSON.parse(bodyCryptopia).Data === null || JSON.parse(bodyCryptopia).Data === undefined) || !httpResponse.headers['content-type'].includes('application/json')) {
            logger.error(err);
            logger.error('cryptopia seems to have troubles...');
            addToValuesObj({btcPrice: 0.0});
        } else {
            addToValuesObj({btcPrice: JSON.parse(bodyCryptopia).Data.LastPrice || 0.0});
        }
    })

    function addToValuesObj(obj) {
        valuesObj[Object.keys(obj)[0]] = obj[Object.keys(obj)[0]];
        if (Object.keys(valuesObj).length == 3) {
            res.status(200).json(valuesObj);
        }
    }

}

exports.getAddresses = function (req, res) {
    var balances = [];
    var addresses = [];
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {


        var txprom=        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listtransactions', 'params': [userid, 100]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyTransactions) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyTransactions.error.message);
                } else {
                    resolve(bodyTransactions.result);
                }
            });
        });

        var unspentprom=  new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getaddressesbyaccount', 'params': [userid]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyAddresses) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyAddresses.error.message);
                } else {


                    var addsWithoutBech={addresses:[]};

                    if(bodyAddresses.result.length>0){


                    bodyAddresses.result.forEach(function(add){
                        if(add.charAt(0)=='L'||add.charAt(0)=='S'){
                            //addsWithoutBech.addresses.push(add);
                            addresses.push(add);
                        }

                    })


                    request({
                        url: 'http://' + req.slaveHost + ':' + config.rpcport,
                        json: {'method': 'listunspent', 'params': [1, 9999999, addresses]},
                        method: 'POST',
                        auth: {user: config.rpcuser, pass: req.slavePass}
                    }, function (err, httpResponse, bodyUn) {
                        if (err || httpResponse.statusCode != 200) {
                            res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                            logger.error(err);
                            logger.error(bodyUn.error.message);
                        } else {
                            resolve(bodyUn.result);
                            // addToAddressesObj({unspent: bodyUn.result});
                        }
                    });
                    }else{
                        resolve([]);
                    }

                }
            });

        })

        Promise.all([txprom,unspentprom]).then(values=>{

            values[0].sort(function (a, b) {
                return b.confirmations - a.confirmations
            }).forEach((tx,indextx,arrtx)=>{


                if(((tx.generated&&tx.category=='immature'&&(tx.confirmations<config.PoSConfirmations))||tx.confirmations<config.TxConfirmations)&&req.query.exact){
                    values[1].push({confirmations:tx.confirmations,amount:tx.amount,address:tx.address,account:tx.account,spendable:false})
                }

                if(indextx==arrtx.length-1){
                    calcBalance(values[1]);
                }
            })
            if(values[0].length==0)
                calcBalance(values[1]);
        })



/*

        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listtransactions', 'params': [userid, 100]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyTransactions) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyTransactions.error.message);
                } else {
                    resolve(bodyTransactions);
                }
            });
        }).then(function (value) {
            value.result.forEach(function (curr, index, array) {
                if (curr.generated && (curr.confirmations <= config.PoSConfirmations) && req.query.exact) {
                    var existingAdd = balances.find(function (address) {
                        return address.address == curr.address
                    });
                    if (existingAdd) {
                        existingAdd.balance += curr.amount;
                    } else {
                        balances.push({address: curr.address, balance: curr.amount});
                    }

                }

            })
            addToAddressesObj({addsWithImmStake: []})
        });


        var addressesObj = {};
        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getaddressesbyaccount', 'params': [userid]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyAddresses) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyAddresses.error.message);
                } else {
                    resolve({addresses: bodyAddresses.result});
                }
            });

        }).then(function (addresses) {
            var addsWithoutBech={addresses:[]};

            addresses.addresses.forEach(function(add){
                if(add.charAt(0)=='L'||add.charAt(0)=='S')
                    addsWithoutBech.addresses.push(add);
            })
            addToAddressesObj(addsWithoutBech);

            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listunspent', 'params': [1, 9999999, addresses.addresses]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyUn) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyUn.error.message);
                } else {
                    addToAddressesObj({unspent: bodyUn.result});
                }
            });
        })

        function addToAddressesObj(value) {
            addressesObj[Object.keys(value)[0]] = value[Object.keys(value)[0]];
            if (Object.keys(addressesObj).length == 3) {
                calcBalance();
            }
        }
*/
        function calcBalance(unspent) {

            addresses.forEach(function (currAdd, indexAdd, arrayAdd) {
                var sum = 0.0;
                if (unspent.length > 0) {
                    unspent.forEach(function (currTra, indexTra, arrayTra) {
                        if (currTra.address == currAdd && currTra.account==userid) {
                            if(req.query.exact){
                                sum += currTra.amount;
                            }else if(currTra.spendable){
                                sum += currTra.amount;
                            }

                        }
                        if (indexTra == unspent.length - 1) {
                            var existingAdd = balances.find(function (address) {
                                return address.address == currAdd
                            });
                            if (existingAdd) {
                                existingAdd.balance += sum;
                            } else {
                                balances.push({address: currAdd, balance: sum});
                            }
                            //balances.push({address: currAdd, balance: sum});
                        }
                    })
                    if (indexAdd == addresses.length - 1) {
                        sendBalance();
                    }
                } else if (unspent.length == 0) {
                    balances.push({address: currAdd, balance: sum});
                    if (indexAdd == addresses.length - 1) {
                        sendBalance();
                    }
                }



            })
            if(addresses.length==0){
                res.status(200).json([])
            }


            function sendBalance() {
                if (balances.length == addresses.length) {
                    res.status(200).json(balances.sort(function (a, b) {
                        return b.balance - a.balance
                    }));
                }

            }
        }
    }
}

exports.getNewAddress = function (req, res) {

    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {

        checkIfSlaveIsUnderMaintenance(req).then(maintenance => {
            if (!maintenance) {
                checkIfExporterIsRunning(req).then(run => {
                    if (!run) {
                        request({
                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                            json: {'method': 'getnewaddress', 'params': [userid]},
                            method: 'POST',
                            auth: {user: config.rpcuser, pass: req.slavePass}
                        }, function (err, httpResponse, bodyNewAdd) {
                            if (err || httpResponse.statusCode != 200) {
                                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                logger.error(err);
                                logger.error(bodyNewAdd.error.message);
                            } else {
                                res.status(200).json(bodyNewAdd.result);
                            }
                        });


                    } else {
                        res.status(200).send({error: 'The export script is currently running, please try again later!'})
                    }
                })
            } else {
                res.status(200).send({error: 'The server you are on is currently under maintenance, please try again later!'})
            }
        })





    }

}


exports.getBalance = function (req, res) {
    var minStakingConfirmations = 2160;
    var balance = 0.0;
    var balanceStaking = 0.0;
    var balanceSpendable = 0.0;
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {



        var txprom=        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listtransactions', 'params': [userid, 100]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyTransactions) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyTransactions.error.message);
                } else {
                    resolve(bodyTransactions.result);
                }
            });
        });

        var unspentprom=  new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getaddressesbyaccount', 'params': [userid]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyAddresses) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyAddresses.error.message);
                } else {

                    if(bodyAddresses.result.length>0){


                    var addsWithoutBech={addresses:[]};

                    bodyAddresses.result.forEach(function(add){
                        //if(add.charAt(0)=='L'||add.charAt(0)=='S')
                            addsWithoutBech.addresses.push(add);
                    })

                    request({
                        url: 'http://' + req.slaveHost + ':' + config.rpcport,
                        json: {'method': 'listunspent', 'params': [1, 9999999, addsWithoutBech.addresses]},
                        method: 'POST',
                        auth: {user: config.rpcuser, pass: req.slavePass}
                    }, function (err, httpResponse, bodyUn) {
                        if (err || httpResponse.statusCode != 200) {
                            res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                            logger.error(err);
                            logger.error(bodyUn.error.message);
                        } else {
                            resolve(bodyUn.result);
                            // addToAddressesObj({unspent: bodyUn.result});
                        }
                    });

                    }else{
                        resolve([]);
                    }
                }
            });

        })

        Promise.all([txprom,unspentprom]).then(values=>{

            values[0].sort(function (a, b) {
                return b.confirmations - a.confirmations
            }).forEach((tx,indextx,arrtx)=>{

                if(config.PoSMaturityInHours){
                    if ((tx.time * 1000 + config.PoSMaturityInHours * 60 * 60 * 1000) <= new Date().getTime()) {
                        minStakingConfirmations = tx.confirmations;
                    }
                }else if(config.PoSMaturityInConfirms){
                    minStakingConfirmations=config.PoSMaturityInConfirms;
                }


                if((tx.generated&&tx.category=='immature'&&(tx.confirmations<config.PoSConfirmations))||tx.confirmations<config.TxConfirmations){
                    values[1].push({confirmations:tx.confirmations,amount:tx.amount,account:tx.account,spendable:false})

                }
                if(indextx==arrtx.length-1){
                    calcBalance(values[1]);
                }
            })
            if(values[0].length==0)
                calcBalance(values[1]);
        })



/*



        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listtransactions', 'params': [userid, 100]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyTransactions) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyTransactions.error.message);
                } else {
                    resolve(bodyTransactions);
                }
            });
        }).then(function (value) {
            //let addsWithImmStake = [];
            var loops=0;
            value.result.sort(function (a, b) {
                return b.confirmations - a.confirmations
            }).forEach(function (curr, index, array) {
                if ((curr.time * 1000 + config.PoSMaturityInHours * 60 * 60 * 1000) <= new Date().getTime()) {
                    minStakingConfirmations = curr.confirmations;
                }
                if (curr.generated && (curr.confirmations < curr.PoSConfirmations) && req.query.exact) {

                    request({
                        url: 'http://' + req.slaveHost + ':' + config.rpcport,
                        json: {'method': 'getrawtransaction', 'params': [curr.txid, 1]},
                        method: 'POST',
                        auth: {user: config.rpcuser, pass: req.slavePass}
                    }, function (err, httpResponse, bodyTransaction) {
                        if (err || httpResponse.statusCode != 200) {
                            res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                            logger.error(err);
                            logger.error(bodyTransaction.error.message);
                        } else {
                            balance +=bodyTransaction.result.vout[1].value
                            loops++;
                            if(loops==value.result.length)
                                addToAddressesObj({addsWithImmStake: []})
                        }
                    });


                    //balance += curr.amount;
                }else{
                    loops++;
                }
                //maybe TODO: double stake

            })
            if(loops==value.result.length)
            addToAddressesObj({addsWithImmStake: []})
        });


        var addressesObj = {};
        new Promise(function (resolve, reject) {
            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'getaddressesbyaccount', 'params': [userid]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyAddresses) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyAddresses.error.message);
                } else {
                    resolve({addresses: bodyAddresses.result});
                }
            });

        }).then(function (addresses) {

            addToAddressesObj(addresses);

            request({
                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                json: {'method': 'listunspent', 'params': [1, 9999999, addresses.addresses]},
                method: 'POST',
                auth: {user: config.rpcuser, pass: req.slavePass}
            }, function (err, httpResponse, bodyUn) {
                if (err || httpResponse.statusCode != 200) {
                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                    logger.error(err);
                    logger.error(bodyUn.error.message);
                } else {
                    addToAddressesObj({unspent: bodyUn.result});
                }
            });
        })


        function addToAddressesObj(value) {
            addressesObj[Object.keys(value)[0]] = value[Object.keys(value)[0]];
            if (Object.keys(addressesObj).length == 3) {
                calcBalance();
            }
        }


        function calcBalance() {
            if (addressesObj.unspent.length > 0) {
                addressesObj.unspent.forEach(function (currTra, indexTra, arrayTra) {
                    if (req.query.exact) {
                        balance += currTra.amount;
                        if (currTra.confirmations >= minStakingConfirmations) {
                            balanceStaking += currTra.amount;
                        }
                    } else {
                        if (currTra.spendable)
                            balance += currTra.amount;
                    }

                    if (indexTra == arrayTra.length - 1) {
                        sendBalance();
                    }
                })

            } else if (addressesObj.unspent.length == 0) {
                balanceStaking = 0.0;
                sendBalance();

            }
*/
        function calcBalance(unspent) {
            if (unspent.length > 0) {
                unspent.forEach(function (currTra, indexTra, arrayTra) {
                    if(currTra.account==userid){

                        balance += currTra.amount;
                        if (currTra.confirmations >= minStakingConfirmations) {
                            balanceStaking += currTra.amount;
                        }

                        if (currTra.spendable)
                            balanceSpendable += currTra.amount;

                    }

                    if (indexTra == arrayTra.length - 1) {
                        sendBalance();
                    }
                })

            } else if (unspent.length == 0) {
                sendBalance();

            }
            function sendBalance() {
                // if (balance.length == addressesObj.addresses.length) {
                //if (req.query.exact) {
                res.status(200).json({
                    balance: balance/*.reduce((a, b) => a + b, 0)*/.toFixed(8),
                    balanceStaking: balanceStaking/*.reduce((a, b) => a + b, 0)*/.toFixed(8),
                    balanceSpendable: balanceSpendable.toFixed(8)
                })
                // } else {
                //     res.status(200).json({balance: balance/*.reduce((a, b) => a + b, 0)*/.toFixed(8)})
                // }

                // }
            }
        }

    }

}


exports.sendTransaction = function (req, res) {
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined && userid != '') {

        checkIfSlaveIsUnderMaintenance(req).then(maintenance => {
            if (!maintenance) {


                checkIfExporterIsRunning(req).then(run => {
                    if (!run) {
                        checkIfEmailVerificationPassed(req,'send').then(passed => {
                            if (passed) {
                                if ((req.body.amount && req.body.fee && req.body.sendTo) && ((req.body.inputAdds.length == 0 && !req.body.changeAdd) || (req.body.inputAdds.length > 0 && req.body.changeAdd))) {
                                    var addressesObj = {};
                                    new Promise(function (resolve, reject) {
                                        request({
                                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                            json: {'method': 'getaddressesbyaccount', 'params': [userid]},
                                            method: 'POST',
                                            auth: {user: config.rpcuser, pass: req.slavePass}
                                        }, function (err, httpResponse, bodyAddresses) {
                                            if (err || httpResponse.statusCode != 200) {
                                                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                logger.error(err);
                                                logger.error(bodyAddresses.error.message);
                                            } else {
                                                resolve({addresses: bodyAddresses.result});
                                            }
                                        });

                                    }).then(function (addresses) {

                                        addToAddressesObj(addresses);

                                        request({
                                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                            json: {'method': 'listunspent', 'params': [1, 9999999, addresses.addresses]},
                                            method: 'POST',
                                            auth: {user: config.rpcuser, pass: req.slavePass}
                                        }, function (err, httpResponse, bodyUn) {
                                            if (err || httpResponse.statusCode != 200) {
                                                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                logger.error(err);
                                                logger.error(bodyUn.error.message);
                                            } else {
                                                addToAddressesObj({unspent: bodyUn.result});
                                            }
                                        });
                                    })


                                    function addToAddressesObj(value) {
                                        addressesObj[Object.keys(value)[0]] = value[Object.keys(value)[0]];
                                        if (Object.keys(addressesObj).length == 2) {
                                            calcBalance();
                                        }
                                    }

                                    var balances = [];
                                    var balancesSorted = [];
                                    var balance = 0.0;
                                    var allUnspent = [];
                                    var allUnspentAmount = [];
                                    var allUnspentWithPub = [];

                                    function calcBalance() {
                                        addressesObj.addresses.forEach(function (currAdd, indexAdd, arrayAdd) {
                                            balances.push({
                                                address: currAdd,
                                                balance: 0,
                                                unspent: [],
                                                unspentAmount: [],
                                                unspentWithPub: []
                                            });
                                            var sum = 0.0;
                                            if (addressesObj.unspent.length > 0) {
                                                addressesObj.unspent.forEach(function (currTra, indexTra, arrayTra) {
                                                    if (currTra.address == currAdd && currTra.spendable && currTra.account==userid) {
                                                        var currAddBalance = balances.find(function (addBalance) {
                                                            return addBalance.address === currAdd
                                                        });
                                                        if (currAddBalance) {
                                                            sum += currTra.amount;
                                                            currAddBalance.unspent.push({
                                                                txid: currTra.txid,
                                                                vout: currTra.vout
                                                            });
                                                            currAddBalance.unspentAmount.push({
                                                                txid: currTra.txid,
                                                                vout: currTra.vout,
                                                                scriptPubKey: currTra.scriptPubKey,
                                                                amount: currTra.amount,
                                                                address: currTra.address
                                                            });
                                                            currAddBalance.unspentWithPub.push({
                                                                txid: currTra.txid,
                                                                vout: currTra.vout,
                                                                scriptPubKey: currTra.scriptPubKey
                                                            })

                                                            allUnspent.push({txid: currTra.txid, vout: currTra.vout});
                                                            allUnspentAmount.push({
                                                                txid: currTra.txid,
                                                                vout: currTra.vout,
                                                                scriptPubKey: currTra.scriptPubKey,
                                                                amount: currTra.amount,
                                                                address: currTra.address
                                                            });
                                                            allUnspentWithPub.push({
                                                                txid: currTra.txid,
                                                                vout: currTra.vout,
                                                                scriptPubKey: currTra.scriptPubKey
                                                            })
                                                        }

                                                    }
                                                    if (indexTra == addressesObj.unspent.length - 1) {

                                                        var currAddBalance = balances.find(function (addBalance) {
                                                            return addBalance.address === currAdd
                                                        });
                                                        if (currAddBalance) {
                                                            balance += sum;
                                                            currAddBalance.balance = sum.toFixed(8) / 1;
                                                        }
                                                    }
                                                })
                                                if (indexAdd == addressesObj.addresses.length - 1) {
                                                    if (((parseFloat(req.body.amount) + parseFloat(req.body.fee)).toFixed(8) / 1 <= (balance.toFixed(8) / 1)) && (parseFloat(req.body.fee).toFixed(8) / 1 >= 0.0001) && (parseFloat(req.body.amount).toFixed(8) / 1 >= 0.00000001) && (parseFloat(req.body.fee).toFixed(8) / 1 <= 0.1)) {
                                                        balancesSorted = balances.sort(function (a, b) {
                                                            return a.balance - b.balance
                                                        });

                                                        var addWithSuffBalance = balancesSorted.find(function (addBalance) {
                                                            return addBalance.balance >= (parseFloat(req.body.amount) + parseFloat(req.body.fee)).toFixed(8) / 1
                                                        });
                                                        // prepareTxAdvanced(addWithSuffBalance);
                                                        prepareTx();


                                                    } else {
                                                        res.status(200).json({error: 'Check your funds, fee and amount!'});
                                                    }
                                                }
                                            } else if (addressesObj.unspent.length == 0) {
                                                res.status(200).json({error: 'insufficient funds!'});
                                            }

                                        })
                                        if(addressesObj.addresses.length==0){
                                            res.status(200).json({error: 'You do not own any addresses, therefor there are no funds!'});
                                        }

                                    }

                                    var transactions = {};
                                    var unspentTx = [];
                                    var unspentTxWithPub = [];

                                    function prepareTx() {
                                        logger.info('User ' + userid + ' just made a tx!');


                                        var prepUnspentAmount = [];

                                        var usedAmount = 0.0;
                                        if (req.body.inputAdds.length > 0) {
                                            var coinControlUnspentAmount = [];
                                            req.body.inputAdds.forEach(function (add, indexAdd, arrayAdd) {
                                                var coinControlAdd = balances.find(function (address) {
                                                    return address.address == add
                                                })
                                                coinControlUnspentAmount = coinControlUnspentAmount.concat(coinControlAdd.unspentAmount);
                                                if (req.body.spendAll) {
                                                    unspentTx = unspentTx.concat(coinControlAdd.unspent);
                                                    unspentTxWithPub = unspentTxWithPub.concat(coinControlAdd.unspentWithPub);
                                                    usedAmount += coinControlAdd.balance;
                                                }
                                            });
                                            prepUnspentAmount = prepUnspentAmount.concat(coinControlUnspentAmount);

                                            logger.info('Option: Coin Control');
                                            logger.info('Spend all: ' + req.body.spendAll);
                                            logger.info('Input addresses: ' + JSON.stringify(req.body.inputAdds));
                                        } else {
                                            prepUnspentAmount = prepUnspentAmount.concat(allUnspentAmount);
                                            logger.info('Option: Advanced');
                                        }
                                        logger.info('To: ' + req.body.sendTo);
                                        logger.info('Amount: ' + parseFloat(req.body.amount).toFixed(8) / 1);
                                        logger.info('Fee: ' + parseFloat(req.body.fee).toFixed(8) / 1);
                                        logger.info('Change address: ' + req.body.changeAdd);


                                        if (!req.body.spendAll) {
                                            var unspentWithSuffAmount = prepUnspentAmount.sort(function (a, b) {
                                                return a.amount - b.amount
                                            }).find(function (unspent) {
                                                return unspent.amount >= (parseFloat(req.body.amount) + parseFloat(req.body.fee)).toFixed(8) / 1
                                            });


                                            var prepUnspentAmountReverse = prepUnspentAmount.concat().reverse();
                                            var sumUnspent = 0.0;
                                            var prepUnspentTx = [];
                                            var prepUnspentTxWithPub = [];
                                            var prepUnspentTxWithAmount = [];
                                            for (j = 0; ((sumUnspent.toFixed(8) / 1) < ((parseFloat(req.body.amount) + parseFloat(req.body.fee)).toFixed(8) / 1)); j++) {
                                                var unspentSingle = allUnspent.find(function (unspent) {
                                                    return unspent.txid === prepUnspentAmount[j].txid && unspent.vout === prepUnspentAmount[j].vout
                                                });
                                                var unspentWithPubSingle = allUnspentWithPub.find(function (unspentWithPub) {
                                                    return unspentWithPub.txid === prepUnspentAmount[j].txid && unspentWithPub.vout === prepUnspentAmount[j].vout
                                                });
                                                if (unspentSingle && unspentWithPubSingle) {
                                                    sumUnspent += prepUnspentAmount[j].amount;
                                                    prepUnspentTxWithAmount.push(prepUnspentAmount[j]);
                                                    prepUnspentTx.push(unspentSingle)
                                                    prepUnspentTxWithPub.push(unspentWithPubSingle);
                                                } else {
                                                    logger.error('Something is wrong with the advanced balance detection')
                                                }
                                            }
                                            var sumUnspentReverse = 0.0;
                                            var prepUnspentTxReverse = [];
                                            var prepUnspentTxWithPubReverse = [];
                                            var prepUnspentTxWithAmountReverse = [];
                                            for (j = 0; ((sumUnspentReverse.toFixed(8) / 1) < ((parseFloat(req.body.amount) + parseFloat(req.body.fee)).toFixed(8) / 1)); j++) {
                                                var unspentSingle = allUnspent.find(function (unspent) {
                                                    return unspent.txid === prepUnspentAmountReverse[j].txid && unspent.vout === prepUnspentAmountReverse[j].vout
                                                });
                                                var unspentWithPubSingle = allUnspentWithPub.find(function (unspentWithPub) {
                                                    return unspentWithPub.txid === prepUnspentAmountReverse[j].txid && unspentWithPub.vout === prepUnspentAmountReverse[j].vout
                                                });
                                                if (unspentSingle && unspentWithPubSingle) {
                                                    sumUnspentReverse += prepUnspentAmountReverse[j].amount;
                                                    prepUnspentTxWithAmountReverse.push(prepUnspentAmountReverse[j]);
                                                    prepUnspentTxReverse.push(unspentSingle)
                                                    prepUnspentTxWithPubReverse.push(unspentWithPubSingle);
                                                } else {
                                                    logger.error('Something is wrong with the advanced balance detection')
                                                }
                                            }
                                            var values = [];
                                            values.push(sumUnspentReverse)
                                            values.push(sumUnspent);
                                            if (unspentWithSuffAmount) {
                                                values.push(unspentWithSuffAmount.amount);
                                            }
                                            values.sort(function (a, b) {
                                                return a - b
                                            });
                                            if (values[0] === sumUnspentReverse) {
                                                unspentTx = unspentTx.concat(prepUnspentTxReverse);
                                                unspentTxWithPub = unspentTxWithPub.concat(prepUnspentTxWithPubReverse);
                                                logger.info('Method: reverse merge')
                                                logger.info('Used inputs: ' + JSON.stringify(prepUnspentTxWithAmountReverse))
                                            } else if (values[0] === sumUnspent) {
                                                unspentTx = unspentTx.concat(prepUnspentTx);
                                                unspentTxWithPub = unspentTxWithPub.concat(prepUnspentTxWithPub);
                                                logger.info('Method: forward merge')
                                                logger.info('Used inputs: ' + JSON.stringify(prepUnspentTxWithAmount))
                                            } else if (values[0] === unspentWithSuffAmount.amount) {
                                                unspentTx.push({
                                                    txid: unspentWithSuffAmount.txid,
                                                    vout: unspentWithSuffAmount.vout
                                                });
                                                unspentTxWithPub.push({
                                                    txid: unspentWithSuffAmount.txid,
                                                    vout: unspentWithSuffAmount.vout,
                                                    scriptPubKey: unspentWithSuffAmount.scriptPubKey
                                                });
                                                logger.info('Method: single unspent')
                                                logger.info('Used inputs: ' + unspentWithSuffAmount.txid + unspentWithSuffAmount.vout)
                                            }
                                            usedAmount = values[0];
                                        }
                                        logger.info('Used: ' + usedAmount);
                                        var amountToSendBack = (usedAmount - parseFloat(req.body.amount) - parseFloat(req.body.fee)).toFixed(8) / 1;
                                        var changeAddress = '';
                                        if (req.body.changeAdd == 'Create new') {

                                            request({
                                                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                                json: {'method': 'getnewaddress', 'params': [userid]},
                                                method: 'POST',
                                                auth: {user: config.rpcuser, pass: req.slavePass}
                                            }, function (err, httpResponse, bodyNewAdd) {
                                                if (err || httpResponse.statusCode != 200) {
                                                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                    logger.error(err);
                                                    logger.error(bodyAddresses.error.message);
                                                } else {
                                                    changeAddress = bodyNewAdd.result;
                                                    createTransactions();

                                                }
                                            });

                                        } else if (req.body.changeAdd) {
                                            changeAddress = req.body.changeAdd;
                                            createTransactions();
                                        } else {
                                            var legacyAdds=balancesSorted.filter(function(sAdd){return sAdd.address.charAt(0)=='L'})
                                            changeAddress = legacyAdds[0].address;
                                            createTransactions();
                                        }

                                        function createTransactions() {
                                            if (amountToSendBack === 0) {
                                                transactions = {
                                                    [req.body.sendTo]: parseFloat(req.body.amount).toFixed(8) / 1,
                                                };
                                            } else {
                                                if (changeAddress === req.body.sendTo) {
                                                    amountToSendBack = (amountToSendBack + parseFloat(req.body.amount)).toFixed(8) / 1;
                                                }
                                                transactions = {
                                                    [req.body.sendTo]: parseFloat(req.body.amount).toFixed(8) / 1,
                                                    [changeAddress]: amountToSendBack
                                                };
                                            }
                                            logger.info('Transactions :' + JSON.stringify(transactions));
                                            sendTx();
                                        }
                                    }

                                    function sendTx() {
                                        request({
                                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                            json: {
                                                'method': 'createrawtransaction',
                                                'params': [unspentTx, transactions]
                                            },
                                            method: 'POST',
                                            auth: {user: config.rpcuser, pass: req.slavePass}
                                        }, function (err, httpResponse, bodyCreateRaw) {
                                            if (bodyCreateRaw.error) {
                                                res.status(200).json({error: bodyCreateRaw.error.message})
                                                logger.error(bodyCreateRaw.error.message);
                                            } else if (err || httpResponse.statusCode != 200) {
                                                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                logger.error(err);
                                            } else {
                                                request({
                                                    url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                                    json: {
                                                        'method': 'signrawtransaction',
                                                        'params': [bodyCreateRaw.result/*, unspentTxWithPub*/]
                                                    },
                                                    method: 'POST',
                                                    auth: {user: config.rpcuser, pass: req.slavePass}
                                                }, function (err, httpResponse, bodySignRaw) {
                                                    if (bodySignRaw.error) {
                                                        res.status(200).json({error: bodySignRaw.error.message});
                                                        logger.error(bodySignRaw.error.message);
                                                    } else if (err || httpResponse.statusCode != 200) {
                                                        res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                        logger.error(err);
                                                    } else {
                                                        if (bodySignRaw.result.complete) {
                                                            request({
                                                                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                                                json: {
                                                                    'method': 'sendrawtransaction',
                                                                    'params': [bodySignRaw.result.hex]
                                                                },
                                                                method: 'POST',
                                                                auth: {user: config.rpcuser, pass: req.slavePass}
                                                            }, function (err, httpResponse, bodySendRaw) {
                                                                if (bodySendRaw.error) {
                                                                    res.status(200).json({error: bodySendRaw.error.message});
                                                                    logger.error(bodySendRaw.error.message);
                                                                } else if (err || httpResponse.statusCode != 200) {
                                                                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                                    logger.error(err);
                                                                } else {
                                                                    res.status(200).json({txid: bodySendRaw.result});
                                                                    logger.info('Txid: ' + bodySendRaw.result);
                                                                    checkIfTxGetsConfirmations(req.slaveHost, req.slavePass, bodySendRaw.result);
                                                                }
                                                            });


                                                        }

                                                    }
                                                });


                                            }
                                        });
                                    }


                                } else {
                                    res.status(500).send({error: 'Invalid option!'});
                                }

                            } else {
                                res.status(200).json({error: 'The provided email verification code is incorrect!'});
                            }
                        });


                    }
                    else {
                        res.status(200).send({error: 'The export script is currently running, please try again later!'})
                    }
                })



            } else {
                res.status(200).send({error: 'The server you are on is currently under maintenance, please try again later!'})
            }
        })




    }


}


exports.getUser = function (req, res) {
    var username = req.kauth.grant.access_token.content.preferred_username;
    if (username != null && username != undefined) {
        poolKey.query('SELECT type FROM credential WHERE user_id=$1 and type=$2', [req.kauth.grant.access_token.content.sub, 'totp'])
            .then(resp => {
                if (resp.rows.length == 1) {
                    res.status(200).json({
                        username: req.kauth.grant.access_token.content.preferred_username,
                        '2fa': true,
                        mod:req.kauth.grant.access_token.content.realm_access.roles.includes('mod')
                    })
                } else {
                    res.status(200).json({
                        username: req.kauth.grant.access_token.content.preferred_username,
                        '2fa': false,
                        mod:req.kauth.grant.access_token.content.realm_access.roles.includes('mod')
                    })
                }


            }).catch(e => logger.error(e.stack));


    }

}

exports.importPrivKey = function (req, res) {
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {

        checkIfSlaveIsUnderMaintenance(req).then(maintenance => {
            if (!maintenance) {
                checkIfExporterIsRunning(req).then(run => {
                    if (!run) {

                        request({
                            url: 'http://' + req.slaveHost + ':' + config.rpcport,
                            json: {'method': 'importprivkey', 'params': [req.body.privkey, userid, false]},
                            method: 'POST',
                            auth: {user: config.rpcuser, pass: req.slavePass}
                        }, function (err, httpResponse, bodyImportPrivKey) {
                            if (bodyImportPrivKey.error) {
                                res.status(200).json({error: bodyImportPrivKey.error.message})
                                logger.error(bodyImportPrivKey.error.message);
                            } else if (err || httpResponse.statusCode != 200) {
                                res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                logger.error(err);
                            } else {
                                logger.info('User ' + userid + ' just imported a priv key!');
                                pool.query('SELECT * FROM tobedeleted WHERE account=$1 AND address=$1 AND slave_id=$2', ['deleteMe', req.slaveId])
                                    .then(resp => {

                                        if (resp.rows.length == 0) {
                                            pool.query('INSERT INTO tobedeleted(account, address, slave_id) VALUES($1, $1, $2)', ['deleteMe', req.slaveId])
                                                .then(resp => {
                                                    res.status(200).send('Success');
                                                    logger.info('and a database entry was created!');
                                                }).catch(e => logger.error(e.stack));
                                        } else {
                                            res.status(200).send('Success');
                                        }

                                    }).catch(e => logger.error(e.stack));
                            }
                        });


                    } else {
                        res.status(200).send({error: 'The export script is currently running, please try again later!'})
                    }
                })

            } else {
                res.status(200).send({error: 'The server you are on is currently under maintenance, please try again later!'})
            }
        })






    }


}
exports.exportPrivKey = function (req, res) {

    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {
        checkIfEmailVerificationPassed(req,'export').then(passed => {
            if (passed) {
                request({
                    url: 'http://' + req.slaveHost + ':' + config.rpcport,
                    json: {'method': 'validateaddress', 'params': [req.body.exportAdd]},
                    method: 'POST',
                    auth: {user: config.rpcuser, pass: req.slavePass}
                }, function (err, httpResponse, bodyValAdd) {
                    if (err || httpResponse.statusCode != 200) {
                        res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                        logger.error(err);
                        logger.error(bodyValAdd.error.message);
                    } else {
                        if (bodyValAdd.result.ismine && bodyValAdd.result.account == userid) {
                            request({
                                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                json: {'method': 'dumpprivkey', 'params': [req.body.exportAdd]},
                                method: 'POST',
                                auth: {user: config.rpcuser, pass: req.slavePass}
                            }, function (err, httpResponse, bodyDumpPrivKey) {
                                if (err || httpResponse.statusCode != 200) {
                                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                    logger.error(err);
                                    logger.error(bodyDumpPrivKey.error.message);
                                } else {
                                    res.status(200).json({exportedPrivKey: bodyDumpPrivKey.result});
                                    logger.info('User ' + userid + ' just exported address ' + req.body.exportAdd);
                                }
                            });


                        }
                    }
                });
            } else {
                res.status(200).json({error: 'The provided email verification code is incorrect!'});
            }
        });


    }

}

exports.exportAndDeletePrivKey = function (req, res) {

    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {

        checkIfSlaveIsUnderMaintenance(req).then(maintenance => {
            if (!maintenance) {
                checkIfExporterIsRunning(req).then(run => {
                    if (!run) {
                        checkIfEmailVerificationPassed(req,'exportAndDelete').then(passed => {
                            if (passed) {
                                request({
                                    url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                    json: {'method': 'validateaddress', 'params': [req.body.exportAdd]},
                                    method: 'POST',
                                    auth: {user: config.rpcuser, pass: req.slavePass}
                                }, function (err, httpResponse, bodyValAdd) {
                                    if (err || httpResponse.statusCode != 200) {
                                        res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                        logger.error(err);
                                        logger.error(bodyValAdd.error.message);
                                    } else {
                                        if (bodyValAdd.result.ismine && bodyValAdd.result.account == userid) {
                                            request({
                                                url: 'http://' + req.slaveHost + ':' + config.rpcport,
                                                json: {'method': 'dumpprivkey', 'params': [req.body.exportAdd]},
                                                method: 'POST',
                                                auth: {user: config.rpcuser, pass: req.slavePass}
                                            }, function (err, httpResponse, bodyDumpPrivKey) {
                                                if (err || httpResponse.statusCode != 200) {
                                                    res.status(500).json({error: 'Our coin daemon seems to be offline, please reload the page in a few seconds'});
                                                    logger.error(err);
                                                    logger.error(bodyDumpPrivKey.error.message);
                                                } else {
                                                    logger.info('User ' + userid + ' just exported&deleted a priv key! Address:' + req.body.exportAdd);
                                                    pool.query('SELECT * FROM tobedeleted WHERE account=$1 AND address=$2 AND slave_id=$3', [userid, req.body.exportAdd, req.slaveId])
                                                        .then(resp => {
                                                            if (resp.rows.length == 0) {
                                                                pool.query('INSERT INTO tobedeleted(account, address, slave_id) VALUES($1, $2, $3)', [userid, req.body.exportAdd, req.slaveId])
                                                                    .then(resp => {
                                                                        res.status(200).json({exportedPrivKey: bodyDumpPrivKey.result});
                                                                        logger.info('and a database entry was created!');
                                                                    }).catch(e => logger.error(e.stack));
                                                            } else {
                                                                res.status(200).json({exportedPrivKey: bodyDumpPrivKey.result});
                                                            }

                                                        }).catch(e => logger.error(e.stack));


                                                }
                                            });


                                        }
                                    }
                                });
                            } else {
                                res.status(200).json({error: 'The provided email verification code is incorrect!'});
                            }
                        });

                    } else {
                        res.status(200).send({error: 'The export script is currently running, please try again later!'})
                    }
                })

            } else {
                res.status(200).send({error: 'The server you are on is currently under maintenance, please try again later!'})
            }
        })







    }

}

function checkIfExporterIsRunning(req) {


    return pool.query('SELECT * FROM runningexporter WHERE slave_id=$1', [req.slaveId])
        .then(resp => {
            if (resp.rows.length > 0) {
                return true;
            } else {
                return false;
            }
        }).catch(e => logger.error(e.stack));

    /*
        return psList().then(data => {
            if (data.find(function (proc) {
                    return proc.cmd === '/usr/bin/node /home/exporter/script/index.js'
                })) {
                return true;
            } else {
                return false;
            }
        });
    */
}

function checkIfSlaveIsUnderMaintenance(req) {


    return pool.query('SELECT * FROM slavemaintenance WHERE slave_id=$1', [req.slaveId])
        .then(resp => {
            if (resp.rows.length > 0) {
                return true;
            } else {
                return false;
            }
        }).catch(e => logger.error(e.stack));

}


function checkIf2faPassed(req) {


    return poolKey.query('SELECT value FROM credential WHERE user_id=$1 and type=$2', [req.kauth.grant.access_token.content.sub, 'totp'])
        .then(resp => {
            if (resp.rows.length == 1) {
                var verified = speakeasy.totp.verify({
                    secret: resp.rows[0].value,
                    encoding: 'ascii',
                    token: req.body.oneTimeCode,
                    window: 1
                });
                if (verified) {
                    return true;
                } else {
                    return false;

                }

            } else {
                return true;
            }
        }).catch(e => logger.error(e.stack));
}

function checkIfTxGetsConfirmations(slaveIp, slavePass, txid, slaveid) {
    var initialHeight = 0;
    var newHeight = 0;
    var slaveId = slaveid || 1;

    function getBlockHeight() {
        return new Promise(function (resolve, reject) {
            request({
                url: 'http://' + slaveIp + ':' + config.rpcport,
                json: {'method': 'getinfo'},
                method: 'POST',
                auth: {user: config.rpcuser, pass: slavePass}
            }, function (err, httpResponse, bodyInfo) {
                if (err || httpResponse.statusCode != 200) {
                    logger.error(err);
                    logger.error(bodyInfo.error.message);
                    reject(err);
                } else {
                    resolve(bodyInfo.result.blocks);
                }
            });
        });
    }

    if (slaveId <= 10) {
        getBlockHeight().then(blockHeight => {
            initialHeight = blockHeight;
            waitAndCheckAgain();
        })
    } else {
        logger.error(txid + ' seems to have huge problems, as 10 rebroadcasts did not work so far')
    }

    function waitAndCheckAgain() {
        setTimeout(function () {
            getBlockHeight().then(blockHeight => {
                newHeight = blockHeight;
                if (newHeight == initialHeight) {
                    waitAndCheckAgain();
                } else {
                    checkTx();
                }
            });
        }, 1000 * 60 * 2)
    }

    function checkTx() {
        request({
            url: 'http://' + slaveIp + ':' + config.rpcport,
            json: {'method': 'gettransaction', params: [txid]},
            method: 'POST',
            auth: {user: config.rpcuser, pass: slavePass}
        }, function (err, httpResponse, bodyTransaction) {
            if (err || httpResponse.statusCode != 200) {
                logger.error(err);
                logger.error(bodyTransaction.error.message);
            } else {
                if (bodyTransaction.result.confirmations == 0) {
                    logger.info(txid + ' seems to be stuck')
                    rebroadcastTx(bodyTransaction.result.hex);
                }
            }
        });

    }

    function rebroadcastTx(txHex) {
        pool.query('SELECT * FROM slaves WHERE id=$1', [slaveId])
            .then(resp => {
                if (resp.rows.length == 1) {
                    request({
                        url: 'http://' + resp.rows[0].ip + ':' + config.rpcport,
                        json: {
                            'method': 'sendrawtransaction',
                            'params': [txHex]
                        },
                        method: 'POST',
                        auth: {user: config.rpcuser, pass: resp.rows[0].password}
                    }, function (err, httpResponse, bodySendRaw) {
                        if (bodySendRaw.error) {
                            logger.error(bodySendRaw.error.message);
                        } else if (err || httpResponse.statusCode != 200) {
                            logger.error(err);
                        } else {
                            logger.info('Rebroadcasted txid: ' + bodySendRaw.result + ' on slave ' + slaveId + ' (' + resp.rows[0].ip + ')');
                            checkIfTxGetsConfirmations(slaveIp/*resp.rows[0].ip*/, slavePass/*resp.rows[0].password*/, bodySendRaw.result, (slaveId + 1));
                        }
                    });
                }

            }).catch(e => logger.error(e.stack));
    }


}

exports.getSlaveStatus=function(req,res){
    var status=[];
    var countReq=0;
    if(req.kauth.grant.access_token.content.realm_access.roles.includes('mod'))
    pool.query('SELECT * FROM slaves', [])
        .then(respSlaves => {
            respSlaves.rows.forEach(function(slave){
                request({
                    url: 'http://' + slave.ip + ':' + config.rpcport,
                    json: {
                        'method': 'getinfo'
                    },
                    method: 'POST',
                    maxAttempts: 1,
                    auth: {user: config.rpcuser, pass: slave.password}
                }, function (err, httpResponse, bodyStatus) {
                    countReq++;
                    if (bodyStatus.error) {
                        logger.error(bodyStatus.error.message);
                        status.push({id:slave.id,version:'NOT ONLINE',balance:'NOT ONLINE',blocks:'NOT ONLINE',connections:'NOT ONLINE'})
                    } else if (err || httpResponse.statusCode != 200) {
                        logger.error(err);
                        status.push({id:slave.id,version:'NOT ONLINE',balance:'NOT ONLINE',blocks:'NOT ONLINE',connections:'NOT ONLINE'})
                    } else {
                        status.push({id:slave.id,version:bodyStatus.result.version,balance:bodyStatus.result.balance,blocks:bodyStatus.result.blocks,connections:bodyStatus.result.connections})
                    }
                    if(countReq==respSlaves.rows.length)
                        res.json(status)
                });



            })


        }).catch(e => console.error(e.stack));
}


exports.sendEmailVerification=function(req,res){

    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {
        checkIf2faPassed(req).then(passed => {
            if (passed) {

                var text,uuid,html;
                text='hi there,\n' +
                    'The following  address ('+req.headers['x-forwarded-for'].split(',')[0]+')  just requested ';
                html='hi there,<br>' +
                    'The following  address ('+req.headers['x-forwarded-for'].split(',')[0]+')  just requested ';
                uuid=uuidv4();
                if(req.body.type=='export'){
                    html+='an export for one of your address in your web-wallet account.<br>'+
                        'The verification code is: <b>'+uuid+'</b><br>'+
                        'Please copy/paste this code into the web wallet.<br><br>'+
                        'If you did not request this, it is highly advised on changing your password.<br><br>'+
                        'Best regards,<br>'+
                        'The web wallet team';
                    text+='an export for one of your address in your web-wallet account.\n'+
                    'The verification code is: '+uuid+'\n'+
                        'Please copy/paste this code into the web wallet.\n\n'+
                        'If you did not request this, it is highly advised on changing your password.\n\n'+
                        'Best regards,\n'+
                        'The web wallet team';
                    writeToDb()
                }else if(req.body.type=='exportAndDelete'){
                    html+='an export and deletion for one of your address in your web-wallet account.<br>'+
                        'The verification code is: <b>'+uuid+'</b><br>'+
                        'Please copy/paste this code into the web wallet.<br><br>'+
                        'If you did not request this, it is highly advised on changing your password.<br><br>'+
                        'Best regards,<br>'+
                        'The web wallet team';
                    text+='an export and deletion for one of your address in your web-wallet account.\n'+
                        'The verification code is: '+uuid+'\n'+
                        'Please copy/paste this code into the web wallet.\n\n'+
                        'If you did not request this, it is highly advised on changing your password.\n\n'+
                        'Best regards,\n'+
                        'The web wallet team';
                    writeToDb()
                }else if(req.body.type=='send'){
                    html+='a transaction from your web-wallet account.<br>'+
                        'The verification code is: <b>'+uuid+'</b><br>'+
                        'Please copy/paste this code into the web wallet.<br><br>'+
                        'If you did not request this, it is highly advised on changing your password.<br><br>'+
                        'Best regards,<br>'+
                        'The web wallet team';
                    text+='a transaction from your web-wallet account.\n'+
                        'The verification code is: '+uuid+'\n'+
                        'Please copy/paste this code into the web wallet.\n\n'+
                        'If you did not request this, it is highly advised on changing your password.\n\n'+
                        'Best regards,\n'+
                        'The web wallet team';
                    writeToDb()
                }

                function writeToDb(){

                    pool.query('DELETE FROM emailverification WHERE user_id=$1', [userid])
                        .then(respDel => {
                            pool.query('INSERT INTO emailverification(user_id,uuid,type,ip) VALUES($1,$2,$3,$4)', [userid,uuid,req.body.type,req.headers['x-forwarded-for'].split(',')[0]])
                                .then(resp => {
                                    if(resp.rowCount==1){
                                        sendEmail();
                                    }
                                }).catch(e => logger.error(e.stack));

                        }).catch(e => logger.error(e.stack));
                }


                function sendEmail(){
                    transporter.sendMail({
                        from: 'info@poswallet.io',
                        to: req.kauth.grant.access_token.content.preferred_username,
                        subject: 'Verification code',
                        text: text,
                        html: html
                    }, (err, info) => {
                        if (err) {
                            logger.error(err);

                        } else {
                            logger.info('Sent email to user!');
                            res.send('Success')
                        }
                    });
                }




            }else{
                res.status(200).json({error: 'The provided one-time code is incorrect!'});
            }
        });




    }

}

function checkIfEmailVerificationPassed(req, type) {


    return pool.query('SELECT uuid FROM emailverification WHERE user_id=$1 and uuid=$2 and type=$3 and ip=$4', [req.kauth.grant.access_token.content.sub, req.body.emailVerificationCode, type,req.headers['x-forwarded-for'].split(',')[0]])
        .then(resp => {
            if (resp.rows.length == 1) {

                return pool.query('DELETE FROM emailverification WHERE user_id=$1 and uuid=$2 and type=$3 and ip=$4', [req.kauth.grant.access_token.content.sub, req.body.emailVerificationCode, type,req.headers['x-forwarded-for'].split(',')[0]])
                    .then(resp => {
                        if (resp.rowCount == 1) {
                            return true;
                        } else {
                            return false;
                        }
                    }).catch(e => logger.error(e.stack));


            } else {
                return false;
            }
        }).catch(e => logger.error(e.stack));
}


exports.getBlockHeight = function (req, res) {
    var userid = req.kauth.grant.access_token.content.sub;
    if (userid != null && userid != undefined) {
        request({
            url: 'http://' + req.slaveHost + ':' + config.rpcport,
            json: {'method': 'getinfo'},
            method: 'POST',
            auth: {user: config.rpcuser, pass: req.slavePass}
        }, function (err, httpResponse, bodyGetInfo) {
            if (bodyGetInfo.error) {
                logger.error(bodyGetInfo.error.message);
            } else if (err || httpResponse.statusCode != 200) {
                logger.error(err);
            } else {
                res.json(bodyGetInfo.result.blocks)
            }
        });
    }




}