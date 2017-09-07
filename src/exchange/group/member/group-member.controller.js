angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabMembersByGroupsCtrl", class ExchangeTabMembersByGroupsCtrl {
        constructor ($scope, Exchange, $timeout, navigation, messaging, translator, group) {
            this.services = {
                $scope,
                Exchange,
                $timeout,
                navigation,
                messaging,
                translator,
                group
            };

            this.$routerParams = Exchange.getParams();

            $scope.$on(Exchange.events.accountsChanged, () => $scope.$broadcast("paginationServerSide.reload", "membersTable"));
            $scope.getMembersList = () => this.membersList;
            $scope.getLoading = () => this.loading;
            $scope.getMembersByGroup = (count, offset) => this.getMembersByGroup(count, offset);
        }

        getMembersByGroup (count, offset) {
            if (_.has(this.services, "navigation.selectedGroup.mailingListName")) {
                this.services.messaging.resetMessages();
                this.loading = true;

                this.services
                    .group
                    .retrievingMembersByGroup(this.$routerParams.organization, this.$routerParams.productId, this.services.navigation.selectedGroup.mailingListName, count, offset)
                    .then((accounts) => {
                        this.membersList = accounts;
                    })
                    .catch((failure) => {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                    })
                    .finally(() => {
                        this.loading = false;
                        this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "membersTable");
                    });
            }
        }

        hide () {
            this.services.$scope.$emit("showGroups");
        }

        removeMember (member) {
            this.services.navigation.setAction("exchange/group/member/remove/group-member-remove", {
                group: this.services.navigation.selectedGroup,
                member
            });
        }
    });
