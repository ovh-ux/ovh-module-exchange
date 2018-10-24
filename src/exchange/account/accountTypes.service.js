angular.module('Module.exchange.services').service(
  'exchangeAccountTypes',
  class ExchangeAccountTypes {
    constructor(exchangeServiceInfrastructure, exchangeVersion, $translate) {
      this.exchangeServiceInfrastructure = exchangeServiceInfrastructure;
      this.exchangeVersion = exchangeVersion;
      this.$translate = $translate;

      this.TYPES = {
        BASIC: 'BASIC',
        STANDARD: 'STANDARD',
        ENTERPRISE: 'ENTERPRISE',
      };

      this.CAN_DO = {
        BASIC: () => this.exchangeServiceInfrastructure.isDedicatedCluster()
          || (this.exchangeServiceInfrastructure.isProvider() && this.exchangeVersion.is(2010))
          || (this.exchangeServiceInfrastructure.isDedicated() && this.exchangeVersion.is(2010)),
        ENTERPRISE: () => this.exchangeServiceInfrastructure.isDedicated()
          || (this.exchangeServiceInfrastructure.isDedicated() && this.exchangeVersion.is(2010)),
      };
    }

    getDisplayValue(accountType) {
      const formattedAccountType = _(`${accountType || ''}`)
        .camelCase()
        .toUpperCase();

      switch (formattedAccountType) {
        case this.TYPES.BASIC:
          if (!this.CAN_DO.BASIC()) {
            throw new Error("Current service doesn't allow Basic account types");
          }

          return this.exchangeServiceInfrastructure.isDedicatedCluster()
            ? this.$translate.instant('exchange_accounts_types_dedicatedCluster_BASIC')
            : this.$translate.instant('exchange_accounts_types_2010_BASIC');

        case this.TYPES.STANDARD:
          return this.exchangeServiceInfrastructure.isDedicatedCluster()
            ? this.$translate.instant('exchange_accounts_types_dedicatedCluster_STANDARD')
            : this.$translate.instant('exchange_accounts_types_2010_STANDARD');

        case this.TYPES.ENTERPRISE:
          return this.$translate.instant('exchange_accounts_types_2010_ENTERPRISE');

        default:
          throw new Error(`Unknown account type ${accountType}`);
      }
    }

    /**
     * @param {object} account
     * @param {string} typeName
     * @returns {boolean} True if the `account` type if the same as `typeName`
     */
    is(account, typeName) {
      const formattedTypeName = _(`${typeName || ''}`)
        .snakeCase()
        .toUpperCase();
      if (_(formattedTypeName).isEmpty()) {
        throw new Error('The input cannot be an empty value');
      }

      const matchingType = this.TYPES[formattedTypeName];

      if (matchingType === undefined) {
        throw new Error(`${typeName} is not a valid account type name`);
      }

      return (
        _(account)
          .get('accountLicense', '')
          .toUpperCase() === matchingType.toUpperCase()
      );
    }
  },
);
