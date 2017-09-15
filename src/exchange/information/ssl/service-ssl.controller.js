angular
    .module("Module.exchange.controllers")
    .controller("ExchangeSslRenewCtrl", class ExchangeSslRenewCtrl {
        constructor ($scope, Exchange, messaging, navigation, translator) {
            this.services = {
                $scope,
                Exchange,
                messaging,
                navigation,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.loading = false;
            this.exchange = Exchange.value;

            $scope.retrievingDCVEmails = () => this.retrievingDCVEmails();
            $scope.submitting = () => this.submitting();
        }

        retrievingDCVEmails () {
            this.loading = true;

            return this.services
                .Exchange
                .retrievingDVCEmails(this.$routerParams.organization, this.$routerParams.productId)
                .then((data) => {
                    this.loading = false;
                    this.availableDomains = data;
                    this.model = {
                        name: ""
                    };
                })
                .catch((failure) => {
                    this.services.navigation.resetAction();
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_renew_ssl_dcv_failure"), failure);
                });
        }

        submitting () {
            return this.services
                .Exchange
                .renewSsl(this.$routerParams.organization, this.$routerParams.productId, this.model.name)
                .then((data) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_renew_ssl_success", [this.model.displayName]), data);
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_renew_ssl_failure"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
