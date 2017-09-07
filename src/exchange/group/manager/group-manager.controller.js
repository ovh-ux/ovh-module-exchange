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

            $scope.$on(Exchange.events.accountsChanged, () => $scope.$broadcast("paginationServerSide.reload", "managersTable"));
            $scope.getManagersList = () => this.managersList;
            $scope.getLoading = () => this.loading;
            $scope.getManagersByGroup = (count, offset) => this.getManagersByGroup(count, offset);
        }

        hide () {
            this.services.$scope.$emit("showGroups");
        }

        getManagersByGroup (count, offset) {
            if (_.has(this.services, "navigation.selectedGroup.mailingListName")) {
                this.services.messaging.resetMessages();
                this.loading = true;

                this.services
                    .group
                    .retrievingManagersByGroup(this.$routerParams.organization, this.$routerParams.productId, this.services.navigation.selectedGroup.mailingListName, count, offset)
                    .then((accounts) => {
                        this.managersList = accounts;
                    })
                    .catch((failure) => {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                    })
                    .finally(() => {
                        this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "managersTable");
                        this.loading = false;
                    });
            }
        }

        removeManager (manager) {
            this.services.navigation.setAction("exchange/group/manager/remove/group-manager-remove", {
                group: this.services.navigation.selectedGroup,
                manager
            });
        }
    });
