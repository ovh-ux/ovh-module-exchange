{
    class OfficeAttachedCtrl {
        constructor (Exchange, officeAttached, ovhUserPref, User) {
            this.services = {
                Exchange,
                officeAttached,
                ovhUserPref,
                User
            };

            this.exchange = Exchange.value;
            this.maxNumberOfAccounts = 25;
            this.shouldDisplayOfficeAttachedF();
        }

        shouldDisplayOfficeAttachedF () {
            this.shouldDisplayOfficeAttached = false;

            return this.services
                .ovhUserPref
                .getValue("OFFICE_ATTACHED")
                .then((pref) => {
                    const preferenceExists = _.has(pref, "shouldDisplayOfficeAttached");
                    this.shouldDisplayOfficeAttached = !preferenceExists || (preferenceExists && pref.shouldDisplayOfficeAttached);
                })
                .catch(() => {
                    this.shouldDisplayOfficeAttached = true;
                })
                .then(() => {
                    if (this.shouldDisplayOfficeAttached) {
                        return this.services
                            .Exchange
                            .getOfficeAttachSubscription(this.exchange.domain)
                            .then((officeTenantServiceName) => {
                                this.shouldDisplayOfficeAttached = officeTenantServiceName == null;
                            });
                    }

                    return null;
                });
        }

        saveHideOfficeAttached () {
            this.services.ovhUserPref.create("OFFICE_ATTACHED", {
                shouldDisplayOfficeAttached: false
            });
        }
    }

    angular
        .module("Module.exchange.directives")
        .directive("officeAttached", () => {
            "use strict";

            return {
                restrict: "E",
                templateUrl: "exchange/office-attached/office-attached.html",
                controller: OfficeAttachedCtrl,
                controllerAs: "officeAttachedCtrl",
                scope: false,
                replace: true
            };
        });
}
