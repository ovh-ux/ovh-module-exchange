{
    class controller {
        constructor (ovhUserPref, $rootScope, translator) {
            Object.assign(this, { ovhUserPref, $rootScope, translator });
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
