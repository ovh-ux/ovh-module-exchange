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
    }

    $onInit() {
      this.$routerParams = this.services.Exchange.getParams();

      this.selectedGroup = this.services.navigation.currentActionData;
      this.form = {
        search: null,
      };

      this.accountChanges = {
        account: this.selectedGroup.mailingListName,
        sendRights: [],
        sendOnBehalfToRights: [],
      };

      this.services.$scope.$on(this.services.Exchange.events.accountsChanged, () => this.services.$scope.$broadcast('paginationServerSide.reload', 'delegationTable'));

      this.debouncedGetDelegationRight = _.debounce(this.getDelegationRight, 300);

      this.services.$scope.getLoading = () => this.loading;
      this.services.$scope.getDelegationList = () => this.delegationList;
      this.services.$scope.updateDelegationRight = () => this.updateDelegationRight();
      this.services.$scope.getDelegationRight = (count, offset) => {
        this.getDelegationRight(count, offset);
      };
      this.services.$scope.hasChanged = () => this.hasChanged();
    }

    onSearchValueChange() {
      this.debouncedGetDelegationRight();
    }

    resetSearch() {
      this.form.search = null;
      this.services.$scope.$broadcast('paginationServerSide.loadPage', 1, 'delegationTable');
    }

    updateAccountSendAs(newSendAsValue, account) {
      if (newSendAsValue !== account.sendAs) {
        this.accountChanges.sendRights.push({
          id: account.id,
          operation: newSendAsValue ? 'POST' : 'DELETE',
        });
      }
    }

    updateAccountSendOnBehalfTo(newSendOnBehalfToValue, account) {
      if (newSendOnBehalfToValue !== account.sendOnBehalfTo) {
        this.accountChanges.sendOnBehalfToRights.push({
          id: account.id,
          operation: newSendOnBehalfToValue ? 'POST' : 'DELETE',
        });
      }
    }

    applyAccountSelection(account) {
      const sendAsAccountChange = this.accountChanges.sendRights
        .find(({ id }) => id === account.id);
      const sendOnBehalfToAccountChange = this.accountChanges.sendOnBehalfToRights
        .find(({ id }) => id === account.id);

      const newSendAsValue = sendAsAccountChange ? _.get(sendAsAccountChange, 'operation') === 'POST' : account.sendAs;
      const newSendOnBehalfToValue = sendOnBehalfToAccountChange ? _.get(sendOnBehalfToAccountChange, 'operation') === 'POST' : account.sendOnBehalfTo;

      return Object.assign({}, account, {
        newSendAsValue,
        newSendOnBehalfToValue,
      });
    }

    hasChanged() {
      return this.accountChanges.sendRights.length > 0
      || this.accountChanges.sendOnBehalfToRights.length > 0;
    }

    getDelegationRight(count, offset) {
      this.services.messaging.resetMessages();
      this.loading = true;

      this.services.Exchange.getMailingListDelegationRights(
        this.$routerParams.organization,
        this.$routerParams.productId,
        this.selectedGroup.mailingListName,
        pageSize,
        offset - 1,
        this.form.search,
      )
        .then((accounts) => {
          // make a deep copy of accounts list to use it as model
          this.delegationList = angular.copy(accounts);

          this.delegationList.list.results = accounts.list.results
            .map(account => this.applyAccountSelection(account));
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
        this.accountChanges,
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
  },
);
