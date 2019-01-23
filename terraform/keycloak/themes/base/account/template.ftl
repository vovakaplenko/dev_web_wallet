<#macro mainLayout active bodyClass>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <title>${msg("accountManagementTitle")}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico">


    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
           <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script type="text/javascript" src="${url.resourcesPath}/${script}"></script>
        </#list>
    </#if>
            <link href="https://dev.poswallet.io/assets/vendors/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet"/>
            <link href="https://dev.poswallet.io/assets/vendors/font-awesome/css/font-awesome.min.css" rel="stylesheet"/>
            <link href="https://dev.poswallet.io/assets/vendors/line-awesome/css/line-awesome.min.css" rel="stylesheet"/>
            <link href="https://dev.poswallet.io/assets/vendors/themify-icons/css/themify-icons.css" rel="stylesheet"/>
            <link href="https://dev.poswallet.io/assets/vendors/animate.css/animate.min.css" rel="stylesheet"/>
            <link href="https://dev.poswallet.io/assets/vendors/toastr/toastr.min.css" rel="stylesheet"/>
                <link href="https://dev.poswallet.io/assets/css/main.css" rel="stylesheet"/>
                <link href="https://dev.poswallet.io/css/custom.css" rel="stylesheet"/>
</head>
<body class="boxed-layout admin-console user ${bodyClass}">

        <!--
    <header class="navbar navbar-default navbar-pf navbar-main header">
        <nav class="navbar" role="navigation">
            <div class="navbar-header">
                <div class="container">
                    <h1 class="navbar-title">DEV WEB WALLET</h1>
                </div>
            </div>
            <div class="navbar-collapse navbar-collapse-1">
                <div class="container">
                    <ul class="nav navbar-nav navbar-utility">
                        <#if realm.internationalizationEnabled>
                            <li>
                                <div class="kc-dropdown" id="kc-locale-dropdown">
                                    <a href="#" id="kc-current-locale-link">${locale.current}</a>
                                    <ul>
                                        <#list locale.supported as l>
                                            <li class="kc-dropdown-item"><a href="${l.url}">${l.label}</a></li>
                                        </#list>
                                    </ul>
                                </div>
                            <li>

                        </#if>
                        <li><a href="http://dev.poswallet.io" class="btn btn-info" role="button">Back to Dashboard</a></li>
                        <#if referrer?has_content && referrer.url?has_content><li><a href="${referrer.url}" id="referrer">${msg("backTo",referrer.name)}</a></li></#if>
                        <li><a href="${url.logoutUrl}">${msg("doSignOut")}</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
-->

<div class="page-wrapper">
    <header class="header">
        <div class="clf header-topbar">
            <div class="wrapper">
                <div class="page-brand"><a class="link" href="https://dev.poswallet.io"><img src="https://dev.poswallet.io/img/dev-webwalletlogo.png" style="height:100%"/></a></div>

                <ul class="nav pull-left navbar-toolbar">
                    <li><a class="nav-link sidebar-toggler js-sidebar-toggler"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></a></li>
                </ul>

                <ul class="nav pull-right navbar-toolbar">

                </ul>
                <!-- END TOP-RIGHT TOOLBAR-->
                <!-- START SEARCH PANEL-->
            </div>
        </div>
        <div class="top-navbar clf">
            <div class="wrapper" id="navbar-wrapper">
                <ul class="nav-menu">
                    <li class="dropdown"><a href="https://dev.poswallet.io/#/" class="nav-link">Dashboard</a></li>
                    <li class="dropdown"><a href="https://dev.poswallet.io/#/addresses" class="nav-link">Addresses</a></li>
                    <li class="dropdown"><a href="https://dev.poswallet.io/#/send" class="nav-link">Send</a></li>
                    <li class="dropdown"><a href="https://dev.poswallet.io/#/importexport" class="nav-link">Import/Export</a></li>
                </ul>
            </div>
        </div>
    </header>

        <div class="container">
            <div class="bs-sidebar col-sm-3">
                <ul>
                    <!--<li class="<#if active=='account'>active</#if>"><a href="${url.accountUrl}">${msg("account")}</a></li>-->
                    <#if features.passwordUpdateSupported><li class="<#if active=='password'>active</#if>"><a href="${url.passwordUrl}">${msg("password")}</a></li></#if>
                    <li class="<#if active=='totp'>active</#if>"><a href="${url.totpUrl}">${msg("2FA")}</a></li>
                    <#if features.identityFederation><li class="<#if active=='social'>active</#if>"><a href="${url.socialUrl}">${msg("federatedIdentity")}</a></li></#if>
                    <li class="<#if active=='sessions'>active</#if>"><a href="${url.sessionsUrl}">${msg("sessions")}</a></li>
                    <#if features.log><li class="<#if active=='log'>active</#if>"><a href="${url.logUrl}">${msg("log")}</a></li></#if>
                </ul>
            </div>

            <div class="col-sm-9 content-area">
                <#if message?has_content>
                    <div class="alert alert-${message.type}">
                        <#if message.type=='success' ><span class="pficon pficon-ok"></span></#if>
                        <#if message.type=='error' ><span class="pficon pficon-error-octagon"></span><span class="pficon pficon-error-exclamation"></span></#if>
                        ${message.summary?no_esc}
                    </div>
                </#if>

                <#nested "content">
            </div>
        </div>


</div>




<script src="https://dev.poswallet.io/assets/vendors/jquery/dist/jquery.min.js" type="text/javascript"></script>

<!-- Bootstrap -->

<script src="https://dev.poswallet.io/assets/vendors/popper.js/dist/umd/popper.min.js" type="text/javascript"></script>
<script src="https://dev.poswallet.io/assets/vendors/bootstrap/dist/js/bootstrap.min.js" type="text/javascript"></script>
<script src="https://dev.poswallet.io/assets/vendors/jquery-slimscroll/jquery.slimscroll.min.js" type="text/javascript"></script>
<script src="https://dev.poswallet.io/assets/vendors/jquery-idletimer/dist/idle-timer.min.js" type="text/javascript"></script>
<script src="https://dev.poswallet.io/assets/vendors/toastr/toastr.min.js" type="text/javascript"></script>
<!-- PAGE LEVEL PLUGINS-->
<script src="https://dev.poswallet.io/assets/vendors/chart.js/dist/Chart.min.js" type="text/javascript"></script>
<script src="https://dev.poswallet.io/assets/vendors/jquery.easy-pie-chart/dist/jquery.easypiechart.min.js" type="text/javascript"></script>
<!-- CORE SCRIPTS-->
<script src="https://dev.poswallet.io/assets/js/app.js" type="text/javascript"></script>
</body>
</html>
</#macro>
