angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveDisclaimerCtrl", class ExchangeRemoveDisclaimerCtrl {
        constructor ($scope, Exchange, navigation, messaging, translator) {
            this.services = { $scope, Exchange, navigation, messaging, translator };

            this.$routerParams = Exchange.getParams();
            this.disclaimer = navigation.currentActionData;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services.messaging.writeSuccess(this.services.translator.tr("exchange_dashboard_action_doing"));

            this.services
                .Exchange
                .deleteDisclaimer(this.$routerParams.organization, this.$routerParams.productId, this.disclaimer.domain.name)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_delete_disclaimer_success"), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_delete_disclaimer_failure"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
