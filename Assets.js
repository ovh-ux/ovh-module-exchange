"use strict";
module.exports = {
    src: {
        js: [
            "src/exchange/**/*.module.js",
            "src/exchange/**/*.js"
        ],
        css: [
            "src/css/exchange/**/*"
        ],
        html: [
            "src/exchange/**/*.html"
        ],
        images: [
            "src/images/exchange/**/*"
        ]
    },

    // Common is only used in STANDALONE!
    common: {
        js: [
            "bower_components/angular/angular.min.js",
            "bower_components/ckeditor/ckeditor.js",
            "bower_components/jquery/dist/jquery.min.js",
            "bower_components/jsurl/lib/jsurl.js",
            "bower_components/ng-ckeditor/ng-ckeditor.min.js",
            "bower_components/punycode/punycode.min.js",
            "bower_components/URIjs/src/URI.min.js"
        ],
        css: []
    },
    resources: {
        i18n: [
            "src/resources/i18n/exchange/**/*.xml"
        ]
    }
};
