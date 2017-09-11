angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAddDomainController", class ExchangeAddDomainController {
        constructor ($rootScope, $scope, Exchange, ExchangeDomains, messaging, navigation, ovhUserPref, translator, Validator, exchangeVersion, accountTypes) {

            this.services = {
                $rootScope,
                $scope,
                Exchange,
                ExchangeDomains,
                messaging,
                navigation,
                ovhUserPref,
                translator,
                Validator,
                exchangeVersion,
                accountTypes
            };

            this.OVH_DOMAIN = "ovh-domain";
            this.NON_OVH_DOMAIN = "non-ovh-domain";
            this.exchange = Exchange.value;

            this.debouncedResetName = _.debounce(this.search, 300);

            this.$routerParams = Exchange.getParams();
            this.noDomainAttached = navigation.currentActionData ? navigation.currentActionData.noDomainAttached : false;
            this.loading = false;
            this.model = {
                name: "",
                displayName: "",
                isUTF8Domain: false,
                srvParam: true,
                mxParam: false,
                domainType: this.OVH_DOMAIN
            };

            this.search = {
                value: null
            };

            this.ovhDomain = this.OVH_DOMAIN;
            this.nonOvhDomain = this.NON_OVH_DOMAIN;

            this.services
                .ovhUserPref
                .getValue("EXCHANGE_DOMAIN_ADD_AUTO_DISPLAY")
                .then((res) => {
                    this.autoDisplay = res.autoDisplay;
                });

            $scope.loadDomainData = () => this.loadDomainData();
            $scope.addDomain = () => this.addDomain();
            $scope.isNonOvhDomainValid = () => this.isNonOvhDomainValid();
            $scope.checkDomain = () => this.checkDomain();
            $scope.isStep2Valid = () => this.isStep2Valid();
            $scope.checkDomainType = () => this.checkDomainType();
            $scope.isStep3Valid = () => this.isStep3Valid();
        }

        isStep3Valid () {
            return this.model.type;
        }

        onSearchValueChange () {
            this.debouncedResetName();
        }

        prepareData (data) {
            this.loading = false;
            this.availableDomains = data.availableDomains;
            this.availableDomainsBuffer = data.availableDomains;
            this.availableTypes = data.types;
            this.availableMainDomains = data.mainDomains;
            this.model.type = this.availableTypes[0];

            if (_.isEmpty(this.availableDomains)) {
                this.model.domainType = this.NON_OVH_DOMAIN;
                this.model.srvParam = false;
                this.model.mxParam = false;
            }
        }

        check2010Provider () {
            if (this.exchange == null) {
                return;
            }

            const isProviderAccount = this.services.accountTypes.isProvider();

            if (this.availableMainDomains != null && isProviderAccount && this.services.exchangeVersion.isVersion(2010)) {
                this.setOrganization2010 = true;

                if (_.isEmpty(this.availableMainDomains)) {
                    this.model.main = true;
                    this.model.organization2010 = null;
                } else {
                    this.model.main = false;
                    this.model.attachOrganization2010 = this.availableMainDomains[0];
                }
            }
        }

        prepareModel () {
            if (this.setOrganization2010) {
                if (this.model.main) {
                    delete this.model.organization2010;
                } else {
                    this.model.organization2010 = this.model.attachOrganization2010.name;
                }

                delete this.model.attachOrganization2010;
            }

            delete this.model.domainType;
            delete this.model.isUTF8Domain;
            delete this.model.displayName;
        }

        /* eslint-disable class-methods-use-this */
        getDefaultLanguage () {
            let defaultLanguage = "";

            if (localStorage["univers-selected-language"]) {
                defaultLanguage = localStorage["univers-selected-language"];
            }
            return defaultLanguage;
        }
        /* eslint-enable class-methods-use-this */

        isFrenchLanguage () {
            const language = this.getDefaultLanguage();
            return language && (/fr_[A-Z]{2}/).test(language);
        }

        toggleAutoDisplay () {
            this.services.ovhUserPref.assign("EXCHANGE_DOMAIN_ADD_AUTO_DISPLAY", {
                autoDisplay: this.autoDisplay
            });
        }

        loadDomainData () {
            this.loading = true;

            this.services
                .ExchangeDomains
                .gettingAddDomainData(this.$routerParams.organization, this.$routerParams.productId)
                .then((data) => {
                    this.loading = false;
                    this.prepareData(data);
                    this.check2010Provider();
                })
                .catch((failure) => {
                    this.services.navigation.resetAction();
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_domain_add_failure"), failure);
                });
        }

        resetSearchValue () {
            this.search.value = null;
            this.availableDomains = _.clone(this.availableDomainsBuffer);
        }

        addDomain () {
            this.prepareModel();

            this.services
                .ExchangeDomains
                .addingDomain(this.model)
                .then(() => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_tab_domain_add_success"));
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_domain_add_failure"), failure);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }

        resetName () {
            this.model.displayName = "";
            this.model.name = "";
        }

        search () {
            this.resetName();

            if (!_.isEmpty(this.search.value)) {
                this.availableDomains = _.filter(this.availableDomainsBuffer, (currentItem) => _.includes(currentItem.displayName, this.search.value));
            }

            this.services.$scope.$apply();
        }

        checkDomain () {
            if (this.model.domainType === this.NON_OVH_DOMAIN) {
                this.model.srvParam = false;
                this.services.$rootScope.$broadcast("wizard-goToStep", 3);
            }
        }

        checkDomainType () {
            if (this.model.domainType === this.NON_OVH_DOMAIN) {
                this.services.$rootScope.$broadcast("wizard-goToStep", 1);
            }
        }

        changeName () {
            this.model.name = punycode.toASCII(this.model.displayName);
            this.model.isUTF8Domain = this.model.displayName !== this.model.name;
        }

        isStep2Valid () {
            return this.model.type === "AUTHORITATIVE" || (this.model.mxRelay != null && this.model.type === "NON_AUTHORITATIVE");
        }

        isNonOvhDomainValid () {
            return this.model.name && (this.model.domainType !== this.NON_OVH_DOMAIN || this.services.Validator.isValidDomain(this.model.displayName));
        }
    });
