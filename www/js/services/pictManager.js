/**
 * Created by diego on 22/02/16.
 */
(function(){
    'use strict';

    angular.module('app')
        .factory('pictManager', pictManager);

    pictManager.$inject = ['dbService','$cordovaFile','$q'];

    function pictManager(dbService, $cordovaFile, $q) {

        var dirName = 'pictos';

        var service = {
            startService: startService,
            getPictPaths: getPictPaths
        };

        return service;

        //////////////

        function startService() {
            if(!dbService.ready()) {
                dbService.startService();
            }
        };

        function getPictPaths(word) {

            return $q(function(resolve,reject) {
                document.addEventListener('deviceready', getPictsPathsHandler, false);

                function getPictsPathsHandler() {
                    var dirUrl = cordova.file.dataDirectory;

                    dbService.getPictographs(word)
                        .then(function(pictNames) {
                            var paths = [];
                            pictNames.forEach(function(name) {
                                $cordovaFile.readAsDataURL(dirUrl+dirName+'/pictos_12',name)
                                    .then(function(success){
                                        paths.push(success);
                                    },function(error){
                                        console.log('[E] '+JSON.stringify(error));
                                    });
                            });
                            resolve(paths);
                        }, function(err) {
                            reject(err);
                        });
                }
            });
        };

    };
})();
