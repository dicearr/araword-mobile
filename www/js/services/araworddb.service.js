/**
 * Created by Diego Ceresuela on 17/02/16.
 *
 * Manages AraWord data base queries.
 */
(function () {
    'use strict';

    angular
        .module('AraWord')
        .factory('araworddb', araworddb);

    araworddb.$inject = ['$cordovaSQLite','$q','accessService'];

    function araworddb($cordovaSQLite, $q, accessService) {

        var db = undefined;
        var db = undefined;
        var dbname = 'AraSuite.db'; // Pre filled db


        var service = {
            startService: startService,
            getWordsStartingWith: getWordsStartingWith,
            getVerbsStartingWith: getVerbsStartingWith,
            newPicto: newPicto,
            ready: ready,
            setLang: setLang
        };

        return service;

        ///////////////////////////////////////////////////////////////////

        function setLang(lang) {
            var langs = ['es','en','fr','cat','it','ger','pt','br','gal','eus'];
            var idL = langs.indexOf(lang);

            var query1 = "DROP VIEW IF EXISTS ArawordView";
            var query2 = "CREATE VIEW ArawordView AS SELECT M.word word, T.name type, M.name name FROM main M, type T WHERE M.idT = T.id AND M.idL = \'" + idL + "\' ORDER BY word";


            document.addEventListener('deviceready', function() {
               db.transaction(function (tx) {
                  tx.executeSql(query1);
                  tx.executeSql(query2);
               }, function(error) {
                   console.log('transaction error: ' + error.message);
               }, function() {
                   console.log('transaction ok');
               });
            });
        }

        /**
         * Searches all the words that starts with the given word.
         * @param word = The word to search.
         * @returns {*} Promise
         */
        function getWordsStartingWith(word) {
            word = word.replace(/[.,]/g,'');
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + word.toLowerCase() +" \%\'" +
                    " UNION SELECT * FROM ArawordView WHERE word=\'" + word.toLowerCase() +"\'";
                var compounds = [];
                var words = [];

                document.addEventListener('deviceready', function() {
                    executeQuery(compounds, words, query, resolve, reject);
                }, false);

            });
        }

        /**
         * Searches all the verbs that starts with the given form or it's infinitive.
         * @param form = Formed verb.
         * @param infinitive = verb in infinitive
         * @returns {*} Promise
         */
        function getVerbsStartingWith(form, infinitive) {
            form = form.replace(/[.,]/g,'');
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + form.toLowerCase() +" \%\'" +
                    " UNION SELECT * FROM ArawordView WHERE word=\'" + form.toLowerCase() +"\'" +
                    " UNION SELECT * FROM ArawordView WHERE word like \'" + infinitive.toLowerCase() +" \%\'" +
                    " UNION SELECT * FROM ArawordView WHERE word=\'" + infinitive.toLowerCase() +"\'";

                var compounds = [];
                var words = [];

                document.addEventListener('deviceready', function() {
                    executeQuery(compounds, words, query, resolve, reject);
                }, false);

            });
        }

        /**
         * Allows you to add new pictograph to the database
         * @param word {{ Word }}
         * @param picto {{ [ 'type':1, 'picto':'foo_bar.jpeg', 'lang':1 ] }}
         * @returns {promise}
         */
        function newPicto(word,picto) {
            word = word.replace(/[.,]/g,'');
            return $q(function(resolve,reject) {
                var query = "INSERT INTO main(word, idL, idT, name, nameNN) VALUES(?,?,?,?)";
                var params = [word.toLowerCase(),picto.lang ,picto.type, picto.picto, picto.pictoNN];

                document.addEventListener('deviceready', executeInsert);

                function executeInsert() {
                    $cordovaSQLite.execute(db,query,params)
                        .then(function() {
                            return resolve();
                        }, function(error) {
                            return reject();
                        })
                }
            })
        }

        /**
         * Executes a query
         * @param compounds = vector where compound words will be pushed
         * @param words = vector where words will be pushed
         * @param query = query to be executed
         * @param resolve = promise resolve
         * @param reject = promise reject
         */
        function executeQuery(compounds, words, query, resolve, reject) {
            db.executeSql(query,[],function(res) {
                for(var i = 0; i < res.rows.length; i++) {
                    var word = res.rows.item(i).word;
                    var pictoName = res.rows.item(i).name;
                    var pictoType = parseType(res.rows.item(i).type);
                    var ind = words.indexOf(word);

                    // If its a pictograph from a previous word we do not
                    // create a new word. We simply add the picto to the
                    // previously created word.
                    if (ind>=0) {
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
                            }]
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

        /**
         * Opens the data base
         */
        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, createFromLocation: 1, location: 'default'} );
            }
        }

        /**
         * @returns {boolean} True if data base has been opened, otherwise false.
         */
        function ready() {
            return !angular.isUndefined(db);
        }

        /**
         * @param typeInText = { nombreComun, descriptivo, verbo, miscelanea, nombrePropio, contenidoSocial }
         * @returns {number} = Returns a unique identifier for each type of word.
         */
        function parseType(typeInText) {
            var types = ['nombreComun','descriptivo','verbo','miscelanea','nombrePropio','contenidoSocial'];
            return types.indexOf(typeInText);
        }

    };

})();

