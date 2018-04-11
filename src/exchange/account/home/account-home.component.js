{
    class ExchangeAccountHomeController {
        constructor ($scope, accountTypes, Exchange, exchangeAccount, exchangeStates, exchangeVersion, messaging, navigation, officeAttach, translator) {
            this.$scope = $scope;

            this.accountTypes = accountTypes;
            this.Exchange = Exchange;
            this.exchangeAccount = exchangeAccount;
            this.exchangeStates = exchangeStates;
            this.exchangeVersion = exchangeVersion;
            this.messaging = messaging;
            this.navigation = navigation;
            this.officeAttach = officeAttach;
            this.translator = translator;
        }

        $onInit () {
            this.$scope.getAccounts = (count, offset) => this.getAccounts(count, offset);
            this.$scope.getLoading = () => this.loading;
            this.$scope.getAccountValue = () => this.accounts;
            this.$scope.subscribeToOfficeAttach = () => this.subscribeToOfficeAttach();

            this.$routerParams = this.Exchange.getParams();

            this.typesOfAccounts = ["ALL", "BASIC", "STANDARD", "ENTERPRISE"];
            this.filterType = "ALL";

            this.loading = false;
            this.accounts = null;
            this.displayAccounts();

            this.exchangeAccount.selectedAccount = null;
            this.noDomainFlag = true;

            this.exchange = this.Exchange.value;
            this.removeAccountInsteadOfReset = this.Exchange.removeAccountInsteadOfReset(this.exchange);

            this.spamTooltipContent = this.translator.tr("exchange_tab_ACCOUNTS_popover_span_text", [`#/ticket?serviceName=${this.$routerParams.productId}`]);

            this.$scope.$on(this.Exchange.events.accountsChanged, () => this.$scope.$broadcast("paginationServerSide.reload", "accountsTable"));

            return this.officeAttach.retrievingIfUserAlreadyHasSubscribed(this.$routerParams.productId)
                .then((userHasAlreadySubscribed) => {
                    this.canSubscribeToOfficeAttach = !userHasAlreadySubscribed;
                })
                .then(() => this.Exchange.fetchingAccountCreationOptions(this.$routerParams.organization, this.$routerParams.productId))
                .then((newAccountOptions) => { this.noDomainFlag = _.isEmpty(newAccountOptions.availableDomains); });
        }

        setFilter () {
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }

        onSearch () {
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }

        resetSearch () {
            this.search.value = null;
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }

        getAccounts (count, offset) {
            this.messaging.resetMessages();
            this.loading = true;

            return this.Exchange
                .getAccounts(count, offset, this.search.value, false, this.filterType === "ALL" ? null : this.filterType)
                .then((accounts) => {
                    this.accounts = accounts;

                    /* eslint-disable no-restricted-properties */
                    _.forEach(accounts.list.results, (account) => {
                        account.percentUse = Math.round(((account.currentUsage / Math.pow(1024, 2)) * 100) / account.quota);
                    });
                    /* eslint-enable no-restricted-properties */
                })
                .catch((failure) => {
                    this.messaging.writeError(this.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.loading = false;
                });
        }

        canOrderAccount () {
            const isExchange2010 = this.exchangeVersion.isVersion(2010);
            const isAfter2010 = this.exchangeVersion.isAfter(2010);
            const is25g = this.accountTypes.is25g();
            const isHosted = this.accountTypes.isHosted();
            const isDedicated = this.accountTypes.isDedicated();
            const isDedicatedCluster = this.accountTypes.isDedicatedCluster();

            return (isExchange2010 && is25g) || (isExchange2010 && isHosted) || (isAfter2010 && !isDedicated && !isDedicatedCluster);
        }

        canAddAccount () {
            const isExchange2010 = this.exchangeVersion.isVersion(2010);
            const isAfter2010 = this.exchangeVersion.isAfter(2010);
            const is25g = this.accountTypes.is25g();
            const isHosted = this.accountTypes.isHosted();
            const isDedicated = this.accountTypes.isDedicated();
            const isDedicatedCluster = this.accountTypes.isDedicatedCluster();

            return !is25g && ((isExchange2010 && !isHosted) || (isAfter2010 && (isDedicated || isDedicatedCluster)));
        }

        newAccount () {
            const numConfigureMeAccount = _.sum(this.accounts.list.results, (account) => account.domain === "configureme.me");
            const useAdding = this.accountTypes.isDedicated() || this.accountTypes.isDedicatedCluster() || (this.accountTypes.isProvider() && this.exchangeVersion.isVersion(2010));

            if (useAdding) {
                this.$scope.$emit(this.exchangeAccount.events.accountSwitch, { action: "add" });
            } else {
                this.navigation.setAction("exchange/account/order/account-order", { numConfigureMeAccount });
            }
        }

        subscribeToOfficeAttach () {
            this.navigation.setAction("exchange/office-attach/dialog/office-attach-dialog");
        }

        isEditable (account) {
            return (this.exchangeStates.constructor.isOk(account) || this.exchangeStates.constructor.isDoing(account) || this.exchangeStates.constructor.isInError(account)) && !this.noDomainFlag;
        }

        isConfigurable (account) {
            return this.exchangeStates.constructor.isOk(account);
        }

        editAccount (account) {
            const populateAccount = angular.copy(account);
            populateAccount.is25g = this.accountTypes.is25g();

            if (this.isEditable(account)) {
                this.navigation.setAction("exchange/account/update/account-update", populateAccount);
            }
        }

        displayAliases (account) {
            if (!this.accountTypes.is25g()) {
                this.$scope.$emit(this.exchangeAccount.events.accountSwitch, { action: "alias", args: { account } });
            }
        }

        configureAccountIsAuthorized () {
            return _.includes(this.exchange.nicType, this.Exchange.nicAdmin) || _.includes(this.exchange.nicType, this.Exchange.nicTech);
        }

        isOutlookCanBeOrdered (account) {
            return !account.outlook && !this.removeAccountInsteadOfReset && this.configureAccountIsAuthorized();
        }

        isOutlookCanBeActivated (account) {
            return !account.outlook && this.removeAccountInsteadOfReset && this.configureAccountIsAuthorized() && account.accountLicense !== "BASIC";
        }

        outlookSettings (account) {
            if (account.canBeConfigured) {
                this.navigation.setAction("exchange/account/outlook/account-outlook", angular.copy(account));
            }
        }

        orderOutlook (account) {
            if (account.canBeConfigured) {
                this.navigation.setAction("exchange/account/outlook/add/account-outlook-add", angular.copy(account));
            }
        }

        activateOutlook (account) {
            if (account.canBeConfigured) {
                this.navigation.setAction("exchange/account/outlook/activate/account-outlook-activate", angular.copy(account));
            }
        }

        shouldDisplayAccounts () {
            return this.exchangeAccount.shouldDisplayAccounts;
        }

        displayAccounts () {
            this.search = {
                value: null
            };

            this.exchangeAccount.selectedAccount = null;

            // TODO this.exchangeAccount.displayAccounts();
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }
    }

    const exchangeAccountHomeComponent = {
        templateUrl: "exchange/account/home/account-home.html",
        controller: ExchangeAccountHomeController
    };

    angular
        .module("Module.exchange.components")
        .component("exchangeAccountHome", exchangeAccountHomeComponent);
}