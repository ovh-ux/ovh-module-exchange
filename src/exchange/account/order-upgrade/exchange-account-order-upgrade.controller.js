angular
  .module('Module.exchange.controllers')
  .controller(
    'exchangeAccountOrderUpgradeCtrl',
    class ExchangeAccountOrderUpgradeCtrl {
      constructor(
        $q,
        $scope,
        $translate,
        $window,

        Exchange,
        exchangeOrder,
        exchangeServiceInfrastructure,
        exchangeVersion,
        messaging,
        navigation,
        User,
      ) {
        this.$q = $q;
        this.$scope = $scope;
        this.$translate = $translate;
        this.$window = $window;

        this.Exchange = Exchange;
        this.exchangeOrder = exchangeOrder;
        this.exchangeServiceInfrastructure = exchangeServiceInfrastructure;
        this.exchangeVersion = exchangeVersion;
        this.messaging = messaging;
        this.navigation = navigation;
        this.User = User;
      }

      $onInit() {
        this.$routerParams = this.Exchange.getParams();

        this.targets = {
          account: {
            globalId: `${this.$routerParams.productId}-${this.navigation.currentActionData.id}`, // id among all OVH services
            primaryEmailAddress: this.navigation.currentActionData.emailAddress,
          },
          service: {
            name: {
              value: this.$routerParams.productId,
              valueToDisplay: this.Exchange.value.displayName,
            },
            type: this.exchangeServiceInfrastructure.getName().toLowerCase(),
            version: this.exchangeVersion.get(),
            expirationDate: {
              value: moment(this.navigation.currentActionData.expirationDate, 'YYYY-MM-DD'),
              valueToDisplay: moment(this.navigation.currentActionData.expirationDate, 'YYYY-MM-DD').format('LL'),
            },
            expiresBeforeEndOfRenewalPeriod: false,
          },
        };

        this.renewalPeriod = 'P1M';
        this.updateValueOfTargetServiceExpiresBeforeEndOfRenewalPeriod(this.renewalPeriod);

        return this.fetchingPrices();
      }

      fetchingPrices() {
        this.isFetchingPrices = true;

        return this.exchangeOrder
          .fetchingUpgradePrices({
            serviceGlobalId: this.targets.account.globalId, // an Exchange account is a service
            planCodeTooLookFor: `exchange-account-${this.targets.service.type}-${this.targets.service.version}-300g`,
          })
          .then((prices) => {
            this.prices = prices;
          })
          .catch((error) => {
            this.messaging.writeError(
              this.$translate.instant(
                'exchange_account_orderUpgrade_fetchingPrices_error',
                {
                  errorMessage: _.get(error, 'data.message', error.toString()),
                },
              ),
            );

            this.$scope.resetAction();
          })
          .finally(() => {
            this.isFetchingPrices = false;
          });
      }

      updateValueOfTargetServiceExpiresBeforeEndOfRenewalPeriod(renewalPeriod) {
        this.targets.service.expiresBeforeEndOfRenewalPeriod = renewalPeriod === 'P1M'
          ? moment().add(1, 'months').isAfter(this.targets.service.expirationDate.value)
          : moment().add(1, 'years').isAfter(this.targets.service.expirationDate.value);
      }

      openingNewTabToOrderForm() {
        if (this.form.$invalid) {
          return this.$q.when();
        }

        const orderPayload = JSURL.stringify([{
          duration: this.renewalPeriod,
          planCode: `activedirectory-account-${this.targets.service.type}`,
          productId: 'microsoft',
          serviceName: this.targets.service.name.value,
          option: [{
            planCode: `exchange-account-${this.targets.service.type}-${this.targets.service.version}-300g`,
            serviceName: this.targets.account.globalId,
          }],
        }]);

        return this.User
          .getUrlOfEndsWithSubsidiary('express_order')
          .then((expressOrderUrl) => {
            this.$window.open(
              `${expressOrderUrl}#/new/express/resume?products=${orderPayload}`,
              '_blank',
            );
          })
          .catch((error) => {
            this.messaging.writeError(
              this.$translate.instant(
                'exchange_account_orderUpgrade_openingNewTabToOrderForm_error',
                {
                  errorMessage: _.get(error, 'message', error.toString()),
                },
              ),
            );
          })
          .finally(() => {
            this.$scope.resetAction();
          });
      }
    },
  );
