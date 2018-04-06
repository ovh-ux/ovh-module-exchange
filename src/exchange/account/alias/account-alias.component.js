{
    class ExchangeAccountAlias {
        constructor ($scope, Exchange, exchangeAccount, exchangeStates, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                exchangeAccount,
                exchangeStates,
                navigation,
                messaging,
                translator
            };
        }

        $onInit () {
            this.$routerParams = this.services.Exchange.getParams();
            this.aliasesParams = {};

            this.aliasMaxLimit = this.services.Exchange.aliasMaxLimit;
            this.services.$scope.$on(this.services.Exchange.events.accountsChanged, () => this.refreshList());
        }

        getAliases ({ pageSize, offset }) {
            this.aliasesParams.pageSize = pageSize;
            this.aliasesParams.offset = offset;

            return this.services.Exchange.getAliases(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress, pageSize, offset - 1)
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
            this.services.Exchange.getAliases(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress, this.aliasesParams.pageSize, this.aliasesParams.offset - 1)
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

        hide () {
            this.services.$scope.$emit(this.services.exchangeAccount.events.accountSwitch, { action: "hide" });
        }

        deleteAlias (alias) {
            if (!alias.taskPendingId) {
                this.services.navigation.setAction("exchange/account/alias/remove/account-alias-remove", {
                    account: this.account,
                    alias
                });
            }
        }

        addAccountAlias () {
            const hasAccountCurrentlySelected = this.account;
            const doesNotExceedMaxNumber = this.account.aliases <= this.aliasMaxLimit;
            const accountIsOk = this.services.exchangeStates.constructor.isOk(this.account);

            if (hasAccountCurrentlySelected && doesNotExceedMaxNumber && accountIsOk) {
                this.services.navigation.setAction("exchange/account/alias/add/account-alias-add", this.account);
            }
        }

        getAddAliasTooltip () {
            if (this.account && this.account.aliases >= this.aliasMaxLimit) {
                return this.services.translator.tr("exchange_tab_ALIAS_add_alias_limit_tooltip");
            }

            return null;
        }
    }

    const exchangeAccountAlias = {
        templateUrl: "exchange/account/alias/account-alias.html",
        controller: ExchangeAccountAlias,
        bindings: {
            account: "<"
        }
    };

    angular
        .module("Module.exchange.components")
        .component("exchangeAccountAlias", exchangeAccountAlias);
}
