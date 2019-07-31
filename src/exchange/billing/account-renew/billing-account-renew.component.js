import controller from './billing-account-renew.controller';
import template from './billing-account-renew.html';

angular.module('Module.exchange.components')
  .component('exchangeAccountRenew', {
    bindings: {
      organization: '<',
      exchangeName: '<',
      goBack: '<',
      onSuccess: '&',
      onError: '&',
    },
    controller,
    template,
  });
