import Vue from 'vue';
import VueResource from 'vue-resource';
Vue.use(VueResource);



const app = new Vue({
    data: {
        eulaAccepted:false,
        tcAccepted:false,
    },
    computed:{
    },
    methods: {
        createDbEntry: function(){
            if(this.eulaAccepted&&this.tcAccepted)
            this.$http.post('/acceptEulaAndTC').then(response => {
                if(response.body=='OK'){
                    location.reload();
                }
            }, response => {
                // error callback
            });
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

        }


    },

}).$mount('.page-wrapper')
