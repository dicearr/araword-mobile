/**
 * Created by diego on 28/03/16.
 */
(function (){
    'use strict';

    angular
        .module('AraWord')
        .controller('navController', navController);

    navController.$inject = ['$ionicPopover','$scope','accessService','$ionicPopup','$window'];

    function navController($ionicPopover, $scope, accessService, $ionicPopup, $window) {

        var vm = this;
        vm.showMenu = showMenu;
        vm.showSubMenu = showSubMenu;
        vm.closeMenus = closeMenus;
        vm.login = login;

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
            if (!vm.acc.logged) {
                login(function() {
                    $scope.subMenu.show(angular.element(document.querySelector('.posit')));
                });
            } else {
                $scope.subMenu.show(angular.element(document.querySelector('.posit')));
            }
        }

        function closeMenus() {
            $scope.subMenu.hide();
            $scope.menu.hide();
        }

        function login(callback) {

            vm.pass = '';

            var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="nav.pass">',
                title: 'Enter Password',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>Save</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!vm.pass) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                var mainPass = $window.localStorage['mainPass'];
                                if (vm.pass === mainPass) {
                                    vm.acc.logged = true;
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        }
                    }
                ]
            });

            myPopup.then(function(res){
                if(res) {
                    $ionicPopup.alert({
                            title: 'WARNING!!',
                            template: 'Now you are in admin mode, rememeber to restart the app so as to come back user mode.'
                    });
                    callback();
                }
            });
        }

    }

})();