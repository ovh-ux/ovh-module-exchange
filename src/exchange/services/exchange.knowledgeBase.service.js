angular
    .module("Module.exchange.services")
    .service("exchangeKnownledgeBase", class ExchangeKnownledgeBase {
        constructor () {
            this.ACCOUNTS = {
                CREATION_METHODS: {
                    ADDING: "ADDING",
                    ORDERING: "ORDERING"
                },
                TYPES: {

                }
            };

            this.INFRASTRUCTURES = {
                HOSTED: {
                    ACCOUNTS: {
                        CREATION_METHOD: this.ACCOUNTS.CREATION_METHODS.ORDERING
                    }
                },
                PROVIDER: { // Actual name is Resaller
                    ACCOUNTS: {
                        CREATION_METHOD: this.ACCOUNTS.CREATION_METHODS.ORDERING
                    }
                },
                DEDICATED: { // Actual name is Private
                    ACCOUNTS: {
                        CREATION_METHOD: this.ACCOUNTS.CREATION_METHODS.ADDING
                    }
                },
                DEDICATED_CLUSTER: { // Actual name is Dedicated
                    ACCOUNTS: {
                        CREATION_METHOD: this.ACCOUNTS.CREATION_METHODS.ADDING,
                        TYPES: {
                            BASIC: {
                                displayName: "BASIC"
                            },
                            STANDARD: {
                                displayName: "STANDARD"
                            }
                        }
                    }
                }
            };

            this.VERSIONS = {
                v2010: {

                },
                v2013: {

                },
                v2016: {

                }
            };
        }

        can (feature) {
            this.a = feature;

            return true;
        }
    });
