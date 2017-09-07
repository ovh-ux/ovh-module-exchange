angular
    .module("Module.exchange.services")
    .service("officeAttached", class OfficeAttached {
        constructor (Exchange, OvhHttp) {
            this.services = { Exchange, OvhHttp };
        }

        getOfficeAttachSubscription () {
            const serviceName = this.services.Exchange.getValue().domain;

            return this.services
                .OvhHttp.get("/msServices/{serviceName}", {
                    rootPath: "apiv6",
                    urlParams: {
                        serviceName
                    }
                })
                .then((data) => {
                    this.canSubscribe = data.officeTenantServiceName == null;

                    return this.canSubscribe;
                });
        }
    });
