angular.module('Module.exchange.services').service(
  'ExchangeDomains',
  class ExchangeDomains {
    constructor($rootScope, Products, $http, $q, constants, Exchange, OvhHttp) {
      this.services = {
        $rootScope,
        Products,
        $http,
        $q,
        constants,
        Exchange,
        OvhHttp,
      };
    }

    gettingDomains(organization, serviceName, count = 10, offset = 0, search = '') {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/domains', {
        rootPath: '2api',
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

    addingDomain(domainToAdd) {
      const keyMapping = {
        mxParam: 'configureMx',
        srvParam: 'configureAutodiscover',
      };

      const transformDomain = _.transform(domainToAdd, (result, valueParam, key) => {
        let value = valueParam;

        if (key === 'type') {
          value = _.camelCase(value);
        }

        if (!_.isEmpty(_.pick(keyMapping, key))) {
          // uses value from the keyMapping object
          result[keyMapping[key]] = value; // eslint-disable-line
        } else {
          // uses value from the domain
          result[key] = value; // eslint-disable-line
        }
      });

      if (transformDomain.type === 'authoritative') {
        delete transformDomain.mxRelay;
      }

      return this.services.OvhHttp.post(
        '/email/exchange/{organizationName}/service/{exchangeService}/domain',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: this.services.Exchange.value.organization,
            exchangeService: this.services.Exchange.value.domain,
          },
          data: transformDomain,
        },
      ).then((response) => {
        this.services.Exchange.resetDomains();
        this.services.Exchange.resetAccounts();
        this.services.Exchange.resetTasks();

        return response;
      });
    }

    retrievingDataToCreateDomains(organization, productId) {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/domains/options', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: productId,
        },
      });
    }

    updatingDomain(organization, productId, domainName, data) {
      return this.services.OvhHttp.put(
        '/email/exchange/{organization}/service/{exchange}/domain/{domainName}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: productId,
            domainName,
          },
          data,
        },
      ).then((response) => {
        this.services.Exchange.resetDomains();
        this.services.Exchange.resetTasks();

        return response;
      });
    }

    removingDomain(organization, serviceName, name) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/domain/{domainName}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            domainName: name,
          },
        },
      ).then((response) => {
        this.services.Exchange.resetDomains();
        this.services.Exchange.resetAccounts();
        this.services.Exchange.resetTasks();

        return response;
      });
    }

    /**
     * Get exchange license history
     */
    addingZoneDnsField(organization, serviceName, data) {
      return this.services.OvhHttp.put(
        '/sws/exchange/{organization}/{exchange}/domains/{domain}/dnsSettings-update',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            domain: data.domain,
          },
          data,
        },
      );
    }

    gettingDNSSettings(organization, serviceName, domain) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/domains/{domain}/dnsSettings',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            domain,
          },
        },
      );
    }
  },
);
