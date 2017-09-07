angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveDomainCtrl", class ExchangeRemoveDomainCtrl {
        constructor ($scope, Exchange, ExchangeDomains, messaging, navigation, translator) {
            this.services = {
                $scope,
                Exchange,
                ExchangeDomains,
                messaging,
                navigation,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.domain = navigation.currentActionData;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services
                .ExchangeDomains
                .removingDomain(this.$routerParams.organization, this.$routerParams.productId, this.domain.name)
                .then(() => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_tab_domain_remove_success"));
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_domain_remove_failure"), {
                        code: this.domain.name,
                        message: failure.message
                    });
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }

    });
