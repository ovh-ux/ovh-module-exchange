angular
    .module("Module.exchange.controllers")
    .controller("exchangeWizardHostedCreationManualController", class ExchangeWizardHostedCreationManualController {
        constructor (navigation, $scope, translator) {
            this.navigation = navigation;
            this.$scope = $scope;
            this.translator = translator;
        }

        $onInit () {
            this.domainName = this.navigation.currentActionData.domainName;

            this.$scope.hideCancelButton = () => true;
        }
    });
