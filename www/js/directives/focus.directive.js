/**
 * Created by Diego Ceresuela on 17/02/16.
 *
 * Creates the 'focus' directive, used to manage the caret.
 */
(function(){
    'use strict';

    angular
        .module('AraWord')
        .directive('focus', focus);

    focus.$inject = ['$timeout'];

    function focus($timeout) {
        return {
            scope: {
                trigger: '@focus'
            },
            link: function (scope, element) {
                scope.$watch('trigger', function (value) {
                    if (value === "true") {
                        $timeout(function () {
                            element[0].focus();
                            element[0].setSelectionRange(
                                element[0].value.length,
                                element[0].value.length);
                        });
                    }
                });
            }
        };
    };
})();
