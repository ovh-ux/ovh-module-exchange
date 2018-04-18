{
    class ExchangeAccountHomeController {
        constructor ($scope, accountTypes, Exchange, exchangeAccount, exchangeAccountOutlook, exchangeSelectedService, exchangeStates, exchangeVersion, messaging, navigation, officeAttach, translator) {
            this.$scope = $scope;

            this.accountTypes = accountTypes;
            this.Exchange = Exchange;
            this.exchangeAccount = exchangeAccount;
            this.exchangeAccountOutlook = exchangeAccountOutlook;
            this.exchangeSelectedService = exchangeSelectedService;
            this.exchangeStates = exchangeStates;
            this.exchangeVersion = exchangeVersion;
            this.messaging = messaging;
            this.navigation = navigation;
            this.officeAttach = officeAttach;
            this.translator = translator;
        }

        $onInit () {
            this.datagridParameters = {};

            this.$routerParams = this.Exchange.getParams();
            this.hostname = this.Exchange.value.hostname;
            this.linkToSpamTicket = `#/ticket?serviceName=${this.$routerParams.productId}`;
            this.initialLoading = true;
            this.initialAccountRetrieval = true;
            this.thereAreAvailableDomains = true;

            this.accountTypeOptions = {
                operators: ["is"]
            };

            if (this.exchangeSelectedService.isContractType(this.exchangeSelectedService.CONTRACT_TYPES.PREPAID)) {
                this.accountTypeOptions.values = {
                    STANDARD: this.getAccountTypeTranslation("STANDARD")
                };
            } else {
                this.accountTypeOptions.values = {
                    STANDARD: this.getAccountTypeTranslation("STANDARD"),
                    BASIC: this.getAccountTypeTranslation("BASIC")
                };
            }

            this.$scope.$on(this.Exchange.events.accountsChanged, () => this.refreshList());

            return this.fetchCanUserSubscribeToOfficeAttach()
                .then(() => this.fetchAccountCreationOptions())
                .finally(() => {
                    this.initialLoading = false;
                });
        }

        getAccountTypeTranslation (accountType) {
            if (this.accountTypes.isDedicatedCluster()) {
                return this.translator.tr(`exchange_tab_dedicatedCluster_account_type_${accountType}`);
            }

            return this.translator.tr(`exchange_tab_ACCOUNTS_type_${accountType}`);
        }

        fetchCanUserSubscribeToOfficeAttach () {
            return this.officeAttach
                .retrievingIfUserAlreadyHasSubscribed(this.$routerParams.productId)
                .then((userHasAlreadySubscribed) => {
                    this.canUserSubscribeToOfficeAttach = !userHasAlreadySubscribed;
                })
                .catch((error) => {
                    this.messaging.writeError("exchange_accounts_fetchOfficeAttachError", error);
                });
        }

        fetchAccountCreationOptions () {
            return this.Exchange
                .fetchingAccountCreationOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((accountCreationOptions) => {
                    this.thereAreAvailableDomains = !_(accountCreationOptions).chain()
                        .get("availableDomains")
                        .isEmpty()
                        .value();
                })
                .catch((error) => {
                    this.messaging.writeError("exchange_accounts_fetchAccountCreationOptions", error);
                });
        }

        refreshList () {
            return this.Exchange.fetchAccounts(this.$routerParams.organization,
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
                    this.messaging.writeError(this.translator.tr("exchange_accounts_fetchAccounts"), error);
                });
        }

        fetchAccounts (parameters) {
            this.datagridParameters = parameters;

            this.datagridParameters.searchValues = _(parameters.criteria)
                .filter((criterium) => _(criterium.property).isNull() || criterium.property === "emailAddress")
                .map((criterium) => criterium.value)
                .value();

            const accountTypesFilters = _(parameters.criteria)
                .filter((criterium) => criterium.property === "accountLicense")
                .map((criterium) => criterium.value)
                .value();

            this.datagridParameters.accountTypeFilter = accountTypesFilters.length === 2 ? "" : accountTypesFilters[0];

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
                    this.messaging.writeError(this.translator.tr("exchange_accounts_fetchAccounts"), error);
                })
                .finally(() => {
                    this.initialAccountRetrieval = false;
                });
        }

        displayAliases (account) {
            this.$scope.$emit(this.exchangeAccount.EVENTS.CHANGE_STATE, { stateName: "alias", args: { account: _(account).clone() } });
        }

        displayDialog (pathToFeature, account) {
            this.navigation.setAction(pathToFeature, _(account).clone());
        }

        formatAccountsForDatagrid (accounts) {
            return _(accounts).get("list.results", []).map((account) => _(account).assign({
                emailAddress: unpunycodeEmailAddress(account.primaryEmailDisplayName),
                size: transformSizeData.call(this, account),
                numberOfAliases: account.aliases,
                outlookStatus: transformOutlook.call(this, account),
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

            function transformOutlook (account) {
                const accountAlreadyHasLicence = account.outlook;

                if (!this.exchangeAccountOutlook.canHaveLicense(account)) {
                    return {
                        displayValue: "",
                        state: "canHaveOutlookLicence"
                    };
                }

                const state = this.exchangeAccountOutlook.getOutlookState(account);

                return {
                    state,
                    displayValue: this.translator.tr(`exchange_tab_accounts_table_outlook_${_(state).snakeCase().toUpperCase()}`)
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
                    return this.translator.tr("exchange_tab_ACCOUNTS_state_BLOCK_FOR_SPAM");
                }

                if (_(account.taskPendingId).isNumber() && account.taskPendingId !== 0) {
                    return this.translator.tr("exchange_tab_ACCOUNTS_state_TASK_ON_DOING");
                }

                return this.translator.tr(`exchange_tab_ACCOUNTS_state_${_(account.state).snakeCase().toUpperCase()}`);
            }
        }

        openAddingAccountDialog () {
            this.$scope.$emit(this.exchangeAccount.EVENTS.CHANGE_STATE, { stateName: "add" });
        }

        openOrderingAccountDialog () {
            const numConfigureMeAccount = _(this.accounts).sum((account) => account.domain === "configureme.me");
            this.navigation.setAction("exchange/account/order/account-order", { numConfigureMeAccount });
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
