angular
    .module("Module.exchange.controllers")
    .controller("ExchangeToolboxDomainsCtrl", class ExchangeToolboxDomainsCtrl {
        constructor ($scope, Exchange, navigation, translator, messaging, exchangeVersion, exchangeStates, accountTypes) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                translator,
                messaging,
                exchangeVersion,
                exchangeStates,
                accountTypes
            };
        }

        isReseller2010AuthInvalidMx () {
            return this.services.accountTypes.isProvider() && this.services.exchangeVersion.isVersion(2010);
        }

        isUpdateDisabled (domain) {
            return !this.services.exchangeStates.constructor.isOk(domain) || domain.taskInProgress || this.isReseller2010AuthInvalidMx();
        }

        isDeleteDisabled (domain) {
            return !this.services.exchangeStates.constructor.isOk(domain) || domain.accountsCount > 0;
        }

        getDeleteTooltip (domain) {
            return this.isDeleteDisabled(domain) ? this.services.translator.tr("exchange_tab_domain_delete_domain_accounts_warning") : "";
        }
    });
