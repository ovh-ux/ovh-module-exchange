angular.module('Module.exchange.controllers')
  .controller('ExchangeAccountMfaCtrl', class ExchangeAccountMfaCtrl {
    constructor(
      $q,
      $scope,
      $timeout,
      $translate,
      Exchange,
      exchangeAccount,
      messaging,
      navigation,
    ) {
      this.$q = $q;
      this.$scope = $scope;
      this.$timeout = $timeout;
      this.$translate = $translate;
      this.exchangeAccount = exchangeAccount;
      this.messaging = messaging;
      this.navigation = navigation;
      this.exchangeService = Exchange.value;
      this.Exchange = Exchange;
      $scope.submit = () => this.submit();
    }

    $onInit() {
      this.account = this.navigation.currentActionData.account;
      this.action = this.navigation.currentActionData.action;

      this.Exchange.getExchangeServer(
        this.exchangeService.organization,
        this.exchangeService.domain,
      ).then((server) => {
        this.server = server;
      }).catch((error) => {
        this.messaging.writeError(
          this.$translate.instant('exchange_mfa_error', {
            error: error.message,
          }),
        );

        this.$scope.resetAction();
      });
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
      const serverMfaPromise = this.server.owaMfa
        ? this.$q.resolve(true)
        : this.Exchange.updateExchangeServer(
          this.exchangeService.organization,
          this.exchangeService.domain,
          { owaMfa: true },
        );

      let accountMfaPromise = null;
      let messages = {};
      switch (this.action) {
        case 'RESET':
          accountMfaPromise = this.reset();
          messages = {
            success: 'exchange_reset_mfa_success',
            error: 'exchange_reset_mfa_error',
          };
          break;
        case 'DISABLE':
          accountMfaPromise = this.disable();
          messages = {
            success: 'exchange_disable_mfa_success',
            error: 'exchange_disable_mfa_error',
          };
          break;
        case 'ENABLE':
          accountMfaPromise = this.account.mfa.status === 'NOT_CREATED' ? this.create() : this.enable();
          messages = {
            success: 'exchange_enable_mfa_success',
            error: 'exchange_enable_mfa_error',
          };
          break;
        default:
          this.$scope.resetAction();
      }

      return serverMfaPromise
        .then(() => this.$timeout(2000))
        .then(() => accountMfaPromise)
        .then(() => {
          this.messaging.writeSuccess(
            this.$translate.instant(messages.success),
          );
        }).catch((error) => {
          this.messaging.writeError(
            this.$translate.instant(messages.error, {
              error: error.message,
            }),
          );
        })
        .finally(() => this.$scope.resetAction());
    }
  });