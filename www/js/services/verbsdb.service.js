/**
 * Created by diego on 6/03/16.
 *
 * Manages the verbs database.
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

        /**
         * Returns the infinitive of a given formed verb.
         * @param verb {{ Formed verb }}
         * @returns {[String]}
         */
        function getInfinitive(verb) {
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM verbs WHERE form=\'" + verb.toLowerCase() +"\'";
                var result = undefined;

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    db.executeSql(query, [], function(res) {
                        console.log(JSON.stringify(res));
                        for(var i = 0; i < res.rows.length; i++) {
                            result = res.rows.item(0).verb;
                        }
                        if (angular.isUndefined(result)) {
                            reject('NO_VERB');
                        }
                        resolve(result);
                    }, function (err) {
                        console.log(JSON.stringify(err));
                        reject(err);
                    });
                }

            });
        }

        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, createFromLocation: 1, location: 'default' }, function(tx) {}, function(err) {
                    console.log(JSON.stringify(err));
                });
                console.log(JSON.stringify(db));
            }
        }

        function ready() {
            return !angular.isUndefined(db);
        }
    }
})();
