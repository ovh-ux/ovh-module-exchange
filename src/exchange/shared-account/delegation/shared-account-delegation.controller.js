angular
    .module("Module.exchange.controllers")
    .controller("ExchangeSharedAccountDelegationCtrl", class ExchangeSharedAccountDelegationCtrl {
        constructor ($scope, Exchange, $timeout, ExchangeSharedAccounts, messaging, translator, navigation) {
            this.services = {
                $scope,
                Exchange,
                $timeout,
                ExchangeSharedAccounts,
                messaging,
                translator,
                navigation
            };

            this.$routerParams = Exchange.getParams();
            this.primaryEmailAddress = navigation.currentActionData.primaryEmailAddress;
            this.isLoading = false;
            this.searchValue = null;

            $scope.$on(Exchange.events.accountsChanged, () => {
                $scope.retrievingAccounts();
            });

            this.debouncedRetrievingAccounts = _.debounce(this.retrievingAccounts, 300);

            $scope.updatingDelegationRight = () => this.updatingDelegationRight();
            $scope.hasChanged = () => this.hasChanged();
            $scope.retrievingAccounts = (count, offset) => this.retrievingAccounts(count, offset);
            $scope.getAccounts = () => this.accounts;
            $scope.getIsLoading = () => this.isLoading;
        }

        onSearchValueChange () {
            this.debouncedRetrievingAccounts();
        }

        onResetSearchValue () {
            this.searchValue = null;
            this.retrievingAccounts();
        }

        hasChanged () {
            let hasChanged = false;

            if (_.has(this.accounts, "list.results") && this.accounts.list.results != null && _.has(this.bufferedAccounts, "list.results") && this.bufferedAccounts.list.results != null) {
                for (const account of this.accounts.list.results) {
                    const matchingBufferedAccount = this.bufferedAccounts.list.results.find((bufferedAccount) => bufferedAccount.id === account.id);
                    matchingBufferedAccount.newSendAs = account.newSendAs;
                    matchingBufferedAccount.newSendOnBehalfTo = account.newSendOnBehalfTo;
                    matchingBufferedAccount.newFullAccess = account.newFullAccess;

                    const differentSendAs = matchingBufferedAccount.sendAs !== account.newSendAs;
                    const differentSendOnBehalfTo = matchingBufferedAccount.sendOnBehalfTo !== account.newSendOnBehalfTo;
                    const differentFullAccess = matchingBufferedAccount.fullAccess !== account.newFullAccess;

                    if (differentSendAs || differentSendOnBehalfTo || differentFullAccess) {
                        hasChanged = true;
                    }
                }
            }

            return hasChanged;
        }

        retrievingAccounts (count, offset) {
            this.services.messaging.resetMessages();
            this.isLoading = true;

            return this.services
                .ExchangeSharedAccounts
                .retrievingSharedAccountDelegations(this.$routerParams.organization, this.$routerParams.productId, this.primaryEmailAddress, count, offset, this.searchValue)
                .then((accounts) => {
                    this.accounts = angular.copy(accounts); // make a deep copy of accounts list to use it as model
                    this.bufferedAccounts = angular.copy(accounts);

                    if (_.has(this.accounts, "list.results") && this.accounts.list.results != null) {
                        for (const account of this.accounts.list.results) {
                            account.newSendAs = account.sendAs;
                            account.newSendOnBehalfTo = account.sendOnBehalfTo;
                            account.newFullAccess = account.fullAccess;
                        }
                    }
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.isLoading = false;
                });
        }

        updatingDelegationRight () {
            this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_delegation_doing_message"));

            const model = {
                primaryEmail: this.primaryEmailAddress,
                sendRights: this.bufferedAccounts.list.results
                    .filter((bufferedAccount) => bufferedAccount.sendAs !== bufferedAccount.newSendAs)
                    .map((account) => ({
                        id: account.id,
                        operation: account.newSendAs ? "POST" : "DELETE"
                    })),
                sendOnBehalfToRights: this.bufferedAccounts.list.results
                    .filter((bufferedAccount) => bufferedAccount.sendOnBehalfTo !== bufferedAccount.newSendOnBehalfTo)
                    .map((account) => ({
                        id: account.id,
                        operation: account.newSendOnBehalfTo ? "POST" : "DELETE"
                    })),
                fullAccessRights: this.bufferedAccounts.list.results
                    .filter((bufferedAccount) => bufferedAccount.fullAccess !== bufferedAccount.newFullAccess)
                    .map((account) => ({
                        id: account.id,
                        operation: account.newFullAccess ? "POST" : "DELETE"
                    }))
            };

            return this.services
                .ExchangeSharedAccounts
                .updatingSharedAccountDelegations(this.$routerParams.organization, this.$routerParams.productId, model)
                .then((data) => {
                    const mainMessage = {
                        OK: this.services.translator.tr("exchange_ACTION_delegation_success_message"),
                        PARTIAL: this.services.translator.tr("exchange_ACTION_delegation_partial_message"),
                        ERROR: this.services.translator.tr("exchange_ACTION_delegation_error_message")
                    };

                    this.services.messaging.setMessage(mainMessage, {
                        messages: data.messages,
                        state: data.state
                    });
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_delegation_error_message"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
