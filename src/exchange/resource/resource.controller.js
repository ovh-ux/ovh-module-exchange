angular.module('Module.exchange.controllers').controller(
  'ExchangeTabResourcesCtrl',
  class ExchangeTabResourcesCtrl {
    constructor(
      $scope,
      Exchange,
      ExchangeResources,
      EXCHANGE_CONFIG,
      User,
      navigation,
      messaging,
      $translate,
      exchangeStates,
    ) {
      this.services = {
        $scope,
        Exchange,
        ExchangeResources,
        EXCHANGE_CONFIG,
        User,
        navigation,
        messaging,
        $translate,
        exchangeStates,
      };

      this.$routerParams = Exchange.getParams();
      this.loading = false;
      this.urls = { guides: {} };
      this.exchange = Exchange.value;
      this.searchValue = null;

      $scope.$on(Exchange.events.resourcesChanged, () => {
        $scope.$broadcast('paginationServerSide.reload', 'resourcesTable');
      });

      User.getUser().then((data) => {
        try {
          this.urls.guides.resources = EXCHANGE_CONFIG.URLS.GUIDES.RESOURCES[data.ovhSubsidiary];
          return data;
        } catch (exception) {
          return '';
        }
      });

      $scope.retrievingResources = (count, offset) => this.retrievingResources(count, offset);
      this.debouncedRetrievingResources = _.debounce(this.retrievingResources, 300);
    }

    onSearchValueChanged() {
      this.debouncedRetrievingResources();
    }

    resetSearch() {
      this.searchValue = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'resourcesTable');
    }

    addResource() {
      this.services.navigation.setAction('exchange/resource/add/resource-add');
    }

    retrievingResources(count, offset) {
      this.services.messaging.resetMessages();
      this.loading = true;

      return this.services.ExchangeResources.retrievingResources(
        this.$routerParams.organization,
        this.$routerParams.productId,
        count,
        offset,
        this.searchValue,
      )
        .then((resources) => {
          this.resources = resources;
        })
        .catch((err) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_tab_RESOURCES_error_message'),
            err,
          );
        })
        .finally(() => {
          this.loading = false;
        });
    }
  },
);
