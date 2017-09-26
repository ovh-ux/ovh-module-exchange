angular.module("Module.exchange.controllers")
    .controller("ExchangeGroupAccountsCtrl", class ExchangeGroupAccountsCtrl {
        constructor ($rootScope, $scope, Exchange, messaging, navigation, translator) {
            this.$rootScope = $rootScope;
            this.$scope = $scope;
            this.Exchange = Exchange;
            this.messaging = messaging;
            this.navigation = navigation;
            this.translator = translator;
        }

        $onInit () {
            this.$routerParams = this.Exchange.getParams();

            this.timeout = null;
            this.selectedGroup = this.navigation.currentActionData;

            this.search = {
                value: null
            };

            this.model = {
                displayName: this.selectedGroup.displayName,
                senderAuthentification: this.selectedGroup.senderAuthentification,
                hiddenFromGAL: this.selectedGroup.hiddenFromGAL,
                joinRestriction: this.selectedGroup.joinRestriction,
                departRestriction: this.selectedGroup.departRestriction,
                managersList: [],
                membersList: []
            };

            this.$scope.retrievingAccounts = (count, offset) => this.retrievingAccounts(count, offset);
            this.$scope.updatingAccounts = () => this.updatingAccounts();
            this.$scope.getAccountsList = () => this.accountsList;
            this.$scope.getLoading = () => this.loading;
        }

        resetSearch () {
            this.search.value = null;
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsByGroupTable");
        }

        onSearch () {
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsByGroupTable");
        }

        saveSelection () {
            this.model.managersList = [];
            this.model.membersList = [];

            if (_.has(this.accountsList, "list.results")) {
                for (const account of this.accountsList.list.results) {
                    const bufferedAccount = _.find(this.accountsListBuffer.list.results, (bufferedAcc) => bufferedAcc.id === account.id);
                    let bufferedAccountUserType = _.get(bufferedAccount, "manager");

                    if (account.manager !== bufferedAccountUserType) {
                        this.model.managersList.push({
                            id: account.id,
                            operation: account.manager ? "POST" : "DELETE",
                            itemType: account.type
                        });
                    }

                    bufferedAccountUserType = _.get(bufferedAccount, "member");

                    if (account.member !== bufferedAccountUserType) {
                        this.model.membersList.push({
                            id: account.id,
                            operation: account.member ? "POST" : "DELETE",
                            itemType: account.type
                        });
                    }
                }
            }
        }

        retrievingAccounts (count, offset) {
            this.messaging.resetMessages();
            this.loading = true;

            return this.Exchange
                .retrievingAccountsByGroup(this.$routerParams.organization, this.$routerParams.productId, this.selectedGroup.mailingListAddress, count, offset, this.search != null ? this.search.value : "")
                .then((accounts) => {
                    this.accountsListBuffer = accounts;
                    this.accountsList = angular.copy(accounts);
                })
                .catch((failure) => {
                    this.messaging.writeError(this.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.loading = false;
                    this.$scope.$broadcast("paginationServerSide.loadPage", 1, "accountsByGroupTable");
                });
        }

        updatingAccounts () {
            this.messaging.writeSuccess(this.translator.tr("exchange_dashboard_action_doing"));
            this.saveSelection();

            return this.Exchange
                .updatingGroups(this.$routerParams.organization, this.$routerParams.productId, this.selectedGroup.mailingListAddress, this.model)
                .then((data) => {
                    const addGroupMessages = {
                        OK: this.translator.tr("exchange_GROUPS_settings_success_message", this.selectedGroup.mailingListDisplayName),
                        PARTIAL: this.translator.tr("exchange_GROUPS_settings_partial_message", this.selectedGroup.mailingListDisplayName),
                        ERROR: this.translator.tr("exchange_GROUPS_settings_error_message", this.selectedGroup.mailingListDisplayName)
                    };

                    if (data == null) {
                        this.messaging.writeSuccess(this.translator.tr("exchange_GROUPS_settings_success_message", this.selectedGroup.mailingListDisplayName));
                    } else {
                        this.messaging.setMessage(addGroupMessages, data);
                    }

                    this.$rootScope.$broadcast(this.Exchange.events.accountsChanged);
                })
                .catch((failure) => {
                    this.messaging.writeError(this.translator.tr("exchange_GROUPS_settings_error_message", this.selectedGroup.mailingListDisplayName), failure);
                })
                .finally(() => {
                    this.navigation.resetAction();
                });
        }
    });
