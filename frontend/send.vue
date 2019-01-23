<template>
    <div class="page-content fade-in-up" v-if="balance||balance==0">
        <div class="row">
            <div class="col-lg-12">
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div>
                                <h3 class="m-0">Send transaction</h3>
                            </div>

                        </div>
                        <div class="ibox-fullwidth-block">
        <center>Balance: <b @click="transaction.amount=balance-0.0001;transaction.fee=0.0001" style="cursor: pointer">{{balance}} {{$parent.coinSymbol}} </b></center>
        <br>
                            <div v-if="balance!=0">
                            <div class="form-group flex">
                                <label class="w-25 col-form-label">Option</label>
                                <div class="w-50">
                                    <div class="form-check">
                                        <label class="form-check-label">
                                            <input class="form-check-input" type="radio" name="gridRadios" id="gridRadios2" value="advanced" v-model="option" >
                                            Advanced
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <label class="form-check-label">
                                            <input class="form-check-input" type="radio" name="gridRadios" id="gridRadios3" value="coinControl" v-model="option" @click.once="getAddresses();">
                                            Coin control
                                        </label>
                                    </div>
                                </div>
                            </div>

        <form>
            <div class="form-group flex">
                <label for="inputAdd" class="w-25 col-form-label">To</label>
                <div class="w-50">
                    <input type="text" class="form-control" id="inputAdd" :placeholder="$parent.coinSymbol+' Address'" v-model="transaction.sendTo" :class="{'is-danger': transaction.sendTo&&(transaction.sendTo.length!=34||transaction.sendTo.charAt(0)!='L')}">
                </div>
            </div>
            <div class="form-group flex">
                <label for="inputAmount" class="w-25 col-form-label">Amount</label>
                <div class="w-25">
                    <input type="text" class="form-control" id="inputAmount" :placeholder="'Max: '+(balance-0.0001).toFixed(8).toString()" v-model.number="transaction.amount" :class="{'is-danger': transaction.amount<0.00000001&&transaction.amount}">
                </div>
            </div>
            <div class="form-group flex">
                <label for="inputAmount" class="w-25 col-form-label">Fee</label>
                <div class="w-25">
                    <input type="text" class="form-control" id="inputFee" :placeholder="'Min: '+(0.0001).toString()+' ;Max: '+(0.1).toString()" v-model.number="transaction.fee" :class="{'is-danger': (transaction.fee<0.0001||transaction.fee>0.1)&&transaction.fee}">
                </div>
            </div>
            <div class="form-group flex">
                <label for="inputAmount" class="w-25 col-form-label">Total</label>
                <div class="w-25">
                    <input type="text" class="form-control" id="inputTotal" :placeholder="'Max: '+balance.toFixed(8).toString()" v-model.number="total" disabled :class="{'is-danger': total>balance}">
                </div>
            </div>
        </form>
            <div v-if="option=='coinControl'">
                <div class="form-group flex">
                    <label for="inputAdd" class="w-25 col-form-label">Inputs</label>
                    <div class="w-50">
                        <multiselect v-model="inputAdds"
                                     :options="addresses.filter(function(address){return address.address.length==34&&address.balance})"
                                     :multiple="true"
                                     placeholder="Pick some"
                                     track-by="address"
                                     :custom-label="customLabel">
                        </multiselect>
                    </div>
                </div>
                <div class="form-group flex">
                    <label for="inputAmount" class="w-25 col-form-label">Sum inputs</label>
                    <div class="w-25">
                        <input type="text" class="form-control" v-model.number="sumInputAdds" disabled :class="{'is-danger': total>sumInputAdds}">
                    </div>
                </div>
                <div class="form-group flex">
                    <label class="w-25 col-form-label">Option</label>
                    <div class="w-50">
                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="spendAll" :value="false" v-model="transaction.spendAll" >
                                Use minimum funds possible
                            </label>
                        </div>
                        <div class="form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="spendAll" :value="true" v-model="transaction.spendAll">
                                Use entire funds from selected address(es)
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group flex">
                    <label for="inputAmount" class="w-25 col-form-label">Difference (Input-Output)</label>
                    <div class="w-25">
                        <input type="text" class="form-control" v-model="difference" disabled :class="{'is-danger': total>sumInputAdds}">
                    </div>
                </div>
                <div class="form-group flex" v-if="(sumInputAdds-total)!=0">
                    <label for="inputAmount" class="w-25 col-form-label">Change address</label>
                    <div class="w-50">
                        <multiselect v-model="changeAdd"
                                     :options="addresses.filter(function(add){return add.address.charAt(0)=='L'||add.address=='Create new'})"
                                     :close-on-select="true"
                                     placeholder="Select one"
                                     track-by="address"
                                     :taggable="true"
                                     @tag="createNewAdd"
                                     tag-placeholder="Press enter to use this address"
                                     :custom-label="customLabelChangeAdd">
                        </multiselect>
                    </div>
                </div>


            </div>
                                <div v-if="$parent['2fa']" class="form-group flex">
                                    <label for="inputAdd" class="w-25 col-form-label">One-time code (2FA) </label>
                                    <div class="w-50">
                                        <input type="text" class="form-control" placeholder="One-time code (6 digits)" v-model="oneTimeCode" >
                                    </div>
                                </div>

            <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" id="modalTra">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">Transaction</h5>


                            <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-if="txid||error||verify" @click="txid='';error='';verify=false;">
                                <span aria-hidden="true">&times;</span>
                            </button>

                        </div>
                        <div class="modal-body">
                            <center><i class="fa fa-spinner fa-spin" style="font-size:100px" v-if="!txid&&!error&&!verify"></i></center>
                            <div v-if="txid">
                                <h4>Transaction was sent successfully!</h4>
                                Txid: <a @click="openInNewTab($parent.explorerurl+'tx/'+txid)" href="javascript:;">{{txid}}</a>

                            </div>
                            <div v-if="error">
                                <h4>An error occured while sending the transaction</h4>>
                                Error: <b>{{error}}</b><br>
                                <div v-if="error=='TX rejected'">Tipp: try to increase fee and try again!</div>

                            </div>
                            <div v-if="verify">
                                <h4>Please enter the email verification code</h4>
                                We sent an email to your account which includes a verification code. Please enter it to continue:<br>
                                <input type="text" class="form-control" placeholder="Email verification code" v-model="transaction.emailVerificationCode" >

                            </div>

                        </div>
                        <div class="modal-footer" v-if="txid||error">

                            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="txid='';error=''">Close</button>
                            <button type="button" class="btn btn-primary" @click="goToDashboard()">Back to Dashboard</button>

                        </div>

                        <div class="modal-footer" v-if="verify">
                            <button type="button" class="btn btn-primary" @click="sendTransaction();verify=false;">Submit</button>
                        </div>

                    </div>
                </div>
            </div>

            <center><button type="submit" class="btn btn-primary" v-if="($parent['2fa']?oneTimeCode.length==6:true)&&transaction.amount>=0.00000001&&transaction.fee>=0.0001&&transaction.fee<=0.1&&(total<=balance)&&transaction.sendTo.length==34&&transaction.sendTo.charAt(0)=='L'&&(((option=='coinControl'?true:false)&&sumInputAdds>=transaction.amount&&(changeAdd||sumInputAdds-total==0))||option=='advanced')" @click="requestEmailVerification()">Send</button></center>





                            </div>

        <div class="form-group flex" v-else>
            You do not have sufficient funds to make a transaction!
        </div>
                        </div>
                    </div>
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
    import Multiselect from 'vue-multiselect';
    export default {
        components: { Multiselect },
        data () {

            return {
                balance: 0.0,
                transaction: {
                    sendTo: '',
                    amount: '',
                    fee:0.0001,
                    inputAdds:[],
                    spendAll:false,
                    changeAdd:'',
                    emailVerificationCode:''

                },
                option:'advanced',
                txid:'',
                error:'',
                addresses: [],
                changeAdd:'',
                inputAdds:[],
                oneTimeCode:'',
                verify:false

            }
        },
        computed:{
          total:function(){
              if(!this.transaction.amount&&!this.transaction.fee){
                  return 0;
              }else{
              return parseFloat((parseFloat(this.transaction.amount==''?0:this.transaction.amount)+parseFloat(this.transaction.fee==''?0:this.transaction.fee)).toFixed(8));
              }
          },
            difference:function(){
              return (!this.transaction.spendAll?'<=':'')+(this.sumInputAdds-this.total).toFixed(8).toString();
            },
            sumInputAdds:function(){
              var sum=0;
                this.inputAdds.forEach(function(address,index,array){
                    sum+=address.balance;
                })
                return sum.toFixed(8);
            }
        },
        methods:{
            createNewAdd:function(address){
                if(address.length==34&&address.charAt(0)=='L'){
                this.changeAdd={address:address}
                }
            },
            getAddresses: function(){
                this.$http.get('/getAddresses').then(response => {
                    this.addresses=response.body;
                    this.addresses.push({address:'Create new'})
            }, response => {
                    location.reload();
                });
            },
            customLabel (option) {
                return `${option.address} - ${option.balance.toFixed(8)}`
            },
            customLabelChangeAdd (option) {
                return `${option.address}`
            },
            goToDashboard:function(){
                $('#modalTra').modal('hide');
                var self=this;
                $('#modalTra').on('hidden.bs.modal', function (e) {
                    self.$router.push({path:'/dashboard'});
                })

            },
            getBalance: function(){
                this.$http.get('/getBalance').then(response => {
                this.balance=parseFloat(response.body.balanceSpendable);
            }, response => {
                    location.reload();
                });
            },
            sendTransaction:function(){
                this.error='';
                this.txid='';
                var usedAdds='';
                var tempInputAdds=[];
                    this.inputAdds.forEach(function(add){
                    usedAdds+=add.address+'\n';
                    tempInputAdds.push(add.address)
                });
                this.transaction.inputAdds=tempInputAdds;
                this.transaction.changeAdd=this.changeAdd.address;
if(this.option=='coinControl'&&(this.sumInputAdds-this.total==0)){
this.transaction.changeAdd=this.inputAdds[0].address;
}
                    var userconfirm;
                    if(this.option=='advanced'){
                        userconfirm=confirm('You are about so send '+this.transaction.amount+' '+this.$parent.coinSymbol+' to '+this.transaction.sendTo+'.\nFee will be '+this.transaction.fee+' '+this.$parent.coinSymbol+'.\nAre you sure?');
                    }else{
                        userconfirm=confirm('You are about so send '+this.transaction.amount+' '+this.$parent.coinSymbol+' to '+this.transaction.sendTo+'.\nFee will be '+this.transaction.fee+' '+this.$parent.coinSymbol+'.\nFunds from the following address(es) will be used:\n'+usedAdds+((this.sumInputAdds-this.total)==0?'':('The difference of '+this.difference+' '+this.$parent.coinSymbol+' will be send to '+(this.changeAdd.address=='Create new'?'a new address':this.changeAdd.address)+'.\n'))+'\nAre you sure?')
                    }

                    if(userconfirm==true) {
                        this.error='';
                        this.$http.post('/sendTransaction',JSON.stringify(this.$data.transaction)).then(response => {
                            if(response.body.error){
                                this.error=response.body.error;
                                this.transaction.emailVerificationCode='';
                            }else{
                            this.txid=response.body.txid;
                            this.transaction.amount='';
                            this.transaction.fee='';
                            this.transaction.sendTo='';
                            this.transaction.inputAdds=[];
                            this.transaction.changeAdd='';
                            this.inputAdds=[];
                            this.changeAdd='';
                            this.getBalance();
                            if(this.option=='coinControl')
                            this.getAddresses();
                            }
                    }, response => {
                            location.reload();
                        });
                    }else{
                        $('#modalTra').modal('hide');
                        this.transaction.emailVerificationCode='';
                    }






            },
            requestEmailVerification: function(){
                $('#modalTra').modal({backdrop: 'static', keyboard: false})
                this.$http.post('/emailVerification',JSON.stringify({type:'send',oneTimeCode:this.oneTimeCode})).then(response => {
                    if(response.body=='Success'){
                        this.verify=true;

                    }else{
                        this.error=response.body.error;
                    }
                }, response => {
                    //    location.reload();
                });

            }

        },
        mounted: function(){
            if(window.location.protocol=='https:') {
                this.getBalance();
                this.$nextTick(function () {
                    $('.dropdown.active').removeClass('active');
                    $('.router-link-exact-active').parent().addClass('active');
                })
            }
        }
    }

</script>