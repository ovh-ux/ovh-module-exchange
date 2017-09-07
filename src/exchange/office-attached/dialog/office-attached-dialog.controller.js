angular
    .module("Module.exchange.controllers")
    .controller("OfficeAttachedDialogCtrl", class OfficeAttachedDialogCtrl {
        constructor ($scope, Exchange, $window, ovhUserPref, messaging, translator, navigation, exchangeVersion, User) {
            this.services = { $scope, Exchange, $window, ovhUserPref, messaging, translator, navigation, exchangeVersion, User };

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

            $scope.onWizardCancel = () => this.onWizardCancel();
            $scope.onWizardFinish = () => this.onWizardFinish();
            $scope.onWizardLoad = () => this.onWizardLoad();
            $scope.loadSelectedAccounts = () => this.loadSelectedAccounts();

            $scope.loading = this.loading;
            $scope.retrieveAccounts = (count, offset) => this.retrieveAccounts(count, offset);
            $scope.isStep1Valid = this.isStep1Valid;
            $scope.isStep2Valid = () => this.isStep2Valid();
        }

        onWizardCancel () {
            this.services.navigation.resetAction();
        }

        resetSearch () {
            this.searchValue = null;
            this.setFilter();
        }

        onWizardFinish () {
            this.services.navigation.resetAction();

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
                            values: ["FR"]
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

        onWizardLoad () {
            this.services
                .Exchange
                .getAccounts(this.maxNumberOfAccounts, 0, this.searchValue, false, null)
                .then((accounts) => {
                    let i = 0;

                    _.each(accounts.list.results, (account) => {
                        const id = account.primaryEmailDisplayName;

                        if (_.isEmpty(this.selectedCheckboxes[id])) {
                            if (i < this.maxNumberOfAccounts) {
                                this.selectedCheckboxes[id] = true;
                                this.selectedAccounts.push(account);
                            } else {
                                this.selectedCheckboxes[id] = false;
                            }
                        }

                        i++;
                    });
                })
                .finally(() => this.countNumberOfCheckedAccounts());
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
                this.selectedAccounts = this.selectedAccounts.concat(accounts.list.results);
            }

            this.services.$scope.accounts = accounts;
        }

        countNumberOfCheckedAccounts () {
            const keys = Object.keys(this.selectedCheckboxes);
            const selectedAccounts = _.filter(keys, (key) => this.selectedCheckboxes[key]);

            let valuesToKeep = [];

            if (!_.isEmpty(this.accounts)) {
                valuesToKeep = _.filter(this.selectedAccounts, (currentSelectedAccount) => _.find(this.accounts.list.results, (currentAccount) =>
                    currentAccount.primaryEmailDisplayName === currentSelectedAccount.primaryEmailDisplayName) != null
                );
            }

            this.selectedAccounts = _.filter(this.accounts.list.results, (account) => _.find(selectedAccounts, (primaryEmailDisplayName) => account.primaryEmailDisplayName === primaryEmailDisplayName));

            this.selectedAccounts = this.selectedAccounts.concat(valuesToKeep);

            this.numberOfSelectedCheckboxes = selectedAccounts.length;
            this.step1IsValid();
        }

        loadSelectedAccounts () {
            const keys = Object.keys(this.selectedCheckboxes);
            const accounts = _.filter(keys, (key) => this.selectedCheckboxes[key]);

            return accounts;
        }

        isStep2Valid () {
            return this.confirmationCheckbox;
        }
    });
