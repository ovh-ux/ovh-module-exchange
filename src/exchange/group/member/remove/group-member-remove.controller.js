angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveMemberCtrl", class ExchangeRemoveMemberCtrl {
        constructor ($scope, Exchange, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                messaging,
                translator
            };

            this.$routerParams = Exchange.getParams();

            this.group = navigation.currentActionData.group;
            this.member = navigation.currentActionData.member;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services.messaging.writeSuccess(this.services.translator.tr("exchange_dashboard_action_doing"));

            this.services
                .Exchange
                .removeMember(this.$routerParams.organization, this.$routerParams.productId, this.group.mailingListName, this.member.id, this.member.type)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_GROUPS_remove_member_success_message", [this.member.primaryEmailAddress, this.group.mailingListDisplayName]), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_GROUPS_remove_member_error_message", [this.member.primaryEmailAddress, this.group.mailingListDisplayName]), failure);
                })
                .finally(() => {
                    this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "membersTable");
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
