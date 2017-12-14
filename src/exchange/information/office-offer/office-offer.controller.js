angular
    .module("Module.exchange.controllers")
    .controller("ExchangeOfficeOfferCtrl", class ExchangeOfficeOfferCtrl {
        constructor ($scope, Exchange, ExchangeInformationService, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangeInformationService,
                messaging,
                translator
            };

            $scope.getAccounts = (count, offset) => this.getAccounts(count, offset);
            $scope.getLoading = () => this.loading;
            $scope.getAccountValue = () => this.accounts;

            this.accountTypes = ["ALL", "BASIC", "STANDARD", "ENTERPRISE"];
            this.filterType = "ALL";

            this.loading = false;
            this.accounts = null;
            this.search = {
                value: null
            };

            this.exchange = Exchange.value;

            $scope.$on(Exchange.events.accountsChanged, () => $scope.$broadcast("paginationServerSide.reload", "accountsTable"));
        }

        displayDashboard () {
            this.services.ExchangeInformationService.displayDashboard();
        }

        getAccounts (count, offset) {
            this.services.messaging.resetMessages();
            this.loading = true;

            this.services
                .Exchange
                .getAccounts(count, offset, this.search.value, false, this.filterType === "ALL" ? null : this.filterType)
                .then((accounts) => {
                    this.accounts = accounts;
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.loading = false;
                });
        }
    });
