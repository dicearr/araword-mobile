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
                        .then(function(wordInfo) {
                            var paths = [];
                            wordInfo.forEach(function(picto) {
                                $cordovaFile.readAsDataURL(dirUrl+dirName+'/pictos_12',picto['picto'])
                                    .then(function(success){

                                        var type = null;
                                        if (picto['type']=="nombreComun") type = 0;
                                        else if (picto['type']=="descriptivo") type = 1;
                                        else if (picto['type']=="verbo") type = 2;
                                        else if (picto['type']=="miscelanea") type = 3;
                                        else if (picto['type']=="nombrePropio") type = 4;
                                        else { type = 5; }

                                        paths.push({
                                            'picto': success,
                                            'type': type
                                        });

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
