angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAccountArchiveCtrl", class ExchangeAccountArchiveCtrl {
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

        load () {

        }

        cancel () {

        }

        update () {

        }
    });
