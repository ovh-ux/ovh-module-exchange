angular
    .module("Module.exchange.controllers")
    .controller("ExchangeCtrl", class ExchangeCtrl {
        constructor (accountTypes, $rootScope, $scope, $timeout, $location, Products, translator, Exchange, APIExchange, User, EXCHANGE_CONFIG, navigation, ovhUserPref, messaging, exchangeVersion, officeAttached) {
            this.services = {
                accountTypes,
                $rootScope,
                $scope,
                $timeout,
                $location,
                Products,
                translator,
                Exchange,
                APIExchange,
                User,
                EXCHANGE_CONFIG,
                navigation,
                ovhUserPref,
                messaging,
                exchangeVersion,
                officeAttached
            };

            this.$routerParams = Exchange.getParams();

            this.initialLoad = true;
            this.autoDisplay = null;

            navigation.$exchangeRootScope = $scope;
            messaging.$exchangeRootScope = $scope;

            $scope.resetAction = navigation.resetAction.bind(navigation);
            $scope.setAction = navigation.setAction.bind(navigation);
            $scope.resetMessages = messaging.resetMessages.bind(messaging);
            $scope.setMessage = messaging.setMessage.bind(messaging);

            this.alerts = {
                dashboard: "exchangeDashboardAlert"
            };

            this.isLoading = true;

            this.currentAction = null;
            this.currentActionData = null;
            this.displayGuides = null;
            this.displayName = null;

            $scope.$on("exchange.dashboard.refresh", () => {
                this.retrievingExchange();
            });

            $scope.$on("$locationChangeStart", () => {
                this.services.navigation.resetAction();
            });

            this.canActivateSharepoint();

            if ($location.search().action === "billing") {
                $timeout(() => {
                    $rootScope.$broadcast("leftNavigation.selectProduct.fromName", this.parseLocationForExchangeData());
                    $scope.setAction("exchange/header/update-renew/update-renew", this.parseLocationForExchangeData());
                    this.retrievingExchange();
                }, 2000);
            } else {
                this.retrievingExchange();
            }

            Exchange.updateValue();
        }

        submittingDisplayName () {
            return this.services
                .APIExchange
                .put("/{organizationName}/service/{exchangeService}", {
                    urlParams: {
                        organizationName: this.exchange.organization,
                        exchangeService: this.exchange.domain
                    },
                    data: {
                        displayName: this.displayName
                    }
                })
                .then(() => {
                    this.exchange.displayName = this.displayName;
                    this.services.$rootScope.$broadcast("change.displayName", [this.exchange.domain, this.displayName]);
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_configure_success"));
                })
                .catch((reason) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_configure_error"), reason);
                })
                .finally(() => {
                    this.editMode = false;
                });
        }

        retrievingExchange () {
            return this.services
                .Exchange
                .getSelected(true)
                .then((exchange) => {
                    this.services.Exchange.value = exchange;
                    this.exchange = exchange;
                    this.displayName = exchange.displayName;

                    this.services
                        .officeAttached
                        .getOfficeAttachSubscription()
                        .then((data) => {
                            this.canSubscribeToOfficeAttach = data;
                        });

                    if (!_.isEmpty(exchange.messages)) {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_dashboard_loading_error"), exchange);
                    }

                    if (this.exchange.domainsNumber === 0 && this.initialLoad) {
                        return this.retrieveDomainAddingDialogPreference();
                    }

                    return false;
                })
                .then((shouldDisplayDialog) => {
                    if (shouldDisplayDialog) {
                        this.services.$timeout(() => {
                            this.services.navigation.setAction("exchange/domain/add/domain-add", {
                                noDomainAttached: true
                            });
                        });
                    }
                })
                .catch((failure) => {
                    if (failure) {
                        const response = failure.data || failure;
                        const data = {
                            status: "ERROR",
                            messages: [{
                                type: "ERROR",
                                message: response.message,
                                id: response.id
                            }]
                        };

                        if (response.code === 460 || response.status === 460) {
                            this.services.messaging.writeError(this.services.translator.tr("common_service_expired", [response.id]), data);
                        } else {
                            this.services.messaging.writeError(this.services.translator.tr("exchange_dashboard_loading_error"), data);
                        }
                    }
                })
                .finally(() => {
                    this.initialLoad = false;
                    this.isLoading = false;
                });
        }

        retrieveDomainAddingDialogPreference () {
            return this.services
                .ovhUserPref
                .getValue("EXCHANGE_DOMAIN_ADD_AUTO_DISPLAY")
                .then((res) => res.autoDisplay)
                .catch(() => {
                    this.services
                        .ovhUserPref
                        .create("EXCHANGE_DOMAIN_ADD_AUTO_DISPLAY", {
                            autoDisplay: true
                        });

                    return true;
                });
        }

        canActivateSharepoint () {
            return this.services
                .Exchange
                .getSharepointService()
                .then((sharepoint) => {
                    this.sharepoint = sharepoint;
                    const isAlreadyActivated = sharepoint != null;
                    const isSupportedExchangeType = this.services.accountTypes.isHosted();

                    this.canSubscribeToSharepoint = !isAlreadyActivated && isSupportedExchangeType;
                })
                .catch(() => {
                    this.canSubscribeToSharepoint = this.services.accountTypes.isHosted();
                });
        }

        parseLocationForExchangeData () {
            // expect something like "/configuration/exchange_dedicated/organization-ss51631-1/exchange-ss51631-001?action=billing&tab=DOMAINS"
            // extract "exchange_dedicated"
            const locationSplit = this.services.$location.url().replace("/configuration/", "").split("/");
            const type = locationSplit[0].toUpperCase();

            return {
                name: this.$routerParams.productId,
                organization: this.$routerParams.organization,
                type
            };
        }

        editDisplayName () {
            this.displayName = this.exchange.displayName;
            this.editMode = true;
        }

        resetDisplayName () {
            this.editMode = false;

            if (this.formExchangeDisplayName.displayNameField.$invalid) {
                this.services.messaging.writeError(this.services.translator.tr("exchange_dashboard_display_name_min"));
            }
        }
    });
