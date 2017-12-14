angular
    .module("Module.exchange.services")
    .service("ExchangeInformationService", class ExchangeInformationService {
        displayDashboard () {
            console.info("displayDashboard");
            this.shouldDisplayDashboard = true;
            this.shouldDisplayOfficeOffer = false;
        }

        displayOfficeOffer () {
            this.shouldDisplayDashboard = false;
            this.shouldDisplayOfficeOffer = true;
        }
    });
