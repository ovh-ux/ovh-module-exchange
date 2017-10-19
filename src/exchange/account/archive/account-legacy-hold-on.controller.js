angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAccountLegacyHoldOnCtrl", class ExchangeAccountLegacyHoldOnCtrl {
        constructor ($scope, Exchange, ExchangeAccountService, navigation, $rootScope, messaging, translator, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                ExchangeAccountService,
                navigation,
                $rootScope,
                messaging,
                translator,
                exchangeStates
            };

            $scope.update = () => this.update();

            this.$routerParams = Exchange.getParams();
            this.account = navigation.currentActionData;
            this.value = this.originalValue = angular.copy(this.account.litigation);
            this.days = this.originalDays = angular.copy(this.account.litigationPeriod) || 0;
            this.unlimited = this.days === 0;

            this.firstTime = !this.value;
        }

        updateUnlimited () {
            if (this.unlimited) {
                this.days = 0;
            } else {
                this.days = this.originalDays;
            }
        }

        needsUpdate () {
            return this.value !== this.originalValue ||
                this.days !== this.originalDays;
        }

        applyValues (account) {
            const values = {
                primaryEmailAddress: account.primaryEmailAddress,
                litigation: this.value,
                litigationPeriod: !this.value || this.unlimited ? 0 : this.days
            };
            return values;
        }

        update () {
            if (this.needsUpdate()) {
                this.services.Exchange.updateAccount(this.$routerParams.organization, this.$routerParams.productId, this.applyValues(this.account)).then((data) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_legacy_hold_on_success_message"));
                }).catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_common_error"), failure);
                }).finally(() => {
                    this.services.navigation.resetAction();
                });
            }
        }
    });
