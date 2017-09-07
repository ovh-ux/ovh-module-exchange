angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveExchangeCtrl", class ExchangeRemoveExchangeCtrl {
        constructor ($scope, Exchange, translator, navigation, messaging, accountTypes, exchangeVersion) {
            this.services = {
                $scope,
                Exchange,
                translator,
                navigation,
                messaging,
                accountTypes,
                exchangeVersion
            };

            this.$routerParams = Exchange.getParams();
            this.exchange = angular.copy(Exchange.value);
            this.exchange.renewPeriod = "YEARLY";
            this.dialogTypeSeparator = this.exchange.renewType.deleteAtExpiration ? "cancel_" : "";

            $scope.getSubmitButtonLabel = () => this.getSubmitButtonLabel();
            $scope.submit = () => this.submit();
        }

        getModel () {
            return {
                exchangeType: this.exchange.offer,
                deleteAtExpiration: !this.exchange.renewType.deleteAtExpiration, // switch the actual value
                renewPeriod: this.exchange.renewPeriod,
                automatic: this.exchange.renewType.automatic
            };
        }

        getSubmitButtonLabel () {
            return this.services.translator.tr(`exchange_resilitation_${this.dialogTypeSeparator}action_button`);
        }

        submit () {
            this.services.messaging.writeSuccess(this.services.translator.tr("exchange_dashboard_action_doing"));

            this.services
                .Exchange
                .updateDeleteAtExpiration(this.$routerParams.organization, this.$routerParams.productId, this.getModel())
                .then((data) => {
                    const updateRenewMessages = {
                        OK: this.services.translator.tr(`exchange_resilitation_${this.dialogTypeSeparator}action_success`),
                        PARTIAL: this.services.translator.tr(`exchange_resilitation_${this.dialogTypeSeparator}action_partial`),
                        ERROR: this.services.translator.tr(`exchange_resilitation_${this.dialogTypeSeparator}action_failure`)
                    };

                    this.services.messaging.setMessage(updateRenewMessages, data);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr(`exchange_resilitation_${this.dialogTypeSeparator}action_failure`), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
