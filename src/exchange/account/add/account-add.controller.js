angular
    .module("Module.exchange.controllers")
    .controller("ExchangeAddAccountCtrl", class ExchangeAddAccountCtrl {
        constructor ($scope, Exchange, ExchangePassword, navigation, messaging, translator, accountTypes, exchangeVersion) {
            this.services = {
                $scope,
                Exchange,
                ExchangePassword,
                navigation,
                messaging,
                translator,
                accountTypes,
                exchangeVersion
            };

            this.$routerParams = Exchange.getParams();
            this.valid = {
                legalWarning: false
            };

            this.loaders = {
                accountOptions: false
            };

            this.newAccountOptions = null;
            this.passwordTooltip = null;
            this.exchange = null;
            this.accountToAdd = {
                outlook: false,
                hiddenFromGAL: false,
                displayName: "",
                firstName: "",
                lastName: "",
                login: "",
                domain: "",
                completeDomain: {
                    name: ""
                }
            };

            this.differentPasswordFlag = false;
            this.simplePasswordFlag = false;
            this.containsNameFlag = false;
            this.passwordContainsSAMAccountName = false;
            this.takenEmailError = false;
            this.exchange = Exchange.value;

            this.loadAccountOptions();

            $scope.accountIsValid = () => this.accountIsValid();
            $scope.addExchangeAccount = () => this.addExchangeAccount();
            $scope.getNewAccountOptions = () => this.newAccountOptions;
        }

        makeDisplayName () {
            const firstName = _.get(this.accountToAdd, "firstName", "");
            const lastName = _.get(this.accountToAdd, "lastName", "");
            const completeName = `${firstName} ${lastName}`;
            this.accountToAdd.displayName = completeName.trim(); // handles case where either firstName or lastName is empty
        }

        setPasswordsFlag (selectedAccount) {
            this.differentPasswordFlag = false;
            this.simplePasswordFlag = false;
            this.containsNameFlag = false;
            this.passwordContainsSAMAccountName = false;

            const hasPassword = _.has(selectedAccount, "password") && !_.isEmpty(selectedAccount.password);
            const hasConfirmation = _.has(selectedAccount, "passwordConfirmation") && !_.isEmpty(selectedAccount.passwordConfirmation);
            const hasMinLength = _.has(this.newAccountOptions, "minPasswordLength") && this.newAccountOptions.minPasswordLength != null;
            const hasComplexityEnabled = _.has(this.newAccountOptions, "passwordComplexityEnabled") && this.newAccountOptions.passwordComplexityEnabled != null;

            if (!hasPassword || !hasConfirmation || !hasMinLength || !hasComplexityEnabled) {
                return;
            }

            selectedAccount.password = selectedAccount.password.toString();
            selectedAccount.passwordConfirmation = selectedAccount.passwordConfirmation.toString();

            this.simplePasswordFlag = !this.services.ExchangePassword.passwordSimpleCheck(selectedAccount.password, true, this.newAccountOptions.minPasswordLength);

            if (!this.simplePasswordFlag && selectedAccount.password !== selectedAccount.passwordConfirmation) {
                this.differentPasswordFlag = true;
            }

            /**
             * See https://technet.microsoft.com/en-us/library/hh994562%28v=ws.10%29.aspx for further information
             */
            if (this.newAccountOptions.passwordComplexityEnabled) {
                this.simplePasswordFlag = this.simplePasswordFlag || !this.services.ExchangePassword.passwordComplexityCheck(selectedAccount.password);

                if (_.isEmpty(selectedAccount.displayName)) {
                    this.containsNameFlag = this.services.ExchangePassword.passwordContainsName(selectedAccount.password, selectedAccount.displayName);
                }

                if (!this.containsNameFlag && !_.isEmpty(selectedAccount.login)) {
                    if (~selectedAccount.password.indexOf(selectedAccount.login)) {
                        this.containsNameFlag = true;
                    }
                }

                this.passwordContainsSAMAccountName = !_.isEmpty(selectedAccount.SAMAccountName) && _.includes(selectedAccount.password, selectedAccount.SAMAccountName);
            }
        }

        getPasswordTooltip () {
            if (!_.has(this.newAccountOptions, "passwordComplexityEnabled", "minPasswordLength")) {
                return null;
            }

            return this.newAccountOptions.passwordComplexityEnabled ?
                this.services.translator.tr("exchange_ACTION_update_account_step1_complex_password_tooltip", [this.newAccountOptions.minPasswordLength]) :
                this.services.translator.tr("exchange_ACTION_update_account_step1_simple_password_tooltip", [this.newAccountOptions.minPasswordLength]);
        }

        checkTakenEmails () {
            this.takenEmailError = false;

            if (_.isEmpty(this.takenEmails) || !_.has(this.accountToAdd, "login") || _.isEmpty(this.accountToAdd.login) || !_.isString(this.accountToAdd.login)) {
                return;
            }

            const foundMatch = _.find(this.takenEmails, (value) => _.isString(value) && `${this.accountToAdd.login.toLowerCase()}@${this.accountToAdd.completeDomain.name}` === value.toLowerCase());

            this.takenEmailError = !_.isEmpty(foundMatch);
        }

        loadAccountOptions () {
            this.loaders.accountOptions = true;

            this.services.Exchange
                .getNewAccountOptions(this.$routerParams.organization, this.$routerParams.productId)
                .then((data) => {
                    this.newAccountOptions = data;
                    this.takenEmails = data.takenEmails;

                    if (_.isEmpty(data.availableDomains) || _.isEmpty(data.availableTypes)) {
                        this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_add_no_domains"));
                        this.services.navigation.resetAction();
                    } else {
                        this.accountToAdd.completeDomain = data.availableDomains[0];
                        this.accountToAdd.accountLicense = data.availableTypes[0];
                        this.accountIsValid();
                    }

                    this.passwordTooltip = this.newAccountOptions.passwordComplexityEnabled ?
                        this.services.translator.tr("exchange_ACTION_update_account_step1_complex_password_tooltip", [this.newAccountOptions.minPasswordLength]) :
                        this.services.translator.tr("exchange_ACTION_update_account_step1_simple_password_tooltip", [this.newAccountOptions.minPasswordLength]);
                }).catch((failure) => {
                    this.services.navigation.resetAction();
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_add_account_option_fail"), failure);
                }).finally(() => {
                    this.loaders.accountOptions = false;
                });
        }

        accountIsValid () {
            if (!this.valid.legalWarning) {
                return false;
            } else if (this.simplePasswordFlag || this.differentPasswordFlag || this.containsNameFlag) {
                return false;
            } else if (!_.has(this.accountToAdd, "completeDomain.name") || _.isEmpty(this.accountToAdd.completeDomain.name)) {
                return false;
            } else if (_.isEmpty(this.accountToAdd.login)) {
                return false;
            } else if (_.isEmpty(this.accountToAdd.password) || ~this.accountToAdd.password.indexOf(" ") || this.accountToAdd.password !== this.accountToAdd.passwordConfirmation) {
                return false;
            }
            return this.services.ExchangePassword.passwordSimpleCheck(this.accountToAdd.password, false, this.newAccountOptions.minPasswordLength);

        }

        addExchangeAccount () {
            // cleanup the model
            this.accountToAdd.domain = _.get(this.accountToAdd, "completeDomain.name", "");
            this.accountToAdd.completeDomain = undefined;

            const login = _.get(this.accountToAdd, "login", "").toString();
            this.accountToAdd.login = login.toLowerCase();

            this.services.Exchange
                .addExchangeAccount(this.$routerParams.organization, this.$routerParams.productId, this.accountToAdd)
                .then((data) => {
                    this.services.messaging.writeSuccess(this.services.translator.tr("exchange_ACTION_add_account_success_message"), data);
                })
                .catch((err) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_ACTION_add_account_error_message"), err);
                })
                .finally(() => {
                    this.services.navigation.resetAction();
                });
        }
    });
