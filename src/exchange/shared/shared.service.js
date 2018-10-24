angular.module('Module.exchange.services').service(
  'ExchangePublicFolders',
  class ExchangePublicFolders {
    constructor(Products, $http, $q, constants, Exchange, OvhHttp, $window) {
      this.services = {
        Products,
        $http,
        $q,
        constants,
        Exchange,
        OvhHttp,
        $window,
      };
    }

    retrievingPublicFolders(organization, serviceName, count = 10, offset = 0, search = '') {
      return this.services.OvhHttp.get('/sws/exchange/{organization}/{exchange}/publicFolders', {
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

    retrievingPublicFolderOptions(organization, serviceName) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/publicFolders/options',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
          },
        },
      );
    }

    addingPublicFolder(organization, serviceName, folderToAdd) {
      const data = angular.copy(folderToAdd);

      data.anonymousPermission = _.camelCase(folderToAdd.anonymousPermission);
      data.defaultPermission = _.camelCase(folderToAdd.defaultPermission);
      data.type = _.camelCase(folderToAdd.type);
      data.path = this.services.$window.decodeURIComponent(folderToAdd.path);

      return this.services.OvhHttp.post(
        '/email/exchange/{organization}/service/{exchange}/publicFolder',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
          },
          data,
        },
      ).then((responseData) => {
        this.services.Exchange.resetPublicFolder();
        this.services.Exchange.resetTasks();

        return responseData;
      });
    }

    updatingPublicFolder(organization, serviceName, folder) {
      const data = {
        quota: folder.quota,
        defaultPermission: _.camelCase(folder.defaultPermission),
        anonymousPermission: _.camelCase(folder.anonymousPermission),
      };

      return this.services.OvhHttp.put(
        '/email/exchange/{organization}/service/{exchange}/publicFolder/{path}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            path: this.services.$window.decodeURIComponent(folder.path),
          },
          data,
        },
      ).then((responseData) => {
        this.services.Exchange.resetPublicFolder();
        this.services.Exchange.resetTasks();

        return responseData;
      });
    }

    removingPublicFolders(organization, serviceName, path) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/publicFolder/{path}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            path,
          },
        },
      ).then((data) => {
        this.services.Exchange.resetPublicFolder();
        this.services.Exchange.resetTasks();

        return data;
      });
    }

    retrievingAccountsByPublicFolder(
      organization,
      serviceName,
      path,
      count = 10,
      offset = 0,
      search = '',
    ) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/publicFolders/{path}/accounts',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            path,
          },
          params: {
            count,
            offset,
            search,
          },
        },
      );
    }

    retrievingPublicFoldersPermissions(organization, serviceName, path, count = 10, offset = 0) {
      return this.services.OvhHttp.get(
        '/sws/exchange/{organization}/{exchange}/publicFolders/{path}/permissions',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            path,
          },
          params: {
            count,
            offset,
          },
        },
      );
    }

    removingPublicFolderPermission(organization, serviceName, path, permission) {
      return this.services.OvhHttp.delete(
        '/email/exchange/{organization}/service/{exchange}/publicFolder/{path}/permission/{allowedAccountId}',
        {
          rootPath: 'apiv6',
          urlParams: {
            organization,
            exchange: serviceName,
            path: this.services.$window.decodeURIComponent(path),
            allowedAccountId: permission,
          },
        },
      ).then((data) => {
        this.services.Exchange.resetPublicFolder();
        this.services.Exchange.resetTasks();

        return data;
      });
    }

    updatingPublicFolderPermissions(organization, serviceName, path, permissions) {
      return this.services.OvhHttp.put(
        '/sws/exchange/{organization}/{exchange}/publicFolders/{path}/permissions-update',
        {
          rootPath: '2api',
          urlParams: {
            organization,
            exchange: serviceName,
            path,
          },
          data: {
            permissions,
          },
        },
      ).then((data) => {
        this.services.Exchange.resetPublicFolder();
        this.services.Exchange.resetTasks();

        return data;
      });
    }
  },
);
