import Vue from 'vue';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';
import VueClipboard from 'vue-clipboard2';
import ToggleButton from 'vue-js-toggle-button'
Vue.use(ToggleButton)
Vue.use(VueRouter);
Vue.use(VueResource);
Vue.use(VueClipboard)
const dashboard = require('./dashboard.vue').default;
const addresses = require('./addresses.vue').default;
const send = require('./send.vue').default;
const importexport = require('./importexport.vue').default;
const eula = require('./eula.vue').default;
const notificationsettings = require('./notificationsettings.vue').default;
const slavestatus = require('./slavestatus.vue').default;



const routes = [
    { path: '/dashboard', component: dashboard },
    { path: '/addresses', component: addresses },
    { path: '/send', component: send },
    { path: '/importexport', component: importexport },
    { path: '/eula', component: eula },
    { path: '/notificationsettings', component: notificationsettings },
    { path: '/slavestatus', component: slavestatus }
    ]


const router = new VueRouter({
    routes // kurz für 'routes: routes'
})


var timer=new Date().getTime();

const app = new Vue({
    router,
    data: {
        username:'',
        error:'',
        '2fa':false,
        mod:false,
        alreadyVisitedDashboard:false,
        coinSymbol: require('../configFrontend.js').coinSymbol,
        explorerurl: require('../configFrontend.js').explorerurl,
        blocks:'-'
    },
    computed:{
        settingsLink:function(){

            return /*location.origin+*/'https://auth.poswallet.io/auth/realms/webwallet/account/password'
        }
    },
    methods: {
        getUser: function(){
            this.$http.get('/getUser').then(response => {
            this.username=response.body.username;
            this['2fa']=response.body['2fa'];
            this.mod=response.body.mod;

        }, response => {
                // error callback
            });
        },
        getBlockHeight: function(){
            this.$http.get('/getBlockHeight').then(response => {
                this.blocks=response.body;

            }, response => {
                // error callback
            });
        },
        openInNewTab: function (url){
            var win = window.open(url, '_blank');
            win.focus();
        },
        doCopy: function (toBeCopied) {
            this.$copyText(toBeCopied).then(function (e) {
//success
            }, function (e) {
//err
            })
        }
    },
    mounted: function(){
        if(window.location.protocol=='http:'){
            window.onload = function() {
                setTimeout(function () {
                    window.location.assign("https://" + window.location.hostname);
                }, 100)
            }
        }else{
            this.getUser();
            this.getBlockHeight();
            setInterval(()=>{
                this.getBlockHeight();
            },60000)
            if(this.$router.history.current.path=='/')
                this.$router.push('/dashboard');
        }


    },

    watch: {
        '$route' (to, from) {
            if(to.path=='/send'&&timer<=new Date().getTime()-1000*60*5){
                location.reload();
            }

        }
    }

}).$mount('.page-wrapper')
