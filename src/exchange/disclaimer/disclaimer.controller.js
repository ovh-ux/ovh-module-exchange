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
            this.$routerParams = this.services.Exchange.getParams();
            this.disclaimersList = null;
            this.loading = {
                table: false
            };

            this.services.$scope.$on(this.services.Exchange.events.disclaimersChanged, () => this.services.$scope.$broadcast("paginationServerSide.reload", "disclaimersTable"));
            this.services.$scope.loadPaginated = (count, offset) => this.loadPaginated(count, offset);
        }

        /* eslint-disable class-methods-use-this */
        hasEmptySlot (list) {
            return _.some(list, (item) => item.emptySlotFlag);
        }
        /* eslint-enable class-methods-use-this */

        /* eslint-disable class-methods-use-this */
        hasFullSlot (list) {
            return _.some(list, (item) => !item.emptySlotFlag);
        }
        /* eslint-enable class-methods-use-this */

        loadPaginated (count, offset) {
            this.loading.table = true;

            this.services
                .Exchange.getDisclaimers(this.$routerParams.organization, this.$routerParams.productId, count, offset)
                .then((disclaimers) => {
                    this.disclaimersList = disclaimers;
                    this.setMessagesFlags(disclaimers);
                })
                .catch((err) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_DISCLAIMER_error_message"), err);
                })
                .finally(() => {
                    this.loading.table = false;
                });
        }

        setMessagesFlags (disclaimersList) {
            const disclaimersHaveEmptylot = this.hasEmptySlot(disclaimersList.list.results);
            const disclaimersHaveFullSlot = this.hasFullSlot(disclaimersList.list.results);

            this.addDomainMessageFlag = _.isEmpty(disclaimersList.list.results) || (!disclaimersHaveEmptylot && !disclaimersHaveFullSlot);
            this.noDisclaimerMessageFlag = disclaimersHaveEmptylot && !disclaimersHaveFullSlot;
        }

        newDisclaimersDisabled () {
            return this.disclaimersList != null && !this.hasEmptySlot(this.disclaimersList.list.results);
        }

        addDisclaimer () {
            if (!this.newDisclaimersDisabled()) {
                this.services.navigation.setAction("exchange/disclaimer/add/disclaimer-add");
            }
        }
    });
