angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveGroupCtrl", class ExchangeRemoveGroupCtrl {
        constructor ($scope, Exchange, navigation, translator, messaging) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                translator,
                messaging
            };

            this.$routerParams = Exchange.getParams();
            this.ml = navigation.currentActionData;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "groupsTable");

            this.services
                .Exchange
                .deleteGroup(this.$routerParams.organization, this.$routerParams.productId, this.ml.mailingListName)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_tab_GROUPS_delete_group_success"), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_GROUPS_delete_group_error"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
