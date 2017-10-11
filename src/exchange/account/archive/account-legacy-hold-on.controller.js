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

            this.account = navigation.currentActionData;
            this.value = angular.copy(this.account.litigation);
            this.days = angular.copy(this.account.litigationPeriod);
            this.unlimited = this.days === 0;

            this.firstTime = !this.value;
        }

        needsUpdate () {
            return this.value !== this.account.litigation ||
                this.days !== this.account.litigationPeriod;
        }

        update () {

        }
    });
