angular.module('Module.exchange.controllers').controller(
  'ExchangeExportToCsvAccountsCtrl',
  class ExchangeExportToCsvAccountsCtrl {
    constructor(
      $scope,
      $q,
      Exchange,
      messaging,
      $translate,
      navigation,
      ExchangeExternalContacts,
      ExchangeSharedAccounts,
    ) {
      this.services = {
        $scope,
        $q,
        Exchange,
        messaging,
        $translate,
        navigation,
        ExchangeExternalContacts,
        ExchangeSharedAccounts,
      };

      this.headers = {
        group: [
          'displayName',
          'mailingListAddress',
          'mailingListDisplayName',
          'mailingListName',
          'aliases',
          'members',
          'managers',
        ],
        external: ['externalEmailAddress', 'firstName', 'lastName', 'displayName', 'creationDate'],
        shared: ['primaryEmailAddress', 'quota', 'firstName', 'lastName', 'displayName'],
      };

      this.$routerParams = Exchange.getParams();
      this.timeoutObject = null;
      this.loading = {
        exportCsv: false,
      };
      this.filterType = navigation.currentActionData.filterType;
      this.search = navigation.currentActionData.search;
      this.totalAccounts = navigation.currentActionData.total;
      this.csvExportType = navigation.currentActionData.csvExportType;
      this.exchange = Exchange.value;

      $scope.exportAccounts = () => this.exportAccounts();
      $scope.cancelExport = () => this.cancelExport();
    }

    exportAccounts() {
      const exportOpts = {
        count: 1000,
        total: this.totalAccounts,
        search: this.search,
        filter: this.filterType === 'ALL' ? null : this.filterType,
        rejectAttrs: [
          '$$hashKey',
          'currentUsage',
          'completeDomain',
          'mailingFilterList',
          'canBeConfigured',
          'initial',
          'samaccountName',
          'taskPendingId',
          'id',
        ],
        toConcatAttrs: ['totalQuota', 'usedQuota', 'quota'],
        toJointAttrs: ['aliases', 'managers', 'members'],
      };

      this.loading.exportCsv = true;

      // check timeout
      if (this.timeoutObject != null) {
        this.timeoutObject.resolve();
      }

      // init timeout
      this.timeoutObject = this.services.$q.defer();

      // get data for csv
      this.prepareForCsv(
        exportOpts,
        0,
        {
          headers: [],
          accounts: [],
        },
        this.timeoutObject.promise,
      )
        .then((datas) => {
          if (datas != null && !_.isEmpty(datas) && this.timeoutObject != null) {
            // get column name
            const { headers } = datas;
            let csvContent = `${headers.join(';')}\n`;

            _.forEach(datas.accounts, (data, index) => {
              let dataString = '';

              _.forEach(headers, (header) => {
                if (_.includes(exportOpts.toJointAttrs, header)) {
                  dataString += `${data[header].join(',')};`;
                } else if (_.includes(exportOpts.toConcatAttrs, header)) {
                  dataString += `${data[header].value + data[header].unit};`;
                } else {
                  dataString += `${data[header]};`;
                }
              });

              csvContent += index < datas.accounts.length ? `${dataString}\n` : dataString;
            });

            const blob = new Blob([csvContent], {
              type: 'text/csv;charset=utf-8;',
            });

            const fileName = `export_${this.csvExportType}_${this.exchange.displayName}_${moment().format(
              'YYYY-MM-DD_HH:mm:ss',
            )}.csv`;

            if (navigator.msSaveBlob) {
              navigator.msSaveBlob(blob, fileName);
            } else {
              const link = document.createElement('a');

              if (link.download != null) {
                const url = window.URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style = 'visibility:hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                window.open(`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
              }
            }

            this.services.messaging.writeSuccess(
              this.services.$translate.instant('exchange_ACTION_export_success'),
            );
          } else if (datas != null || _.isEmpty(datas)) {
            this.services.messaging.writeError(
              this.services.$translate.instant('exchange_ACTION_export_error'),
            );
          }

          this.timeoutObject = null;
          this.loading.exportCsv = false;
        })
        .finally(() => {
          this.services.navigation.resetAction();
        });
    }

    cancelExport() {
      this.timeoutObject = null;
      this.services.navigation.resetAction();
    }

    prepareForCsv(exportOpts, offset, infos, timeoutObject) {
      this.promise = null;
      switch (this.csvExportType) {
        case 'accounts':
          this.promise = this.services.Exchange.prepareForCsv(
            this.$routerParams.organization,
            this.$routerParams.productId,
            exportOpts,
            offset,
            timeoutObject,
          );
          break;
        case 'group':
          this.promise = this.services.Exchange.prepareGroupsForCsv(
            this.$routerParams.organization,
            this.$routerParams.productId,
            exportOpts,
            offset,
            timeoutObject,
          ); break;
        case 'external':
          this.promise = this.services.ExchangeExternalContacts.prepareForCsv(
            this.$routerParams.organization,
            this.$routerParams.productId,
            exportOpts,
            offset,
            timeoutObject,
          ); break;
        case 'shared':
          this.promise = this.services.ExchangeSharedAccounts.prepareForCsv(
            this.$routerParams.organization,
            this.$routerParams.productId,
            exportOpts,
            offset,
            timeoutObject,
          ); break;
        default: break;
      }

      return this.promise.then((datas) => {
        if (datas != null) {
          _.set(infos, 'accounts', infos.accounts.concat(datas.accounts));
          _.set(infos, 'headers', _.isEmpty(infos.headers) ? datas.headers : infos.headers);
          switch (this.csvExportType) {
            case 'group': _.set(infos, 'headers', this.headers.group); break;
            case 'external': _.set(infos, 'headers', this.headers.external); break;
            case 'shared': _.set(infos, 'headers', this.headers.shared); break;
            default: _.set(infos, 'headers', _.difference(datas.headers, exportOpts.rejectAttrs)); break;
          }
          if (offset + exportOpts.count < exportOpts.total) {
            return this.prepareForCsv(exportOpts, offset + exportOpts.count, infos, timeoutObject);
          }
          return infos;
        }

        return null;
      });
    }
  },
);
