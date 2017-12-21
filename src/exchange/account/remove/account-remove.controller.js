angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveAccountCtrl", class ExchangeRemoveAccountCtrl {
        constructor ($scope, Exchange, navigation, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                messaging,
                translator
            };

            $scope.submit = () => this.submit();
            $scope.getTitle = () => this.getTitle();

            this.$routerParams = Exchange.getParams();

            this.account = navigation.currentActionData;
            this.removeAccountInsteadOfReset = Exchange.removeAccountInsteadOfReset(Exchange.value);
        }

        getTitle () {
            return this.removeAccountInsteadOfReset ? this.services.translator.tr("exchange_tab_account_remove_account") : this.services.translator.tr("exchange_tab_account_reset_account");
        }

        submit () {
            this.services
                .Exchange
                .removingAccount(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress)
                .then((success) => {
                    this.services.messaging.writeSuccess(this.removeAccountInsteadOfReset ? this.services.translator.tr("exchange_tab_account_remove_success") : this.services.translator.tr("exchange_tab_account_reset_success"), success);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.removeAccountInsteadOfReset ? this.services.translator.tr("exchange_tab_account_remove_failure") : this.services.translator.tr("exchange_tab_account_reset_failure"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
