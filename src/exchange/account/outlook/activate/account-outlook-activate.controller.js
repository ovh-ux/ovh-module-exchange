angular
    .module("Module.exchange.controllers")
    .controller("ExchangeActivateOutlookCtrl", class ExchangeActivateOutlookCtrl {
        constructor ($scope, Exchange, ExchangeOutlook, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangeOutlook,
                navigation,
                messaging,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.account = navigation.currentActionData;

            $scope.activateOutlookExchangeAccount = () => this.activateOutlookExchangeAccount();
        }

        activateOutlookExchangeAccount () {
            this.services
                .ExchangeOutlook
                .activateOutlook(this.$routerParams.organization, this.$routerParams.productId, {
                    primaryEmailAddress: this.account.primaryEmailAddress
                })
                .then(() => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_update_account_success_message"));
                })
                .catch((error) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_common_error"), error);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
