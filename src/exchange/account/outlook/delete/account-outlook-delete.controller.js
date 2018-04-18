angular
    .module("Module.exchange.controllers")
    .controller("exchangeAccountOutlookDelete", class ExchangeAccountOutlookDelete {
        constructor ($scope, Exchange, ExchangeOutlook, messaging, navigation, translator) {
            this.$scope = $scope;

            this.Exchange = Exchange;
            this.ExchangeOutlook = ExchangeOutlook;
            this.messaging = messaging;
            this.navigation = navigation;
            this.translator = translator;
        }

        $onInit () {
            this.$routerParams = this.Exchange.getParams();
            this.account = this.navigation.currentActionData;
            this.exchange = this.Exchange.value;

            this.$scope.delete = () => this.delete();
        }

        delete () {
            return this.ExchangeOutlook
                .delete(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress)
                .then(() => {
                    this.messaging.writeSuccess(this.translator.tr("exchange_accounts_outlook_delete_success"));
                })
                .catch((error) => {
                    this.messaging.writeError(this.translator.tr("exchange_accounts_outlook_delete_error"), error);
                })
                .finally(() => {
                    this.navigation.resetAction();
                });
        }
    });
