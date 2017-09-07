angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabGroupAliasCtrl", class ExchangeTabGroupAliasCtrl {
        constructor ($scope, Exchange, navigation, messaging, translator, exchangeStates) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                messaging,
                translator,
                exchangeStates
            };

            this.$routerParams = Exchange.getParams();
            this.aliasMaxLimit = this.services.Exchange.aliasMaxLimit;

            $scope.$on(this.services.Exchange.events.groupsChanged, () => this.services.$scope.$broadcast("paginationServerSide.reload", "groupAliasTable"));
            $scope.getAliases = (count, offset) => this.getAliases(count, offset);
            $scope.getAliaseObjects = () => this.getAliaseObjects();
            $scope.getLoading = () => this.getLoading();
        }

        getAliases (count, offset) {
            if (_.has(this.services.navigation.selectedGroup, "mailingListAddress")) {
                this.loading = true;

                this.services
                    .Exchange
                    .getGroupAliasList(this.$routerParams.organization, this.$routerParams.productId, this.services.navigation.selectedGroup.mailingListAddress, count, offset)
                    .then((data) => {
                        this.aliases = data;
                    })
                    .catch((err) => {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ALIAS_error_message"), err);
                    })
                    .finally(() => {
                        this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "groupAliasTable");
                        this.loading = false;
                    });
            }
        }

        hide () {
            this.services.$scope.$emit("showGroups");
        }

        deleteGroupAlias (alias) {
            if (!alias.taskPendingId) {
                this.services.navigation.setAction("exchange/group/alias/remove/group-alias-remove", {
                    selectedGroup: this.services.navigation.selectedGroup,
                    alias
                });
            }
        }

        addGroupAlias () {
            if (this.services.navigation.selectedGroup && this.services.navigation.selectedGroup.aliases <= this.aliasMaxLimit && this.services.exchangeStates.constructor.isOk(this.services.navigation.selectedGroup)) {
                this.services.navigation.setAction("exchange/group/alias/add/group-alias-add", this.services.navigation.selectedGroup);
            }
        }

        getAddAliasTooltip () {
            if (_.has(this.services.navigation.selectedGroup, "aliases") && this.services.navigation.selectedGroup.aliases >= this.aliasMaxLimit) {
                return this.services.translator.tr("exchange_tab_ALIAS_add_alias_limit_tooltip");
            }

            return null;
        }

        getAliaseObjects () {
            return this.aliases;
        }

        getLoading () {
            return this.loading;
        }
    });
