angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveManagerCtrl", class ExchangeRemoveManagerCtrl {
        constructor ($scope, Exchange, navigation, $translate, messaging) {
            this.services = { $scope, Exchange, navigation, $translate, messaging };

            this.$routerParams = Exchange.getParams();
            this.group = navigation.currentActionData.group;
            this.manager = navigation.currentActionData.manager;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services.messaging.writeSuccess(this.services.$translate.instant("exchange_dashboard_action_doing"));

            this.services
                .Exchange
                .removeManager(this.$routerParams.organization, this.$routerParams.productId, this.group.mailingListName, this.manager.id)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.$translate.instant("exchange_GROUPS_remove_manager_success_message", {
                        email: this.manager.primaryEmailAddress,
                        name: this.group.mailingListDisplayName
                    }), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.$translate.instant("exchange_GROUPS_remove_manager_error_message", {
                        email: this.manager.primaryEmailAddress,
                        name: this.group.mailingListDisplayName
                    }), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
