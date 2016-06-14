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

    araworddb.$inject = ['$q'];

    function araworddb($q) {

        var db = undefined;
        var dbname = 'AraSuite.db'; // Pre filled db
        var json2sqlite = {
            "data": {
                "inserts":{
                    "type":[{
                        'id': 0,
                        'name': 'nombreComun'
                    },{
                        'id': 1,
                        'name': 'descriptivo'
                    },{
                        'id': 2,
                        'name': 'verbo'
                    },{
                        'id': 3,
                        'name': 'miscelanea'
                    },{
                        'id': 4,
                        'name': 'nombrePropio'
                    },{
                        'id': 5,
                        'name': 'contenidoSocial'
                    }],
                    "language": [],
                    "main": []
                }
            }
        };

        var service = {
            startService: startService,
            getWordsStartingWith: getWordsStartingWith,
            getVerbsStartingWith: getVerbsStartingWith,
            newPicto: newPicto,
            ready: ready,
            setLang: setLang,
            createDB: createDB,
            addPictoBulk: addPictoBulk,
            executeBulk: executeBulk,
            addLanguagesBulk: addLanguagesBulk
        };

        return service;

        ///////////////////////////////////////////////////////////////////

        function createDB() {
            var deferred = $q.defer();

            var createMain = "CREATE TABLE main (word VARCHAR(50), idL INTEGER, idT INTEGER, name VARCHAR(50), nameNN VARCHAR(50));";
            var createType = "CREATE TABLE type (id INTEGER PRIMARY KEY,name VARCHAR(45) NOT NULL);";
            var createLang = "CREATE TABLE language(id INTEGER PRIMARY KEY,name VARCHAR(45) NOT NULL);";
            var createIndex = "CREATE UNIQUE INDEX main_index ON main (word, idL, idT, name, nameNN);";

            document.addEventListener('deviceready', function() {
                db.transaction(function (tx) {
                    tx.executeSql(createMain);
                    tx.executeSql(createLang);
                    tx.executeSql(createType);
                    tx.executeSql(createIndex);
                }, function(error) {
                    console.log('INIT_DB_ERROR',JSON.stringify(error));
                    deferred.reject(error);
                }, function() {
                    deferred.resolve();
                });
            });

            return deferred.promise;
        }

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
                   console.log('CREATE_VIEW_ERROR',JSON.stringify(error));
               }, function(success) {
                   console.log('CREATE_VIEW',JSON.stringify(success));
               })
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

        function addLanguagesBulk(langs) {
            langs.forEach(function(lang, ind) {
                json2sqlite.data.inserts.language.push({
                    "id": ind,
                    "name": lang
                })
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
         *
         * @param word
         * @param picto
         * @returns {*}
         */
        function newPicto(word, picto) {
            word = word.replace(/[.,]/g,'');
            return $q(function(resolve,reject) {
                var query = "INSERT INTO main(word, idL, idT, name, nameNN) VALUES(?,?,?,?)";
                var params = [word.toLowerCase(),picto.lang ,picto.type, picto.picto, picto.pictoNN];


                document.addEventListener('deviceready', executeInsert);

                function executeInsert() {
                    db.transaction(function (tx) {
                        tx.executeSql(query, params);
                    }, function(s) {
                        resolve();
                    }, function(error) {
                        reject(error);
                    })
                }
            })
        }

        function addPictoBulk(word,picto) {
            json2sqlite.data.inserts.main.push({
                'word': word,
                'idL': picto.lang,
                'idT': picto.type,
                'name': picto.picto,
                'nameNN': picto.pictoNN
            })
        }

        function executeBulk(rootDeferred) {
            var def = $q.defer();
            var successFn = function(){
                def.resolve();
            };
            var errorFn = function(error){
                def.reject(error);
            };
            var progressFn = function(current, total){
                rootDeferred.notify({
                    "lengthComputable": true,
                    "total": total,
                    "loaded": current
                });
            };
            cordova.plugins.sqlitePorter.importJsonToDb(db, json2sqlite, {
                successFn: successFn,
                errorFn: errorFn,
                progressFn: progressFn
            });
            return def.promise;
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
                console.log('QUERY',JSON.stringify(err));
                reject(err);
            });
        }

        /**
         * Opens the data base
         */
        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, location: 'default'} );
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

