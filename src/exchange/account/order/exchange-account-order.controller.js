angular
  .module('Module.exchange.controllers')
  .controller(
    'exchangeAccountOrderCtrl',
    class ExchangeAccountOrderCtrl {
      constructor(
        $q,
        $scope,
        $translate,
        $window,

        Exchange,
        exchangeOrder,
        exchangeServiceInfrastructure,
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
        this.messaging = messaging;
        this.navigation = navigation;
        this.User = User;
      }

      $onInit() {
        this.$routerParams = this.Exchange.getParams();
        this.serviceToTarget = this.navigation.currentActionData.serviceToTarget;

        this.renewalPeriod = 'P1M';
        this.updateValueOfServiceToTargetExpiresBeforeEndOfRenewalPeriod(this.renewalPeriod);

        return this.fetchingOffers();
      }

      fetchingOffers() {
        this.isFetchingOffers = true;

        return this.exchangeOrder
          .fetchingProductOffers()
          .then((offers) => {
            this.offers = offers;
          })
          .catch((error) => {
            this.messaging.writeError(
              this.$translate.instant(
                'exchange_account_order_fetchingOffers_error',
                {
                  errorMessage: _.get(error, 'data.message', error.toString()),
                },
              ),
            );

            this.$scope.resetAction();
          })
          .finally(() => {
            this.isFetchingOffers = false;
          });
      }

      updateValueOfServiceToTargetExpiresBeforeEndOfRenewalPeriod(value) {
        this.serviceToTargetExpiresBeforeEndOfRenewalPeriod = value === 'P1M'
          ? moment().add(1, 'months').isAfter(this.serviceToTarget.expirationDate.value)
          : moment().add(1, 'years').isAfter(this.serviceToTarget.expirationDate.value);
      }

      openingNewTabToOrderForm() {
        if (this.form.$invalid) {
          return this.$q.when();
        }

        const orderPayload = JSURL.stringify([{
          productId: 'microsoft',
          planCode: `activedirectory-account-${this.exchangeServiceInfrastructure.getName().toLowerCase()}`,
          serviceName: this.$routerParams.productId,
          quantity: this.numberOfAccountsToOrder,
          option: [{
            planCode: this.offer.planCode,
            quantity: this.numberOfAccountsToOrder,
            duration: this.renewalPeriod,
          }],
        }]);

        return this.User
          .getUrlOfEndsWithSubsidiary('express_order')
          .then((expressOrderUrl) => {
            this.$window.open(
              `${expressOrderUrl}#/express/review?products=${orderPayload}`,
              '_blank',
            );
          })
          .catch((error) => {
            this.messaging.writeError(
              this.$translate.instant(
                'exchange_account_order_openingNewTabToOrderForm_error',
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
