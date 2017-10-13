angular
    .module("Module.exchange.services")
    .service("ExchangeAccountService", class ExchangeAccountService {
        displayAccounts () {
            this.shouldDisplayAccounts = true;
            this.shouldDisplayAliases = false;
            this.shouldDisplayActiveDirectory = false;
        }

        displayAliases (selectedAccount) {
            this.selectedAccount = selectedAccount;
            this.shouldDisplayAccounts = false;
            this.shouldDisplayAliases = true;
            this.shouldDisplayActiveDirectory = false;
        }

        displayActiveDirectory () {
            this.selectedAccount = null;
            this.shouldDisplayAccounts = false;
            this.shouldDisplayAliases = false;
            this.shouldDisplayActiveDirectory = true;
        }
    });
