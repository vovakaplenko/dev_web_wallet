var session = require('express-session');
var MemoryStore = require('memorystore')(session);
var Keycloak = require('keycloak-connect');
var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var path = require('path');
var nodemailer = require('nodemailer');
var csrf = require('csurf')
var csrfProtection = csrf({ cookie: false })

//var aws = require('aws-sdk');
//aws.config.update({region: 'us-east-1'});
//var memoryStore = new session.MemoryStore();
var memoryStore= new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
});
var config = require('./config.js');
let kcConfig = {
    clientId: config.kcClientId,
    publicClient: config.kcPublicClient,
    serverUrl: config.kcServerUrl,
    realm: config.kcRealm,
    sslRequired: config.kcSslRequired
};
var keycloak = new Keycloak({store: memoryStore}, kcConfig);
var dev = require('./dev.js');

const fs = require('fs');
const https = require('https');
const {Pool} = require('pg');


const pool = new Pool({
    user: config.pguser,
    host: config.pghost,
    database: config.pgdb,
    password: config.pgpass,
    port: config.pgport,
})
//const redirectHTTPMiddleware = require("aws-elb-redirect-http-middleware");
//const environment = process.env.NODE_ENV || "development";
/*
var awsmail = nodemailer.createTransport({
    SES: new aws.SES({
        apiVersion: '2010-12-01'
    })
});
*/
let transporter = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    secure: false,
    auth: {
        user: config.mailUser,
        pass: config.mailPass
    }
});

//if (environment === "production") app.use(redirectHTTPMiddleware);
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));
//Body-Parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//log4js
var log4js = require('log4js');
log4js.configure(config.log4js);
var logger = log4js.getLogger('EXPRESS');
app.use(log4js.connectLogger(logger, {level: 'auto'}));


app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};
var justLoggedin=[];
app.use(function(req,res,next){
    if(req.originalUrl.includes('auth_callback')){
        justLoggedin.push(req.headers['x-forwarded-for']);
    }

    next();
});




app.use(keycloak.middleware());
if(process.env.NODE_ENV=='maintenance'){
app.all('*', function (req, res) {
    res.status(200).sendFile(path.join(__dirname, './frontend/maintenance.html'))
});
}





var getConnectionInfo = function (req, res, func) {
    var userid=req.kauth.grant.access_token.content.sub;
    justLoggedin.find(function(ip,index){if(ip==req.headers['x-forwarded-for']){justLoggedin.remove(index);

        pool.query('SELECT login FROM notificationsettings WHERE user_id=$1', [userid])
            .then(respNotSett => {
                if(respNotSett.rows.length==0){
                    sendEmail()
                }else{
                    if(respNotSett.rows[0].login)
                        sendEmail()
                }

            }).catch(e => console.error(e.stack));

        function sendEmail(){
        transporter.sendMail({
            from: 'info@poswallet.io',
            to: req.kauth.grant.access_token.content.preferred_username,
            subject: 'Successful login',
            text: 'Hey there,\n someone successfully logged into your account at https://dev.poswallet.io.\n\n ' +
            'IP Address: '+req.headers['x-forwarded-for'].split(',')[0]+'\n\nIf this wasn\'t you, change your password immediately! \n'
        }, (err, info) => {
            if (err) {
                logger.error(err);
            } else {
                logger.info('Sent email to user!')
            }
        });
        }

    }
    });

    pool.query('SELECT password, ip, id FROM connections,slaves WHERE slave_id=id AND user_id=$1', [userid])
        .then(respConInfo => {
            if (respConInfo.rows.length == 1) {
                req.slaveId = respConInfo.rows[0].id;
                req.slaveHost = respConInfo.rows[0].ip;
                req.slavePass = respConInfo.rows[0].password;
                func(req, res);


            } else if (respConInfo.rows.length == 0) {
                pool.query('SELECT slaves.*, (SELECT COUNT(*) FROM connections WHERE connections.slave_id = slaves.id) FROM slaves ORDER BY count ASC')
                    .then(respSlaveConCount => {
                        if (respSlaveConCount.rows[0].count >= config.maxUserLimitPerSlave) {
                            res.status(404).sendFile(path.join(__dirname, './frontend/serverfull.html'))
                            transporter.sendMail({
                                from: 'info@poswallet.io',
                                to: config.teamEmailAdd,
                                subject: 'WEB WALLET IS FULL',
                                text: 'Hey there,\n all slaves are currently full with users! Because of this, it is ' +
                                'currently not possible to accept new users. \nSo please either increase the maximum users per slave limit or go to AWS and deploy more slaves. \n' +
                                'Maximum user per slave limit is: ' + config.maxUserLimitPerSlave + '\n' +
                                'Number of slaves: ' + respSlaveConCount.rows.length
                            }, (err, info) => {
                                if (err) {
                                    logger.error(err);
                                } else {
                                    logger.info('Sent email to team!')
                                }
                            });
                        } else {
                            pool.query('INSERT INTO connections(user_id,slave_id) VALUES($1,$2)', [userid, respSlaveConCount.rows[0].id])
                                .then(respConCreate => {
                                    req.slaveId = respSlaveConCount.rows[0].id;
                                    req.slaveHost = respSlaveConCount.rows[0].ip;
                                    req.slavePass = respSlaveConCount.rows[0].password;
                                    func(req, res);
                                }).catch(e => console.error(e.stack));
                        }
                    }).catch(e => console.error(e.stack));

            } else {
                logger.error('Too many db entries for same user!!!');
                res.send('Please contact the DEVCORE dev team if you see this!')
            }

        }).catch(e => console.error(e.stack));

}

function checkIfEulaAndTCAccepted(req, res, func){
    var userid=req.kauth.grant.access_token.content.sub;
    pool.query('SELECT * FROM eulaandtcaccepted WHERE user_id=$1', [userid])
        .then(respEula => {
            if(respEula.rows.length==0){
                res.status(200).sendFile(path.join(__dirname, './frontend/eulaandtc.html'))
            }else{
                getConnectionInfo(req, res, func);
            }

        }).catch(e => console.error(e.stack));

}


app.get('/', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req,res,dev.checkAccount);
});

app.get('/getUser', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getUser);
});

app.get('/getDashboard', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getDashboard);
});

app.get('/getAddresses', keycloak.protect(), csrfProtection, function (req, res) {
    res.set('csrf-token', req.csrfToken());
    checkIfEulaAndTCAccepted(req, res, dev.getAddresses);
});
app.get('/getBTCValue', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getBTCValue);
});

app.post('/getNewAddress', keycloak.protect(), csrfProtection, function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getNewAddress);
});

app.get('/getBalance', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getBalance);
});

app.post('/sendTransaction', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.sendTransaction);
});

app.post('/importPrivKey', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.importPrivKey);
});

app.post('/exportPrivKey', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.exportPrivKey);
});

app.post('/exportAndDeletePrivKey', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.exportAndDeletePrivKey);
});

app.post('/acceptEulaAndTC', keycloak.protect(), function (req, res) {
    var userid=req.kauth.grant.access_token.content.sub;
    pool.query('SELECT * FROM eulaandtcaccepted WHERE user_id=$1', [userid])
        .then(respEula => {
            if(respEula.rows.length==0){
                pool.query('INSERT INTO eulaandtcaccepted(user_id) VALUES($1)', [userid])
                    .then(respEulaCreate => {
                        res.status(200).send('OK');
                    }).catch(e => console.error(e.stack));
            }else{
                res.status(200).send('You already accepted T&C and EULA.');
            }

        }).catch(e => console.error(e.stack));
});

app.post('/notificationSettings', keycloak.protect(), csrfProtection, function (req, res) {
    var userid=req.kauth.grant.access_token.content.sub;
    pool.query('SELECT mobil,stake,login FROM notificationsettings WHERE user_id=$1', [userid])
        .then(respNotSett => {
            if(respNotSett.rows.length==0){
                pool.query('INSERT INTO notificationsettings(mobil,stake,login,user_id) VALUES($1,$2,$3,$4)', [req.body.mobil,req.body.stake,req.body.login,userid])
                    .then(respNotSettSave => {
                        res.status(200).send('OK');
                    }).catch(e => console.error(e.stack));
            }else{
                pool.query('UPDATE notificationsettings SET mobil=$1, stake=$2, login=$3 WHERE user_id=$4', [req.body.mobil,req.body.stake,req.body.login,userid])
                    .then(respNotSettSave => {
                        res.status(200).send('OK');
                    }).catch(e => console.error(e.stack));
            }

        }).catch(e => console.error(e.stack));
});

app.get('/notificationSettings', keycloak.protect(), csrfProtection, function (req, res) {
    var userid=req.kauth.grant.access_token.content.sub;
    pool.query('SELECT mobil,stake,login FROM notificationsettings WHERE user_id=$1', [userid])
        .then(respNotSett => {
            res.set('csrf-token', req.csrfToken());
            if(respNotSett.rows.length==0){
                res.status(200).json({mobil:false,login:true,stake:true})
            }else{
                res.status(200).json({mobil:respNotSett.rows[0].mobil,login:respNotSett.rows[0].login,stake:respNotSett.rows[0].stake})
            }
        }).catch(e => console.error(e.stack));
});

app.get('/slaveStatus', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getSlaveStatus);
});

app.get('/healthcheck', function (req, res) {
    res.status(200).send('OK');
});


app.post('/emailVerification', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.sendEmailVerification);
});

app.get('/getBlockHeight', keycloak.protect(), function (req, res) {
    checkIfEulaAndTCAccepted(req, res, dev.getBlockHeight);
});
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    // handle CSRF token errors here
    res.status(403)
    res.send('Missing csrf token')
})

app.get('*', function (req, res) {
    res.status(404).sendFile(path.join(__dirname, './frontend/error_404.html'))
});



app.listen(8000, function () {
    logger.info('Dev Web Wallet listening on port 8000');
});


/*
function ensureSecure(req, res, next){
    if(req.protocol=='https'){
        // OK, continue
        return next();
    };
    // handle port numbers if you need non defaults
    // res.redirect('https://' + req.host + req.url); // express 3.x
    res.redirect('https://' + req.hostname + req.url); // express 4.x
}

const options = {
    cert: fs.readFileSync('./sslcert/fullchain.pem'),
    key: fs.readFileSync('./sslcert/privkey.pem')
};
https.createServer(options, app).listen(443);
*/
