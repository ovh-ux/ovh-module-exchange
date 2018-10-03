angular.module('Module.exchange.controllers').controller(
  'ExchangeAddDisclaimerCtrl',
  class ExchangeAddDisclaimerCtrl {
    constructor($scope, Exchange, navigation, messaging, $translate) {
      this.services = {
        $scope,
        Exchange,
        navigation,
        messaging,
        $translate,
      };

      this.mceId = 'add-disclaimer-editor';
      this.$routerParams = Exchange.getParams();

      this.data = {
        content: '',
        outsideOnly: false,
        selectedVariable: 'Name',
      };

      this.loadAvailableDomains();

      $scope.saveDisclaimer = () => this.saveDisclaimer();
      $scope.isStep1Valid = () => this.isStep1Valid();
    }

    loadAvailableDomains() {
      this.loadingData = true;

      return this.services.Exchange.getNewDisclaimerOptions(
        this.$routerParams.organization,
        this.$routerParams.productId,
      ).then((data) => {
        this.loadingData = false;

        if (data.availableDomains) {
          this.availableDomains = data.availableDomains;
          this.selectCurrentDomain();

          this.data.selectedAttribute = data.availableAttributes[0];
          this.availableAttributes = data.availableAttributes;
        } else {
          this.services.navigation.resetAction();
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_ACTION_add_disclaimer_no_domains'),
          );
        }
      });
    }

    selectCurrentDomain() {
      if (_.get(this.services.navigation, 'currentActionData.domain.name')) {
        this.data.completeDomain = _.find(
          this.availableDomains,
          'name',
          this.services.navigation.currentActionData.domain.name,
        );
      }
      if (!this.data.completeDomain) {
        this.data.completeDomain = this.availableDomains[0];
      }
    }

    isStep1Valid() {
      return this.data.completeDomain && this.data.content && this.data.content.length < 5000;
    }

    saveDisclaimer() {
      const model = {
        domain: this.data.completeDomain.name,
        externalEmailsOnly: this.data.outsideOnly,
        content: this.data.content,
      };

      this.services.messaging.writeSuccess(
        this.services.$translate.instant('exchange_dashboard_action_doing'),
      );

      this.services.Exchange.saveDisclaimer(
        this.$routerParams.organization,
        this.$routerParams.productId,
        model,
      )
        .then((data) => {
          this.services.messaging.writeSuccess(
            this.services.$translate.instant('exchange_ACTION_add_disclaimer_success_message'),
            data,
          );
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_ACTION_add_disclaimer_error_message'),
            failure,
          );
        })
        .finally(() => {
          this.services.navigation.resetAction();
        });
    }
  },
);
