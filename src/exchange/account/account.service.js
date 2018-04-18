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

            this.PLACEHOLDER_DOMAIN_NAME = "configureme.me";
        }

        /**
         * Get an array of task id
         * @param  {string} primaryEmailAddress
         * @returns {Promise} [number]
         */
        getTasks (organizationName, serviceName, primaryEmailAddress) {
            return this.OvhHttp
                .get(`/email/exchange/${organizationName}/service/${serviceName}/account/${primaryEmailAddress}/tasks`, {
                    rootPath: "apiv6"
                });
        }

        /**
         * @param {string} organizationName
         * @param {string} serviceName
         * @param {object} newAccount
         */
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

        /**
         * @param {object} account
         * @returns {boolean} True if the account can be edited
         */
        isEditable (account) {
            return this.exchangeStates.constructor.isOk(account) || this.exchangeStates.constructor.isDoing(account) || this.exchangeStates.constructor.isInError(account);
        }

        /**
         * @param {object} account
         * @returns {boolean} True if the `account` can't be used as it is a placeholder and not an actual account
         */
        isPlaceholder (account) {
            const inputIsValid = _(account).chain()
                .get("domain")
                .isString()
                .value();

            if (!inputIsValid) {
                throw "Input is not a valid account";
            }

            return account.domain.toUpperCase() === this.PLACEHOLDER_DOMAIN_NAME.toUpperCase();
        }

        /**
         * @param {object} account
         * @param {string} typeName
         * @returns {boolean} True if the `account` type if the same as `typeName`
         */
        isOfType (account, typeName) {
            const formattedTypeName = _(`${typeName}`).snakeCase().toUpperCase();
            const matchingType = this.ACCOUNT_TYPES[formattedTypeName];

            if (matchingType === undefined) {
                throw `${typeName} is not a valid account type name`;
            }

            return `${_(account).get("accountLicense", "")}`.toUpperCase() === matchingType.toUpperCase();
        }
    });
