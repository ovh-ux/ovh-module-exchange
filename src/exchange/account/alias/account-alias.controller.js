angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabAliasCtrl", class ExchangeTabAliasCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, exchangeStates, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                exchangeStates,
                navigation,
                messaging,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.aliasLoading = false;

            this.aliasMaxLimit = Exchange.aliasMaxLimit;
            $scope.$on(Exchange.events.accountsChanged, () => {
                $scope.$broadcast("paginationServerSide.reload", "aliasTable");
            });

            $scope.getAliases = (count, offset) => this.getAliases(count, offset);
            $scope.getAliasesValue = () => this.aliases;
            $scope.getAliasLoading = () => this.aliasLoading;

            this.search = {
                value: null
            };

            $scope.$on(Exchange.events.accountsChanged, () => $scope.$broadcast("paginationServerSide.reload", "aliasTable"));
        }

        onSearch () {
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "aliasTable");
        }

        resetSearch () {
            this.search.value = null;
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "aliasTable");
        }

        getAliases (count, offset) {
            if (this.services.ExchangeAccountService.selectedAccount) {
                this.aliasLoading = true;
                this.services
                    .Exchange
                    .getAliases(this.$routerParams.organization, this.$routerParams.productId, this.services.ExchangeAccountService.selectedAccount.primaryEmailAddress, count, offset, this.search.value)
                    .then((data) => {
                        this.aliases = data;
                    })
                    .catch((err) => {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ALIAS_error_message"), err);
                    })
                    .finally(() => {
                        this.aliasLoading = false;
                    });
            }
        }

        displayAccounts () {
            this.search.value = null;
            this.services.ExchangeAccountService.selectedAccount = null;
            this.services.ExchangeAccountService.displayAccounts();
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "aliasTable");
        }

        deleteAlias (alias) {
            if (!alias.taskPendingId) {
                this.services.navigation.setAction("exchange/account/alias/remove/account-alias-remove", {
                    account: this.services.ExchangeAccountService.selectedAccount,
                    alias
                });
            }
        }

        addAccountAlias () {
            const hasAccountCurrentlySelected = this.services.ExchangeAccountService.selectedAccount;
            const doesNotExceedMaxNumber = this.services.ExchangeAccountService.selectedAccount.aliases <= this.aliasMaxLimit;
            const accountIsOk = this.services.exchangeStates.constructor.isOk(this.services.ExchangeAccountService.selectedAccount);

            if (hasAccountCurrentlySelected && doesNotExceedMaxNumber && accountIsOk) {
                this.services.navigation.setAction("exchange/account/alias/add/account-alias-add", this.services.ExchangeAccountService.selectedAccount);
            }
        }

        getAddAliasTooltip () {
            if (this.services.ExchangeAccountService.selectedAccount && this.services.ExchangeAccountService.selectedAccount.aliases >= this.aliasMaxLimit) {
                return this.services.translator.tr("exchange_tab_ALIAS_add_alias_limit_tooltip");
            }

            return null;
        }
    });
