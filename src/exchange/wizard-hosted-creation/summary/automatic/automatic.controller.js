angular
    .module("Module.exchange.controllers")
    .controller("exchangeWizardHostedCreationAutoController", class ExchangeWizardHostedCreationAutoController {
        constructor (Exchange, navigation, $scope, translator) {
            Object.assign(this, { Exchange, navigation, $scope, translator });
        }

        $onInit () {
            this.hostname = this.Exchange.value.hostname;
            this.domainName = this.navigation.currentActionData.domainName;

            this.$scope.hideCancelButton = () => true;
        }
    });
