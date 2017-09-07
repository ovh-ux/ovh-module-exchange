angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemovePublicFolderPermissionCtrl", class ExchangeRemovePublicFolderPermissionCtrl {
        constructor ($scope, Exchange, ExchangePublicFolders, messaging, navigation, translator) {
            this.services = { $scope, Exchange, ExchangePublicFolders, messaging, navigation, translator };

            this.$routerParams = Exchange.getParams();

            this.folder = navigation.currentActionData.folder;
            this.permission = navigation.currentActionData.permission;

            $scope.submitting = () => this.submitting();
        }

        submitting () {
            this.services.messaging.writeSuccess(this.services.translator.tr("exchange_dashboard_action_doing"));

            return this.services
                .ExchangePublicFolders
                .removingPublicFolderPermission(this.$routerParams.organization, this.$routerParams.productId, this.folder.path, this.permission.allowedAccountId)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_action_SHARED_permissions_delete_success"), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_action_SHARED_permissions_delete_error"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
