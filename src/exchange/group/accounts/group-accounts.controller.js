angular.module('Module.exchange.controllers').controller(
  'ExchangeGroupAccountsCtrl',
  class ExchangeGroupAccountsCtrl {
    constructor($scope, Exchange, messaging, navigation, $translate) {
      this.services = {
        $scope,
        Exchange,
        messaging,
        navigation,
        $translate,
      };

      this.$routerParams = Exchange.getParams();

      this.timeout = null;
      this.selectedGroup = navigation.currentActionData;
      this.availableDomains = [];
      this.loadingDomains = false;
      this.currentAccount = this.services.navigation.currentActionData.mailingListAddress;
      this.allDomainsOption = { displayName: this.services.$translate.instant('exchange_all_domains'), name: '' };
      this.selectedDomain = this.getDefaultDomain();

      this.search = {
        value: null,
      };

      this.model = {
        displayName: this.selectedGroup.displayName,
        senderAuthentification: this.selectedGroup.senderAuthentification,
        hiddenFromGAL: this.selectedGroup.hiddenFromGAL,
        joinRestriction: this.selectedGroup.joinRestriction,
        departRestriction: this.selectedGroup.departRestriction,
        managersList: [],
        membersList: [],
      };
      this.fetchAccountCreationOptions();
      $scope.getAccounts = (count, offset) => this.getAccounts(count, offset);
      $scope.updateAccounts = () => this.updateAccounts();
      $scope.getAccountsList = () => this.accountsList;
      $scope.getLoading = () => this.loading;
    }

    resetSearch() {
      this.search.value = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'accountsByGroupTable');
    }

    onSearch() {
      // clear filter by domain name
      this.selectedDomain = this.allDomainsOption;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'accountsByGroupTable');
    }

    onDomainValueChange() {
      // clear filter by free text search
      this.search.value = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'accountsByGroupTable');
    }

    saveSelection() {
      this.model.managersList = [];
      this.model.membersList = [];

      if (_.has(this.accountsList, 'list.results')) {
        const accounts = this.accountsList.list.results;

        _.forEach(accounts, (account) => {
          const bufferedAccount = _.find(
            this.accountsListBuffer.list.results,
            bufferedAcc => bufferedAcc.id === account.id,
          );
          let bufferedAccountUserType = _.get(bufferedAccount, 'manager');

          if (account.manager !== bufferedAccountUserType) {
            this.model.managersList.push({
              id: account.id,
              operation: account.manager ? 'POST' : 'DELETE',
              itemType: account.type,
            });
          }

          bufferedAccountUserType = _.get(bufferedAccount, 'member');

          if (account.member !== bufferedAccountUserType) {
            this.model.membersList.push({
              id: account.id,
              operation: account.member ? 'POST' : 'DELETE',
              itemType: account.type,
            });
          }
        });
      }
    }

    getDefaultDomain() {
      const name = _.last(this.currentAccount.split('@'))
      return {
        displayName: name,
        name: name
      };
    }

    fetchAccountCreationOptions() {
      this.loadingDomains = true;
      return this.services.Exchange.fetchingAccountCreationOptions(
        this.$routerParams.organization,
        this.$routerParams.productId,
      )
        .then((accountCreationOptions) => {
          const domains = [this.allDomainsOption];
          _.forEach(accountCreationOptions.availableDomains, domain => {
            domains.push(domain);
            if (domain.name === this.selectedDomain.name) {
              this.selectedDomain = domain;
            }
          });
          this.availableDomains = domains;
        })
        .catch((error) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_accounts_fetchAccountCreationOptions_error'),
            error,
          );
        })
        .finally(() => {
          this.loadingDomains = false;
        });
    }

    getAccounts(count, offset) {
      this.services.messaging.resetMessages();
      this.loading = true;
      // filter by domain name or free text search
      const filter = _.get(this.search, 'value') || _.get(this.selectedDomain, 'name');
      this.services.Exchange.getAccountsByGroup(
        this.$routerParams.organization,
        this.$routerParams.productId,
        this.selectedGroup.mailingListAddress,
        count,
        offset,
        filter,
      )
        .then((accounts) => {
          this.accountsListBuffer = accounts;
          this.accountsList = angular.copy(accounts);
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_tab_ACCOUNTS_error_message'),
            failure,
          );
        })
        .finally(() => {
          this.loading = false;
          this.services.$scope.$broadcast(
            'paginationServerSide.loadPage',
            1,
            'accountsByGroupTable',
          );
        });
    }

    updateAccounts() {
      this.services.messaging.writeSuccess(
        this.services.$translate.instant('exchange_dashboard_action_doing'),
      );
      this.saveSelection();

      this.services.Exchange.updateGroups(
        this.$routerParams.organization,
        this.$routerParams.productId,
        this.selectedGroup.mailingListAddress,
        this.model,
      )
        .then((data) => {
          const addGroupMessages = {
            OK: this.services.$translate.instant('exchange_GROUPS_settings_success_message', {
              t0: this.selectedGroup.mailingListDisplayName,
            }),
            PARTIAL: this.services.$translate.instant('exchange_GROUPS_settings_partial_message', {
              t0: this.selectedGroup.mailingListDisplayName,
            }),
            ERROR: this.services.$translate.instant('exchange_GROUPS_settings_error_message', {
              t0: this.selectedGroup.mailingListDisplayName,
            }),
          };

          if (data == null) {
            this.services.messaging.writeSuccess(
              this.services.$translate.instant('exchange_GROUPS_settings_success_message', {
                t0: this.selectedGroup.mailingListDisplayName,
              }),
            );
          } else {
            this.services.messaging.setMessage(addGroupMessages, data);
          }
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_GROUPS_settings_error_message', {
              t0: this.selectedGroup.mailingListDisplayName,
            }),
            failure,
          );
        })
        .finally(() => {
          this.services.navigation.resetAction();
        });
    }
  },
);
