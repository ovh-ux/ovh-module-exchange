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
            this.getGroupParams = {};

            $scope.$on(Exchange.events.accountsChanged, () => this.getMembersByGroup(this.getGroupParams));
            $scope.getMembersList = () => this.membersList;
            $scope.getMembersByGroup = (pageSize, offset) => this.getMembersByGroup(pageSize, offset);
        }

        getMembersByGroup ({ pageSize, offset }) {
            this.getGroupParams.pageSize = pageSize;
            this.getGroupParams.offset = offset;
            this.services.messaging.resetMessages();

            return this.services.group
                .retrievingMembersByGroup(this.$routerParams.organization, this.$routerParams.productId, this.services.navigation.selectedGroup.mailingListName, pageSize, offset - 1)
                .then((accounts) => {
                    this.membersList = accounts;
                    return {
                        data: accounts.list.results,
                        meta: {
                            totalCount: accounts.count
                        }
                    };
                })
                .catch((failure) => this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ACCOUNTS_error_message"), failure));
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
