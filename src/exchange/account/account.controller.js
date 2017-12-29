angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabAccountsCtrl", class ExchangeTabAccountsCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, navigation, messaging, translator, exchangeVersion, accountTypes, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                navigation,
                messaging,
                translator,
                exchangeVersion,
                accountTypes,
                exchangeStates
            };

            $scope.getAccounts = (count, offset) => this.getAccounts(count, offset);
            $scope.getLoading = () => this.loading;
            $scope.getAccountValue = () => this.accounts;
            $scope.subscribeToOfficeAttached = () => this.subscribeToOfficeAttached();

            this.$routerParams = Exchange.getParams();

            this.accountTypes = ["ALL", "BASIC", "STANDARD", "ENTERPRISE"];
            this.filterType = "ALL";

            this.loading = false;
            this.accounts = null;
            this.displayAccounts();

            this.services.ExchangeAccountService.selectedAccount = null;
            this.noDomainFlag = true;

            this.exchange = Exchange.value;
            this.removeAccountInsteadOfReset = Exchange.removeAccountInsteadOfReset(this.exchange);

            this.services
                .Exchange
                .getNewAccountOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((data) => { this.noDomainFlag = _.isEmpty(data.availableDomains); });

            this.spamTooltipContent = this.services.translator.tr("exchange_tab_ACCOUNTS_popover_span_text", [`#/ticket?serviceName=${this.$routerParams.productId}`]);

            $scope.$on(Exchange.events.accountsChanged, () => $scope.$broadcast("paginationServerSide.reload", "accountsTable"));
        }

        setFilter () {
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }

        onSearch () {
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }

        resetSearch () {
            this.search.value = null;
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }

        shouldShowAccounts () {
            return this.services.ExchangeAccountService.shouldShowAccounts;
        }

        getAccounts (count, offset) {
            this.services.messaging.resetMessages();
            this.loading = true;

            this.services
                .Exchange
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
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.loading = false;
                });
        }

        canOrderAccount () {
            const isExchange2010 = this.services.exchangeVersion.isVersion(2010);
            const isAfter2010 = this.services.exchangeVersion.isAfter(2010);
            const is25g = this.services.accountTypes.is25g();
            const isHosted = this.services.accountTypes.isHosted();
            const isDedicated = this.services.accountTypes.isDedicated();

            return (isExchange2010 && is25g) || (isExchange2010 && isHosted) || (isAfter2010 && !isDedicated);
        }

        canAddAccount () {
            const isExchange2010 = this.services.exchangeVersion.isVersion(2010);
            const isAfter2010 = this.services.exchangeVersion.isAfter(2010);
            const is25g = this.services.accountTypes.is25g();
            const isHosted = this.services.accountTypes.isHosted();
            const isDedicated = this.services.accountTypes.isDedicated();

            return !is25g && ((isExchange2010 && !isHosted) || (isAfter2010 && isDedicated));
        }

        newAccount () {
            if (this.services.accountTypes.is25g()) {
                this.services.navigation.setAction("exchange/account/order/account-order");
            } else if (this.services.accountTypes.isDedicated()) {
                this.services.navigation.setAction("exchange/account/add/account-add");
            } else if (this.services.accountTypes.isProvider() && this.services.exchangeVersion.isVersion(2010)) {
                this.services.navigation.setAction("exchange/account/add/account-add");
            } else {
                this.services.navigation.setAction("exchange/account/order/account-order");
            }
        }

        subscribeToOfficeAttached () {
            this.services.navigation.setAction("exchange/office-attached/dialog/office-attached-dialog");
        }

        isEditable (account) {
            return (account.canBeConfigured ||
                    this.services.exchangeStates.constructor.isDoing(account) ||
                    this.services.exchangeStates.constructor.isInError(account) ||
                    _.includes(this.services.Exchange.dummy_domains, account.domain)) && !this.noDomainFlag;
        }

        hasDummyDomain (account) {
            return _.includes(this.services.Exchange.dummy_domains, account.domain);
        }

        editAccount (account) {
            const populateAccount = angular.copy(account);
            populateAccount.is25g = this.services.accountTypes.is25g();
            if (this.isEditable(account)) {
                this.services.navigation.setAction("exchange/account/update/account-update", populateAccount);
            }
        }

        displayAliases (account) {
            if (!this.services.accountTypes.is25g()) {
                this.services.ExchangeAccountService.displayAliases(account);
                this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "aliasTable");
            }
        }

        shouldDisplayAliases () {
            return this.services.ExchangeAccountService.shouldDisplayAliases;
        }

        configureAccountIsAuthorized () {
            return _.includes(this.exchange.nicType, this.services.Exchange.nicAdmin) || _.includes(this.exchange.nicType, this.services.Exchange.nicTech);
        }

        isOutlookCanBeOrdered (account) {
            return !account.outlook && !this.removeAccountInsteadOfReset && this.configureAccountIsAuthorized();
        }

        isOutlookCanBeActivated (account) {
            return !account.outlook && this.removeAccountInsteadOfReset && this.configureAccountIsAuthorized() && account.accountLicense !== "BASIC";
        }

        outlookSettings (account) {
            if (account.canBeConfigured) {
                this.services.navigation.setAction("exchange/account/outlook/account-outlook", angular.copy(account));
            }
        }

        orderOutlook (account) {
            if (account.canBeConfigured) {
                this.services.navigation.setAction("exchange/account/outlook/add/account-outlook-add", angular.copy(account));
            }
        }

        activateOutlook (account) {
            if (account.canBeConfigured) {
                this.services.navigation.setAction("exchange/account/outlook/activate/account-outlook-activate", angular.copy(account));
            }
        }

        activateAcount (account) {
            if (!account.readyToUse && account.domain !== "configureme.me") {
                this.services.navigation.setAction("exchange/account/activate/activate-account", angular.copy(account));
            }
        }

        shouldDisplayAccounts () {
            return this.services.ExchangeAccountService.shouldDisplayAccounts;
        }

        displayAccounts () {
            this.search = {
                value: null
            };

            this.services.ExchangeAccountService.selectedAccount = null;
            this.services.ExchangeAccountService.displayAccounts();
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsTable");
        }
    });
