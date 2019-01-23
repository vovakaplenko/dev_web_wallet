<template>
    <div class="page-content fade-in-up" v-if="dashboard.difficulty">
        <div class="row">
            <div class="col-lg-3 col-md-6">
                <div class="ibox widget-stat">
                    <div class="ibox-body">
                        <div @click="balanceIndex==2?balanceIndex=0:balanceIndex++" style="cursor:pointer">
                            <div style="height: 25px;">
                        <div class="text-muted" style="float:left; width: 210px">BALANCE </div>
                                <div style="padding 2px;"><i aria-hidden="true" class="fa fa-refresh" style="font-size: 14px; vertical-align: middle;"></i></div>
                            </div>
                        <h2 class="m-b-5 noselect" style="white-space: nowrap;">{{balanceComp}}</h2>
                        </div>
                        <div @click="showSpendable=!showSpendable" style="cursor:pointer">
                            <div style="height: 25px;">
                                <div class="text-muted" style="float:left; width: 210px">{{ showSpendable?'SPENDABLE':'STAKING' }} </div>
                                <div style="padding 2px;"><i aria-hidden="true" class="fa fa-refresh" style="font-size: 14px; vertical-align: middle;"></i></div>
                            </div>
                            <h2 class="m-b-5 noselect" style="white-space: nowrap;">{{showSpendable?balanceSpendable:balanceStaking}} {{$parent.coinSymbol}}</h2>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="ibox widget-stat">
                    <div class="ibox-body">
                        <div class="text-muted m-b-20">{{$parent.coinSymbol}} VALUE </div>
                        <h2 class="m-b-5">{{btcValue}} BTC</h2>
                                                <div class="progress m-b-5">
                                                    <div class="progress-bar bg-success" :class="{'bg-success': priceChange>=0.0,'bg-danger':priceChange<0.0}" role="progressbar" style="height:5px;" v-bind:style="{width: Math.abs(priceChange) + '%'}" :aria-valuenow="Math.abs(priceChange)" aria-valuemin="0" aria-valuemax="100" v-if=""></div>
                                                </div>
                                                <div class="d-flex justify-content-between"><small>Last 24hr</small><span class="font-12" v-if="priceChange>=0.0" style="color:#28a745"><i class="fa fa-level-up"></i> {{priceChange}}%</span><span class="text-danger font-12" v-else><i class="fa fa-level-down"></i> {{priceChange}}%</span></div>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6">
                <div class="ibox widget-stat">
                    <div class="ibox-body">
                        <div class="text-muted">POW DIFFICULTY </div>
                        <h2 class="m-b-5">{{ dashboard.difficulty.PoW.toFixed(2) }}</h2>
                        <div class="text-muted">POS DIFFICULTY </div>
                        <h2 class="m-b-5">{{ dashboard.difficulty.PoS.toFixed(2) }}</h2>

                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="ibox widget-stat">
                    <div class="ibox-body">
                        <div class="text-muted m-b-20">ADDRESSES </div>
                        <h2 class="m-b-5">{{dashboard.addresses}}</h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-lg-12">
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div style="width:100%;display:flex;justify-content:space-between">
                                <h3 class="m-0">{{showLast100?'Last 100 transactions':'Recent transactions (from last 10000 blocks)'}}</h3>
                                <button type="button" class="btn btn-success" @click="showLast100=!showLast100;getDashboard()">{{showLast100?'Show recent':'Show last 100'}}</button>
                            </div>

                        </div>
                        <div class="ibox-fullwidth-block">
                            <table class="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th class="p-l-20" id="ttime">Time</th>
                                    <th id="tcategory">Category</th>
                                    <th id="tamount">Amount</th>
                                    <th id="ttxid">Txid</th>
                                    <th class="p-r-20" id="tto">To</th>
                                    <th id="tconfirms">Confirms</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="(transaction,index) in dashboard.transactions" :key="transaction.time" v-if="/*((page-1)*10-1)<index&&*/index<=(page*10-1)">
                                    <td class="p-l-20"><div v-if="transaction.category=='send'">{{new Date(transaction.time*1000).toLocaleString().replace(',','')}}</div><div v-else class="dotted" data-toggle="tooltip" data-placement="top" title="" :id="'tooltip'+index">{{new Date(transaction.time*1000).toLocaleString().replace(',','')}}</div></td>
                                    <td :class="{'table-success': transaction.category=='receive'||transaction.category=='minted','table-danger':transaction.category=='send'}">{{transaction.category}} <span v-if="transaction.category=='minted'" class='icon-mining'></span></td>
                                    <td>{{transaction.amount}} {{$parent.coinSymbol}}</td>
                                    <td><a @click="$parent.openInNewTab($parent.explorerurl+'tx/'+transaction.txid)" href="javascript:;">{{transaction.txid}}</a></td>
                                    <td class="p-r-20">{{transaction.address}}</td>
                                    <td class="tcenter"><span class="badge badge-success" v-if="((transaction.category=='receive'||transaction.category=='send')&&transaction.confirmations>=TxConfirmations)||transaction.confirmations>=PoSConfirmations">{{transaction.confirmations}}</span><span class="badge badge-default" v-else>{{transaction.confirmations}}</span></td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="ibox-footer text-center" v-if="page<Math.ceil(dashboard.transactions.length/10)"><a href="javascript:;" @click="page++;updateTooltip()">Show 10 more</a></div>
                </div>
            </div>
        </div>
        <footer class="page-footer">
            <div class="to-top" onClick="$('html, body').animate({ scrollTop: 0 }, 'fast');"><i class="fa fa-angle-double-up"></i></div>
            <div style="display: flex; justify-content: space-between;">
                <div>© 2018 <b>Devcore</b>. All rights reserved</div>
                <div><span class="badge badge-success">{{$parent.blocks}} blocks</span></div>
                <div style="display: flex; flex-direction:column;align-items: flex-end;">
                    <div><a href="https://www.devcore.io/terms-conditions">Terms &amp; Conditions</a></div>
                    <div><router-link to="eula">EULA</router-link></div>
                    <div><a href="https://discordapp.com/invite/27xFP5Y">Support</a></div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script>
    export default {

        data () {
            return {
                dashboard:{},
                showLast100:false,
                balance:0.0,
                balanceStaking:0.0,
                balanceSpendable:0.0,
                btcValue:0.0,
                btcPrice:0.0,
                priceChange:0.0,
                page:1,
                balanceIndex:0,
                showSpendable:false,
                PoSConfirmations: require('../configFrontend.js').PoSConfirmations,
                TxConfirmations:require('../configFrontend.js').TxConfirmations,
                PoSMaturityInHours: require('../configFrontend.js').PoSMaturityInHours,
                PoSMaturityInConfirms: require('../configFrontend.js').PoSMaturityInConfirms

            }
        },
        computed:{
            balanceComp:function(){
                switch(this.balanceIndex){
                    case 0:
                        return this.balance+' '+this.$parent.coinSymbol;
                        break;
                    case 1:
                        return (this.balance*this.btcValue).toFixed(8)+' BTC';
                        break;
                    case 2:
                        return (this.balance*this.btcValue*this.btcPrice).toFixed(8)+' USDT';
                        break;
                    default:
                        return 0;
                }
            }
        },
        methods:{
            updateTooltip:function(index){
                if(this.$route.path=='/dashboard'){
                var self=this;
                setTimeout(function(){
                    $('[data-toggle="tooltip"]').tooltip();
                    self.dashboard.transactions.forEach(function(curr,index,array){
                        if(self.PoSMaturityInHours){
                            var timediff=new Date().getTime()-curr.time*1000;
                            if(timediff>=self.PoSMaturityInHours*60*60*1000){
                                $('#tooltip'+index).attr('data-original-title', 'Coins are mature');
                            }else{
                                $('#tooltip'+index).attr('data-original-title', ((self.PoSMaturityInHours*60*60*1000-timediff)/(60*60*1000)).toFixed(1)+'h left till maturity');
                            }
                        }else if(self.PoSMaturityInConfirms){
                            if(self.PoSMaturityInConfirms<=curr.confirmations){
                                $('#tooltip'+index).attr('data-original-title', 'Coins are mature');
                            }else{
                                $('#tooltip'+index).attr('data-original-title', (self.PoSMaturityInConfirms-curr.confirmations)+' confirmations left till maturity');
                            }


                        }


                    });
                },50)
                }

                //$('#tooltip'+index).attr('data-original-title', "Copied!");
            },
            getDashboard: function(){
                this.$http.get('/getDashboard'+(this.showLast100?'?last100=true':'')).then(response => {


                this.dashboard=response.body;
                this.dashboard.transactions.sort(orderByProperty('time', 'amount')).reverse();
                var self=this;
                /*
                this.dashboard.transactions.forEach(function(transaction){
                    if(transaction.category=='minted'&&transaction.confirmations<80){
                        self.balance+=transaction.amount
                        self.balance=parseFloat(self.balance.toFixed(8))
                    }
                })
                */
                this.$nextTick(function () {
                    var self=this;
                        self.updateTooltip();
                })
                    function orderByProperty(prop) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        return function (a, b) {
                            var equality = a[prop] - b[prop];
                            if (equality === 0 && arguments.length > 1) {
                                return orderByProperty.apply(null, args)(a, b);
                            }
                            return equality;
                        };
                    }
            }, response => {
                    location.reload();
                });
            },
            getBTCValueAndChange: function(){
                this.$http.get('/getBTCValue').then(response => {
                    this.btcValue=response.body.btcValue;
                    this.priceChange=response.body.priceChange;
                    this.btcPrice=response.body.btcPrice;
            }, response => {
                    location.reload();
                });
            },
            getBalance: function(){
                this.$http.get('/getBalance').then(response => {
                    this.balance=response.body.balance/1;
                    this.balanceStaking=response.body.balanceStaking/1;
                    this.balanceSpendable=response.body.balanceSpendable/1;

            }, response => {
location.reload();
                });
            },

        },
        mounted: function(){
            if(window.location.protocol=='https:') {
                this.getDashboard();
                this.getBTCValueAndChange();
                this.getBalance();
                var self = this;
                if(!this.$parent.alreadyVisitedDashboard){
                    this.$parent.alreadyVisitedDashboard=true;
                    setInterval(function () {
                        self.getDashboard();
                        self.getBTCValueAndChange();
                        self.getBalance();
                    }, 60000)
                }
                this.$nextTick(function () {
                    $('.dropdown.active').removeClass('active');
                    $('.router-link-exact-active').parent().addClass('active');
                })
            }
        }
    }

</script>