{
    class ExchangeAccountAdd {
        constructor ($scope, $timeout, accountTypes, Exchange, exchangeAccount, ExchangePassword, exchangeVersion, messaging, translator) {
            this.$scope = $scope;
            this.$timeout = $timeout;

            this.accountTypes = accountTypes;
            this.Exchange = Exchange;
            this.exchangeAccount = exchangeAccount;
            this.ExchangePassword = ExchangePassword;
            this.exchangeVersion = exchangeVersion;
            this.messaging = messaging;
            this.translator = translator;
        }

        $onInit () {
            this.isFetchingCreationOptions = true;
            this.$routerParams = this.Exchange.getParams();
            this.newAccount = {};
            this.shouldDisplayPasswordInput = true;
            this.isSendingNewAccount = false;

            return this.fetchingAccountCreationOptions();
        }

        fetchingAccountCreationOptions () {
            return this.Exchange
                .fetchingAccountCreationOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((accountCreationOptions) => {
                    this.accountCreationOptions = transformAccountTypes.call(this, accountCreationOptions);
                    this.newAccount.accountType = this.accountCreationOptions.availableTypes[0];
                    this.newAccount.domain = this.accountCreationOptions.availableDomains[0];
                })
                .catch((error) => {
                    this.messaging.writeError("exchange_ACTION_add_account_error_message", error);
                    this.hide();
                })
                .finally(() => {
                    this.isFetchingCreationOptions = false;
                });

            function transformAccountTypes (accountCreationOptions) {
                const transformedAccountCreationOptions = _(accountCreationOptions).assign({
                    availableTypes: accountCreationOptions.availableTypes.map((accountType) => ({
                        name: accountType,
                        displayName: this.accountTypes.isDedicatedCluster() ? this.translator.tr(`exchange_tab_dedicatedCluster_account_type_${accountType}`) : this.translator.tr(`exchange_tab_ACCOUNTS_type_${accountType}`)
                    }))
                }).value();

                return transformedAccountCreationOptions;
            }
        }

        buildEmailAddress () {
            return `${this.newAccount.login}@${this.newAccount.domain.name}`;
        }

        checkEmailAddressIsAlreadyTaken () {
            const emailAddressIsAlreadyTaken = !_(this.accountCreationOptions.takenEmails).chain()
                .find((emailAddress) => emailAddress === this.buildEmailAddress())
                .isEmpty()
                .value();

            this.newAccountForm.login.$setValidity("emailAddressIsAlreadyTaken", !emailAddressIsAlreadyTaken);
        }

        checkPasswordValidity () {
            if (this.newAccountForm.password.$error.required) {
                this.newAccountForm.password.$setValidity("respectsComplexityRules", true);
                this.newAccountForm.password.$setValidity("containsDisplayName", true);
                this.newAccountForm.password.$setValidity("isSameAsSAMAccountName", true);
                this.newAccountForm.password.$setValidity("respectsComplexityRules", true);
                return;
            }

            if (this.accountCreationOptions.passwordComplexityEnabled) {
                this.newAccountForm.password.$setValidity("respectsComplexityRules", this.ExchangePassword.passwordComplexityCheck(this.newAccount.password, true, this.accountCreationOptions.minPasswordLength));
                this.newAccountForm.password.$setValidity("containsDisplayName", !this.ExchangePassword.passwordContainsName(this.newAccount.password, this.newAccount.displayName));
                this.newAccountForm.password.$setValidity("isSameAsSAMAccountName",
                                                          _(this.newAccount.samAccountName).isEmpty() ||
                                                         (_(this.newAccount.password).isString() &&
                                                            _(this.newAccount.samAccountName).isString() &&
                                                            this.newAccount.password.toUpperCase() !== this.newAccount.samAccountName.toUpperCase())
                );
            } else {
                this.newAccountForm.password.$setValidity("respectsComplexityRules", this.ExchangePassword.passwordSimpleCheck(this.newAccount.password, true, this.accountCreationOptions.minPasswordLength));
            }
        }

        hide () {
            this.$scope.$emit(this.exchangeAccount.events.accountSwitch, { action: "hide" });
        }

        switchBetweenPasswordAndTextInput () {
            const touchednessStatus = this.newAccountForm.password.$touched;
            this.shouldDisplayPasswordInput = !this.shouldDisplayPasswordInput;
            this.$timeout(() => {
                if (touchednessStatus) {
                    this.newAccountForm.password.$setTouched();
                    this.newAccountForm.password.$setDirty(); // It is intentional if the touchness impacts the dirtyness
                }

                this.checkPasswordValidity();
            });
        }

        onPasswordConfirmationChange () {
            if (this.newAccountForm.passwordConfirmation.$error.required) {
                this.newAccountForm.passwordConfirmation.$setValidity("isDifferentToPassword", true);
            } else {
                this.newAccountForm.passwordConfirmation.$setValidity("isDifferentToPassword", this.newAccount.password === this.newAccount.passwordConfirmation);
            }
        }

        sendingNewAccount () {
            this.isSendingNewAccount = true;

            const formattedAccount = {
                SAMAccountName: this.newAccount.samAccountName,
                displayName: this.newAccount.displayName,
                domain: this.newAccount.domain.name,
                firstName: this.newAccount.firstName,
                lastName: this.newAccount.lastName,
                license: this.newAccount.accountType.name.toLowerCase(),
                login: this.newAccount.login,
                password: this.newAccount.password,
                spamAndVirusConfiguration: {
                    checkDKIM: false,
                    putInJunk: false,
                    deleteSpam: false,
                    tagSpam: false,
                    checkSPF: false,
                    tagVirus: false,
                    deleteVirus: true
                }
            };

            return this.exchangeAccount
                .sendingNewAccount(this.$routerParams.organization, this.$routerParams.productId, formattedAccount)
                .then((data) => {
                    this.messaging.writeSuccess(this.translator.tr("exchange_account_add_submit_success", `${formattedAccount.login}@${formattedAccount.domain}`), data);
                })
                .catch((error) => {
                    this.messaging.writeError(this.translator.tr("exchange_ACTION_add_account_error_message"), error);
                })
                .finally(() => {
                    this.hide();
                });
        }
    }

    const exchangeAccountAdd = {
        templateUrl: "exchange/account/add/account-add.html",
        controller: ExchangeAccountAdd
    };

    angular
        .module("Module.exchange.components")
        .component("exchangeAccountAdd", exchangeAccountAdd);
}
