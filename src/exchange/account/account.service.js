angular
    .module("Module.exchange.services")
    .service("exchangeAccount", class ExchangeAccount {
        constructor (Exchange, exchangeSelectedService, exchangeStates, OvhHttp) {
            this.Exchange = Exchange;
            this.exchangeSelectedService = exchangeSelectedService;
            this.exchangeStates = exchangeStates;
            this.OvhHttp = OvhHttp;

            this.EVENTS = {
                CHANGE_STATE: "exchange.account.CHANGE_STATE"
            };

            this.ACCOUNT_TYPES = {
                BASIC: "Basic",
                STANDARD: "Standard"
            };

            this.OUTLOOK_STATES = {
                ALREADY_ORDERED: "alreadyOrdered",
                ALREADY_ACTIVATED: "alreadyActivated",
                TO_ACTIVATE: "toActivate",
                TO_ORDER: "toOrder"
            };

            this.PLACEHOLDER_DOMAIN_NAME = "configureme.me";
        }

        /**
         * Get an array of task id
         * @param  {string} primaryEmailAddress
         * @return {Promise} [number]
         */
        getTasks (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .get(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}/tasks`, {
                    rootPath: "apiv6"
                });
        }

        sendingNewAccount (organizationName, serviceName, newAccount) {
            return this.OvhHttp
                .post(`/email/exchange/${organizationName}/service/${serviceName}/account`, {
                    rootPath: "apiv6",
                    data: newAccount
                })
                .then((data) => {
                    this.Exchange.refreshViews("Accounts", "Tasks");

                    return data;
                });
        }

        isEditable (account) {
            return this.exchangeStates.constructor.isOk(account) || this.exchangeStates.constructor.isDoing(account) || this.exchangeStates.constructor.isInError(account);
        }

        isPlaceholder (account) {
            return account.domain === this.PLACEHOLDER_DOMAIN_NAME;
        }

        hasLicence (account, licenceName) {
            const accountLicence = `${_(account).get("accountLicense", "")}`;
            const formattedLicenceName = _(`${licenceName}`).snakeCase().toUpperCase();

            return accountLicence.toUpperCase() === this.ACCOUNT_TYPES[formattedLicenceName].toUpperCase();
        }

        canHaveOutlookLicence (account) {
            return !this.hasLicence(account, this.ACCOUNT_TYPES.BASIC) && !this.isPlaceholder(account);
        }

        getOutlookState (account) {
            const accountAlreadyHasLicence = account.outlook;

            if (accountAlreadyHasLicence && this.exchangeSelectedService.isContractType(this.exchangeSelectedService.CONTRACT_TYPES.PREPAID)) {
                return this.OUTLOOK_STATES.ALREADY_ORDERED;
            }

            if (accountAlreadyHasLicence && this.exchangeSelectedService.isContractType(this.exchangeSelectedService.CONTRACT_TYPES.PAY_AS_YOU_GO)) {
                return this.OUTLOOK_STATES.ALREADY_ACTIVATED;
            }

            if (!accountAlreadyHasLicence && this.Exchange.currentUserHasConfigurationRights() && this.exchangeSelectedService.isContractType(this.exchangeSelectedService.CONTRACT_TYPES.PAY_AS_YOU_GO)) {
                return this.OUTLOOK_STATES.TO_ACTIVATE;
            }

            return this.OUTLOOK_STATES.TO_ORDER;
        }
    });
