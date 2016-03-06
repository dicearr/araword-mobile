/**
 * Created by diego on 29/02/16.
 */
(function(){
    'use strict';

    angular
        .module('app')
        .controller('pictEditorController', pictEditorController);

    pictEditorController.$inject = ['pictEditorService'];

    function pictEditorController(pictEditorService) {

        var vm = this;

        vm.currentPicto = null;

        var picto = pictEditorService.getPicto;

        vm.currentPicto = picto;

        console.log(picto);

        ///////////

    }

})();