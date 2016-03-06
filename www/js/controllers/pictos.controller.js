/**
 * Created by diego on 29/02/16.
 */

(function() {
    'use strict';

    angular
        .module('app')
        .controller('pictosController', pictosController);

    pictosController.$inject = ['pictEditorService','$location'];

    function pictosController(pictEditorService, $location) {

        var vm = this;

        vm.editPicto = editPicto;

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

        function editPicto(word) {
            pictEditorService.setPicto(word);
            $location.path('/pictos/edit');
        }
    }

})();