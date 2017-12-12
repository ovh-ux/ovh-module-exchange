angular
    .module("Module.exchange.controllers")
    .controller("ExchangeActivateAccountCtrl", class ExchangeActivateAccountCtrl {

        constructor (Alerter, Exchange, $stateParams, $scope, navigation) {
            this.alerter = Alerter;
            this.exchangeService = Exchange;
            this.$stateParams = $stateParams;
            this.$scope = $scope;
            this.account = navigation.currentActionData;
        }

        $onInit () {
            this.$scope.submit = () => {
                this.$scope.resetAction();
                return this.exchangeService.activateExchangeOnAccount(this.$stateParams.exchangeId, this.account.primaryEmailAddress)
                    .then(() => {
                        this.alerter.success(
                            this.$scope.tr("exchange_tab_ACCOUNTS_activate_account_success_message", this.account.primaryEmailDisplayName),
                            this.$scope.alerts.dashboard
                        );
                    })
                    .catch((err) => this.alerter.alertFromSWS(this.$scope.tr("exchange_tab_ACCOUNTS_activate_account_error_message"), err, this.$scope.alerts.dashboard))
                    .finally(() => this.$scope.resetAction());
            };
        }
    });
