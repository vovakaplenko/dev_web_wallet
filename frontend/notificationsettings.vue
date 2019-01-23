<template>
    <div class="page-content fade-in-up" v-if="notificationSettings">
        <div class="row">
            <div class="col-lg-12">
                <div class="ibox">
                    <div class="ibox-body">
                        <div class="d-flex justify-content-between m-b-20">
                            <div>
                                <h3 class="m-0">Notification settings</h3>
                            </div>

                        </div>
                        <br>
                        <div class="ibox-fullwidth-block">

                            <div>


                                    <div class="form-group flex" style="padding-right:15px;">
                                        <label class="w-50 col-form-label">Receive emails on
                                            login?</label>
                                        <div class="w-50" style="display:flex;justify-content:flex-end">
                                            <toggle-button v-model="notificationSettings.login" :labels="true" @change="changed=true"/>
                                        </div>
                                    </div>
                                    <div class="form-group flex" style="padding-right:15px;">
                                        <label class="w-50 col-form-label">Receive emails on new
                                            stakes?</label>
                                        <div class="w-50" style="display:flex;justify-content:flex-end">
                                            <toggle-button v-model="notificationSettings.stake" :labels="true" @change="changed=true"/>
                                        </div>
                                    </div>
                                    <div class="form-group flex" style="padding-right:15px;">
                                        <label class="w-50 col-form-label">Receive mobile
                                            notifications? (coming soon)</label>
                                        <div class="w-50" style="display:flex;justify-content:flex-end">
                                            <toggle-button v-model="notificationSettings.mobil" :labels="true" :disabled="true" @change="changed=true"/>
                                        </div>
                                    </div>


                                <center>
                                    <button type="submit" class="btn btn-primary" v-if="changed" @click="saveNotificationSettings()">
                                        Save
                                    </button>
                                </center>


                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
        <footer class="page-footer">
            <div class="to-top" onClick="$('html, body').animate({ scrollTop: 0 }, 'fast');"><i
                    class="fa fa-angle-double-up"></i></div>
            <div style="display: flex; justify-content: space-between;">
                <div>© 2018 <b>Devcore</b>. All rights reserved</div>
                <div><span class="badge badge-success">{{$parent.blocks}} blocks</span></div>
                <div style="display: flex; flex-direction:column;align-items: flex-end;">
                    <div><a href="https://www.devcore.io/terms-conditions">Terms &amp; Conditions</a></div>
                    <div>
                        <router-link to="eula">EULA</router-link>
                    </div>
                    <div><a href="https://discordapp.com/invite/27xFP5Y">Support</a></div>
                </div>
            </div>
        </footer>
    </div>


</template>

<script>
    import Multiselect from 'vue-multiselect';

    export default {
        components: {Multiselect},
        data() {

            return {
                notificationSettings:null,
                changed:false,
                csrfToken:''
            }
        },
        methods: {
            getNotificationSettings: function () {
                this.$http.get('/notificationSettings').then(response => {
                    this.notificationSettings = response.body;
                    this.csrfToken= response.headers.map['csrf-token'][0]
                }, response => {
                    location.reload();
                });
            },

            saveNotificationSettings: function () {

                    this.$http.post('/notificationSettings', JSON.stringify(this.$data.notificationSettings), {headers:{'csrf-token':this.csrfToken}}).then(response => {
                        this.changed=false;
                    }, response => {
                        location.reload();
                    });
                }




        },
        mounted: function () {
            if (window.location.protocol == 'https:') {
                this.getNotificationSettings();
            }
        }
    }

</script>