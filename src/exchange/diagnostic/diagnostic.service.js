angular
    .module("Module.exchange.services")
    .service("diagnostic", class diagnostic {
        constructor ($rootScope, Exchange, OvhHttp, Poller) {
            this.services = {
                $rootScope,
                Exchange,
                OvhHttp,
                Poller
            };

            this.diagnosticCache = {};
            this.exchange = Exchange.value;
        }

        cacheDiagnostic (email) {
            this.diagnosticCache = {
                organizationName: this.exchange.organization,
                exchangeService: this.exchange.domain,
                primaryEmailAddress: email
            };
        }

        gettingLastDiagnostic () {
            if (this.diagnosticCache.organizationName === this.exchange.organization && this.diagnosticCache.exchangeService === this.exchange.domain) {
                return this.diagnosticCache.primaryEmailAddress;
            }

            return false;
        }

        launchingDiagnostic (email, password) {
            this.cacheDiagnostic(email);

            return this.services
                .OvhHttp
                .post("/email/exchange/{organizationName}/service/{exchangeService}/account/{primaryEmailAddress}/diagnostics", {
                    rootPath: "apiv6",
                    urlParams: {
                        organizationName: this.exchange.organization,
                        exchangeService: this.exchange.domain,
                        primaryEmailAddress: email
                    },
                    data: {
                        password
                    }
                });
        }

        gettingDiagnosticResult (email) {
            return this.services
                .OvhHttp
                .get("/email/exchange/{organizationName}/service/{exchangeService}/account/{primaryEmailAddress}/diagnostics", {
                    rootPath: "apiv6",
                    urlParams: {
                        organizationName: this.exchange.organization,
                        exchangeService: this.exchange.domain,
                        primaryEmailAddress: email
                    }
                });
        }

        clearCache () {
            this.diagnosticCache = {};
        }

        cacheLastDiagnosticResult (diagnosticResult) {
            this.diagnosticCache.diagnosticResult = diagnosticResult;
        }

        getCachedDiagnosticResult () {
            return this.diagnosticCache.diagnosticResult;
        }

        hasCachedDiagnosticResult () {
            return this.diagnosticCache.diagnosticResult != null;
        }

        gettingTasks (email) {
            return this.services
                .OvhHttp
                .get("/email/exchange/{organizationName}/service/{exchangeService}/account/{primaryEmailAddress}/tasks", {
                    rootPath: "apiv6",
                    urlParams: {
                        organizationName: this.exchange.organization,
                        exchangeService: this.exchange.domain,
                        primaryEmailAddress: email
                    }
                });
        }

        gettingTask (email, id) {
            return this.services
                .OvhHttp
                .get("/email/exchange/{organizationName}/service/{exchangeService}/account/{primaryEmailAddress}/tasks/{id}", {
                    rootPath: "apiv6",
                    urlParams: {
                        organizationName: this.exchange.organization,
                        exchangeService: this.exchange.domain,
                        primaryEmailAddress: email,
                        id
                    }
                });
        }

        pollingState (email, opts) {
            if (opts.id == null) {
                return this.services.$rootScope.$broadcast(`${opts.namespace}.error`, "");
            }

            if (!_.isArray(opts.successSates)) {
                opts.successSates = [opts.successSates];
            }

            const url = `apiv6/email/exchange/${this.exchange.organization}/service/${this.exchange.domain}/account/${email}/tasks/${opts.id}`;
            const pollParameters = {
                interval: 2000,
                successRule: {
                    state: (task) => _.includes(opts.successSates, task.status)
                },
                namespace: opts.namespace
            };

            return this.services
                .Poller
                .poll(url, null, pollParameters)
                .then(() => {
                    this.services.$rootScope.$broadcast(`${opts.namespace}.done`);
                })
                .catch((err) => {
                    this.services.$rootScope.$broadcast(`${opts.namespace}.error`, err);
                });
        }

        killAllPolling (opts) {
            this.services
                .Poller
                .kill({
                    namespace: opts.namespace
                });
        }
    });
