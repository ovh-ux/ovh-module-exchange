angular
    .module("Module.exchange.controllers")
    .controller("exchangeAccountOutlookDeactivate", class ExchangeAccountOutlookDeactivate {
        constructor ($scope, Exchange, exchangeAccountOutlook, messaging, navigation, translator) {
            this.$scope = $scope;

            this.Exchange = Exchange;
            this.exchangeAccountOutlook = exchangeAccountOutlook;
            this.messaging = messaging;
            this.navigation = navigation;
            this.translator = translator;
        }

        $onInit () {
            this.$routerParams = this.Exchange.getParams();
            this.account = this.navigation.currentActionData;

            this.$scope.deactivate = () => this.deactivate();
        }

        deactivate () {
            return this.exchangeAccountOutlook
                .deactivate(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress)
                .then(() => {
                    this.messaging.writeSuccess(this.translator.tr("exchange_accounts_outlook_deactivate_success"));
                })
                .catch((error) => {
                    this.messaging.writeError(this.translator.tr("exchange_accounts_outlook_deactivate_error"), error);
                })
                .finally(() => {
                    this.navigation.resetAction();
                });
        }
    });
