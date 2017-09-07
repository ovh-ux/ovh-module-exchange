angular
    .module("Module.exchange.services")
    .service("ExchangeAccount", class ExchangeAccount {
        constructor ($routeParams, OvhHttp) {
            this.services = {
                OvhHttp
            };
        }

        /**
         * Get an array of task id
         * @param  {string} primaryEmailAddress
         * @return {Promise} [number]
         */
        getTasks (organizationName, exchangeService, primaryEmailAddress) {
            return this.services
                .OvhHttp
                .get(`/email/exchange/${organizationName}/service/${exchangeService}/account/${primaryEmailAddress}/tasks`, {
                    rootPath: "apiv6"
                });
        }
    });
