angular
    .module("Module.exchange.controllers")
    .controller("ExchangeRemoveAliasCtrl", class ExchangeRemoveAliasCtrl {
        constructor ($scope, Exchange, navigation, translator) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                translator
            };

            this.$routerParams = Exchange.getParams();
            this.account = navigation.currentActionData.account;
            this.alias = navigation.currentActionData.alias;

            $scope.submit = () => this.submit();
        }

        submit () {
            this.services
                .Exchange
                .deleteAlias(this.$routerParams.organization, this.$routerParams.productId, this.account.primaryEmailAddress, this.alias.alias)
                .then(() => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_tab_ALIAS_delete_success_message"));
                })
                .catch((err) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_ALIAS_delete_error_message"), err);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
