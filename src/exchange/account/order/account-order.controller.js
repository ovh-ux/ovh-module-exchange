angular
    .module("Module.exchange.controllers")
    .controller("ExchangeOrderAccountCtrl", class ExchangeOrderAccountCtrl {
        constructor ($scope, Exchange, $window, messaging, translator, navigation, accountTypes) {
            this.services = {
                $scope,
                Exchange,
                $window,
                messaging,
                translator,
                navigation,
                accountTypes
            };

            this.$routerParams = Exchange.getParams();
            this.numConfigureMeAccount = navigation.currentActionData.numConfigureMeAccount;

            // default values
            this.accountsToAdd = {
                duration: "12",
                accountsNumber: 1
            };

            this.accountsTypes = [{
                label: translator.tr("exchange_ACTION_order_accounts_step1_account_type_50G"),
                reference: "exchange_hosted_account",
                storageQuota: "50"
            }, {
                label: translator.tr("exchange_ACTION_order_accounts_step1_account_type_300G"),
                reference: "exchange_hosted_account_300g",
                storageQuota: "300"
            }];

            this.selectedAccountType = {
                value: this.accountsTypes[0]
            };

            this.valid = {
                legalWarning: false
            };

            this.worldPart = $scope.worldPart;

            if (this.worldPart === "CA") {
                this.valid.legalWarning = true;
            }

            this.ordersList = [];
            this.url = null;
            this.previewOrder = null;
            this.exchange = Exchange.value;

            this.loadOrderList();

            $scope.addExchangeAccount = () => this.addExchangeAccount();
            $scope.isValid = () => this.isValid();
            $scope.order = () => this.order();
            $scope.getPreviewOrder = () => this.previewOrder;
            $scope.getURL = () => this.url;
        }

        getPreviewOrder () {
            return this.previewOrder;
        }

        order () {
            this.url = null;
            this.previewOrder = null;

            this.accountsToAdd.storageQuota = this.selectedAccountType.value.storageQuota;

            this.services
                .Exchange
                .orderAccounts(this.$routerParams.organization, this.$routerParams.productId, this.accountsToAdd)
                .then((data) => {
                    this.previewOrder = data;
                    this.url = data.url;
                }).catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_order_accounts_step2_error_message"), failure);
                    this.services.navigation.resetAction();
                });
        }

        loadOrderList (accountType) {
            this.ordersList = [];

            this.accountsToAdd.storageQuota = accountType ? accountType.storageQuota : "50";
            this.accountsToAdd.duration = "01";
            this.services
                .Exchange
                .getAccountsOptions(this.$routerParams.organization, this.$routerParams.productId, this.accountsToAdd)
                .then((data) => {
                    data.duration = "01";
                    this.ordersList.push(data);
                }).catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_order_accounts_step1_loading_error"), failure);
                    this.services.navigation.resetAction();
                });

            this.accountsToAdd.duration = "12";
            this.services
                .Exchange
                .getAccountsOptions(this.$routerParams.organization, this.$routerParams.productId, this.accountsToAdd)
                .then((data) => {
                    data.duration = "12";
                    this.ordersList.push(data);
                }).catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_order_accounts_step1_loading_error"), failure);
                    this.services.navigation.resetAction();
                });
        }

        getURL () {
            return this.url;
        }

        getSelectedPaymentPrice () {
            if (!_.isEmpty(this.ordersList)) {
                const selected = $.grep(this.ordersList, (order) => this.accountsToAdd.duration === order.duration);

                return selected ? selected[0] : null;
            }

            return null;
        }

        isValid () {
            return this.ordersList && this.accountsToAdd.accountsNumber && this.valid.legalWarning && this.accountsToAdd.duration;
        }

        addExchangeAccount () {
            this.services.navigation.resetAction();
            this.services.$window.open(this.url, "_blank");
        }
    });
