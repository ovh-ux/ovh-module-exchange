angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveSharedCtrl", class ExchangeRemoveSharedCtrl {
        constructor ($scope, Exchange, ExchangePublicFolders, messaging, navigation, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangePublicFolders,
                messaging,
                navigation,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.shared = navigation.currentActionData;
            $scope.submitting = () => this.submitting();
        }

        submitting () {
            return this.services
                .ExchangePublicFolders
                .removingPublicFolders(this.$routerParams.organization, this.$routerParams.productId, this.shared.path)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_action_SHARED_delete_success"), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_action_SHARED_delete_error"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
