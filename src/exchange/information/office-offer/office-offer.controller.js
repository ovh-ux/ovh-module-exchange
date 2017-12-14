angular
    .module("Module.exchange.controllers")
    .controller("ExchangeOfficeOfferCtrl", class ExchangeOfficeOfferCtrl {
        constructor ($scope, Exchange, ExchangeInformationService, exchangeStates, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangeInformationService,
                exchangeStates,
                navigation,
                messaging,
                translator
            };
        }

        displayDashboard () {
            this.services.ExchangeInformationService.displayDashboard();
        }
    });
