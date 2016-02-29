/**
 * Created by diego on 29/02/16.
 */

(function() {
    'use strict';

    angular
        .module('app')
        .controller('pictosController', pictosController);

    pictosController.$inject = [];

    function pictosController() {
        var vm = this;

        vm.customPicts = [{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        },{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        },{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        },{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        },{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        },{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        }];
    }

})();