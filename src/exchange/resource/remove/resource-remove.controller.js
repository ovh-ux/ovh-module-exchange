angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveResourceCtrl", class ExchangeRemoveResourceCtrl {
        constructor ($scope, Exchange, ExchangeResources, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangeResources,
                navigation,
                messaging,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.resource = navigation.currentActionData;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services.messaging.writeSuccess(this.services.translator.tr("exchange_dashboard_action_doing"));

            return this.services
                .ExchangeResources
                .removeResource(this.$routerParams.organization, this.$routerParams.productId, this.resource.resourceEmailAddress)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_tab_RESOURCES_remove_resource_success"), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_RESOURCES_remove_resource_failure"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });

        }
    });
