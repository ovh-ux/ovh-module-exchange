{
    class ExchangeAccountAdd {
        constructor ($scope, $timeout, Exchange, exchangeAccount, ExchangePassword, exchangeVersion, messaging, translator) {
            this.$scope = $scope;
            this.$timeout = $timeout;

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
            this.isOrderButtonDisabled = false;

            return this.fetchingAccountCreationOptions();
        }

        fetchingAccountCreationOptions () {
            return this.Exchange
                .fetchingAccountCreationOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((accountCreationOptions) => {
                    this.accountCreationOptions = transformAccountTypes.call(this, accountCreationOptions);
                    this.newAccount.accountType = this.accountCreationOptions.availableTypes[0];
                    this.newAccount.domain = this.accountCreationOptions.availableDomains[0];
                    this.passwordHintText = selectPasswordHintText.call(this);
                })
                .catch((error) => {
                    this.messaging.writeError("exchange_ACTION_add_account_error_message", error);
                    this.hide();
                })
                .finally(() => {
                    this.isFetchingCreationOptions = false;
                });

            function transformAccountTypes (accountCreationOptions) {
                const accountCreationOptionsa = _(accountCreationOptions).assign({
                    availableTypes: accountCreationOptions.availableTypes.map((type) => ({
                        name: type,
                        displayName: this.translator.tr(`exchange_tab_dedicatedCluster_account_type_${type}`)
                    }))
                }).value();

                return accountCreationOptionsa;
            }

            function selectPasswordHintText () {
                return this.accountCreationOptions.passwordComplexityEnabled ?
                    this.translator.tr("exchange_account_add_password_hint_complex", [this.accountCreationOptions.minPasswordLength]) :
                    this.translator.tr("exchange_account_add_password_hint_simple", [this.accountCreationOptions.minPasswordLength]);
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

            this.newAccountForm.login.$setValidity("emailAddressIsNotTaken", !emailAddressIsAlreadyTaken);
        }

        checkPasswordValidity () {
            if (this.newAccountForm.password.$error.required) {
                this.newAccountForm.password.$setValidity("respectsComplexityRules", true);
                this.newAccountForm.password.$setValidity("containsDisplayName", true);
                this.newAccountForm.password.$setValidity("containsSAMAccountName", true);
                this.newAccountForm.password.$setValidity("respectsComplexityRules", true);
                return;
            }

            if (this.accountCreationOptions.passwordComplexityEnabled) {
                this.newAccountForm.password.$setValidity("respectsComplexityRules", this.ExchangePassword.passwordComplexityCheck(this.newAccount.password, true, this.accountCreationOptions.minPasswordLength));
                this.newAccountForm.password.$setValidity("containsDisplayName", this.ExchangePassword.passwordContainsName(this.newAccount.password, this.newAccount.displayName));
                this.newAccountForm.password.$setValidity("containsSAMAccountName", _(this.newAccount.password).isString() && !_(this.newAccount.password).isEmpty() && _(this.newAccount.samAccountName).isString() && !_(this.newAccount.samAccountName).isEmpty() && this.newAccount.password.toUpperCase() === this.newAccount.samAccountName.toUpperCase());
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
            this.isOrderButtonDisabled = true;

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
