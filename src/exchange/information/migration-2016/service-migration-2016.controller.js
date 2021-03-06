angular.module('Module.exchange.controllers').controller(
  'ExchangeMigration2016Ctrl',
  class ExchangeMigration2016Ctrl {
    constructor($scope, Exchange, navigation, messaging, $translate, $window) {
      this.services = {
        $scope,
        Exchange,
        navigation,
        messaging,
        $translate,
        $window,
      };
    }

    $onInit() {
      this.curExchange = this.services.navigation.currentActionData;
      this.model = {};
      this.agree = {
        value: false,
      };

      this.services.$scope.submitting = () => this.submitting();

      this.retrievingContracts();
    }

    retrievingContracts() {
      this.agree.value = false;

      return this.services.Exchange.getUpgradeInfos(this.curExchange)
        .then((data) => {
          this.model.contracts = data.contracts;
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_ACTION_upgrade_get_contracts_error'),
            failure,
          );
          this.services.navigation.resetAction();
        });
    }

    submitting() {
      return this.services.Exchange.upgradeExchange(this.curExchange)
        .then((order) => {
          this.services.messaging.writeSuccess(
            this.services.$translate.instant('exchange_ACTION_order_upgrade_success', {
              t0: order.url,
              t1: order.orderId,
            }),
          );
          this.services.$window.open(order.url, '_blank');
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_ACTION_order_upgrade_error'),
            failure,
          );
        })
        .finally(() => {
          this.services.navigation.resetAction();
        });
    }
  },
);
