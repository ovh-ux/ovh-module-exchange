angular.module('Module.exchange.controllers').controller(
  'ExchangeMailingListDelegationCtrl',
  class ExchangeMailingListDelegationCtrl {
    constructor($scope, Exchange, $timeout, messaging, navigation, $translate) {
      this.services = {
        $scope,
        Exchange,
        $timeout,
        messaging,
        navigation,
        $translate,
      };
      this.Exchange = Exchange;
      this.$routerParams = Exchange.getParams();
      this.selectedGroup = navigation.currentActionData;
      this.form = {
        search: null,
      };
      this.currentAccount = this.services.navigation.currentActionData.mailingListAddress;
      this.allDomainsOption = { displayName: this.services.$translate.instant('exchange_all_domains'), name: '' };
      this.selectedDomain = this.getDefaultDomain();
      $scope.$on(Exchange.events.accountsChanged, () => $scope.$broadcast('paginationServerSide.reload', 'delegationTable'));

      this.debouncedGetDelegationRight = _.debounce(this.getDelegationRight, 300);
      this.fetchAccountCreationOptions();
      $scope.getLoading = () => this.loading;
      $scope.getDelegationList = () => this.delegationList;
      $scope.updateDelegationRight = () => this.updateDelegationRight();
      $scope.getDelegationRight = (count, offset) => this.getDelegationRight(count, offset);
      $scope.hasChanged = () => this.hasChanged();
    }

    onSearchValueChange() {
      // clear filter by domain name
      this.selectedDomain = this.allDomainsOption;
      this.debouncedGetDelegationRight();
    }

    getChanges() {
      const changesList = {
        account: this.selectedGroup.mailingListName,
        sendRights: [],
        sendOnBehalfToRights: [],
      };

      if (_.has(this.delegationList, 'list.results')) {
        _.forEach(this.delegationList.list.results, (account) => {
          this.recordChangeOperations(account, changesList);
        });
      }

      return changesList;
    }

    resetSearch() {
      this.form.search = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'delegationTable');
    }

    onDomainValueChange() {
      // clear filter by free text search
      this.form.search = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'delegationTable');
    }

    /* eslint-disable class-methods-use-this */
    recordChangeOperations(account, changesList) {
      // record the operation to be done for sendAs rights:
      if (account.newSendAsValue !== account.sendAs) {
        changesList.sendRights.push({
          id: account.id,
          operation: account.newSendAsValue ? 'POST' : 'DELETE',
        });
      }

      // records the operation for sendOnBehalfTo rights:
      if (account.newSendOnBehalfToValue !== account.sendOnBehalfTo) {
        changesList.sendOnBehalfToRights.push({
          id: account.id,
          operation: account.newSendOnBehalfToValue ? 'POST' : 'DELETE',
        });
      }

      return changesList;
    }
    /* eslint-enable class-methods-use-this */

    hasChanged() {
      const changesList = this.getChanges();

      return changesList != null
        ? changesList.sendRights.length > 0 || changesList.sendOnBehalfToRights.length > 0
        : false;
    }

    getDelegationRight(count, offset) {
      this.services.messaging.resetMessages();
      this.loading = true;
      // filter by domain name or free text search
      const filter = _.get(this.form, 'search') || _.get(this.selectedDomain, 'name');
      this.services.Exchange.getMailingListDelegationRights(
        this.$routerParams.organization,
        this.$routerParams.productId,
        this.selectedGroup.mailingListName,
        count,
        offset,
        filter,
      )
        .then((accounts) => {
          // make a deep copy of accounts list to use it as model
          this.delegationList = angular.copy(accounts);

          if (_.has(this.delegationList, 'list.results')) {
            // keep the original value to have a reference to compare changes
            _.forEach(this.delegationList.list.results, (account) => {
              _.set(account, 'newSendAsValue', account.sendAs);
              _.set(account, 'newSendOnBehalfToValue', account.sendOnBehalfTo);
            });
          }
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_tab_GROUPS_error_message'),
            failure,
          );
        })
        .finally(() => {
          this.loading = false;
          this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'delegationTable');
        });
    }

    updateDelegationRight() {
      this.services.messaging.writeSuccess(
        this.services.$translate.instant('exchange_GROUPS_delegation_doing_message'),
      );

      this.services.Exchange.updateMailingListDelegationRights(
        this.$routerParams.organization,
        this.$routerParams.productId,
        this.getChanges(),
      )
        .then((data) => {
          this.services.messaging.writeSuccess(
            this.services.$translate.instant('exchange_GROUPS_delegation_success_message'),
            data,
          );
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_GROUPS_delegation_error_message'),
            failure,
          );
        })
        .finally(() => {
          this.services.navigation.resetAction();
        });
    }

    getDefaultDomain() {
      const name = _.last(this.currentAccount.split('@'));
      return {
        displayName: name,
        name,
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
          _.forEach(accountCreationOptions.availableDomains, (domain) => {
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
  },
);
