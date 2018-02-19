{
    class controller {
        constructor (ovhUserPref, $rootScope, translator) {
            this.ovhUserPref = ovhUserPref;
            this.$rootScope = $rootScope;
            this.translator = translator;
        }

        hideSelfAndDisplayDomainConfiguration () {
            this.displayComponent({ componentName: "domain-configuration" });
        }
    }

    angular
        .module("Module.exchange.components")
        .component("exchangeWizardHostedCreationHeader", {
            templateUrl: "exchange/wizard-hosted-creation/first-step/header/header.html",
            controller,
            bindings: {
                displayComponent: "&"
            },
            require: {
                homepage: "^^exchangeWizardHostedCreation"
            }
        });
}
