angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAccountArchiveCtrl", class ExchangeAccountArchiveCtrl {
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
            this.originalValue = this.account.archive != null;
            this.value = this.originalValue;

            this.isPrivate = null;
            if (!this.value) {
                this.isPrivate = Exchange.value.offer === "DEDICATED";
                this.value = true;
            }
        }

        needsUpdate () {
            return this.value !== this.originalValue;
        }

        update () {
            if (this.needsUpdate()) {
                if (this.value) {
                    this.services.Exchange.addArchive(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress).then((data) => {
                        this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_archive_add_success_message"));
                    }).catch((failure) => {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_common_error"), failure);
                    }).finally(() => {
                        this.services.navigation.resetAction();
                    });
                } else {
                    this.services.Exchange.deleteArchive(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress).then((data) => {
                        this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_archive_delete_success_message"));
                    }).catch((failure) => {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_common_error"), failure);
                    }).finally(() => {
                        this.services.navigation.resetAction();
                    });
                }
            }
        }
    });
