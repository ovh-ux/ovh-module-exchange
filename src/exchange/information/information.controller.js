angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabInformationCtrl", class ExchangeTabInformationCtrl {
        constructor ($scope, accountTypes, Exchange, ExchangeInformationService, EXCHANGE_CONFIG, exchangeVersion, messaging, navigation, translator, User, officeOffer) {
            this.$scope = $scope;
            this.accountTypes = accountTypes;
            this.exchangeService = Exchange;
            this.informationService = ExchangeInformationService;
            this.EXCHANGE_CONFIG = EXCHANGE_CONFIG;
            this.exchangeVersion = exchangeVersion;
            this.messaging = messaging;
            this.navigation = navigation;
            this.translator = translator;
            this.User = User;
            this.officeOfferService = officeOffer;
        }

        $onInit () {
            this.exchange = this.exchangeService.value;
            this.shouldDisplaySSLRenewValue = false;
            this.hasSSLTask = false;
            this.loading = {
                sharePoint: false,
                sslButton: false
            };

            this.$scope.$on(this.exchangeService.events.sslRenewAsked, () => {
                this.hasSSLTask = true;
                this.setMessageSSL();
            });
            this.informationService.displayDashboard();

            this.getGuides();
            this.getSharePoint();
            this.retrievingDVCEmails();
            this.loadATooltip();
            this.loadAaaaTooltip();
            this.loadPtrTooltip();
            this.loadPtrv6Tooltip();
            this.loadATooltip();

            this.officeOfferService.getOfficeOfferSubscription()
                .then((officeTenantServiceName) => {
                    // this.shouldDisplayOfficeAttached = _(officeTenantServiceName).isString() && !_(officeTenantServiceName).isEmpty();
                    // this.shouldDisplayOfficeAttached = officeTenantServiceName;
                    this.shouldDisplayOfficeAttached = !!officeTenantServiceName;
                });
        }

        getGuides () {
            return this.User.getUser()
                .then((data) => {
                    try {
                        this.displayGuides = this.EXCHANGE_CONFIG.URLS.GUIDES.DOCS_HOME[data.ovhSubsidiary];
                    } catch (exception) {
                        this.displayGuides = null;
                    }
                })
                .catch(() => {
                    this.displayGuides = null;
                });
        }

        getSharePoint () {
            this.loading.sharePoint = true;
            return this.exchangeService.getSharepointService()
                .then((sharePoint) => {
                    this.sharepoint = sharePoint;
                })
                .finally(() => {
                    this.loading.sharePoint = false;
                });
        }

        retrievingDVCEmails () {
            this.loading.sslButton = true;
            return this.exchangeService.retrievingDVCEmails(this.exchange.organization, this.exchange.domain)
                .catch((err) => {
                    const message = _.get(err, "message", err);
                    if (_.isString(message) && /pending task/i.test(message)) {
                        this.hasSSLTask = true;
                    }
                })
                .finally(() => {
                    this.shouldDisplaySSLRenew();
                    this.setMessageSSL();
                    this.loading.sslButton = false;
                });
        }

        sslRenew () {
            if (this.exchange.sslRenewAvailable) {
                this.navigation.setAction("exchange/information/ssl/service-ssl-renew");
            }
        }

        displayRenewDate () {
            return this.exchange.expiration && this.exchangeVersion.isAfter(2010) && this.accountTypes.isDedicated();
        }

        shouldDisplayMigration2016 () {
            const isHostedAccount = this.accountTypes.isHosted();
            const isNicAdmin = _.includes(this.exchange.nicType, "ADMIN");
            const isNicBilling = _.includes(this.exchange.nicType, "BILLING");

            return this.exchangeVersion.isVersion(2013) && isHostedAccount && (isNicAdmin || isNicBilling);
        }

        shouldDisplayDiagnostic () {
            return this.exchangeVersion.isAfter(2010);
        }

        shouldDisplayOfficeOffer () {
            return this.informationService.shouldDisplayOfficeOffer;
        }

        shouldDisplayDashboard () {
            return this.informationService.shouldDisplayDashboard;
        }

        shouldDisplaySSLRenew () {
            const now = moment();
            const sslExpirationDate = moment(this.exchange.sslExpirationDate);
            const aMonthBeforeSSLExpirationDate = moment(this.exchange.sslExpirationDate).subtract(1, "months");
            const isAlreadyExpired = now.isAfter(sslExpirationDate);
            const canRenewBeforeExpiration = now.isAfter(aMonthBeforeSSLExpirationDate);

            const isDedicatedAccount = this.accountTypes.isDedicated();
            const is2010DedicatedOrProvider = this.exchangeVersion.isVersion(2010) && !this.accountTypes.isHosted();

            this.shouldDisplaySSLRenewValue = (isDedicatedAccount || is2010DedicatedOrProvider) && (canRenewBeforeExpiration || isAlreadyExpired);
        }

        setMessageSSL () {
            const now = moment();
            const sslExpirationDate = moment(this.exchange.sslExpirationDate);
            const aMonthBeforeSSLExpirationDate = moment(this.exchange.sslExpirationDate).subtract(1, "months");

            if (this.hasSSLTask) {
                this.messageSSL = this.translator.tr("exchange_action_renew_ssl_info");
            } else if (now.isAfter(sslExpirationDate)) {
                this.messageSSL = this.translator.tr("exchange_action_renew_ssl_info_expired");
            } else if (now.isAfter(aMonthBeforeSSLExpirationDate)) {
                this.messageSSL = this.translator.tr("exchange_action_renew_ssl_info_next", [sslExpirationDate.format("L")]);
            } else {
                this.messageSSL = null;
            }
        }

        displayOrderDiskSpace () {
            return this.exchangeVersion.isVersion(2010) && this.accountTypes.isProvider();
        }

        displayOfficeOffer () {
            this.informationService.displayOfficeOffer();
            this.$scope.$broadcast("paginationServerSide.loadPage", 1, "aliasTable");
        }

        orderDiskSpace () {
            if (this.displayOrderDiskSpace()) {
                this.navigation.setAction("exchange/information/disk/service-disk-order-space");
            }
        }

        loadATooltip () {
            const ipv4 = _.get(this.exchange, "serverDiagnostic.ip", "");
            if (!_.isEmpty(ipv4) && _.get(this.exchange, "serverDiagnostic.isAValid", false)) {
                this.exchange.serverDiagnostic.aTooltip = this.translator.tr("exchange_dashboard_diag_a_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.aTooltip = this.translator.tr("exchange_dashboard_diag_a_tooltip_error", [this.exchange.hostname, ipv4]);
            }
        }

        loadAaaaTooltip () {
            const ipv6 = _.get(this.exchange, "serverDiagnostic.ipV6", "");
            if (!_.isEmpty(ipv6) && _.get(this.exchange, "serverDiagnostic.isAaaaValid", false)) {
                this.exchange.serverDiagnostic.aaaaTooltip = this.translator.tr("exchange_dashboard_diag_aaaa_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.aaaaTooltip = this.translator.tr("exchange_dashboard_diag_aaaa_tooltip_error", [this.exchange.hostname, ipv6]);
            }
        }

        loadPtrTooltip () {
            if (_.get(this.exchange, "serverDiagnostic.isPtrValid", false)) {
                this.exchange.serverDiagnostic.ptrTooltip = this.translator.tr("exchange_dashboard_diag_ptr_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.ptrTooltip = this.translator.tr("exchange_dashboard_diag_ptr_tooltip_error");
            }
        }

        loadPtrv6Tooltip () {
            if (_.get(this.exchange, "serverDiagnostic.isPtrV6Valid", false)) {
                this.exchange.serverDiagnostic.ptrv6Tooltip = this.translator.tr("exchange_dashboard_diag_ptrv6_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.ptrv6Tooltip = this.translator.tr("exchange_dashboard_diag_ptrv6_tooltip_error");
            }
        }
    });
