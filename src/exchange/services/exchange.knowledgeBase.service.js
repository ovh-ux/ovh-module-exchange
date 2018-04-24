angular
    .module("Module.exchange.services")
    .service("exchangeKnownledgeBase", class ExchangeKnownledgeBase {
        constructor (exchangeInfrastructures, exchangeVersion, translator) {
            this.exchangeInfrastructures = exchangeInfrastructures;
            this.exchangeVersion = exchangeVersion;
            this.translator = translator;

            this.FEATURES = {
                ACCOUNTS: {
                    CREATION_METHODS: {
                        ADDING: this.exchangeInfrastructures.isHosted() || this.exchangeInfrastructures.isProvider(),
                        ORDERING: this.exchangeInfrastructures.isDedicated() || this.exchangeInfrastructures.isDedicatedCluter()
                    }
                }
            };

            this.VALUES = {
                ACCOUNTS: {
                    TYPES: () => _(["BASIC", "STANDARD"])
                        .map((accountType) => [accountType, this.exchangeVersion.is(2010) ? this.translator.tr(`exchange_accounts_types_2010_${accountType}`) : this.translator.tr(`exchange_accounts_types_dedicatedCluster_${accountType}`)])
                        .zipObject()
                        .value()
                }
            };
        }
    });
