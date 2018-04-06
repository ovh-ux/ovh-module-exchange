angular
    .module("Module.exchange.controllers")
    .controller("exchangeAccountCtlr", class ExchangeAccountCtlr {
        constructor ($scope, exchangeAccount) {
            this.$scope = $scope;

            this.exchangeAccount = exchangeAccount;
        }

        $onInit () {
            this.currentState = "home";

            this.$scope.$on(this.exchangeAccount.events.accountSwitch, (events, args) => this.changeState(args));
        }

        changeState ({ action, args }) {
            switch (action.toUpperCase()) {
            case "HIDE":
                this.currentState = "home";
                this.currentAccount = null;
                break;
            case "ALIAS":
                this.currentState = "alias";
                this.currentAccount = args.account;
                break;
            case "ADD":
                this.currentState = "add";
                this.currentAccount = null;
                break;
            default:
                this.currentState = action.toLowerCase();
            }
        }
    });
