angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabManagersByGroupsCtrl", class ExchangeTabManagersByGroupsCtrl {
        constructor ($scope, Exchange, navigation, messaging, translator, group) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                messaging,
                translator,
                group
            };

            this.$routerParams = Exchange.getParams();
            this.getGroupParams = {};

            $scope.$on(Exchange.events.accountsChanged, () => this.getManagersByGroup(this.getGroupParams));
            $scope.getManagersList = () => this.managersList;
            $scope.getManagersByGroup = (pageSize, offset) => this.getManagersByGroup(pageSize, offset);
        }

        hide () {
            this.services.$scope.$emit("showGroups");
        }

        getManagersByGroup ({ pageSize, offset }) {
            this.getGroupParams.pageSize = pageSize;
            this.getGroupParams.offset = offset;
            this.services.messaging.resetMessages();

            return this.services.group
                .retrievingManagersByGroup(this.$routerParams.organization, this.$routerParams.productId, this.services.navigation.selectedGroup.mailingListName, pageSize, offset - 1)
                .then((accounts) => {
                    this.managersList = accounts;
                    return {
                        data: accounts.list.results,
                        meta: {
                            totalCount: accounts.count
                        }
                    };
                })
                .catch((failure) => this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure));
        }

        removeManager (manager) {
            this.services.navigation.setAction("exchange/group/manager/remove/group-manager-remove", {
                group: this.services.navigation.selectedGroup,
                manager
            });
        }
    });
