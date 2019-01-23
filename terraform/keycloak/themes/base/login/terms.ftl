<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "title">
    ${msg("termsTitle")}
    <#elseif section = "header">
    ${msg("termsTitleHtml")}
    <#elseif section = "form">
    <div id="kc-terms-text">
        Devcore will not be responsible for any losses, damages or claims arising from events falling within the scope of the following five (5) categories and by clicking Accept you agree to these conditions:<br>
        1.    Mistakes made by the user of the Virtual Coin related software or service (i.e. forgotten/misplaced passwords, payments sent to wrong/inaccurate Virtual Coin addresses, and accidental deletion of wallets).<br>
        2.    Software problems of the Website and/or any Virtual Coin-related software or service (i.e. corrupted wallet files, improperly constructed transactions, unsafe cryptographic libraries, malware affecting the Website and/or any Virtual Coin-related software or service). All software, including wallets, are experimental in nature and come with no guarantee whatsoever. Users may download and use them at their own risk and Devcore takes no responsibility for the technical functionalities or the lack thereof<br>
        3.    Technical failures in the hardware of the user of any Virtual Coin-related software or service (i.e. data loss due to a faulty or damaged storage device) <br>
        4.    Security problems experienced by the user of any Virtual Coin-related software or service (i.e. unauthorized access to users' wallets and/or accounts).<br>
        5.    Actions or inactions of third parties and/or events experienced by third parties (i.e. bankruptcy of service providers, information security attacks on service providers, and fraud conducted by third parties).<br>
    </div>
    <form class="form-actions" action="${url.loginAction}" method="POST">
        <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}" name="accept" id="kc-accept" type="submit" value="${msg("doAccept")}"/>
        <input class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonLargeClass!}" name="cancel" id="kc-decline" type="submit" value="${msg("doDecline")}"/>
    </form>
    </#if>
</@layout.registrationLayout>