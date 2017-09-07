angular
    .module("Module.exchange.controllers")
    .controller("ExchangeToolboxDisclaimerCtrl", class ExchangeToolboxDisclaimerCtrl {
        constructor ($scope, navigation) {
            this.services = {
                $scope,
                navigation
            };
        }

        updateDisclaimer (disclaimer) {
            if (!disclaimer.taskPendingId) {
                this.services.navigation.setAction("exchange/disclaimer/update/disclaimer-update", angular.copy(disclaimer));
            }
        }

        deleteDisclaimer (disclaimer) {
            if (!disclaimer.taskPendingId) {
                this.services.navigation.setAction("exchange/disclaimer/remove/disclaimer-remove", angular.copy(disclaimer));
            }
        }
    });
