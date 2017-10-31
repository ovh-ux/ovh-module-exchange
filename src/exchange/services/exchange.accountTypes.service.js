angular
    .module("Module.exchange.services")
    .service("accountTypes", class AccountTypes {
        constructor (Exchange, exchangeVersion) {
            this.services = {
                Exchange,
                exchangeVersion
            };
        }

        isType (accountType) {
            if (_.isEmpty(accountType)) {
                throw "accountType.isType(accountType) can't work on an empty string";
            }

            return _.get(this.services.Exchange, "value.offer", "").toUpperCase() === accountType.toUpperCase();
        }

        isDedicated () {
            return this.isType("DEDICATED");
        }

        isHosted () {
            return this.isType("HOSTED");
        }

        isProvider () {
            return this.isType("PROVIDER");
        }

        is25g () {
            return this.isProvider() && this.services.exchangeVersion.isIndividual2010();
        }
    });
