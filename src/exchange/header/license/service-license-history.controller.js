angular.module('Module.exchange.controllers').controller(
  'exchangeLicenseHistoryCtrl',
  class ExchangeLicenseHistoryCtrl {
    constructor(
      $scope,
      ChartjsFactory,
      Exchange,
      exchangeAccountTypes,
      exchangeHeaderLicence,
      messaging,
      navigation,
      $translate,
    ) {
      this.$scope = $scope;

      this.ChartjsFactory = ChartjsFactory;
      this.Exchange = Exchange;
      this.exchangeAccountTypes = exchangeAccountTypes;
      this.exchangeHeaderLicence = exchangeHeaderLicence;
      this.messaging = messaging;
      this.navigation = navigation;
      this.$translate = $translate;
    }

    $onInit() {
      this.$routerParams = this.Exchange.getParams();
      this.selectedPeriod = this.exchangeHeaderLicence.PERIODS.LAST_MONTH;

      this.$scope.loadMonitoring = () => this.loadMonitoring();
    }

    loadMonitoring() {
      this.loading = true;

      return this.exchangeHeaderLicence
        .fetchLicences(
          this.$routerParams.organization,
          this.$routerParams.productId,
          this.selectedPeriod.date,
        )
        .then((licenses) => {
          this.chart = new this.ChartjsFactory({
            type: 'line',
            data: {
              datasets: [],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              legend: {
                position: 'bottom',
                display: true,
              },
              elements: {
                point: {
                  radius: 0,
                },
              },
              tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  title: data => _(data)
                    .chain()
                    .first()
                    .get('xLabel')
                    .value(),
                },
              },
              scales: {
                yAxes: [
                  {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    scaleLabel: {
                      display: true,
                    },
                    gridLines: {
                      drawBorder: true,
                      display: true,
                    },
                    ticks: {
                      beginAtZero: true,
                      stepSize: 1,
                      suggestedMax: licenses.maxValue + 1,
                    },
                  },
                ],
                xAxes: [
                  {
                    type: 'time',
                    position: 'bottom',
                    gridLines: {
                      drawBorder: true,
                      display: false,
                    },
                  },
                ],
              },
            },
          });

          const serieOptions = {
            dataset: {
              fill: false,
              borderWidth: 1,
            },
          };

          this.chart.addSerie(
            this.$translate.instant('exchange_action_license_history_type_outlook'),
            licenses.outlook,
            serieOptions,
          );

          if (_(licenses.standard).isArray()) {
            this.chart.addSerie(
              this.$translate.instant('exchange_action_license_history_label', {
                t0: this.exchangeAccountTypes.getDisplayValue(
                  this.exchangeAccountTypes.TYPES.STANDARD,
                ),
              }),
              licenses.standard,
              serieOptions,
            );
          }

          if (_(licenses.basic).isArray()) {
            this.chart.addSerie(
              this.$translate.instant('exchange_action_license_history_label', {
                t0: this.exchangeAccountTypes.getDisplayValue(
                  this.exchangeAccountTypes.TYPES.BASIC,
                ),
              }),
              licenses.basic,
              serieOptions,
            );
          }

          if (_(licenses.enterprise).isArray()) {
            this.chart.addSerie(
              this.$translate.instant('exchange_action_license_history_label', {
                t0: this.exchangeAccountTypes.getDisplayValue(
                  this.exchangeAccountTypes.TYPES.ENTERPRISE,
                ),
              }),
              licenses.enterprise,
              serieOptions,
            );
          }
        })
        .catch((error) => {
          this.navigation.resetAction();
          this.messaging.writeError(
            this.$translate.instant('exchange_action_license_history_fail'),
            error,
          );
        })
        .finally(() => {
          this.loading = false;
        });
    }
  },
);
