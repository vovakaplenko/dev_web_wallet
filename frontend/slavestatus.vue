<template>
    <div class="page-content fade-in-up">
        <div class="row">
            <div class="col-lg-12">
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div>
                                <h3 class="m-0">Slave status</h3>
                            </div>

                        </div>
                        <div class="ibox-fullwidth-block">
                            <table class="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th scope="col" style="cursor:pointer" @click="status.sort(function(a,b){return a.id-b.id})"># <i class="fa fa-sort" aria-hidden="true"></i></th>
                                    <th scope="col" style="cursor:pointer" @click="status.sort(function(a,b){return a.version-b.version})">Version <i class="fa fa-sort" aria-hidden="true"></i></th>
                                    <th scope="col" style="cursor:pointer" @click="status.sort(function(a,b){return a.blocks-b.blocks})">Blocks <i class="fa fa-sort" aria-hidden="true"></i></th>
                                    <th scope="col" style="cursor:pointer" @click="status.sort(function(a,b){return a.connections-b.connections})">Connections <i class="fa fa-sort" aria-hidden="true"></i></th>
                                    <th scope="col" style="cursor:pointer" @click="status.sort(function(a,b){return a.balance-b.balance})">Balance <i class="fa fa-sort" aria-hidden="true"></i></th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="(stat,index ) in status" :key="stat.id">
                                    <td :class="{'table-danger': stat.version=='NOT ONLINE'}">{{stat.id}}</td>
                                    <td :class="{'table-danger': stat.version=='NOT ONLINE'}">{{stat.version}}</td>
                                    <td :class="{'table-danger': stat.version=='NOT ONLINE'}">{{stat.blocks}}</td>
                                    <td :class="{'table-danger': stat.version=='NOT ONLINE'}">{{stat.connections}}</td>
                                    <td :class="{'table-danger': stat.version=='NOT ONLINE'}">{{stat.balance}} </td>
                                </tr>

                                </tbody>
                            </table>
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
                status:[]
            }
        },

        methods:{

            getSlaveStatus: function(){
                this.$http.get('/slaveStatus').then(response => {
                this.status=response.body;
                this.status.sort(function(a,b){return a.id-b.id})

            }, response => {
                    location.reload();
                });
            },

        },
        mounted: function(){
            if(this.$parent.mod){
                if(window.location.protocol=='https:') {
                    this.getSlaveStatus();
                    this.$nextTick(function () {
                        $('.dropdown.active').removeClass('active');
                        $('.router-link-exact-active').parent().addClass('active');

                    })
                }
            }else{
                this.$router.push('dashboard')
            }

        }
    }

</script>