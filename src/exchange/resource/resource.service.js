angular.module('Module.exchange.services').service(
  'ExchangeResources',
  class ExchangeResources {
    constructor($http, $q, $rootScope, Exchange, OvhHttp) {
      this.services = {
        $http,
        $q,
        $rootScope,
        Exchange,
        OvhHttp,
      };
    }

    /**
     * Return the selected resources for the current exchange account
     */
    retrievingResources(organization, serviceName, count = 10, offset = 0, search = '') {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/resources', {
        rootPath: '2api',
        clearCache: true,
        urlParams: {
          organization,
          exchange: serviceName,
        },
        params: {
          count,
          offset,
          search,
        },
      });
    }

    /**
     * Return the options for creating resources
     */
    getResourcesOptions(organization, serviceName) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/resources/options',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
          },
        },
      );
    }

    addResource(organization, serviceName, resource) {
      return this.services.OvhHttp.post(
        '/email/exchange/{organization}/service/{exchange}/resourceAccount',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
          },
          data: {
            allowConflict: resource.allowConflict,
            capacity: resource.capacity,
            type: _.camelCase(resource.resourceType),
            resourceEmailAddress: resource.resourceEmailAddress,
            displayName: resource.displayName,
          },
        },
      ).then((response) => {
        this.services.Exchange.resetResources();
        this.services.Exchange.resetTasks();

        return response;
      });
    }

    updateResource(organization, serviceName, resource) {
      return this.services.OvhHttp.put(
        '/email/exchange/{organization}/service/{exchange}/resourceAccount/{resourceEmailAddress}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            resourceEmailAddress: resource.resourceEmailAddress,
          },
          data: {
            allowConflict: resource.allowConflict,
            capacity: resource.capacity,
            displayName: resource.displayName,
          },
        },
      ).then((response) => {
        this.services.Exchange.resetResources();
        this.services.Exchange.resetTasks();

        return response;
      });
    }

    /**
     * Delete resource
     */
    removeResource(organization, serviceName, resourceEmailAddress) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/resourceAccount/{resourceEmailAddress}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            resourceEmailAddress,
          },
        },
      ).then((data) => {
        this.services.Exchange.resetResources();
        this.services.Exchange.resetTasks();

        return data;
      });
    }

    /**
     * Get accounts by resource
     */
    getAccountsByResource(
      organization,
      serviceName,
      resourceEmailAddress,
      count = 10,
      offset = 0,
      search = '',
    ) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/resources/{resourceEmailAddress}/rights',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
            resourceEmailAddress,
          },
          params: {
            count,
            offset,
            search,
          },
        },
      );
    }

    /**
     * Get accounts by resource
     */
    updateResourceDelegation(organization, serviceName, resourceEmailAddress, delegationModel) {
      return this.services.OvhHttp.put(
        '/sws/exchange/{organization}/{exchange}/resources/{resourceEmailAddress}/rights-update',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
            resourceEmailAddress,
          },
          data: delegationModel,
        },
      ).then((response) => {
        this.services.Exchange.resetResources();
        this.services.Exchange.resetTasks();

        return response;
      });
    }
  },
);
