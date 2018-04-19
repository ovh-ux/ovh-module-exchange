{
    class ExchangeAccountHomeController {
        constructor ($scope, accountTypes, Exchange, exchangeAccount, exchangeAccountOutlook, exchangeSelectedService, exchangeStates, messaging, navigation, officeAttach, translator) {
            this.$scope = $scope;

            this.accountTypes = accountTypes;
            this.Exchange = Exchange;
            this.exchangeAccount = exchangeAccount;
            this.exchangeAccountOutlook = exchangeAccountOutlook;
            this.exchangeSelectedService = exchangeSelectedService;
            this.exchangeStates = exchangeStates;
            this.messaging = messaging;
            this.navigation = navigation;
            this.officeAttach = officeAttach;
            this.translator = translator;
        }

        $onInit () {
            this.$routerParams = this.Exchange.getParams();
            this.hostname = this.Exchange.value.hostname;

            this.datagridParameters = {};
            this.linkToSpamTicket = `#/ticket?serviceName=${this.$routerParams.productId}`;
            this.initialAccountRetrieval = true;
            this.atLeastOneDomainIsAssociatedToCurrentExchangeService = true;

            this.accountTypeOptions = {
                operators: ["is"]
            };

            this.accountTypeOptions.values = {
                STANDARD: this.getAccountTypeTranslation("STANDARD")
            };

            if (this.exchangeSelectedService.isContractType(this.exchangeSelectedService.CONTRACT_TYPES.PAY_AS_YOU_GO)) {
                this.accountTypeOptions.values.BASIC = this.getAccountTypeTranslation("BASIC");
            }

            this.$scope.$on(this.Exchange.events.accountsChanged, () => this.refreshList());

            return this.fetchInitialData();
        }

        fetchInitialData () {
            this.initialLoading = true;

            this.fetchCanUserSubscribeToOfficeAttach()
                .then(() => this.fetchAccountCreationOptions())
                .finally(() => {
                    this.initialLoading = false;
                });
        }

        fetchCanUserSubscribeToOfficeAttach () {
            return this.officeAttach
                .retrievingIfUserAlreadyHasSubscribed(this.$routerParams.productId)
                .then((userHasAlreadySubscribed) => {
                    this.userCanSubscribeToOfficeAttach = !userHasAlreadySubscribed;
                })
                .catch((error) => {
                    this.messaging.writeError("exchange_accounts_fetchOfficeAttachError_error", error);
                });
        }

        fetchAccountCreationOptions () {
            return this.Exchange
                .fetchingAccountCreationOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((accountCreationOptions) => {
                    this.atLeastOneDomainIsAssociatedToCurrentExchangeService = !_(accountCreationOptions).chain()
                        .get("availableDomains")
                        .isEmpty()
                        .value();
                })
                .catch((error) => {
                    this.messaging.writeError("exchange_accounts_fetchAccountCreationOptions_error", error);
                });
        }

        getAccountTypeTranslation (accountType) {
            return this.accountTypes.isDedicatedCluster() ? this.translator.tr(`exchange_tab_dedicatedCluster_account_type_${accountType}`) : this.translator.tr(`exchange_tab_ACCOUNTS_type_${accountType}`);
        }

        refreshList () {
            return this.Exchange
                .fetchAccounts(this.$routerParams.organization,
                               this.$routerParams.productId,
                               this.datagridParameters.pageSize,
                               this.datagridParameters.offset - 1,
                               this.datagridParameters.searchValues,
                               this.datagridParameters.accountTypeFilter)
                .then((accounts) => {
                    const formattedAccounts = this.formatAccountsForDatagrid(accounts);

                    for (let i = 0; i < formattedAccounts.length; i++) {
                        this.accounts.splice(i, 1, formattedAccounts[i]);
                    }

                    for (let i = formattedAccounts.length; i < this.accounts.length; i++) {
                        this.accounts.splice(i, 1);
                    }
                })
                .catch((error) => {
                    this.messaging.writeError(this.translator.tr("exchange_accounts_fetchAccounts_error"), error);
                });
        }

        fetchAccounts (parameters) {
            this.datagridParameters = parameters;

            this.datagridParameters.searchValues = _(parameters.criteria)
                .filter((criterium) => _(criterium.property).isNull() || criterium.property === "emailAddress")
                .map((criterium) => criterium.value)
                .value();

            const accountTypeFilters = _(parameters.criteria)
                .filter((criterium) => criterium.property === "accountLicense")
                .map((criterium) => criterium.value)
                .value();

            this.datagridParameters.accountTypeFilter = accountTypeFilters.length === 2 ? "" : accountTypeFilters[0];

            return this.Exchange
                .fetchAccounts(this.$routerParams.organization, this.$routerParams.productId, parameters.pageSize, parameters.offset - 1, this.datagridParameters.searchValues, this.datagridParameters.accountTypeFilter)
                .then((accounts) => {
                    this.accounts = this.formatAccountsForDatagrid(accounts);

                    return {
                        data: this.accounts,
                        meta: {
                            totalCount: accounts.count
                        }
                    };
                })
                .catch((error) => {
                    this.messaging.writeError(this.translator.tr("exchange_accounts_fetchAccounts_error"), error);
                })
                .finally(() => {
                    this.initialAccountRetrieval = false;
                });
        }

        formatAccountsForDatagrid (accounts) {
            return _(accounts)
                .get("list.results", [])
                .map((account) => _(account)
                    .assign({
                        emailAddress: unpunycodeEmailAddress(account.primaryEmailDisplayName),
                        size: transformSizeData.call(this, account),
                        numberOfAliases: account.aliases,
                        outlookStatus: transformOutlookStatus.call(this, account),
                        status: chooseStatusText.call(this, account)
                    }).value());

            function unpunycodeEmailAddress (emailAddress) {
                const parts = emailAddress.split("@");
                const unpunycodedLocalPart = punycode.toUnicode(parts[0]);

                return `${unpunycodedLocalPart}@${parts[1]}`;
            }

            function transformSizeData (account) {
                return {
                    usage: Math.round(account.currentUsage / (1024 ** 2) * 100 / account.quota),
                    progressionText: `${account.usedQuota.value} ${this.translator.tr(`unit_size_${account.usedQuota.unit}`)} / ${account.totalQuota.value} ${this.translator.tr(`unit_size_${account.totalQuota.unit}`)}`
                };
            }

            function transformOutlookStatus (account) {
                const accountOutlookStatus = this.exchangeAccountOutlook.getStatus(account);

                if (!this.exchangeAccountOutlook.canHaveLicense(account) || this.exchangeAccountOutlook.hasStatus(account, this.exchangeAccountOutlook.STATES.CANT_ORDER_OR_ACTIVATE_LICENSE)) {
                    return {
                        state: "",
                        displayValue: ""
                    };
                }

                return {
                    status,
                    displayValue: this.translator.tr(`exchange_tab_accounts_table_outlook_${accountOutlookStatus}`)
                };
            }

            function chooseStatusText (account) {
                if (this.exchangeStates.constructor.isDeleting(account)) {
                    if (this.exchangeSelectedService.isContractType(this.exchangeSelectedService.CONTRACT_TYPES.PAY_AS_YOU_GO)) {
                        return this.translator.tr("exchange_tab_ACCOUNTS_state_DELETING");
                    }

                    return this.translator.tr("exchange_tab_ACCOUNTS_state_RESETTING");
                }

                if (account.spamDetected) {
                    return this.translator.tr("exchange_tab_ACCOUNTS_state_BLOCKED");
                }

                if (this.exchangeStates.isValidState(account.state)) {
                    return this.translator.tr(`exchange_tab_ACCOUNTS_state_${_(account.state).snakeCase().toUpperCase()}`);
                }

                if (_(account.taskPendingId).isNumber() && account.taskPendingId !== 0) {
                    return this.translator.tr("exchange_tab_ACCOUNTS_state_TASK_ON_DOING");
                }

                return this.translator.tr("exchange_tab_ACCOUNTS_state_UNKNOWN");
            }
        }

        displayAliasManagementView (account) {
            this.messaging.resetMessages();
            this.$scope.$emit(this.exchangeAccount.EVENTS.CHANGE_STATE, { stateName: "alias", args: { account: _(account).clone() } });
        }

        displayDialog (pathToFeature, account) {
            this.navigation.setAction(pathToFeature, _(account).clone());
        }

        displayAccountAddingView () {
            this.messaging.resetMessages();
            this.$scope.$emit(this.exchangeAccount.EVENTS.CHANGE_STATE, { stateName: "add" });
        }

        openAccountOrderingDialog () {
            const placeholderAccountAmount = _(this.accounts).sum((account) => this.exchangeAccount.isPlaceholder(account));
            this.navigation.setAction("exchange/account/order/account-order", { placeholderAccountAmount });
        }
    }

    angular
        .module("Module.exchange.components")
        .component("exchangeAccountHome", {
            templateUrl: "exchange/account/home/account-home.html",
            controller: ExchangeAccountHomeController
        });
}
