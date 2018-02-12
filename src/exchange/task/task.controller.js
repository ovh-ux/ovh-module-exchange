angular
    .module("Module.exchange.controllers")
    .controller("ExchangeTabTasksCtrl", class ExchangeTabTasksCtrl {
        constructor ($scope, Exchange, messaging, translator) {
            this.services = {
                $scope,
                Exchange,
                messaging,
                translator
            };
        }

        $onInit () {
            const params = this.services.Exchange.getParams();
            this.organization = params.organization;
            this.productId = params.productId;

            this.states = {
                doing: "DOING",
                error: "ERROR",
                done: "DONE",
                cancelled: "CANCELLED",
                todo: "TODO"
            };

            this.services.$scope.$on(this.services.Exchange.events.tasksChanged, () => this.refreshTasks());

        }

        _getTasks ({ count, offset }) {
            return this.services.Exchange
                .getTasks(this.organization, this.productId, count, offset - 1);
        }

        loadPaginated ($config) {
            this.tasksList = null;
            this.pageSize = $config.pageSize;
            this.offset = $config.offset;
            return this._getTasks($config)
                .then((response) => {
                    this.tasksList = response.list.results;
                    return {
                        data: this.tasksList,
                        meta: {
                            totalCount: response.count
                        }
                    };
                })
                .catch((error) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_TASKS_error_message"), error);
                });
        }

        refreshTasks () {
            if (!this.tasksList) { return undefined; }
            const config = { pageSize: this.pageSize, offset: this.offset };
            return this._getTasks(config)
                .then((response) => {
                    for (let i = 0; i < response.list.results.length; i++) {
                        this.tasksList.splice(i, 1, response.list.results[i]);
                    }
                    for (let i = response.list.results.length; i < this.tasksList.length; i++) {
                        this.tasksList.splice(i, 1);
                    }
                })
                .catch((error) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_TASKS_error_message"), error);
                });
        }
    });
