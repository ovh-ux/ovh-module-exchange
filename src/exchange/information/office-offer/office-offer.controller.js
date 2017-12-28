angular
    .module("Module.exchange.controllers")
    .controller("ExchangeOfficeOfferCtrl", class ExchangeOfficeOfferCtrl {
        constructor ($scope, Exchange, ExchangeInformationService, $window, ovhUserPref, messaging, translator, navigation, exchangeVersion, User, OFFICE_365_URL) {
            this.services = { $scope, Exchange, ExchangeInformationService, $window, ovhUserPref, messaging, translator, navigation, exchangeVersion, User, OFFICE_365_URL };

            this.loading = {
                step1: {
                    general: false,
                    table: false
                },
                step2: {
                    general: false
                }
            };

            this.debouncedSetFilter = _.debounce(this.setFilter, 300);
            this.numberOfSelectedCheckboxes = 0;
            this.maxNumberOfAccounts = 25;
            this.selectedCheckboxes = {};
            this.selectedAccounts = [];
            this.numberOfSelectedCheckboxes = 0;
            this.allSelected = false;
            this.isInitialLoad = true;
            this.exchange = Exchange.value;

            this.searchValue = null;
            this.isStep1Valid = false;

            this.accountTypes = ["ALL", "BASIC", "STANDARD", "ENTERPRISE"];
            this.filterType = "ALL";
            this.tr = $scope.tr;
            this.OFFICE_365_URL = OFFICE_365_URL;

            $scope.loadSelectedAccounts = () => this.loadSelectedAccounts();

            $scope.loading = this.loading;
            $scope.retrieveAccounts = (count, offset) => this.retrieveAccounts(count, offset);
        }

        $onInit () {
            this.currentStep = "step1";
            this.services
                .User
                .getUser()
                .then((user) => {
                    this.ovhSubsidiary = user.ovhSubsidiary;
                    this.office_365_website_url = this.getOfficeLink(user.ovhSubsidiary);
                });
        }

        resetSearch () {
            this.searchValue = null;
            this.setFilter();
        }

        onWizardFinish () {
            let displayName = `${this.exchange.displayName} Office`;
            if (this.exchange.displayName.match(/.*hosted.*/i) || this.exchange.displayName.match(/.*exchange.*/i) || this.exchange.displayName.match(/.*private.*/i)) {
                displayName = this.exchange.displayName.replace(/hosted/i, "Office").replace(/exchange/i, "Office").replace(/private/i, "Office");
            }

            const answer = [
                {
                    planCode: "office-tenant",
                    configuration: [
                        {
                            label: "zip_code",
                            values: ["00000"]
                        },
                        {
                            label: "display_name",
                            values: [displayName]
                        },
                        {
                            label: "exchange_service_name",
                            values: [this.exchange.domain]
                        },
                        {
                            label: "country",
                            values: [this.ovhSubsidiary || "FR"]
                        }
                    ],
                    option: [],
                    quantity: 1,
                    productId: "office365Prepaid"
                }
            ];

            answer[0].option = _.map(this.selectedAccounts, (account) => ({
                planCode: "office-business-pp",
                configuration: [
                    {
                        label: "lastName",
                        values: [account.lastName ? account.lastName : ""]
                    },
                    {
                        label: "firstName",
                        values: [account.firstName ? account.firstName : ""]
                    },
                    {
                        label: "login",
                        values: [account.primaryEmailDisplayName.split(/@/)[0]]
                    }
                ],
                option: [],
                quantity: 1
            }));

            this.services.User.getUrlOfEndsWithSubsidiary("express_order").then((expressOrderUrl) => {
                this.services.$window.open(`${expressOrderUrl}#/new/express/resume?products=${JSURL.stringify(answer)}`, "_blank");
                this.displayDashboard();
            });
        }

        onSearchValueChange () {
            this.debouncedSetFilter();
        }

        setFilter () {
            this.services.$scope.$broadcast("paginationServerSide.loadPage", 1, "officeAttachedTable");
        }

        step1IsValid () {
            this.services.$scope.isStep1Valid = this.numberOfSelectedCheckboxes <= this.maxNumberOfAccounts && this.numberOfSelectedCheckboxes > 0;
        }

        retrieveAccounts (count, offset) {
            this.services.messaging.resetMessages();
            this.offset = offset;
            this.loading.step1.table = true;
            const filterType = this.filterType === "ALL" ? null : this.filterType;

            this.services
                .Exchange
                .getAccounts(count, offset, this.searchValue, false, filterType)
                .then((accounts) => {
                    this.accounts = accounts;
                    this.services.$scope.accounts = accounts;

                    this.accountsTotalNumber = accounts.ids.length;
                })
                .catch((failure) => {
                    this.accounts = null;
                    this.services.$scope.accounts = null;
                    this.services.messaging.writeError(this.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.preSelectFirtsAccount();
                    this.loading.step1.table = false;
                });
        }

        getOfficeLink (ovhSubsidiary) {
            return _.get(this.OFFICE_365_URL, ovhSubsidiary, "FR");  // "FR" as default value
        }

        countNumberOfCheckedAccounts (item) {
            if (_.isObject(this.accounts) && !_.isEmpty(this.accounts)) {
                const selectedAccountsEmails = this.loadSelectedAccounts();
                if (_(item).isObject()) {
                    if (selectedAccountsEmails.includes(item.primaryEmailDisplayName)) {
                        this.selectedAccounts.push(item);
                    } else {
                        this.selectedAccounts = this.selectedAccounts.filter((currentAccount) => currentAccount.primaryEmailDisplayName !== item.primaryEmailDisplayName);
                    }
                }

                this.numberOfSelectedCheckboxes = selectedAccountsEmails.length;
                this.step1IsValid();
            }
        }

        loadSelectedAccounts () {
            const keys = Object.keys(this.selectedCheckboxes);
            const accounts = _.filter(keys, (key) => this.selectedCheckboxes[key]);
            return accounts;
        }

        preSelectFirtsAccount () {
            if (this.isInitialLoad && this.accountsTotalNumber > 0) {
                this.selectedCheckboxes[this.services.$scope.accounts.list.results[0].primaryEmailDisplayName] = true;
                this.countNumberOfCheckedAccounts(this.services.$scope.accounts.list.results[0]);
                this.isInitialLoad = false;
            }
        }

        selectAll () {
            let i = 0;
            if (this.allSelected) {
                while (i < this.maxNumberOfAccounts) {
                    this.selectedCheckboxes[this.services.$scope.accounts.list.results[i].primaryEmailDisplayName] = true;
                    this.countNumberOfCheckedAccounts(this.services.$scope.accounts.list.results[i]);
                    i++;
                }
            } else {
                while (i <= this.accountsTotalNumber) {
                    this.selectedCheckboxes[this.services.$scope.accounts.list.results[i].primaryEmailDisplayName] = false;
                    this.selectedAccounts = [];
                    this.numberOfSelectedCheckboxes = 0;
                    i++;
                }
            }
        }

        isStep2Valid () {
            return this.confirmationCheckbox;
        }

        displayDashboard () {
            this.services.ExchangeInformationService.displayDashboard();
        }

        goToStep1 () {
            this.currentStep = "step1";
        }

        goToStep2 () {
            this.currentStep = "step2";
        }

        displayStep (step) {
            return this.currentStep === step;
        }
    });
