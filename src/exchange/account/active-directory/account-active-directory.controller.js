angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabActiveDirectoryCtrl", class ExchangeTabActiveDirectoryCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, navigation, $rootScope, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                navigation,
                $rootScope,
                exchangeStates
            };

            this.activeDirectoryLoading = true;
        }

        displayAccounts () {
            this.services.ExchangeAccountService.displayAccounts();
        }
    });
