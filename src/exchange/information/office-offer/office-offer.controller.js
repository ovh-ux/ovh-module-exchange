angular
    .module("Module.exchange.controllers")
    .controller("ExchangeOfficeOfferCtrl", class ExchangeOfficeOfferCtrl {
        constructor ($scope, Exchange, ExchangeInformationService, $window, ovhUserPref, messaging, translator, navigation, exchangeVersion, User) {
            this.services = { $scope, Exchange, ExchangeInformationService, $window, ovhUserPref, messaging, translator, navigation, exchangeVersion, User };

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
            this.isInitialLoad = true;
            this.exchange = Exchange.value;

            this.searchValue = null;
            this.isStep1Valid = false;

            this.accountTypes = ["ALL", "BASIC", "STANDARD", "ENTERPRISE"];
            this.filterType = "ALL";
            this.tr = $scope.tr;

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
            this.selectedAccounts = this.loadSelectedAccounts();

            const answer = [{
                planCode: "office-tenant",
                configuration: [{
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
            }];

            answer[0].option = _.map(this.selectedAccounts, (account) => ({
                planCode: "office-business-pp",
                configuration: [{
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

            this.updateAccounts(null);

            this.services
                .Exchange
                .getAccounts(count, offset, this.searchValue, false, filterType)
                .then((accounts) => {
                    this.updateAccounts(accounts);
                    this.accountsTotalNumber = accounts.ids.length;
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.tr("exchange_tab_ACCOUNTS_error_message"), failure);
                })
                .finally(() => {
                    this.loading.step1.table = false;
                    this.countNumberOfCheckedAccounts();
                });
        }

        updateAccounts (accounts) {
            this.accounts = accounts;

            if (!_.isEmpty(accounts)) {
                const alreadyPresentAccounts = this.selectedAccounts.map((account) => account);
                this.selectedAccounts = this.selectedAccounts.concat(accounts.list.results.filter((account) => !alreadyPresentAccounts.includes(account)));
            }

            this.services.$scope.accounts = accounts;
        }

        countNumberOfCheckedAccounts () {
            if (!_.isEmpty(this.accounts)) {
                const currentDisplayedAccountEmailAddresses = this.accounts.list.results.map((account) => account.primaryEmailDisplayName);
                const selectedAccountsCurrentBeingDisplayed = this.selectedAccounts.filter((currentSelectedAccount) => currentDisplayedAccountEmailAddresses.includes(currentSelectedAccount));

                const currentlySelectedAccountsEmailAddresses = Object.keys(this.selectedCheckboxes).filter((key) => this.selectedCheckboxes[key]);
                const currentlyDislayedAccountsThatAreSelected = this.accounts.list.results.filter((account) => currentlySelectedAccountsEmailAddresses.includes(account.primaryEmailDisplayName));

                const alreadyPresentAccounts = currentlyDislayedAccountsThatAreSelected.map((account) => account.primaryEmailDisplayName);
                this.selectedAccounts = currentlyDislayedAccountsThatAreSelected.concat(selectedAccountsCurrentBeingDisplayed.filter((account) => !alreadyPresentAccounts.includes(account.primaryEmailDisplayName)));

                const currentlyNotSelectedAccountsEmailAddresses = Object.keys(this.selectedCheckboxes).filter((key) => !this.selectedCheckboxes[key]);

                this.selectedAccounts = this.selectedAccounts.filter((account) => !currentlyNotSelectedAccountsEmailAddresses.includes(account.primaryEmailDisplayName));

                this.numberOfSelectedCheckboxes = currentlySelectedAccountsEmailAddresses.length;
                this.step1IsValid();
            }
        }

        loadSelectedAccounts () {
            const keys = Object.keys(this.selectedCheckboxes);
            const accounts = _.filter(keys, (key) => this.selectedCheckboxes[key]);
            return accounts;
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
