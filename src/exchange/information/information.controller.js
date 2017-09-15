angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabInformationCtrl", class ExchangeTabInformationCtrl {
        constructor ($scope, Exchange, navigation, messaging, translator, exchangeVersion, accountTypes, User, EXCHANGE_CONFIG) {
            this.services = {
                $scope,
                Exchange,
                navigation,
                messaging,
                translator,
                exchangeVersion,
                accountTypes,
                User,
                EXCHANGE_CONFIG
            };

            this.exchange = Exchange.value;
            this.isGetSharepointDone = false;
            this.$routerParams = Exchange.getParams();
            this.shouldDisplaySSLRenewValue = false;
            this.hasSSLTask = false;

            Exchange.getSharepointService()
                .then((sharepoint) => {
                    this.sharepoint = sharepoint;
                })
                .finally(() => {
                    this.isGetSharepointDone = true;
                });

            Exchange.retrievingDVCEmails(this.$routerParams.organization, this.$routerParams.productId)
                .catch((err) => {
                    const message = err.message || err;

                    if (message === "You can't get dcv email if there is a pending task for installSSL") {
                        this.hasSSLTask = true;
                    }
                })
                .finally(() => {
                    this.shouldDisplaySSLRenew();
                    this.loadingEnableSSLButton = false;
                });

            User.getUser()
                .then((data) => {
                    try {
                        this.displayGuides = this.services.EXCHANGE_CONFIG.URLS.GUIDES.DOCS_HOME[data.ovhSubsidiary];
                    } catch (exception) {
                        this.displayGuides = null;
                    }
                });

            this.loadATooltip();
            this.loadAaaaTooltip();
            this.loadPtrTooltip();
            this.loadPtrv6Tooltip();
            this.loadATooltip();
        }

        sslRenew () {
            if (this.exchange.sslRenewAvailable) {
                this.services.navigation.setAction("exchange/information/ssl/service-ssl-renew");
            }
        }

        displayRenewDate () {
            return this.exchange.expiration && this.services.exchangeVersion.isAfter(2010) && this.services.accountTypes.isDedicated();
        }

        shouldDisplayMigration2016 () {
            const isHostedAccount = this.services.accountTypes.isHosted();
            const isNicAdmin = _.includes(this.exchange.nicType, "ADMIN");
            const isNicBilling = _.includes(this.exchange.nicType, "BILLING");

            return this.services.exchangeVersion.isVersion(2013) && isHostedAccount && (isNicAdmin || isNicBilling);
        }

        shouldDisplayDiagnostic () {
            return this.services.exchangeVersion.isAfter(2010);
        }

        shouldDisplaySSLRenew () {
            const isDedicatedAccount = this.services.accountTypes.isDedicated();
            const is2010DedicatedOrProvider = this.services.exchangeVersion.isVersion(2010) && !this.services.accountTypes.isHosted();

            this.shouldDisplaySSLRenewValue = isDedicatedAccount || is2010DedicatedOrProvider;
        }

        getSSLRenewTooltipText () {
            const now = moment();
            const sslExpirationDate = moment(this.exchange.sslExpirationDate);
            const aMonthBeforeSSLExpirationDate = sslExpirationDate.subtract(30, "days");

            if (this.hasSSLTask) {
                return this.services.translator.tr("exchange_action_renew_ssl_info");
            }

            if (now.isAfter(sslExpirationDate)) {
                return this.services.translator.tr("exchange_action_renew_ssl_info_expired");
            }

            if (now.isAfter(aMonthBeforeSSLExpirationDate)) {
                return this.services.translator.tr("exchange_action_renew_ssl_info_next", [sslExpirationDate.format("L")]);
            }

            if (now.isBefore(aMonthBeforeSSLExpirationDate)) {
                return this.services.translator.tr("exchange_action_renew_ssl_info_normal", [sslExpirationDate.format("L")]);
            }

            return null;
        }


        displayOrderDiskSpace () {
            return this.services.exchangeVersion.isVersion(2010) && this.services.accountTypes.isProvider();
        }

        orderDiskSpace () {
            if (this.displayOrderDiskSpace()) {
                this.services.navigation.setAction("exchange/information/disk/service-disk-order-space");
            }
        }

        loadATooltip () {
            if (_.has(this.exchange, "serverDiagnostic.ip") && this.exchange.serverDiagnostic.ip != null && _.has(this.exchange, "serverDiagnostic.isAValid") && this.exchange.serverDiagnostic.isAValid != null) {
                this.exchange.serverDiagnostic.aTooltip = this.services.translator.tr("exchange_dashboard_diag_a_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.aTooltip = this.services.translator.tr("exchange_dashboard_diag_a_tooltip_error", [this.exchange.hostname, this.exchange.serverDiagnostic.ip]);
            }
        }

        loadAaaaTooltip () {
            if (_.has(this.exchange, "serverDiagnostic.ipV6") && this.exchange.serverDiagnostic.ipV6 != null && _.has(this.exchange, "serverDiagnostic.isAaaaValid") && this.exchange.serverDiagnostic.isAaaaValid != null) {
                this.exchange.serverDiagnostic.aaaaTooltip = this.services.translator.tr("exchange_dashboard_diag_aaaa_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.aaaaTooltip = this.services.translator.tr("exchange_dashboard_diag_aaaa_tooltip_error", [this.exchange.hostname, this.exchange.serverDiagnostic.ipV6]);
            }
        }

        loadPtrTooltip () {
            if (_.has(this.exchange, "serverDiagnostic.isPtrValid") && this.exchange.serverDiagnostic.isPtrValid != null) {
                this.exchange.serverDiagnostic.ptrTooltip = this.services.translator.tr("exchange_dashboard_diag_ptr_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.ptrTooltip = this.services.translator.tr("exchange_dashboard_diag_ptr_tooltip_error");
            }
        }

        loadPtrv6Tooltip () {
            if (_.has(this.exchange, "serverDiagnostic.isPtrV6Valid") && this.exchange.serverDiagnostic.isPtrV6Valid != null) {
                this.exchange.serverDiagnostic.ptrv6Tooltip = this.services.translator.tr("exchange_dashboard_diag_ptrv6_tooltip_ok");
            } else {
                this.exchange.serverDiagnostic.ptrv6Tooltip = this.services.translator.tr("exchange_dashboard_diag_ptrv6_tooltip_error");
            }
        }
    });
