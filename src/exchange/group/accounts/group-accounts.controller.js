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

      $scope.updateAccounts = () => this.updateAccounts();
      $scope.getAccountsList = () => this.accountsList;
      $scope.getLoading = () => this.loading;
    }

    resetSearch() {
      this.search.value = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'accountsByGroupTable');
    }

    onSearch() {
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'accountsByGroupTable');
    }

    updateManagersList(newManagerValue, account) {
      const bufferedAccount = _.find(
        this.accountsListBuffer.list.results,
        bufferedAcc => bufferedAcc.id === account.id,
      );

      if (newManagerValue !== _.get(bufferedAccount, 'manager')) {
        this.model.managersList.push({
          id: account.id,
          operation: newManagerValue ? 'POST' : 'DELETE',
          itemType: account.type,
        });
      }
    }

    updateMembersList(newMemberValue, account) {
      const bufferedAccount = _.find(
        this.accountsListBuffer.list.results,
        bufferedAcc => bufferedAcc.id === account.id,
      );

      if (newMemberValue !== _.get(bufferedAccount, 'manager')) {
        this.model.membersList.push({
          id: account.id,
          operation: newMemberValue ? 'POST' : 'DELETE',
          itemType: account.type,
        });
      }
    }

    applySelection(account) {
      const accountInManagerList = _.find(
        this.model.managersList,
        manager => manager.id === account.id,
      );
      const accountInMemberList = _.find(
        this.model.membersList,
        manager => manager.id === account.id,
      );

      const managerValue = accountInManagerList ? _.get(accountInManagerList, 'operation') === 'POST' : account.manager;
      const memberValue = accountInMemberList ? _.get(accountInMemberList, 'operation') === 'POST' : account.member;

      return Object.assign({}, account, {
        manager: managerValue,
        member: memberValue,
      });
    }

    getAccounts({ pageSize, offset, criteria }) {
      const [search] = criteria;
      this.services.messaging.resetMessages();

      return this.services.Exchange.getAccountsByGroup(
        this.$routerParams.organization,
        this.$routerParams.productId,
        this.selectedGroup.mailingListAddress,
        pageSize,
        offset,
        search != null ? search.value : '',
      )
        .then((accounts) => {
          this.accountsListBuffer = accounts;
          this.accountsList = angular.copy(accounts);
          return {
            data: _.sortBy(accounts.list.results, 'formattedAddress').concat(_.sortBy(accounts.list.messages, 'id')),
            meta: {
              totalCount: accounts.count,
            },
          };
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_tab_ACCOUNTS_error_message'),
            failure,
          );
        });
    }

    updateAccounts() {
      this.services.messaging.writeSuccess(
        this.services.$translate.instant('exchange_dashboard_action_doing'),
      );

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
