angular.module('Module.exchange.controllers').controller(
  'ExchangeDisplayOutlookCtrl',
  class ExchangeDisplayOutlookCtrl {
    constructor(
      $scope,
      Exchange,
      exchangeAccountOutlook,
      $timeout,
      $translate,
      APIExchange,
      navigation,
      messaging,
    ) {
      this.services = {
        $scope,
        Exchange,
        exchangeAccountOutlook,
        $timeout,
        $translate,
        APIExchange,
        navigation,
        messaging,
      };

      this.selectedAccount = navigation.currentActionData;
      this.model = {
        primaryEmailAddress: this.selectedAccount.primaryEmailAddress,
        language: $translate.use().split('_')[1],
      };

      this.exchange = Exchange.value;
      this.$routerParams = Exchange.getParams();

      this.timeout = null;
      this.NO_SERIAL = 'Not required';
      this.retryFlag = 10; // max number to try getting licence (during 1 minutes)

      $scope.exitWizard = () => this.exitWizard();
      $scope.isStep1Valid = () => this.isStep1Valid();
      $scope.step1OnLoad = () => this.step1OnLoad();
      $scope.generateOutlookLicence = () => this.generateOutlookLicence();
      $scope.previous = () => this.previous();
    }

    step1OnLoad() {
      return this.services.exchangeAccountOutlook
        .getLicenceDetails(
          this.$routerParams.organization,
          this.$routerParams.productId,
          this.selectedAccount.primaryEmailAddress,
        )
        .then((data) => {
          this.outlook = data;

          if (this.NO_SERIAL === this.outlook.serial) {
            this.outlook.serial = this.services.$translate.instant(
              'exchange_ACTION_display_outlook_serial_not_required',
            );
          }

          this.displayWaitMessage = true;
        })
        .catch(() => {
          this.getOutlookVersions();
        });
    }

    isStep1Valid() {
      return this.model.licenceVersion && this.model.languageIndex;
    }

    startTimeout() {
      this.services.$timeout.cancel(this.timeout);
      this.timeout = this.services.$timeout(() => {
        this.getOutlookDetails();
      }, 10000); // try getting licence every 10 seconds
    }

    orderOutlook() {
      this.services.exchangeAccountOutlook
        .orderOutlook(this.$routerParams.organization, this.$routerParams.productId, this.model)
        .then((data) => {
          this.previewOrder = data;
        })
        .catch((failure) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_ACTION_add_outlook_step2_error_message'),
            failure,
          );
          this.services.navigation.resetAction();
        });
    }

    static checkForNoLanguageSpecificApiError(message) {
      // hack to detect a specific API error like
      // "There is no outlook for mac_x86_2011 in tr language"
      return !_.isEmpty(message) && _.includes(message, 'There') && _.includes(message, 'language');
    }

    getOutlookDetails() {
      this.services.exchangeAccountOutlook
        .getLicenceDetails(
          this.$routerParams.organization,
          this.$routerParams.productId,
          this.selectedAccount.primaryEmailAddress,
        )
        .then((data) => {
          this.outlook = data;

          if (this.NO_SERIAL === this.outlook.serial) {
            this.outlook.serial = this.services.$translate.instant(
              'exchange_ACTION_display_outlook_serial_not_required',
            );
          }
        })
        .catch(() => {
          if (this.retryFlag--) { // eslint-disable-line
            this.startTimeout();
          } else {
            this.services.navigation.resetAction();
          }
        });
    }

    getOutlookAvailibility(licence, language) {
      let availibility;

      if (licence && language) {
        availibility = _.find(this.availableLicences, {
          outlookVersion: licence,
          outlookLanguage: language,
        });
      }

      return availibility ? availibility.status : true;
    }

    /* eslint-disable class-methods-use-this */
    parseOutlookVersionEnum(version) {
      return version;
    }
    /* eslint-enable class-methods-use-this */

    isLanguageDisabled(language) {
      return !this.getOutlookAvailibility(this.model.licenceVersion, language.toLowerCase());
    }

    previous() {
      this.displayWaitMessage = true;
    }

    getOutlookVersions() {
      this.services.APIExchange.get(
        '/{organizationName}/service/{exchangeService}/outlookAvailability',
        {
          urlParams: {
            organizationName: this.exchange.organization,
            exchangeService: this.exchange.domain,
          },
        },
      )
        .then((data) => {
          this.availableLicences = data;
          this.versionsList = _.uniq(this.availableLicences.map(item => item.outlookVersion));
          this.languageList = _.uniq(this.availableLicences.map(item => item.outlookLanguage));
          this.model.licenceVersion = _.first(this.versionsList);
        })
        .catch((fail) => {
          this.services.messaging.writeError(
            this.services.$translate.instant('exchange_ACTION_display_outlook_error_message'),
            fail,
          );
          this.services.navigation.resetAction();
        });
    }

    generateOutlookLicence() {
      this.model.language = this.model.languageIndex.toUpperCase();
      this.model.licenceVersion = this.parseOutlookVersionEnum(this.model.licenceVersion);
      delete this.model.languageIndex; // clean up the model

      this.services.exchangeAccountOutlook
        .generateOutlookUrl(
          this.$routerParams.organization,
          this.$routerParams.productId,
          this.model,
        )
        .then((data) => {
          if (data.status !== 'ERROR' && this.retryFlag--) { // eslint-disable-line
            this.startTimeout();
          } else {
            this.services.messaging.writeError(
              this.services.$translate.instant('exchange_ACTION_display_outlook_error_message'),
              data,
            );
            this.services.navigation.resetAction();
          }
        })
        .catch((fail) => {
          if (
            ExchangeDisplayOutlookCtrl.checkForNoLanguageSpecificApiError(fail.message) !== null
          ) {
            this.services.messaging.writeError(
              this.services.$translate.instant(
                'exchange_ACTION_display_outlook_language_error_message',
              ),
              fail,
            );
          } else {
            this.services.messaging.writeError(
              this.services.$translate.instant('exchange_ACTION_display_outlook_error_message'),
              fail,
            );
          }

          this.services.navigation.resetAction();
        });
    }

    exitWizard() {
      this.retryFlag = 0;
      this.services.$timeout.cancel(this.timeout);
      this.services.navigation.resetAction();
    }
  },
);
