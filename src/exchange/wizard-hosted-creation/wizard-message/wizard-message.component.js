{
    angular
        .module("Module.exchange.components")
        .component("exchangeWizardHostedCreationWizardMessage", {
            templateUrl: "exchange/wizard-hosted-creation/wizard-message/wizard-message.html",
            require: {
                homepage: "^^exchangeWizardHostedCreation"
            }
        });
}
