/**
 * Created by diego on 28/03/16.
 */
(function (){
    'use strict';

    angular
        .module('AraWord')
        .controller('navController', navController);

    navController.$inject = ['$ionicPopover','$scope','accessService'];

    function navController($ionicPopover, $scope, accessService) {

        var vm = this;
        vm.showMenu = showMenu;
        vm.showSubMenu = showSubMenu;
        vm.closeMenus = closeMenus;

        $ionicPopover.fromTemplateUrl('templates/popovers/dropdown.html', {
            scope: $scope
        }).then(function(popover){
            $scope.menu = popover;
        });

        $ionicPopover.fromTemplateUrl('templates/popovers/securityOptions.html', {
            scope: $scope
        }).then(function(popover){
            $scope.subMenu = popover;
        });

        vm.acc = accessService;

        ///////////////

        function showMenu(event) {
            $scope.menu.show(event);
        }

        function showSubMenu() {
            $scope.subMenu.show(angular.element(document.querySelector('.posit')));
        }

        function closeMenus() {
            $scope.subMenu.hide();
            $scope.menu.hide();
        }

    }

})();