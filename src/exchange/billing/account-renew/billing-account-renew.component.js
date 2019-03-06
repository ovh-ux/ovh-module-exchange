angular.module('Module.exchange.components')
  .component('exchangeAccountRenew', {
    bindings: {
      organization: '@',
      exchangeName: '@',
    },
    controller: 'ExchangeUpdateRenewCtrl',
    templateUrl: 'exchange/billing/account-renew/billing-account-renew.template.html',
  });
