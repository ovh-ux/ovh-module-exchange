angular
    .module("Module.exchange.controllers")
    .controller("exchangeWizardHostedCreationManualController", class ExchangeWizardHostedCreationManualController {
        constructor (navigation, $scope, translator) {
            Object.assign(this, { navigation, $scope, translator });
        }

        $onInit () {
            this.domainName = this.navigation.currentActionData.domainName;

            this.$scope.hideCancelButton = () => true;
        }
    });
