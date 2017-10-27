angular
    .module("Module.exchange.controllers")
    .controller("ExchangeLicenseHistoryCtrl", class ExchangeLicenseHistoryCtrl {
        constructor ($rootScope, $scope, Exchange, translator, messaging, navigation, ChartjsFactory, EXCHANGE_HEADER_LICENSE) {
            this.services = {
                $rootScope,
                $scope,
                Exchange,
                translator,
                messaging,
                navigation
            };

            this.ChartjsFactory = ChartjsFactory;
            this.constant = {
                EXCHANGE_HEADER_LICENSE
            };

            this.$routerParams = Exchange.getParams();
            this.loading = false;
            this.selectedPeriod = {
                period: "LASTMONTH"
            };

            $scope.getMonitoringData = () => this.licenseHistory;
            $scope.loadMonitoring = () => this.loadMonitoring();
            $scope.getLicenseHistory = () => this.licenseHistory;
        }

        parseSerie (serie) {
            serie.name = this.services.translator.tr(`exchange_action_license_history_type_${serie.name}`);

            if (_.has(serie, "data") && serie.data != null) {
                serie.data = serie.data.map((data) => ExchangeLicenseHistoryCtrl.parseItem(data));
            }
        }

        static parseItem (item) {
            const date = moment(item.time, "YYYY-MM-DDTHH:mm:dd.SSSZZ").toDate();

            return [Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()), item.value];
        }

        loadMonitoring () {
            const period = this.selectedPeriod.period;
            this.loading = true;

            return this.services
                .Exchange
                .getExchangeLicenseHistory(this.$routerParams.organization, this.$routerParams.productId, period)
                .then((data) => {
                    if (_.has(data, "series") && data.series != null) {
                        _.forEach(data.series, (datum) => {
                            this.parseSerie(datum);
                        });
                    }

                    this.licenseHistory = data;

                    this.chart = new this.ChartjsFactory(angular.copy(this.constant.EXCHANGE_HEADER_LICENSE.chart));
                    this.chart.setAxisOptions("yAxes", {
                        type: "linear"
                    });
                    angular.forEach(data.series, (serie) => {
                        this.chart.addSerie(
                            serie.name,
                            _.map(serie.data, (point) => ({
                                x: point[0],
                                y: point[1]
                            })),
                            {
                                dataset: {
                                    fill: true,
                                    borderWidth: 1
                                }
                            }
                        );
                    });
                })
                .catch((failure) => {
                    this.services.navigation.resetAction();
                    this.services.messaging.writeError(this.services.translator.tr("exchange_action_license_history_fail"), failure);
                })
                .finally(() => {
                    this.loading = false;
                });
        }
    })
    .constant("EXCHANGE_HEADER_LICENSE", {
        chart: {
            type: "line",
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: "bottom",
                    display: true
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                tooltips: {
                    mode: "label",
                    intersect: false,
                    callbacks: {
                        title (data) {
                            return moment(_.get(_.first(data), "xLabel")).fromNow();
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        display: true,
                        position: "left",
                        scaleLabel: {
                            display: true
                        },
                        gridLines: {
                            drawBorder: true,
                            display: true
                        }
                    }],
                    xAxes: [{
                        type: "time",
                        position: "bottom",
                        gridLines: {
                            drawBorder: true,
                            display: false
                        }
                    }]
                }
            }
        }
    });
