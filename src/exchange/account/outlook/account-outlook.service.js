angular
    .module("Module.exchange.services")
    .service("ExchangeOutlook", class ExchangeOutlook {
        constructor (Exchange, OvhHttp) {
            this.Exchange = Exchange;
            this.OvhHttp = OvhHttp;
        }

        generateOutlookUrl (organizationName, serviceName, model) {
            return this.OvhHttp
                .post(`/email/exchange/${organizationName}/service/${serviceName}/account/${model.primaryEmailAddress}/outlookURL`, {
                    rootPath: "apiv6",
                    data: {
                        version: model.licenceVersion,
                        language: model.language.toLowerCase()
                    }
                }).then((response) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return response;
                });
        }

        getLicenceDetails (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .get(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}/outlookURL`, {
                    rootPath: "apiv6"
                });
        }


        getLicenceOptions (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .get(`/sws/exchange/${organizationName}/${serviceName}/${primaryEmailAddress}/license/options`, {
                    rootPath: "2api"
                });
        }

        orderOutlook (organizationName, serviceName, model) {
            return this.OvhHttp
                .post(`/order/email/exchange/${organizationName}/service/${serviceName}/outlook/${model.duration}`, {
                    rootPath: "apiv6",
                    data: {
                        licence: model.licenceVersion,
                        primaryEmailAddress: model.primaryEmailAddress
                    }
                })
                .then((response) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return response;
                });
        }

        activateOutlook (organizationName, serviceName, model) {
            const data = {
                outlookLicense: true,
                primaryEmailAddress: model.primaryEmailAddress
            };

            if (model.orderedOutlook) {
                data.deleteOutlookAtExpiration = false;
            }

            return this.OvhHttp
                .put(`/email/exchange/${organizationName}/service/${serviceName}/account/${model.primaryEmailAddress}`, {
                    rootPath: "apiv6",
                    data
                })
                .then((response) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return response;
                });
        }

        delete (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .put(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}`, {
                    rootPath: "apiv6",
                    data: {
                        deleteOutlookAtExpiration: true
                    }
                })
                .then((response) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return response;
                });
        }

        deactivate (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .put(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}`, {
                    rootPath: "apiv6",
                    data: {
                        outlookLicense: false
                    }
                })
                .then((response) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return response;
                });
        }
    });
