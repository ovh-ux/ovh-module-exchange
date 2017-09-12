angular
    .module("Module.exchange.controllers")
    .controller("ExchangeToolboxAccountsCtrl", class ExchangeToolboxAccountsCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, navigation, $rootScope, exchangeStates, accountTypes) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                navigation,
                $rootScope,
                exchangeStates,
                accountTypes
            };

            this.removeAccountInsteadOfReset = Exchange.removeAccountInsteadOfReset(Exchange.value);
        }

        isDisabled (account) {
            return !this.services.exchangeStates.constructor.isOk(account);
        }

        removeAccount (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                this.services.navigation.setAction("exchange/account/remove/account-remove", angular.copy(account));
            }
        }

        exportAsPst (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                this.services.navigation.setAction("exchange/account/export-as-pst/account-export-as-pst", angular.copy(account));
            }
        }

        upgrade300G (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                this.services.navigation.setAction("exchange/account/upgrade-300g/account-upgrade-300g", angular.copy(account));
            }
        }

        delegationSettings (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                this.services.navigation.setAction("exchange/account/delegation/account-delegation", angular.copy(account));
            }
        }

        aliasDisplay (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                this.services.ExchangeAccountService.displayAliases(account);
                this.services.$rootScope.$broadcast("paginationServerSide.loadPage", 1, "aliasTable");
            }
        }

        outlookSettings (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                this.services.navigation.setAction("exchange/account/outlook/account-outlook", angular.copy(account));
            }
        }

        removeOutlook (account) {
            if (this.services.exchangeStates.constructor.isOk(account)) {
                const actionVerb = account.deleteOutlook ? "cancel" : "remove";
                this.services.navigation.setAction(`exchange/account/outlook/remove/account-outlook-${actionVerb}`, angular.copy(account));
            }
        }
    });
