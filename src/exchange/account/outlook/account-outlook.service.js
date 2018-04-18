angular
    .module("Module.exchange.services")
    .service("ExchangeOutlook", class ExchangeOutlook {
        constructor ($rootScope, Products, $http, $q, Exchange, OvhHttp) {
            this.services = {
                $rootScope,
                Products,
                $http,
                $q,
                Exchange,
                OvhHttp
            };
        }

        /**
         * Generate an Outlook license URL
         */
        generateOutlookUrl (organization, serviceName, model) {
            return this.services.OvhHttp.post("/email/exchange/{organization}/service/{exchange}/account/{primaryEmailAddress}/outlookURL", {
                rootPath: "apiv6",
                urlParams: {
                    organization,
                    exchange: serviceName,
                    primaryEmailAddress: model.primaryEmailAddress
                },
                data: {
                    version: model.licenceVersion,
                    language: model.language.toLowerCase()
                }
            }).then((response) => {
                this.services.Exchange.resetAccounts();
                this.services.Exchange.resetTasks();

                return response;
            });
        }

        /**
         * Return an Outlook license details
         */
        getLicenceDetails (organization, exchange, account) {
            return this.services
                .OvhHttp
                .get("/email/exchange/{organization}/service/{exchange}/account/{account}/outlookURL", {
                    rootPath: "apiv6",
                    urlParams: {
                        organization,
                        exchange,
                        account
                    }
                });
        }

        /**
         * Return options for buying an Outlook license
         */
        getLicenceOptions (organization, serviceName, account) {
            return this.services.OvhHttp.get("/sws/exchange/{organization}/{exchange}/{account}/license/options", {
                rootPath: "2api",
                urlParams: {
                    organization,
                    exchange: serviceName,
                    account
                }
            });
        }

        /**
         * Order an Outlook license
         */
        orderOutlook (organization, serviceName, model) {
            return this.services.OvhHttp.post("/order/email/exchange/{organization}/service/{exchange}/outlook/{duration}", {
                rootPath: "apiv6",
                urlParams: {
                    organization,
                    exchange: serviceName,
                    duration: model.duration
                },
                data: {
                    licence: model.licenceVersion,
                    primaryEmailAddress: model.primaryEmailAddress
                }
            }).then((response) => {
                this.services.Exchange.resetAccounts();
                this.services.Exchange.resetTasks();

                return response;
            });
        }

        /**
         * Activate Outlook license
         */
        activateOutlook (organization, serviceName, account) {
            const data = {
                outlookLicense: true,
                primaryEmailAddress: account.primaryEmailAddress
            };

            if (account.orderedOutlook) {
                data.deleteOutlookAtExpiration = false;
            }

            return this.services.OvhHttp.put("/email/exchange/{organization}/service/{exchange}/account/{primaryEmailAddress}", {
                rootPath: "apiv6",
                urlParams: {
                    organization,
                    exchange: serviceName,
                    primaryEmailAddress: account.primaryEmailAddress
                },
                data
            }).then((response) => {
                this.services.Exchange.resetAccounts();
                this.services.Exchange.resetTasks();

                return response;
            });
        }

        delete (organizationName, serviceName, primaryEmailAddress) {
            return this.services.OvhHttp.put(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}`, {
                rootPath: "apiv6",
                data: {
                    deleteOutlookAtExpiration: true
                }
            }).then((response) => {
                this.services.Exchange.resetAccounts();
                this.services.Exchange.resetTasks();

                return response;
            });
        }

        deactivate (organizationName, serviceName, primaryEmailAddress) {
            return this.services.OvhHttp.put(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}`, {
                rootPath: "apiv6",
                data: {
                    outlookLicense: false
                }
            }).then((response) => {
                this.services.Exchange.resetAccounts();
                this.services.Exchange.resetTasks();

                return response;
            });
        }
    });
