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
            this.getAliasesParams = {};

            $scope.$on(this.services.Exchange.events.groupsChanged, () => this.getAliases(this.getAliasesParams));
            $scope.getAliases = (pageSize, offset) => this.getAliases(pageSize, offset);
            $scope.getAliaseObjects = () => this.getAliaseObjects();
        }

        getAliases ({ pageSize, offset }) {
            this.getAliasesParams.pageSize = pageSize;
            this.getAliasesParams.offset = offset;

            return this.services.Exchange
                .getGroupAliasList(this.$routerParams.organization, this.$routerParams.productId, this.services.navigation.selectedGroup.mailingListAddress, pageSize, offset - 1)
                .then((data) => {
                    this.aliases = data;
                    return {
                        data: data.list.results,
                        meta: {
                            totalCount: data.count
                        }
                    };
                })
                .catch((err) => this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ALIAS_error_message"), err));
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
    });
