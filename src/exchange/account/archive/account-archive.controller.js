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

            this.offer = Exchange.value.offer;

            this.firstTime = false;
            if (!this.value) {
                // we always want to subscribe to the offer
                // if it is the first time we are presented this form
                this.value = true;
                this.firstTime = true;
            }
        }

        needsUpdate () {
            return this.value !== this.originalValue;
        }

        update () {
            if (this.needsUpdate()) {
                if (this.value) {
                    if (this.offer == "DEDICATED") {
                        this.addArchive();
                    } else {
                        this.services.navigation.resetAction();
                        this.goToOrder();
                    }
                } else {
                    this.deleteArchive();
                }
            }
        }

        addArchive () {
            this.services.Exchange.addArchive(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress).then((data) => {
                this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_archive_add_success_message"));
            }).catch((failure) => {
                this.services.messaging.writeError(this.services.translator.tr("exchange_common_error"), failure);
            }).finally(() => {
                this.services.navigation.resetAction();
            });
        }

        deleteArchive () {
            this.services.Exchange.deleteArchive(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress).then((data) => {
                this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_archive_delete_success_message"));
            }).catch((failure) => {
                this.services.messaging.writeError(this.services.translator.tr("exchange_common_error"), failure);
            }).finally(() => {
                this.services.navigation.resetAction();
            });
        }

        goToOrder () {
            const answer = {

            };

            this.services.User.getUrlOfEndsWithSubsidiary("express_order").then((expressOrderUrl) => {
                this.services.$window.open(`${expressOrderUrl}#/new/express/resume?products=${JSURL.stringify(answer)}`, "_blank");
            });
        }
    });
