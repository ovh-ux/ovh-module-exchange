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

            this.$routerParams = Exchange.getParams();

            this.tableLoading = false;

            this.states = {
                doing: "DOING",
                error: "ERROR",
                done: "DONE",
                cancelled: "CANCELLED",
                todo: "TODO"
            };

            $scope.$on(Exchange.events.tasksChanged, () => $scope.$broadcast("paginationServerSide.reload", "tasksTable"));

            $scope.retrieveTasks = (count, offset) => this.retrieveTasks(count, offset);
            $scope.getTasksList = () => this.tasksList;
            $scope.getTableLoading = () => this.tableLoading;
        }

        retrieveTasks (count, offset) {
            this.tableLoading = true;

            return this.services
                .Exchange
                .getTasks(this.$routerParams.organization, this.$routerParams.productId, count, offset)
                .then((tasks) => {
                    this.tasksList = tasks;
                })
                .catch((failure) => {
                    this.services.messaging.writeError(this.services.translator.tr("exchange_tab_TASKS_error_message"), failure);
                })
                .finally(() => {
                    this.tableLoading = false;
                });
        }
    });
