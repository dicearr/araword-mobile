/**
 * Created by Diego Ceresuela on 17/02/16.
 */
(function () {
    'use strict';

    angular
        .module('app')
        .factory('dbService', dbService);

    dbService.$inject = ['$cordovaSQLite','$q'];

    function dbService($cordovaSQLite, $q) {

        var db = undefined;
        var dbname = 'AraSuite.db';


        var service = {
            startService: startService,
            getCompoundsStartingWith: getCompoundsStartingWith,
            ready: ready
        };

        return service;

        ///////////////////////////////////////////////////////////////////

        function getCompoundsStartingWith(word) {

            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + word.toLowerCase() +" \%\'" +
                    "UNION SELECT * FROM ArawordView WHERE word=\'" + word.toLowerCase() +"\'";
                var compounds = [];
                var words = [];
                var emptyPicto = {'picto':'','type':'3','base64':'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='};

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    $cordovaSQLite.execute(db, query).then(function(res) {
                        for(var i = 0; i < res.rows.length; i++) {

                            var word = res.rows.item(i).word;
                            var pictoName = res.rows.item(i).name;
                            var pictoType = parseType(res.rows.item(i).type);
                            var ind = words.indexOf(word);

                            if (ind>=0) { // One word can have multiple pictos
                                compounds[ind]['pictos'].push({
                                    'picto': pictoName,
                                    'type': pictoType
                                })
                            } else {
                                words.push(word);
                                compounds.push({
                                    'word': word,
                                    'pictos': [{
                                        'picto': pictoName,
                                        'type': pictoType
                                    }, emptyPicto]
                                })
                            }
                        }
                        if (compounds.length==0) {
                            reject('NO_COMPOUNDS');
                        }
                        resolve(compounds);
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

        function parseType(typeInText) {
            if (typeInText=="nombreComun") return 0;
            else if (typeInText=="descriptivo") return 1;
            else if (typeInText=="verbo") return 2;
            else if (typeInText=="miscelanea") return 3;
            else if (typeInText=="nombrePropio") return 4;
            else { return 5; }
        }
    };

})();

