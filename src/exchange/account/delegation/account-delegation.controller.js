angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAccountDelegationCtrl", class ExchangeAccountDelegationCtrl {
        constructor ($scope, Exchange, $timeout, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                $timeout,
                navigation,
                messaging,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.currentAccount = navigation.currentActionData.primaryEmailAddress;
            this.searchValue = null;

            $scope.updateDelegationRight = () => this.updateDelegationRight();
            $scope.hasChanged = () => this.hasChanged();
            $scope.retrieveAccounts = (count, offset) => this.retrieveAccounts(count, offset);
            $scope.getLoading = () => this.loading;
            $scope.getAccounts = () => this.accounts;

            $scope.$on(Exchange.events.accountsChanged, () => $scope.retrieveAccounts());

            this.debouncedRetrieveAccounts = _.debounce(this.retrieveAccounts, 300);
        }

        /**
         * Return an array containing changes from the original configuration
         */
        getChanges () {
            const changesList = {
                account: this.currentAccount,
                sendRights: [],
                sendOnBehalfToRights: [],
                fullAccessRights: []
            };

            if (_.has(this.accounts, "list.results")) {
                changesList.sendRights = this.accounts.list.results
                    .filter((account, index) => {
                        const matchingAccountInBuffer = this.bufferAccounts.list.results[index];

                        // record the operation to be done for sendAs rights:
                        return account.newSendAsValue !== matchingAccountInBuffer.sendAs;
                    })
                    .map((account) => ({
                        id: account.id,
                        operation: account.newSendAsValue ? "POST" : "DELETE"
                    }));

                changesList.sendOnBehalfToRights = this.accounts.list.results
                    .filter((account, index) => {
                        const matchingAccountInBuffer = this.bufferAccounts.list.results[index];

                        // record the operation to be done for sendAs rights:
                        return account.newSendOnBehalfToValue !== matchingAccountInBuffer.sendOnBehalfTo;
                    })
                    .map((account) => ({
                        id: account.id,
                        operation: account.newSendOnBehalfToValue ? "POST" : "DELETE"
                    }));

                changesList.fullAccessRights = this.accounts.list.results
                    .filter((account, index) => {
                        const matchingAccountInBuffer = this.bufferAccounts.list.results[index];

                        // record the operation to be done for sendAs rights:
                        return account.newFullAccessValue !== matchingAccountInBuffer.fullAccess;
                    })
                    .map((account) => ({
                        id: account.id,
                        operation: account.newFullAccessValue ? "POST" : "DELETE"
                    }));
            }

            return changesList;
        }

        onSearchValueChange () {
            this.debouncedRetrieveAccounts();
        }

        resetSearch () {
            this.searchValue = null;
            this.retrieveAccounts();
        }

        getAccounts () {
            return this.accounts;
        }

        getLoading () {
            return this.loading;
        }

        constructResult (data) {
            const mainMessage = {
                OK: this.services.translator.tr("exchange_ACTION_delegation_success_message"),
                PARTIAL: this.services.translator.tr("exchange_ACTION_delegation_partial_message"),
                ERROR: this.services.translator.tr("exchange_ACTION_delegation_error_message")
            };

            let state = "OK";
            let numberOfErrors = 0;

            for (const datum of data) {
                if (_(datum).isString()) {
                    this.services.messaging.setMessage(mainMessage, {
                        message: datum,
                        type: "PARTIAL"
                    });

                    return;
                } else if (datum.status === "ERROR") {
                    datum.message = this.services.translator.tr(`exchange_tab_TASKS_${datum.function}`);
                    datum.type = "ERROR";
                    state = "PARTIAL";
                    numberOfErrors++;
                }
            }

            if (numberOfErrors === data.length) {
                state = "ERROR";
            }

            this.services.messaging.setMessage(mainMessage, {
                messages: data,
                state
            });
        }

        checkForBufferChanges (account) {
            if (_.has(this.bufferAccounts, "list.results")) {
                _.forEach(this.bufferAccounts.list.results, (bufferAccount) => {
                    if (bufferAccount.id === account.id) {
                        account.newSendAsValue = bufferAccount.newSendAsValue;
                        account.newSendOnBehalfToValue = bufferAccount.newSendOnBehalfToValue;
                        account.newFullAccessValue = bufferAccount.newFullAccessValue;
                    }
                });
            }
        }

        /**
         * Check if there are changes compared to original configuration
         */
        hasChanged () {
            const listOfChanges = this.getChanges();

            return !_.isEmpty(listOfChanges.sendRights) || !_.isEmpty(listOfChanges.fullAccessRights) || !_.isEmpty(listOfChanges.sendOnBehalfToRights);
        }

        retrieveAccounts (count, offset) {
            this.services.messaging.resetMessages();
            this.loading = true;

            this.services
                .Exchange
                .retrieveAccountDelegationRight(this.$routerParams.organization, this.$routerParams.productId, this.currentAccount, count, offset, this.searchValue)
                .then((accounts) => {
                    this.accounts = angular.copy(accounts); // make a deep copy of accounts list to use it as model

                    _.forEach(this.accounts.list.results, (account) => {
                        account.newSendAsValue = account.sendAs;
                        account.newSendOnBehalfToValue = account.sendOnBehalfTo;
                        account.newFullAccessValue = account.fullAccess;
                        this.checkForBufferChanges(account);
                    });

                    this.bufferAccounts = this.accounts; // keep the original data as a reference point to compare changes
                })
                .catch((failure) => {
                    this.services.navigation.resetAction();
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.loading = false;
                });
        }

        updateDelegationRight () {
            const changes = this.getChanges();

            return this.services
                .Exchange
                .updatingAccountDelegationRights(this.$routerParams.organization, this.$routerParams.productId, changes)
                .then((data) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_delegation_doing_message"));
                    this.constructResult(data);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_delegation_error_message"), failure.data);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
