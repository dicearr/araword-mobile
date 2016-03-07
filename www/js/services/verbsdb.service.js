/**
 * Created by diego on 6/03/16.
 */

(function() {
    'use strict';

    angular
        .module('AraWord')
        .factory('verbsdb',verbsdb);

    verbsdb.$inject = ['$q','$cordovaSQLite'];

    function verbsdb($q, $cordovaSQLite) {

        var db = undefined;
        var dbname = 'Castellano_verbs.db';

        var service = {
            startService: startService,
            getInfinitive: getInfinitive,
            ready: ready
        };

        return service;

        //////////

        function getInfinitive(verb) {
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM verbs WHERE form=\'" + verb.toLowerCase() +"\'";
                var result = undefined;

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    $cordovaSQLite.execute(db, query).then(function(res) {
                        for(var i = 0; i < res.rows.length; i++) {
                            result = res.rows.item(0).verb;
                        }
                        if (angular.isUndefined(result)) {
                            reject('NO_VERB');
                        }
                        resolve(result);
                    }, function (err) {
                        reject(err);
                    });
                }

            });
        }

        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, createFromLocation: 1} );
            }
        }

        function ready() {
            return !angular.isUndefined(db);
        }
    }
})();
