angular
    .module("Module.exchange.controllers")
    .controller("exchangeWizardHostedCreationEmailCreationDeleteController", class ExchangeWizardHostedCreationEmailCreationDeleteController {
        constructor (Exchange, messaging, navigation, $rootScope, $scope, translator) {
            Object.assign(this, { Exchange, messaging, navigation, $rootScope, $scope, translator });
        }

        $onInit () {
            this.$routerParams = this.Exchange.getParams();
            this.account = this.navigation.currentActionData;

            this.$scope.deleting = () => this.deleting();
        }

        deleting () {
            return this.Exchange
                .removingAccount(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress)
                .catch((error) => {
                    this.messaging.writeError(this.translator.tr("exchange_tab_account_remove_failure"), error);
                })
                .finally(() => {
                    this.$rootScope.$broadcast("exchange.wizard.request.done");
                    this.navigation.resetAction();
                });
        }
    });
