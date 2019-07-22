angular.module('Module.exchange.controllers')
  .controller('ExchangeAccountMfaCtrl', class ExchangeAccountMfaCtrl {
    constructor($scope, $translate, Exchange, exchangeAccount, messaging, navigation) {
      this.$scope = $scope;
      this.$translate = $translate;
      this.exchangeAccount = exchangeAccount;
      this.messaging = messaging;
      this.navigation = navigation;
      this.exchangeService = Exchange.value;
      $scope.submit = () => this.submit();
    }

    $onInit() {
      this.account = this.navigation.currentActionData.account;
      this.action = this.navigation.currentActionData.action;
    }

    create() {
      return this.exchangeAccount.createMfa(
        this.exchangeService.domain,
        this.account.primaryEmailAddress,
      );
    }

    enable() {
      return this.exchangeAccount.enableMfa(
        this.exchangeService.domain,
        this.account.primaryEmailAddress,
      );
    }

    disable() {
      return this.exchangeAccount.disableMfa(
        this.exchangeService.domain,
        this.account.primaryEmailAddress,
        this.disablePeriod,
      );
    }

    reset() {
      return this.exchangeAccount.resetMfa(
        this.exchangeService.domain,
        this.account.primaryEmailAddress,
      );
    }

    submit() {
      let promise = null;
      let messages = {};
      switch (this.action) {
        case 'RESET':
          promise = this.reset();
          messages = {
            success: 'exchange_reset_mfa_success',
            error: 'exchange_reset_mfa_error',
          };
          break;
        case 'DISABLE':
          promise = this.disable();
          messages = {
            success: 'exchange_disable_mfa_success',
            error: 'exchange_disable_mfa_error',
          };
          break;
        case 'ENABLE':
          promise = this.account.mfa.status === 'NOT_CREATED' ? this.create() : this.enable();
          messages = {
            success: 'exchange_enable_mfa_success',
            error: 'exchange_enable_mfa_error',
          };
          break;
        default:
          this.$scope.resetAction();
      }

      return promise.then(() => {
        this.messaging.writeSuccess(
          this.$translate.instant(messages.success),
        );
      }).catch((error) => {
        this.messaging.writeError(
          this.$translate.instant(messages.error, { error }),
        );
      }).finally(() => this.$scope.resetAction());
    }
  });
