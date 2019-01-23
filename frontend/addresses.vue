<template>
    <div class="page-content fade-in-up" v-if="addresses.length>0">
        <div class="row">
            <div class="col-lg-12">
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div>
                                <h3 class="m-0">Addresses</h3>
                            </div>

                        </div>
                        <div class="ibox-fullwidth-block">
                            <table class="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th scope="col" class="w-75">Address</th>
                                    <th scope="col" id="w-25">Balance</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="(address,index ) in addresses">
                                    <td><a @click="openInNewTab($parent.explorerurl+'address/'+address.address)" href="javascript:;">{{address.address}}</a> <i class="fa fa-clipboard" aria-hidden="true" @click="$parent.doCopy(address.address);changeTooltip(index);" style="cursor: pointer" data-toggle="tooltip" data-placement="top" title="Copy to clipboard" :id="'tooltip'+index"></i>
                                    </td>
                                    <td>{{address.balance.toFixed(8)}} {{$parent.coinSymbol}}</td>
                                </tr>

                                </tbody>
                            </table>
                        </div>
                        <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" id="modalAdd">
                            <div class="modal-dialog modal-lg" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Create new Address</h5>


                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-if="error" @click="error=''">
                                            <span aria-hidden="true">&times;</span>
                                        </button>

                                    </div>
                                    <div class="modal-body">
                                        <div v-if="error">
                                            <h4>An error occured while creating your new address</h4>
                                            Error: <b>{{error}}</b><br>
                                        </div>
                                    </div>
                                    <div class="modal-footer" v-if="error">

                                        <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="error=''">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <center><button type="button" class="btn btn-success" @click="getNewAddress()" id="createAddBut">Create new</button></center><br>
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
                addresses:[],
                error:'',
                csrfToken:''
            }
        },

        methods:{
            changeTooltip:function(index){
                $('#tooltip'+index).attr('data-original-title', "Copied!").tooltip('show');
                $('#tooltip'+index).on('hidden.bs.tooltip', function () {
                    $('#tooltip'+index).attr('data-original-title', "Copy to clipboard");
                })
            },
            getAddresses: function(){
                this.$http.get('/getAddresses?exact=true').then(response => {
                this.addresses=response.body;
                    this.csrfToken= response.headers.map['csrf-token'][0]
                    this.$nextTick(function () {
                        $('[data-toggle="tooltip"]').tooltip();
                    })

            }, response => {
                    location.reload();
                });
            },
            getNewAddress:function(){
                $('#createAddBut').css('display','none');
                this.$http.post('/getNewAddress',{},{headers:{'csrf-token':this.csrfToken}}).then(response => {

                    if(response.body.error){
                        this.error=response.body.error;
                        $('#modalAdd').modal({backdrop: 'static', keyboard: false});
                    }else{
                    this.addresses.push({address:response.body,balance:0.0});
                    }

                $('#createAddBut').css('display','inline-block');
            }, response => {
                    location.reload();
                });

            },
            openInNewTab: function (url){
        var win = window.open(url, '_blank');
        win.focus();
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