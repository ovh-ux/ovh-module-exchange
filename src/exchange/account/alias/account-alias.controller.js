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
            this.aliasesParams = {};

            this.aliasMaxLimit = Exchange.aliasMaxLimit;
            $scope.$on(Exchange.events.accountsChanged, () => this.refreshList());
        }

        getAliases ({ pageSize, offset }) {
            this.aliasesParams.pageSize = pageSize;
            this.aliasesParams.offset = offset;

            return this.services.Exchange.getAliases(this.$routerParams.organization, this.$routerParams.productId, this.services.ExchangeAccountService.selectedAccount.primaryEmailAddress, pageSize, offset - 1)
                .then((data) => {
                    this.aliases = data.list.results;
                    return {
                        data: this.aliases,
                        meta: {
                            totalCount: data.count
                        }
                    };
                })
                .catch((err) => this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ALIAS_error_message"), err));
        }

        refreshList () {
            this.services.Exchange.getAliases(this.$routerParams.organization, this.$routerParams.productId, this.services.ExchangeAccountService.selectedAccount.primaryEmailAddress, this.aliasesParams.pageSize, this.aliasesParams.offset - 1)
                .then((data) => {
                    for (let i = 0; i < data.list.results.length; i++) {
                        this.aliases.splice(i, 1, data.list.results[i]);
                    }
                    for (let i = data.list.results.length; i < this.aliases.length; i++) {
                        this.aliases.splice(i, 1);
                    }
                })
                .catch((err) => this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ALIAS_error_message"), err));
        }

        displayAccounts () {
            this.services.ExchangeAccountService.displayAccounts();
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
