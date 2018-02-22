angular
    .module("Module.exchange.controllers")
    .controller("ExchangeDisclaimerCtrl", class ExchangeDisclaimerCtrl {
        constructor ($scope, Exchange, navigation, translator, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                translator,
                exchangeStates
            };
        }

        $onInit () {
            const params = this.services.Exchange.getParams();
            this.organization = params.organization;
            this.productId = params.productId;

            this.services.$scope.$on(this.services.Exchange.events.disclaimersChanged, () => this.refreshList());
        }

        /* eslint-disable class-methods-use-this */
        hasEmptySlot (list) {
            return _.some(list, (item) => item.emptySlotFlag);
        }
        /* eslint-enable class-methods-use-this */

        _getDisclaimers ({ pageSize, offset }) {
            return this.services
                .Exchange.getDisclaimers(this.organization, this.productId, pageSize, offset - 1);
        }

        refreshList () {
            if (!this.disclaimersList) { return undefined; }
            const config = { pageSize: this.pageSize, offset: this.offset };
            return this._getDisclaimers(config)
                .then((disclaimers) => {
                    for (let i = 0; i < disclaimers.list.results.length; i++) {
                        this.disclaimersList.splice(i, 1, disclaimers.list.results[i]);
                    }
                    for (let i = disclaimers.list.results.length; i < this.disclaimersList.length; i++) {
                        this.disclaimersList.splice(i, 1);
                    }
                    this.setMessagesFlags(this.disclaimers);
                })
                .catch((err) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_DISCLAIMER_error_message"), err);
                });
        }


        loadPaginated ($config) {
            this.disclaimersList = null;
            this.pageSize = $config.pageSize;
            this.offset = $config.offset;
            return this._getDisclaimers($config)
                .then((disclaimers) => {
                    this.disclaimersList = disclaimers.list.results;
                    this.setMessagesFlags(this.disclaimers);
                    return {
                        data: this.disclaimersList,
                        meta: {
                            totalCount: disclaimers.count
                        }
                    };
                })
                .catch((err) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_DISCLAIMER_error_message"), err);
                });
        }

        setMessagesFlags () {
            this.addDomainMessageFlag = !this.newDisclaimersDisabled();
        }

        newDisclaimersDisabled () {
            return !this.disclaimersList || !this.hasEmptySlot(this.disclaimersList);
        }

        addDisclaimer () {
            if (!this.newDisclaimersDisabled()) {
                this.services.navigation.setAction("exchange/disclaimer/add/disclaimer-add");
            }
        }

        updateDisclaimer (disclaimer) {
            if (!disclaimer.taskPendingId) {
                this.services.navigation.setAction("exchange/disclaimer/update/disclaimer-update", angular.copy(disclaimer));
            }
        }

        deleteDisclaimer (disclaimer) {
            if (!disclaimer.taskPendingId) {
                this.services.navigation.setAction("exchange/disclaimer/remove/disclaimer-remove", angular.copy(disclaimer));
            }
        }
    });
