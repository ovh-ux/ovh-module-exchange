{
    const VERBS = ["get", "put", "post", "delete"];

    angular
        .module("Module.exchange.services")
        .service("APIExchange", class APIExchange {
            constructor (Api, $q, constants, $cacheFactory) {
                const cache = $cacheFactory("exchangeService");

                for (const verb of VERBS) {
                    this[verb] = (path, optionsParam) => {
                        let options = optionsParam || {};
                        options.cache = cache;
                        options.cache.removeAll();

                        return Api[verb](`${constants.swsProxyRootPath}email/exchange${path}`, options)
                            .then((data) => data, (reason) => $q.reject(reason));
                    };
                }
            }
        });
}
