angular
    .module("Module.exchange.controllers")
    .controller("ExchangeDomainSrvAutoconfigCtrl", class ExchangeDomainSrvAutoconfigCtrl {
        constructor ($scope, Exchange, ExchangeDomains, navigation, messaging, translator, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                ExchangeDomains,
                navigation,
                messaging,
                translator,
                exchangeStates
            };

            this.$routerParams = Exchange.getParams();
            this.domain = navigation.currentActionData;

            this.services
                .ExchangeDomains
                .gettingDNSSettings(this.$routerParams.organization, this.$routerParams.productId, this.domain.name)
                .then((data) => {
                    this.domainDiag = data;
                })
                .catch((failure) => {
                    navigation.resetAction();
                    messaging.writeError(translator.tr("exchange_tab_domain_diagnostic_add_field_failure"), failure);
                });

            $scope.configSRV = () => this.configSRV();
        }

        configSRV () {
            this.services
                .ExchangeDomains
                .addingZoneDnsField(this.$routerParams.organization, this.$routerParams.productId, {
                    domain: this.domain.name,
                    fieldList: [this.domainDiag.srv]
                })
                .then((success) => {
                    if (this.services.exchangeStates.constructor.isOk(success)) {
                        this.services.messaging.writeSuccess(this.services.translator.tr("exchange_tab_domain_diagnostic_add_field_success"));
                    } else {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_tab_domain_diagnostic_add_field_failure"));
                    }
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_domain_diagnostic_add_field_failure"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
