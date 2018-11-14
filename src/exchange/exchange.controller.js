angular.module('Module.exchange.controllers').controller(
  'ExchangeCtrl',
  class ExchangeCtrl {
    constructor(
      $location,
      $rootScope,
      $scope,
      $timeout,
      $translate,
      Exchange,
      exchangeServiceInfrastructure,
      messaging,
      navigation,
      ovhUserPref,
      User,
    ) {
      this.services = {
        $location,
        $rootScope,
        $scope,
        $timeout,
        $translate,
        Exchange,
        exchangeServiceInfrastructure,
        messaging,
        navigation,
        ovhUserPref,
        User,
      };

      this.$routerParams = Exchange.getParams();

      _.set(navigation, '$exchangeRootScope', $scope);
      _.set(messaging, '$exchangeRootScope', $scope);

      $scope.resetAction = navigation.resetAction.bind(navigation);
      $scope.setAction = navigation.setAction.bind(navigation);
      $scope.resetMessages = messaging.resetMessages.bind(messaging);
      $scope.setMessage = messaging.setMessage.bind(messaging);

      this.isLoading = true;
      this.hasNoDomain = false;
      this.loadingExchangeError = false;

      this.currentAction = null;
      this.currentActionData = null;
      this.displayGuides = null;
      this.displayName = null;

      $scope.$on('exchange.dashboard.refresh', () => {
        this.retrievingExchange();
      });

      $scope.$on('$locationChangeStart', () => {
        this.services.navigation.resetAction();
      });

      $scope.$on('exchange.wizard_hosted_creation.display', () => {
        this.shouldOpenWizard = this.services.exchangeServiceInfrastructure.isHosted();
        this.hasNoDomain = true;
      });

      $scope.$on('exchange.wizard_hosted_creation.hide', () => {
        this.shouldOpenWizard = false;
        this.hasNoDomain = false;
      });

      this.retrievingExchange()
        .then(() => {
          if ($location.search().action === 'billing') {
            $timeout(() => {
              $rootScope.$broadcast(
                'leftNavigation.selectProduct.fromName',
                this.parseLocationForExchangeData(),
              );
              $scope.setAction(
                'exchange/header/update-renew/update-renew',
                this.parseLocationForExchangeData(),
              );
            });
          }
        });
    }

    $onInit() {
      this.services.$scope.resetMessages();
    }

    retrievingWizardPreference() {
      this.isLoading = true;
      this.shouldOpenWizard = this.services.exchangeServiceInfrastructure.isHosted();

      if (!this.shouldOpenWizard) {
        return false;
      }

      return this.services.Exchange.retrievingWizardPreference()
        .then((preference) => {
          this.shouldOpenWizard = _.get(preference, 'shouldOpenWizard', false);
        })
        .catch(() => {
          this.shouldOpenWizard = true;
        })
        .then(() => this.services.User.getUser().then((currentUser) => {
          const { ovhSubsidiary } = currentUser;

          this.shouldOpenWizard = this.shouldOpenWizard && ovhSubsidiary !== 'CA';
        }))
        .then(() => {
          if (this.shouldOpenWizard) {
            return this.services.ovhUserPref
              .getValue('WIZARD_HOSTED_CREATION_CHECKPOINT')
              .catch(() => null)
              .then((preferences) => {
                const preferenceToSave = !_(preferences).isObject() || _(preferences).isEmpty()
                  ? {}
                  : preferences;

                const hasNoDomain = this.exchange.domainsNumber === 0;
                const isReturningToWizard = !_(
                  preferenceToSave[this.$routerParams.organization],
                ).isEmpty();

                this.hasNoDomain = hasNoDomain || (!hasNoDomain && isReturningToWizard);
              });
          }

          return null;
        })
        .finally(() => {
          this.isLoading = false;
        });
    }

    retrievingExchange() {
      this.isLoading = true;

      return this.services.Exchange.getSelected(true)
        .then((exchange) => {
          this.services.Exchange.value = exchange;
          this.exchange = exchange;
        })
        .then(() => {
          if (!_.isEmpty(this.exchange.messages)) {
            this.services.messaging.writeError(
              this.services.$translate.instant('exchange_dashboard_loading_error'),
              this.exchange,
            );
          }
        })
        .then(() => this.services.Exchange.updateValue())
        .then(() => this.retrievingWizardPreference())
        .catch((failure) => {
          if (failure) {
            const response = failure.data || failure;
            const data = {
              status: 'ERROR',
              messages: [
                {
                  type: 'ERROR',
                  message: response.message,
                  id: response.id,
                },
              ],
            };

            if (response.code === 460 || response.status === 460) {
              this.services.messaging.writeError(
                this.services.$translate.instant('common_service_expired', { t0: response.id }),
                data,
              );
            } else {
              this.services.messaging.writeError(
                this.services.$translate.instant('exchange_dashboard_loading_error'),
                data,
              );
            }
          } else {
            this.loadingExchangeError = true;
          }
        })
        .finally(() => {
          this.isLoading = false;
        });
    }

    parseLocationForExchangeData() {
      // expect something like
      // /configuration/exchange_dedicated/organization-ID/exchange-ID?action=billing&tab=DOMAINS"
      // extract "exchange_dedicated"
      const locationSplit = this.services.$location
        .url()
        .replace('/configuration/', '')
        .split('/');
      const type = locationSplit[0].toUpperCase();

      return {
        name: this.$routerParams.productId,
        organization: this.$routerParams.organization,
        type,
      };
    }
  },
);
