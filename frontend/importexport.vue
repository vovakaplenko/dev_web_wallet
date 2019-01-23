<template>
    <div class="page-content fade-in-up">
        <div class="row">
            <div class="col-lg-12">
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div>
                                <h3 class="m-0">Import private key</h3>
                            </div>

                        </div>
                        <div class="ibox-fullwidth-block">
        <br><br>
        <form>
            <div class="form-group flex">
                <label for="inputAdd" class="w-25 col-form-label">Private key</label>
                <div class="w-50">
                    <input type="text" class="form-control" id="inputAdd" placeholder="DEV private key" v-model="privkey" >
                </div>
            </div>


            <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" id="modalImport">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">Import</h5>


                            <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-if="status||error" @click="status='';error=''">
                                <span aria-hidden="true">&times;</span>
                            </button>

                        </div>
                        <div class="modal-body">
                            <center><i class="fa fa-spinner fa-spin" style="font-size:100px" v-if="!status&&!error"></i></center>
                            <div v-if="status=='Success'">
                                <h4>Your private key was successfully imported and assigned to your account!</h4><br>
                                Hint: It can take up to 30 min, till the balance of the address is displayed correctly

                            </div>
                            <div v-if="error">
                                <h4>An error occured while importing</h4>>
                                Error: <b>{{error}}</b><br>

                            </div>
                        </div>
                        <div class="modal-footer" v-if="status||error">

                            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="status='';error=''">Close</button>
                            <button type="button" class="btn btn-primary" @click="goToDashboard()">Back to Dashboard</button>

                        </div>
                    </div>
                </div>
            </div>

            <center><button type="button" class="btn btn-success" @click="importPrivKey()" id="importprivkey" v-if="privkey">Import</button></center><br>


        </form>
                        </div>
                    </div>
                </div>
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div>
                                <h3 class="m-0">Export private key</h3>
                            </div>

                        </div>
                        <div class="ibox-fullwidth-block">
                            <br><br>
                            <form>
                                <div class="form-group flex">
                                    <label class="w-25 col-form-label">DEV address</label>
                                    <div class="w-50">
                                        <select v-model="exportAdd" class="form-control">
                                            <option disabled value="">Please select one</option>
                                            <option v-for="address in addresses">{{address.address}}</option>
                                        </select>
                                    </div>



                                </div>
                                <div class="form-group flex">
                                <label class="w-25 col-form-label">Option</label>
                                <div class="w-50">
                                    <div class="form-check">
                                        <label class="form-check-label">
                                            <input class="form-check-input" type="radio" name="gridRadios" id="gridRadios1" value="export" checked v-model="exportOption">
                                            Export private key
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <label class="form-check-label">
                                            <input class="form-check-input" type="radio" name="gridRadios" id="gridRadios2" value="exportAndDelete" v-model="exportOption">
                                            Export & delete private key from server
                                        </label>
                                    </div>
                                </div>
                                </div>
                                <div v-if="$parent['2fa']" class="form-group flex">
                                    <label for="inputAdd" class="w-25 col-form-label">One-time code (2FA) </label>
                                    <div class="w-50">
                                        <input type="text" class="form-control" placeholder="One-time code (6 digits)" v-model="oneTimeCode" >
                                    </div>
                                </div>


                                <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" id="modalExport">
                                    <div class="modal-dialog modal-lg" role="document">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <h5 class="modal-title" id="exampleModalLabel">Export</h5>


                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-if="exportedPrivKey||error||verify" @click="exportedPrivKey='';error='';verify=false">
                                                    <span aria-hidden="true">&times;</span>
                                                </button>

                                            </div>
                                            <div class="modal-body">
                                                <center><i class="fa fa-spinner fa-spin" style="font-size:100px" v-if="!exportedPrivKey&&!error&&!verify"></i></center>
                                                <div v-if="exportedPrivKey">
                                                    <h4>Your private key was successfully exported!</h4>
                                                    Private key: <b>{{exportedPrivKey}}</b><br>
                                                    <div v-if="exportOption=='exportAndDelete'">Hint: It can take up to 30 min, till your address disappears</div><br>


                                                </div>
                                                <div v-if="error">
                                                    <h4>An error occured while exporting</h4>
                                                    Error: <b>{{error}}</b><br>

                                                </div>
                                                <div v-if="verify">
                                                    <h4>Please enter the email verification code</h4>
                                                    We sent an email to your account which includes a verification code. Please enter it to continue:<br>
                                                    <input type="text" class="form-control" placeholder="Email verification code" v-model="emailVerificationCode" >

                                                </div>
                                            </div>
                                            <div class="modal-footer" v-if="exportedPrivKey||error">

                                                <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="exportedPrivKey='';error=''">Close</button>
                                                <button type="button" class="btn btn-primary" @click="goToDashboard()">Back to Dashboard</button>

                                            </div>

                                            <div class="modal-footer" v-if="verify">
                                                <button type="button" class="btn btn-primary" @click="exportPrivKey();verify=false;">Submit</button>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                <center><button type="button" class="btn btn-success" @click="requestEmailVerification()" id="exportprivkey" v-if="exportAdd&&exportOption&&($parent['2fa']?oneTimeCode.length==6:true)">Export</button></center><br>


                            </form>
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
    export default {

        data () {
            return {
                privkey:'',
                error:'',
                status:'',
                addresses:[],
                exportAdd:'',
                exportOption:'',
                exportedPrivKey:'',
                oneTimeCode:'',
                emailVerificationCode:'',
                verify:false
            }
        },
        methods:{
            goToDashboard:function(){
                $('#modalImport').modal('hide');
                $('#modalExport').modal('hide');
                this.$router.push({path:'/dashboard'});
            },
            getAddresses: function(){
                this.$http.get('/getAddresses').then(response => {
                    this.addresses=response.body;
            }, response => {
                    location.reload();
                });
            },
            importPrivKey: function(){
                $('#modalImport').modal({backdrop: 'static', keyboard: false})
                this.$http.post('/importPrivKey',JSON.stringify({privkey:this.$data.privkey})).then(response => {
                    if(response.body.error){
                    this.error=response.body.error;
                }else{
                    this.status=response.body;
                }
            }, response => {
                //    location.reload();
                });
            },
            exportPrivKey: function(){
                if(this.exportOption=='export'){
                    this.$http.post('/exportPrivKey',JSON.stringify({exportAdd:this.$data.exportAdd,emailVerificationCode:this.emailVerificationCode})).then(response => {
                        if(response.body.error){
                            this.error=response.body.error;
                            this.emailVerificationCode='';
                        }else{
                            this.exportedPrivKey=response.body.exportedPrivKey;
                        }
                    }, response => {
                        //    location.reload();
                    });
                }else if(this.exportOption=='exportAndDelete'){
                    var userconfirm;
                    if(this.$data.exportAdd.charAt(0)=='L'){
                        userconfirm=confirm('You are about to export and delete '+this.$data.exportAdd+',\nthis will also export and delete your segwit address (address starting with S).\n Please confirm to proceed');
                    }else if(this.$data.exportAdd.charAt(0)=='S'){
                        userconfirm=confirm('You are about to export and delete '+this.$data.exportAdd+',\nthis will also export and delete your legacy address (address starting with L).\n Please confirm to proceed');
                    }
                    if(userconfirm){
                        this.$http.post('/exportAndDeletePrivKey',JSON.stringify({exportAdd:this.$data.exportAdd,emailVerificationCode:this.emailVerificationCode})).then(response => {
                            if(response.body.error){
                                this.error=response.body.error;
                                this.emailVerificationCode='';
                            }else{
                                this.exportedPrivKey=response.body.exportedPrivKey;
                            }
                        }, response => {
                            //    location.reload();
                        });
                    }else{
                        $('#modalExport').modal('hide');
                        this.emailVerificationCode='';
                    }
                }

            },
            requestEmailVerification: function(){
                $('#modalExport').modal({backdrop: 'static', keyboard: false})
                this.$http.post('/emailVerification',JSON.stringify({type:this.exportOption,oneTimeCode:this.oneTimeCode})).then(response => {
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
                this.getAddresses();
                this.$nextTick(function () {
                    $('.dropdown.active').removeClass('active');
                    $('.router-link-exact-active').parent().addClass('active');
                })
            }
        }
    }

</script>