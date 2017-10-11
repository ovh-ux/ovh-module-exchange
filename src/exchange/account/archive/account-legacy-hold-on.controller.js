angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAccountLegacyHoldOnCtrl", class ExchangeAccountLegacyHoldOnCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, navigation, $rootScope, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                navigation,
                $rootScope,
                exchangeStates
            };
        }

        update () {

        }
    });
