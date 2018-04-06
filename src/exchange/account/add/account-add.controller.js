{
    class ExchangeAccountAdd {
        constructor ($scope, Exchange, exchangeAccount, translator) {
            this.$scope = $scope;

            this.Exchange = Exchange;
            this.exchangeAccount = exchangeAccount;
            this.translator = translator;
        }

        $onInit () {
            this.$routerParams = this.Exchange.getParams();
            this.newAccount = {};

            return this.fetchingAccountCreationOptions();
        }

        buildEmailAddress () {
            return `${this.newAccount.login}@${this.newAccount.domainName}`;
        }

        validateEmailAddress () {
            const newAccountEmailAddress = this.buildEmailAddress();

            const matchingEmailAddress = _(this.accountCreationOptions.takenEmails).find((emailAddress) => emailAddress === newAccountEmailAddress);
            return matchingEmailAddress;
        }

        fetchingAccountCreationOptions () {
            this.isFetchingCreationOptions = true;

            return this.Exchange
                .fetchingAccountCreationOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((accountCreationOptions) => {
                    this.accountCreationOptions = _(accountCreationOptions).assign({
                        availableTypes: transformAccountTypes.call(this, accountCreationOptions.availableTypes)
                    }).value();

                    this.newAccount.accountType = this.accountCreationOptions.availableTypes[0];
                    this.newAccount.domainName = this.accountCreationOptions.availableDomains[0];
                }).catch((error) => {
                    this.services.messaging.writeError(this.translator.tr("exchange_ACTION_add_account_option_fail"), error);
                }).finally(() => {
                    this.isFetchingCreationOptions = false;
                });

            function transformAccountTypes (availableTypes) {
                return availableTypes.map((type) => ({
                    name: type,
                    displayName: this.translator.tr(`exchange_tab_dedicatedCluster_account_type_${type}`)
                }));
            }
        }

        hide () {
            this.$scope.$emit(this.exchangeAccount.events.accountSwitch, { action: "hide" });
        }
    }

    const exchangeAccountAdd = {
        templateUrl: "exchange/account/add/account-add.html",
        controller: ExchangeAccountAdd
    };

    angular
        .module("Module.exchange.components")
        .component("exchangeAccountAdd", exchangeAccountAdd);
}
