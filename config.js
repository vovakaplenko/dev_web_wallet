module.exports = {
    rpcuser: process.env.RPC_USER,
    rpcport: process.env.RPC_PORT,
    pguser: process.env.PG_USER,
    pgpass: process.env.PG_PASS,
    pghost: process.env.PG_HOST,
    pgdb: process.env.PG_DB,
    pgdbkey: process.env.PG_DBKEY,
    pgport: process.env.PG_PORT,
    oldPoSReward: 0.6,
    PoSReward: 0.8,
    blocktime300k: 1530274425, //blocktime in seconds
    PoSConfirmations: 80,
    TxConfirmations: 1,
    PoSMaturityInHours: 36, //in hours
    //DO NOT USE BOTH AT THE SAME TIME
//PoSMaturityInConfirms: 90,
    log4js: {
        appenders: {
            out: {type: 'console'},
            EXPRESS: {type: 'file', filename: './logs/express.log', maxLogSize: 10485760, backups: 3, compress: true},
            DEVWEBWALLET: {
                type: 'file',
                filename: './logs/devwebwallet.log',
                maxLogSize: 10485760,
                backups: 3,
                compress: true
            }
        },
        categories: {
            default: {appenders: ['out'], level: 'info'},
            DEVWEBWALLET: {appenders: ['out', 'DEVWEBWALLET'], level: 'info'},
            EXPRESS: {appenders: ['out', 'EXPRESS'], level: 'info'}
        }
    },
    sessionSecret: process.env.SESSION_SECRET,
    maxUserLimitPerSlave: 75,
    teamEmailAdd: process.env.TEAM_EMAIL, // to this email messages like "slaves are full" will be sent
    mailHost:process.env.MAIL_HOST,
    mailPort:process.env.MAIL_PORT,
    mailUser:process.env.MAIL_USER,
    mailPass:process.env.MAIL_PASS,
    kcClientId:process.env.KC_CLIENT_ID,
    kcPublicClient:true,
    kcServerUrl: process.env.KC_SERVER_URL,
    kcRealm: process.env.KC_REALM,
    kcSslRequired: process.env.KC_SSL_REQUIRED,
    poswalletUrl: 'https://dev.poswallet.io'
}
