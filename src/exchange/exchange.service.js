angular.module('Module.exchange.services').service(
  'Exchange',
  class Exchange {
    constructor(
      $cacheFactory,
      $http,
      $q,
      $rootScope,
      $stateParams,
      APIExchange,
      OvhApiEmailExchange,
      OvhHttp,
      ovhUserPref,
      constants,
    ) {
      this.services = {
        $cacheFactory,
        $http,
        $q,
        $rootScope,
        $stateParams,
        APIExchange,
        OvhApiEmailExchange,
        OvhHttp,
        ovhUserPref,
        constants,
      };

      this.requests = {
        exchangeDetails: null,
      };

      this.tasksCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_TASKS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_TASKS');
      this.delegationRightsCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_DELEGATION_RIGHTS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_DELEGATION_RIGHTS');
      this.disclaimersCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_DISCLAIMERS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_DISCLAIMERS');
      this.exchangeCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE') || $cacheFactory('UNIVERS_WEB_EXCHANGE');
      this.domainsCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_DOMAINS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_DOMAINS');
      this.accountsCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_ACCOUNTS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_ACCOUNTS');
      this.sharedAccountsCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_SHARED_ACCOUNTS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_SHARED_ACCOUNTS');
      this.resourcesCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_RESOURCES')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_RESOURCES');
      this.groupsCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_GROUPS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_GROUPS');
      this.publicFolderCache = $cacheFactory.get('UNIVERS_WEB_EXCHANGE_PUBLIC_FOLDERS')
        || $cacheFactory('UNIVERS_WEB_EXCHANGE_PUBLIC_FOLDERS');

      this.updateAccountAction = 'UPDATE_ACCOUNT';
      this.changePasswordAction = 'CHANGE_PASSWORD';
      this.nicBill = 'BILLING';
      this.nicAdmin = 'ADMIN';
      this.nicTech = 'TECH';

      this.stateCreating = 'CREATING';
      this.stateDeleting = 'DELETING';
      this.stateReopening = 'REOPENING';
      this.stateSuspended = 'SUSPENDED';
      this.stateSuspending = 'SUSPENDING';
      this.stateOk = 'OK';
      this.stateTaskDoing = 'TASK_ON_DOING';

      this.aliasMaxLimit = 1000;

      this.events = {
        domainsChanged: 'exchange.domains.changed',
        accountsChanged: 'exchange.accounts.changed',
        sharedAccountsChanged: 'exchange.sharedAccounts.changed',
        tasksChanged: 'exchange.tasks.changed',
        delegationRightsChanged: 'exchange.delegationRights.changed',
        resourcesChanged: 'exchange.resources.changed',
        groupsChanged: 'exchange.groups.changed',
        disclaimersChanged: 'exchange.disclaimers.changed',
        externalcontactsChanged: 'exchange.tabs.externalcontacts.changed',
        publicFoldersChanged: 'exchange.tabs.publicFolders.changed',
        sslRenewAsked: 'exchange.sslRenew.asked',
      };

      this.updateValue();
    }

    /*
         * Private function to reset the cache
         */
    resetCache(key) {
      if (key != null) {
        if (this.requests[key] != null) {
          this.requests[key] = null;
        }

        this.exchangeCache.remove(key);
      } else {
        this.exchangeCache.removeAll();
        this.domainsCache.removeAll();
        this.accountsCache.removeAll();
        this.sharedAccountsCache.removeAll();
        this.tasksCache.removeAll();
        this.delegationRightsCache.removeAll();
        this.groupsCache.removeAll();
        this.resourcesCache.removeAll();
        this.publicFolderCache.removeAll();
        this.disclaimersCache.removeAll();

        _.forEach(Object.keys(this.requests), (request) => {
          this.requests[request] = null;
        });
      }
    }

    getValue() {
      return this.value;
    }

    getParams() {
      return this.services.$stateParams;
    }

    resetDomains() {
      this.domainsCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.domainsChanged);
    }

    resetAccounts() {
      this.accountsCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.accountsChanged);
    }

    resetSharedAccounts() {
      this.sharedAccountsCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.sharedAccountsChanged);
    }

    resetTasks() {
      this.tasksCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.tasksChanged);
    }

    resetDelegationRights() {
      this.delegationRightsCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.delegationRightsChanged);
    }

    resetResources() {
      this.resourcesCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.resourcesChanged);
    }

    resetGroups() {
      this.groupsCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.groupsChanged);
    }

    resetDisclaimers() {
      this.disclaimersCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.disclaimersChanged);
    }

    resetPublicFolder() {
      this.publicFolderCache.removeAll();
      this.services.$rootScope.$broadcast(this.events.publicFoldersChanged);
    }

    resetTabExternalContacts() {
      this.services.$rootScope.$broadcast(this.events.externalcontactsChanged);
    }

    getSuccessDataOrReject(response) {
      return response.status < 300 ? response.data : this.services.$q.reject(response);
    }

    static isEmailValid(email) {
      return (
        email
        && email.match(
          /^[\w!#$%&'*+/=?^`{|}~-]+(?:\.[\w!#$%&'*+/=?^`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]{2}(?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
        )
      );
    }

    retrievingWizardPreference() {
      return this.services.ovhUserPref.getValue('WIZARD_HOSTED_CREATION_OPENING_PREFERENCE');
    }

    currentUserHasConfigurationRights() {
      return _(this.value.nicType).some(
        nicType => nicType === this.nicAdmin || nicType === this.nicTech,
      );
    }

    getExchangeServices() {
      return this.services.OvhApiEmailExchange.service().v7()
        .query()
        .expand(false)
        .aggregate('displayName')
        .execute({ organizationName: '*' })
        .$promise
        .then(services => _.filter(services, service => _.has(service, 'value.displayName') && _.has(service, 'value.offer')))
        .then(services => _.map(
          services, service => ({
            name: service.key,
            displayName: service.value.displayName,
            organization: _.get(service.path.split('/'), '[3]'),
            type: `EXCHANGE_${service.value.offer.toUpperCase()}`,
          }),
        ));
    }

    getExchange(organization, exchangeId) {
      return this.getExchangeServices()
        .then(services => _.find(services, {
          name: exchangeId,
          organization,
        }));
    }

    getExchangeDetails(organization, exchangeName) {
      return this.services.OvhApiEmailExchange.service().Aapi().get({
        organization,
        exchange: exchangeName,
      }).$promise;
    }

    /**
     * Get Selected Exchange
     */
    getSelected(forceRefresh) {
      if (forceRefresh) {
        this.resetCache();
      }

      const { organization, productId } = this.getParams();

      return this.getExchange(organization, productId)
        .then((product) => {
          if (product && product.organization) {
            const selectedExchange = this.exchangeCache.get('exchange');
            if (!selectedExchange) {
              if (this.requests.exchangeDetails === null) {
                this.requests.exchangeDetails = this.services.OvhHttp.get(
                  '/sws/exchange/{organization}/{exchange}',
                  {
                    rootPath: '2api',
                    urlParams: {
                      organization: product.organization,
                      exchange: product.name,
                    },
                  },
                ).then((result) => {
                  this.exchangeCache.put('exchange', result);
                });
              }
              return this.requests.exchangeDetails;
            }
            return selectedExchange;
          }
          return this.services.$q.reject(product);
        })
        .then(() => this.exchangeCache.get('exchange'))
        .catch(reason => this.services.$q.reject(reason));
    }

    updateValue() {
      return this.getSelected().then((exchange) => {
        this.value = exchange;
      });
    }

    setConfiguration(organization, serviceName, data) {
      return this.services.APIExchange.put('/{organizationName}/service/{exchangeService}', {
        urlParams: {
          organizationName: organization,
          exchangeService: serviceName,
        },
        data,
      }).then(() => this.services.APIExchange.post(
        '/{organizationName}/service/{exchangeService}/updateFlagsOnAllAccounts',
        {
          urlParams: {
            organizationName: organization,
            exchangeService: serviceName,
          },
        },
      ));
    }

    /**
     * Return the last 2 days task list for the selected exchange
     */
    getTasks(organization, serviceName, count = 10, offset = 0) {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/tasks', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: serviceName,
        },
        params: {
          count,
          offset,
        },
      });
    }

    /**
     * Return the list of e-mails available to be used for SSL renew operation
     */
    retrievingDVCEmails(organization, serviceName) {
      return this.services.OvhHttp.get(
        '/email/exchange/{organizationName}/service/{exchangeService}/dcvEmails',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: organization,
            exchangeService: serviceName,
          },
          returnKey: '',
        },
      ).then((dcvs) => {
        const data = dcvs || dcvs.data;

        return data.map(dcv => ({
          name: dcv,
          displayName: punycode.toUnicode(dcv),
          formattedName: punycode.toUnicode(dcv),
        }));
      });
    }

    /**
     * Renew SSL certificate
     */
    renewSsl(organization, serviceName, dcvEmail) {
      return this.services.OvhHttp.post(
        '/email/exchange/{organizationName}/service/{exchangeService}/renewSSL',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: organization,
            exchangeService: serviceName,
          },
          data: {
            dcv: dcvEmail,
          },
          broadcast: this.events.sslRenewAsked,
        },
      );
    }

    /**
     * Return paginated exchange accounts list
     * @param pageSize - the size of page([10, 20, 40])
     * @param offset - page index
     * @param search - filter over primaryEmail value
     * @param configurableOnly - Integer value: "0" to get all, "1" to filter out dummy accounts
     *                           and creating/deleting ones
     */
    getAccounts(pageSize, offset, search, configurableOnly, type, timeout) {
      return this.getSelected().then(exchange => this.getAccountsForExchange(
        exchange,
        pageSize,
        offset,
        search,
        configurableOnly,
        type,
        timeout,
      ));
    }

    /**
     * Return paginated accounts list for the specified exchange.
     * @param exchange - an object describing exchange service we want the accounts of.
     *                   Use this.getSelected() for the currently selected exchange service
     * @param cache - the cache to use. If getting for the selected exchange,
     *                use this.accountsCache.
     * @param pageSize - the size of page([10, 20, 40])
     * @param offset - page index
     * @param search - filter over primaryEmail value
     * @param configurableOnly - Integer value: "0" to get all, "1" to filter out dummy accounts
     *                           and creating/deleting ones
     */
    getAccountsForExchange(
      exchange,
      count = 10,
      offset = 0,
      search = '',
      configurableOnly = 0,
      type = '',
      timeout = null,
    ) {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/accounts', {
        rootPath: '2api',
        urlParams: {
          organization: exchange.organization,
          exchange: exchange.domain,
        },
        params: {
          count,
          offset,
          search,
          configurableOnly,
          typeLicence: type,
        },
        timeout,
      });
    }

    fetchAccounts(
      organizationName,
      exchangeService,
      count = 25,
      offset = 1,
      searchValues = [],
      accountType = '',
    ) {
      return this.services.OvhHttp.get(
        `/sws/exchange/${organizationName}/${exchangeService}/accounts`,
        {
          rootPath: '2api',
          params: {
            count,
            offset,
            searchValues,
            configurableOnly: 0,
            typeLicence: accountType,
          },
        },
      );
    }

    /**
     * Return paginated exchange accounts list
     * @param pageSize - the size of page([10, 20, 40])
     * @param offset - page index
     * @param search - filter over primaryEmail value
     * @param configurableOnly - Integer value: "0" to get all, "1" to filter out dummy accounts
     *                           and creating/deleting ones
     */
    getAccountsAndContacts(
      organization,
      serviceName,
      count = 10,
      offset = 0,
      search = '',
      configurableOnly = 0,
    ) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/accounts/contacts',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
          },
          params: {
            count,
            offset,
            search,
            configurableOnly,
          },
        },
      );
    }

    /**
     * Data necessary for new account creation
     */
    fetchingAccountCreationOptions(organization, serviceName) {
      return this.services.OvhHttp.get(
        `/sws/exchange/${organization}/${serviceName}/accounts/options`,
        { rootPath: '2api' },
      );
    }

    /**
     * Add a new Exchange account
     */
    addExchangeAccount(organization, serviceName, accountToAdd) {
      // Format from play to api
      const data = angular.copy(accountToAdd);
      data.license = _.camelCase(data.accountLicense);
      delete data.accountLicense;
      data.outlookLicense = _.camelCase(data.outlook);
      delete data.outlook;
      data.SAMAccountName = _.camelCase(data.samaccountName);
      delete data.samaccountName;
      delete data.passwordConfirmation;
      data.displayName = data.displayName ? data.displayName.trim() : '';
      return this.services.OvhHttp.post(
        '/email/exchange/{organization}/service/{exchange}/account',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
          },
          data,
        },
      ).then((receivedData) => {
        this.resetAccounts();
        this.resetTasks();

        return receivedData;
      });
    }

    /**
     * Asks the datagrid in each `views` to refresh
     * @param {string[]} views The views containing the datagrid to refresh
     */
    refreshViews(...views) {
      views.forEach((view) => {
        const matchingMethod = this[`reset${view}`];

        if (matchingMethod !== undefined) {
          matchingMethod.call(this);
        }
      });
    }

    getAccountsOptions(organization, serviceName, params) {
      return this.services.OvhHttp.get(
        '/order/email/exchange/{organization}/service/{exchange}/account/{duration}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            duration: params.duration,
          },
          params: {
            number: params.accountsNumber || '1',
            licence: params.accountLicense ? _.camelCase(params.accountLicense) : 'standard',
            storageQuota: params.storageQuota || '50',
          },
        },
      ).then(data => data);
    }

    /**
     * Order new Exchange accounts
     */
    orderAccounts(organization, productId, accountsToAdd) {
      // From play to apiv6
      const data = angular.copy(accountsToAdd);
      data.number = data.accountsNumber;
      delete data.accountsNumber;
      const { duration } = data;
      delete data.duration;
      data.licence = data.accountLicense ? _.camelCase(data.accountLicense) : 'standard';
      delete data.accountLicense;
      data.storageQuota = data.storageQuota || '50';

      return this.services.OvhHttp.post(
        '/order/email/exchange/{organization}/service/{exchange}/account/{duration}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: productId,
            duration,
          },
          data,
        },
      ).then((receivedData) => {
        this.resetAccounts();
        this.resetTasks();

        return receivedData;
      });
    }

    updateAccount(organization, serviceName, account) {
      const accountToUpdate = angular.copy(account);
      accountToUpdate.outlookLicense = accountToUpdate.outlook;
      delete accountToUpdate.outlook;
      _.set(accountToUpdate, 'deleteOutlookAtExpiration', accountToUpdate.outlookLicense && accountToUpdate.deleteOutlook);
      delete accountToUpdate.deleteOutlook;

      accountToUpdate.displayName = account.displayName ? account.displayName.trim() : undefined;
      const { password } = accountToUpdate;
      delete accountToUpdate.password;
      if (accountToUpdate.accountLicense) {
        accountToUpdate.accountLicense = _.camelCase(accountToUpdate.accountLicense);
      }
      const promises = [
        this.services.OvhHttp.put(
          '/email/exchange/{organization}/service/{exchange}/account/{account}',
          {
            rootPath: 'apiv6',
            urlParams: {
              organization,
              exchange: serviceName,
              account: account.primaryEmailAddress,
            },
            data: accountToUpdate,
          },
        ).then(() => ({
          code: null,
          id: account.primaryEmailAddress,
          message: 'UPDATE_ACCOUNT',
          type: 'INFO',
        })),
      ];

      if (password) {
        promises.push(
          this.services.OvhHttp.post(
            '/email/exchange/{organization}/service/{exchange}/account/{account}/changePassword',
            {
              rootPath: 'apiv6',
              urlParams: {
                organization,
                exchange: serviceName,
                account: account.primaryEmailAddress,
              },
              data: {
                password,
              },
            },
          ).then(() => ({
            code: null,
            id: account.primaryEmailAddress,
            message: 'CHANGE_PASSWORD',
            type: 'INFO',
          })),
        );
      }
      return this.services.$q.all(promises).then((data) => {
        this.resetAccounts();
        this.resetTasks();

        return {
          messages: data,
          state: data.filter(message => message.type === 'ERROR').length > 0 ? 'ERROR' : 'OK',
        };
      });
    }

    /**
     * Get order list
     */
    getOrderList(organization, serviceName) {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/accounts/orders', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: serviceName,
        },
      });
    }

    updateRenew(organization, serviceName, accounts) {
      return this.services.OvhHttp.put('/sws/exchange/{organization}/{exchange}/accounts/renew', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: serviceName,
        },
        data: {
          modelList: accounts,
        },
      });
    }

    /**
     * Delete account
     */
    removingAccount(organization, serviceName, account) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/account/{account}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            account,
          },
        },
      ).then((data) => {
        this.resetAccounts();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Remove account if dedicated or provider 2010 is true, else reset it
     */
    removeAccountInsteadOfReset() {
      const isDedicatedOrCluster = this.value.offer.toUpperCase() === 'DEDICATED'
        || this.value.offer.toUpperCase() === 'DEDICATED_CLUSTER';
      const isProvider = this.value.offer.toUpperCase() === 'PROVIDER';
      return (
        isDedicatedOrCluster
        || (isProvider && _(this.value.serverDiagnostic.commercialVersion).includes(2010))
      );
    }

    retrieveAccountDelegationRight(
      organization,
      exchange,
      account,
      count = 10,
      offset = 0,
      search = '',
    ) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/accounts/{account}/rights',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange,
            account,
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
     * Set Exchange accounts delegation rights
     */
    updatingAccountDelegationRights(organization, serviceName, model) {
      return this.services.OvhHttp.post(
        '/sws/exchange/{organization}/{exchange}/accounts/{account}/rights-update',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            account: model.account,
          },
          data: {
            sendRights: model.sendRights,
            fullAccessRights: model.fullAccessRights,
            sendOnBehalfRights: model.sendOnBehalfToRights,
          },
        },
      ).then((response) => {
        this.resetDelegationRights();
        this.resetTasks();

        return response;
      });
    }

    /**
     * Get Exchange accounts aliases
     */
    getAliases(organizationName, exchangeService, account, count = 10, offset = 0) {
      return this.services.OvhHttp.get(
        `/sws/exchange/${organizationName}/${exchangeService}/accounts/${account}/alias`,
        {
          rootPath: '2api',
          params: {
            count,
            offset,
          },
        },
      );
    }

    /**
     * Data necessary for new alias creation
     */
    getNewAliasOptions(organization, serviceName, email = null, type = null) {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/aliasOptions', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: serviceName,
        },
        params: {
          emailAddress: email,
          subType: type,
        },
      }).then((data) => {
        this.resetCache();
        return data;
      });
    }

    /**
     * Add an account alias
     */
    addAlias(organization, serviceName, account, aliasModel) {
      const completeAlias = `${aliasModel.alias}@${aliasModel.domain.name}`;
      return this.services.OvhHttp.post(
        '/email/exchange/{organization}/service/{exchange}/account/{account}/alias',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            account,
          },
          data: {
            alias: completeAlias,
          },
        },
      ).then((data) => {
        this.resetAccounts();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Delete an account alias
     */
    deleteAlias(organization, productId, account, alias) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/account/{account}/alias/{alias}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: productId,
            account,
            alias,
          },
        },
      ).then((data) => {
        this.resetAccounts();
        this.resetTasks();

        return data;
      });
    }

    getGroupManagerList(organization, serviceName, groupName, count, offset) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/groups/{mailinglist}/managers',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
            mailinglist: groupName,
          },
          params: {
            count,
            offset,
          },
        },
      );
    }

    getGroupMembersList(organization, serviceName, groupName) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/groups/{groupName}/members',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
            groupName,
          },
          params: {
            state: 'ok',
          },
        },
      );
    }

    prepareGroupsForCsv(organization, serviceName, opts, offset) {
      const queue = [];
      return this.getGroups(organization, serviceName, opts.count, offset, opts.search).then(
        (accounts) => {
          angular.forEach(accounts.list.results, (account) => {
            if (account.aliases > 0) {
              _.set(account, 'aliases', []);
              queue.push(
                this.getGroupAliasList(
                  organization,
                  serviceName,
                  account.mailingListAddress,
                  this.aliasMaxLimit,
                  offset,
                ).then((aliases) => {
                  _.set(account, 'aliases', aliases.list.results.map(alias => alias.displayName));
                }),
              );
            } else {
              _.set(account, 'aliases', []);
            }
            if (account.managers > 0) {
              _.set(account, 'managers', []);
              queue.push(
                this.getGroupManagerList(
                  organization,
                  serviceName,
                  account.mailingListAddress,
                ).then((managers) => {
                  _.set(account, 'managers', managers.list.results.map(manager => manager.displayAddress));
                }),
              );
            } else {
              _.set(account, 'managers', []);
            }
            if (account.members > 0) {
              _.set(account, 'members', []);
              queue.push(
                this.getGroupMembersList(
                  organization,
                  serviceName,
                  account.mailingListAddress,
                ).then((members) => {
                  _.set(account, 'members', members.list.results.map(member => member.displayAddress));
                }),
              );
            } else {
              _.set(account, 'members', []);
            }
          });

          return this.services.$q.all(queue).then(
            () => ({
              accounts: accounts.list.results,
              headers: _.keys(accounts.list.results[0]),
            }),
          );
        },
        () => null,
      );
    }

    /**
     * Get groups this Exchange account belongs to
     */
    getGroups(organization, serviceName, count = 10, offset = 0, search = '') {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/groups', {
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
     * Get Exchange mailing list delegation rights
     */
    getMailingListDelegationRights(
      organization,
      productId,
      mailinglist,
      count = 10,
      offset = 0,
      search = '',
    ) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/groups/{mailinglist}/rights',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: productId,
            mailinglist,
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
     * Set Exchange mailing list delegation rights
     */
    updateMailingListDelegationRights(organization, serviceName, model) {
      return this.services.OvhHttp.put(
        '/sws/exchange/{organization}/{exchange}/groups/{mailinglist}/rights-update',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
            mailinglist: model.account,
          },
          data: {
            sendRights: model.sendRights,
            sendOnBehalfRights: model.sendOnBehalfToRights,
          },
        },
      ).then((response) => {
        this.resetDelegationRights();
        this.resetTasks();

        return response;
      });
    }

    /**
     * Delete an Exchange mailing list (group)
     */
    deleteGroup(organization, serviceName, groupName) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/mailingList/{mailingListAddress}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            mailingListAddress: groupName,
          },
        },
      ).then((data) => {
        this.resetGroups();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Get accounts by group
     */
    getAccountsByGroup(organization, serviceName, groupName, count = 10, offset = 0, search = '') {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/groups/{mailinglist}/accounts',
        {
          rootPath: '2api',
          clearCache: true,
          urlParams: {
            organization,
            exchange: serviceName,
            mailinglist: groupName,
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
     * Add a new Exchange group (mailing list)
     */
    addExchangeGroup(organization, serviceName, groupToAdd) {
      return this.services.OvhHttp.post('/sws/exchange/{organization}/{exchange}/groups-add', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: serviceName,
        },
        data: groupToAdd,
      }).then((data) => {
        this.resetGroups();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Remove an Exchange group manager
     */
    removeManager(organization, serviceName, groupName, accountId) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/mailingList/{mailingListAddress}/manager/account/{managerAccountId}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            mailingListAddress: groupName,
            managerAccountId: accountId,
          },
        },
      ).then((data) => {
        this.resetGroups();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Remove an Exchange group member
     */
    removeMember(organization, serviceName, groupName, accountId, type) {
      let url = '/email/exchange/{organization}/service/{exchange}/mailingList/{mailingListAddress}/member';
      switch (type) {
        case 'ACCOUNT':
          url += '/account/{accountId}';
          break;
        case 'CONTACT':
          url += '/contact/{accountId}';
          break;
        default:
          break;
      }
      return this.services.OvhHttp.delete(url, {
        rootPath: 'apiv6',
        urlParams: {
          organization,
          exchange: serviceName,
          mailingListAddress: groupName,
          accountId,
        },
      }).then((data) => {
        this.resetGroups();
        this.resetTasks();

        return data;
      });
    }

    updateGroups(organizationName, exchangeService, groupName, data) {
      return this.services.OvhHttp.put(
        '/sws/exchange/{organizationName}/{exchangeService}/groups/{mailingListAddress}/update',
        {
          rootPath: '2api',
          urlParams: {
            organizationName,
            exchangeService,
            mailingListAddress: groupName,
          },
          data,
        },
      ).then((receivedData) => {
        this.resetGroups();
        this.resetTasks();

        return receivedData;
      });
    }

    updateGroup(organizationName, exchangeService, groupName, data) {
      return this.services.OvhHttp.put(
        '/email/exchange/{organizationName}/service/{exchangeService}/mailingList/{mailingListAddress}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName,
            exchangeService,
            mailingListAddress: groupName,
          },
          data,
        },
      ).then((receivedData) => {
        this.resetGroups();
        this.resetTasks();

        return receivedData;
      });
    }

    /**
     * Get group aliases
     */
    getGroupAliasList(organization, serviceName, groupName, count = 10, offset = 0) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/group/{group}/alias',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            mailingListAddress: groupName,
            group: groupName,
          },
          params: {
            count,
            offset,
          },
        },
      );
    }

    /**
     * Add a group alias
     */
    addGroupAlias(organization, serviceName, groupName, aliasModel) {
      const completeAlias = `${aliasModel.alias}@${aliasModel.domain.name}`;
      return this.services.OvhHttp.post(
        '/email/exchange/{organization}/service/{exchange}/mailingList/{mailingListAddress}/alias',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            mailingListAddress: groupName,
          },
          data: {
            alias: completeAlias,
          },
        },
      ).then((data) => {
        this.resetGroups();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Delete a group alias
     */
    deleteGroupAlias(organization, serviceName, groupName, alias) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/mailingList/{mailingListAddress}/alias/{alias}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            mailingListAddress: groupName,
            alias,
          },
        },
      ).then((data) => {
        this.resetGroups();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Return disclaimers list for a given Exchange service
     */
    getDisclaimers(organization, serviceName, count = 10, offset = 0) {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/disclaimers', {
        rootPath: '2api',
        urlParams: {
          organization,
          exchange: serviceName,
        },
        params: {
          count,
          offset,
        },
      });
    }

    /**
     * Return new disclaimer options
     */
    getNewDisclaimerOptions(organization, serviceName) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/disclaimers/new/options',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
          },
        },
      );
    }

    /**
     * Return update disclaimer options
     */
    getUpdateDisclaimerOptions() {
      return this.services.$q.when({
        availableDomains: [],
        availableAttributes: [
          'City',
          'Country',
          'Department',
          'DisplayName',
          'Email',
          'FaxNumber',
          'FirstName',
          'HomePhoneNumber',
          'Initials',
          'LastName',
          'MobileNumber',
          'Office',
          'PhoneNumber',
          'Street',
          'ZipCode',
        ],
      });
    }

    /**
     * Save an Exchange disclaimer
     */
    saveDisclaimer(organization, productId, model) {
      return this.services.OvhHttp.post(
        '/email/exchange/{organization}/service/{exchange}/domain/{domainName}/disclaimer',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: productId,
            domainName: model.domain,
          },
          data: {
            content: model.content,
            outsideOnly: model.externalEmailsOnly,
          },
        },
      ).then((data) => {
        this.resetDisclaimers();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Save an Exchange disclaimer
     */
    updateDisclaimer(organization, productId, model) {
      return this.services.OvhHttp.put(
        '/email/exchange/{organization}/service/{exchange}/domain/{domainName}/disclaimer',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: productId,
            domainName: model.domain,
          },
          data: {
            content: model.content,
            outsideOnly: model.externalEmailsOnly,
          },
        },
      ).then((data) => {
        this.resetDisclaimers();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Delete an Exchange mailing list (group)
     */
    deleteDisclaimer(organization, serviceName, domain) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/domain/{domainName}/disclaimer',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            domainName: domain,
          },
        },
      ).then((data) => {
        this.resetDisclaimers();
        this.resetTasks();

        return data;
      });
    }

    /**
     * Get additional disk space options
     */
    getDiskSpaceOptions(organization, serviceName) {
      return this.services.OvhHttp.get(
        '/order/email/exchange/{organization}/service/{exchange}/diskSpace',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
          },
        },
      ).then((data) => {
        this.resetTasks();
        return data;
      });
    }

    /**
     * Order additional disk space
     */
    orderDiskSpace(organization, serviceName) {
      return this.services.OvhHttp.post(
        '/order/email/exchange/{organization}/service/{exchange}/diskSpace',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
          },
        },
      ).then((data) => {
        this.resetTasks();

        return data;
      });
    }

    /**
     * Get upgrade account options
     */
    getAccountUpgradeOptions(organization, serviceName, options) {
      return this.services.OvhHttp.get(
        '/order/email/exchange/{organization}/service/{exchange}/accountUpgrade/{duration}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            duration: options.duration,
          },
          params: {
            newQuota: options.newQuota, // 300
            primaryEmailAddress: options.primaryEmailAddress,
          },
        },
      ).then((data) => {
        this.resetTasks();

        return data;
      });
    }

    /**
     * Order account upgrade
     */
    orderAccountUpgrade(organization, serviceName, options) {
      const { duration } = options;
      delete options.duration; // eslint-disable-line

      return this.services.OvhHttp.post(
        '/order/email/exchange/{organization}/service/{exchange}/accountUpgrade/{duration}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            duration,
          },
          data: options,
        },
      ).then((data) => {
        this.resetTasks();

        return data;
      });
    }

    prepareForCsv(organization, serviceName, opts, offset, timeout) {
      const queue = [];

      return this.getAccounts(opts.count, offset, opts.search, false, opts.filter, timeout).then(
        (accounts) => {
          angular.forEach(accounts.list.results, (account) => {
            if (account.aliases > 0) {
              _.set(account, 'aliases', []);
              queue.push(
                this.getAliases(
                  organization,
                  serviceName,
                  account.primaryEmailAddress,
                  this.aliasMaxLimit,
                ).then((aliases) => {
                  angular.forEach(aliases.list.results, (alias) => {
                    account.aliases.push(alias.displayName);
                  });
                }),
              );
            } else {
              _.set(account, 'aliases', []);
            }
          });

          return this.services.$q.all(queue).then(
            () => ({
              accounts: accounts.list.results,
              headers: _.keys(accounts.list.results[0]),
            }),
            () => null,
          );
        },
        () => null,
      );
    }

    /**
     * Update Exchange resiliation conditions
     */
    updateDeleteAtExpiration(organization, serviceName, renewType) {
      return this.services.OvhHttp.put(
        '/sws/exchange/{organization}/{exchange}/deleteAtExpiration',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
          },
          data: renewType,
        },
      ).then((response) => {
        this.exchangeCache.removeAll();
        this.services.$rootScope.$broadcast('exchange.dashboard.refresh');
        this.resetAccounts();
        this.resetTasks();

        return response;
      });
    }

    doSharepointBeta(opts) {
      const { primaryEmailAddress, subDomain } = opts;

      return this.getSelected().then(exchange => this.services.$http.post(
        [
          'apiv6/email/exchange',
          exchange.organization,
          'service',
          exchange.domain,
          'activateSharepoint',
        ].join('/'),
        {
          primaryEmailAddress,
          subDomain,
        },
      ));
    }

    getAccountIds(opts) {
      return this.services.OvhHttp.get(
        '/email/exchange/{organizationName}/service/{exchangeService}/account',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: opts.organizationName,
            exchangeService: opts.exchangeService,
          },
          params: opts.params,
        },
      );
    }

    getAccount(opts) {
      return this.services.OvhHttp.get(
        '/email/exchange/{organizationName}/service/{exchangeService}/account/{primaryEmailAddress}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: opts.organizationName,
            exchangeService: opts.exchangeService,
            primaryEmailAddress: opts.primaryEmailAddress,
          },
        },
      );
    }

    getAliasIds(opts) {
      return this.services.OvhHttp.get(
        '/email/exchange/{organizationName}/service/{exchangeService}/account/{primaryEmailAddress}/alias',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: opts.organizationName,
            exchangeService: opts.exchangeService,
            primaryEmailAddress: opts.primaryEmailAddress,
          },
          params: opts.params,
        },
      );
    }

    getUpgradeInfos(opts) {
      return this.services.OvhHttp.get(
        '/order/email/exchange/{organizationName}/service/{exchangeService}/upgrade',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: opts.organization,
            exchangeService: opts.domain,
          },
        },
      );
    }

    upgradeExchange(opts) {
      return this.services.OvhHttp.post(
        '/order/email/exchange/{organizationName}/service/{exchangeService}/upgrade',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: opts.organization,
            exchangeService: opts.domain,
          },
        },
      );
    }

    getExchangeServer(organization, name) {
      return this.services.OvhHttp.get(
        '/email/exchange/{organizationName}/service/{exchangeService}/server',
        {
          rootPath: 'apiv6',
          urlParams: {
            organizationName: organization,
            exchangeService: name,
          },
        },
      ).then(this.getSuccessDataOrReject);
    }

    /**
     * Return information related to sharepoint order
     */
    getSharepointService() {
      return this.getSelected().then(exchange => this.getSharepointServiceForExchange(exchange));
    }

    getSharepointServiceForExchange(exchange) {
      if (this.services.constants.target !== 'EU') {
        return this.services.$q.when(null);
      }

      return this.services.OvhHttp.get('/msServices/{serviceName}/sharepoint', {
        rootPath: 'apiv6',
        urlParams: {
          serviceName: exchange.domain,
        },
      });
    }

    /**
     * @param {string} ovhSubsidiary
     * @param {number} price
     * @param {string} currencyCode
     * @returns {string} The localized price according to the subsidiary
     */
    static getLocalizedPrice(ovhSubsidiary, price, currencyCode) {
      return price.toLocaleString(ovhSubsidiary, { style: 'currency', currency: currencyCode });
    }
  },
);
