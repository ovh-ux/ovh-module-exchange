angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabActiveDirectoryCtrl", class ExchangeTabActiveDirectoryCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, navigation, $rootScope, exchangeStates, User) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                navigation,
                $rootScope,
                exchangeStates,
                User
            };

            this.username = "loremipsum";
            this.password = "loremipsum";

            this.activeDirectoryPrice = "...";
            this.getActiveDirectoryPrice();
        }

        displayAccounts () {
            this.services.ExchangeAccountService.displayAccounts();
        }

        getActiveDirectoryPrice () {
            return this.services.User.getUser()
                .then((user) => this.services.Exchange.getActiveDirectoryPrice(user.ovhSubsidiary))
                .then((data) => {
                    this.activeDirectoryPrice = data;
                });
        }
    });
