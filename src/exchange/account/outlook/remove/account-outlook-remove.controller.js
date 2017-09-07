angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveOutlookCtrl", class ExchangeRemoveOutlookCtrl {
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
            this.deleteOutlookAtExpiration = false;

            $scope.removeOutlookFromExchangeAccount = () => this.removeOutlookFromExchangeAccount();
            $scope.cancelRemovingOutlookFromExchangeAccount = () => this.cancelRemovingOutlookFromExchangeAccount();

            this.exchange = Exchange.value;
            this.deleteOutlookAtExpiration = !Exchange.removeAccountInsteadOfReset(this.exchange);
        }

        removeOutlookFromExchangeAccount () {
            const parameters = {
                primaryEmailAddress: this.account.primaryEmailAddress,
                orderedOutlook: this.deleteOutlookAtExpiration
            };

            this.services
                .ExchangeOutlook
                .removeOutlook(this.$routerParams.organization, this.$routerParams.productId, parameters)
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

        cancelRemovingOutlookFromExchangeAccount () {
            const parameters = {
                primaryEmailAddress: this.account.primaryEmailAddress,
                orderedOutlook: true
            };

            this.services
                .ExchangeOutlook
                .activateOutlook(this.$routerParams.organization, this.$routerParams.productId, parameters)
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
