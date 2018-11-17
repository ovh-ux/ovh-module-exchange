angular
  .module('Module.exchange.services')
  .service(
    'exchangeOrder',
    class ExchangeOrder {
      constructor(
        $translate,

        exchangeServiceInfrastructure,
        exchangeVersion,
        OvhApiMsServices,
        OvhApiOrder,
        User,
      ) {
        this.$translate = $translate;

        this.exchangeServiceInfrastructure = exchangeServiceInfrastructure;
        this.exchangeVersion = exchangeVersion;
        this.OvhApiMsServices = OvhApiMsServices;
        this.OvhApiOrder = OvhApiOrder;
        this.User = User;
      }

      fetchingDoesServiceUseAgora(serviceName) {
        return this.OvhApiMsServices.Exchange().v6()
          .doesServiceUseAgora({ serviceName }).$promise
          .then(({ serviceUsesAgora }) => serviceUsesAgora);
      }

      creatingCart() {
        return this.User
          .getUser()
          .then(({ ovhSubsidiary }) => this.OvhApiOrder.Cart().v6()
            .post({ ovhSubsidiary }).$promise)
          .then(({ cartId }) => this.OvhApiOrder.Cart().v6().assign({ cartId }).$promise)
          .then(({ cartId }) => cartId);
      }

      buildDisplayableOfferFromOfferJoin([remoteOffer, localOffer]) {
        const availableDurations = {
          oneMonth: 'P1M',
          oneYear: 'P1Y',
        };

        const remotePrices = {
          P1M: remoteOffer.prices
            .find(price => price.duration === availableDurations.oneMonth)
            .price,
          P1Y: remoteOffer.prices
            .find(price => price.duration === availableDurations.oneYear)
            .price,
        };

        const displayableOffer = Object.assign(
          {},
          localOffer,
          {
            prices: {
              P1M: {
                valueToDisplay: remotePrices.P1M.text,
                description: this.$translate.instant('exchange_account_order_renewalPeriod_P1M_description', { price: remotePrices.P1M.text }),
                duration: availableDurations.oneMonth,
              },
              P1Y: {
                valueToDisplay: remotePrices.P1Y.text,
                description: this.$translate.instant('exchange_account_order_renewalPeriod_P1Y_description', { price: remotePrices.P1Y.text }),
                duration: availableDurations.oneYear,
              },
            },
          },
        );

        return displayableOffer;
      }

      joinLocalOffersAndRemoteOffers(localOffers, remoteOffers) {
        return _(remoteOffers)
          .concat(localOffers)
          .groupBy('planCode')
          .filter(offer => offer.length > 1) // removes items that don't match a local offer
          .map(this.buildDisplayableOfferFromOfferJoin, this)
          .sortBy(displayableOffer => displayableOffer.orderOfAppearance)
          .value();
      }

      fetchingProductOffers() {
        const serviceInfrastructureName = this.exchangeServiceInfrastructure
          .getName()
          .toLowerCase();
        const serviceVersion = this.exchangeVersion.get();

        const localOffers = [
          {
            orderOfAppearance: 1,
            planCode: `exchange-account-${serviceInfrastructureName}-${serviceVersion}`,
            valueToDisplay: this.$translate.instant(`exchange_account_order_accountType_item_exchange-account-${serviceInfrastructureName}-${serviceVersion}`),
          },
          {
            orderOfAppearance: 2,
            planCode: `exchange-account-${serviceInfrastructureName}-${serviceVersion}-enterprise`,
            valueToDisplay: this.$translate.instant(`exchange_account_order_accountType_item_exchange-account-${serviceInfrastructureName}-${serviceVersion}-enterprise`),
          },
          {
            orderOfAppearance: 3,
            planCode: `exchange-account-${serviceInfrastructureName}-${serviceVersion}-300g`,
            valueToDisplay: this.$translate.instant(`exchange_account_order_accountType_item_exchange-account-${serviceInfrastructureName}-${serviceVersion}-300g`),
          },
          {
            orderOfAppearance: 4,
            planCode: `exchange-account-${serviceInfrastructureName}-${serviceVersion}-300g-enterprise`,
            valueToDisplay: this.$translate.instant(`exchange_account_order_accountType_item_exchange-account-${serviceInfrastructureName}-${serviceVersion}-300g-enterprise`),
          },
        ];

        return this.creatingCart()
          .then(cartId => this.OvhApiOrder.Cart().Product().v6()
            .getOptions({
              cartId,
              productName: 'microsoft',
              planCode: `activedirectory-account-${serviceInfrastructureName}`,
            }).$promise)
          .then(remoteOffers => this.joinLocalOffersAndRemoteOffers(localOffers, remoteOffers));
      }

      // Passing from 50GB to 300GB is an upgrade
      fetchingUpgradePrices({
        serviceGlobalId,
        planCodeTooLookFor,
      }) {
        return this.OvhApiOrder.Upgrade().MicrosoftExchange().v6()
          .getAvailableOffers({
            serviceName: serviceGlobalId, // API doesn't actually use the name of the service
          }).$promise
          .then(offers => offers
            .find(offer => offer.planCode === planCodeTooLookFor)
            .prices
            .filter(price => price.priceInUcents !== 0)
            // if price.priceInUcents === 0 then the offer is not orderable
            .reduce(
              (
                previousValue,
                currentValue,
              ) => Object.assign(
                {},
                previousValue,
                { [currentValue.interval === 1 ? 'P1M' : 'P1Y']: currentValue.price }, // bug with the API prevents us from using price.duration
              ),
              {},
            ));
      }

      // An Outlook license is an option
      fetchingOptionPrices({
        serviceGlobalId,
        planCodeTooLookFor,
      }) {
        return this.OvhApiOrder.CartServiceOption().MicrosoftExchange().v6()
          .getAvailableOffers({
            serviceName: serviceGlobalId, // API doesn't actually use the name of the service
          }).$promise
          .then(offers => offers
            .find(offer => offer.planCode === planCodeTooLookFor)
            .prices
            .filter(price => price.priceInUcents !== 0)
            // if price.priceInUcents === 0 then the offer is not orderable
            .reduce(
              (
                previousValue,
                currentValue,
              ) => Object.assign(
                {},
                previousValue,
                { [currentValue.interval === 1 ? 'P1M' : 'P1Y']: currentValue.price }, // bug with the API prevents us from using price.duration
              ),
              {},
            ));
      }
    },
  );
