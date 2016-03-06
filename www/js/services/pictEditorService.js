/**
 * Created by diego on 29/02/16.
 */
(function() {
    'use strict';

    angular
        .module('app')
        .factory('pictEditorService', pictEditorService);

    pictEditorService.$inject = [];

    function pictEditorService() {


        var service = {
            setPicto: setPicto,
            getPicto: null
        }

        return service;

        ////////////////////////

        function setPicto(newPicto) {
           service.getPicto = newPicto;
        }
    }

})();