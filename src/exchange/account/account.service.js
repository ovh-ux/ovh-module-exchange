angular
    .module("Module.exchange.services")
    .service("exchangeAccount", class ExchangeAccount {
        constructor (Exchange, OvhHttp) {
            this.Exchange = Exchange;
            this.OvhHttp = OvhHttp;

            this.events = {
                accountSwitch: "exchange.account.switch"
            };
        }

        /**
         * Get an array of task id
         * @param  {string} primaryEmailAddress
         * @return {Promise} [number]
         */
        getTasks (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .get(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}/tasks`, {
                    rootPath: "apiv6"
                });
        }

        sendingNewAccount (organizationName, serviceName, data) {
            return this.OvhHttp
                .post(`/email/exchange/${organizationName}/service/${serviceName}/account`, {
                    rootPath: "apiv6",
                    data
                })
                .then((receivedData) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return receivedData;
                });
        }
    });
