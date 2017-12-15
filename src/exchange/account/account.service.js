angular
    .module("Module.exchange.services")
    .service("ExchangeAccountService", class ExchangeAccountService {
        displayAccounts () {
            this.shouldDisplayAccounts = true;
            this.shouldDisplayAliases = false;
        }

        displayAliases (selectedAccount) {
            this.selectedAccount = selectedAccount;
            this.shouldDisplayAccounts = false;
            this.shouldDisplayAliases = true;
        }
    });
