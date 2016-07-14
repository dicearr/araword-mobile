/**
 * Created by diego on 23/02/16.
 *
 * Manages changes in the text. Uses databases to get pictographs
 * and insert them into their words.
 */

(function(){
    'use strict';

    angular
        .module('AraWord')
        .factory('textAnalyzer', textAnalyzer);

    textAnalyzer.$inject = ['araworddb','$q','verbsdb'];

    function textAnalyzer(araworddb, $q, verbsdb){

        var radius = 3;
        var caretPosition = 0;
        var emptyPicto = {'picto':'','type':'3','base64':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8/58BAzAOZUEA5OUT9xiCXfgAAAAASUVORK5CYII='};
        var text = [];
        var errors = [];

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            setCaret: setCaret,
            addEmptyWord: addEmptyWord,
            text: text,
            errors: errors,
            radius: radius,
            docName: ''
        };

        if(!verbsdb.ready()) {
            verbsdb.startService();
        }

        return service;

        //////////////////////////////

        /**
         * Modifies the tex by changing the words if it's required. For example
         * it detects new compound words.
         * @param w = The word that has been changed
         * @param text = The whole text
         * @param {Boolean} noPrevious - True means algorithm will not analyze previous words to look for compounds.
         */
        function processEvent(w, text, noPrevious) {

            var deferred = $q.defer();
            var ctx = {
                'values': [],
                'ids': [],
                'strings': [],
                'min': 0,
                'max': 0
            };
            initializeContext(ctx, text.indexOf(w));

            var promises = [], finalResult = [];
            ctx.values.forEach(function(word, position) {
                var defer = $q.defer();
                promises.push(defer.promise);
                var infinitives = undefined;
                var sanitized = sanitize(word);
                verbsdb.getInfinitive(sanitized)
                    .then(getVerbs, getWords)
                    .then(function(results) {
                        if (!results) {
                            finalResult.push({
                                'id': w.id,
                                'value': word,
                                'pictos': [emptyPicto],
                                'autofocus': false,
                                'pictInd': 0,
                                'words': 1
                            });
                        } else {
                            // If there are many verbs we've to generate all the sentences
                            // for each infinitive form.
                            if (!angular.isUndefined(infinitives)) {
                                generateStrings(ctx, infinitives, position);
                            }
                            ctx.strings.push(
                                ctx.values.slice(position, ctx.values.length)
                                    .map(sanitize).join(' ')
                                    .trim()
                            );

                            var finalWord = {
                                'id': ctx.ids[position],
                                'value': word,
                                'pictos': [emptyPicto],
                                'autofocus': false,
                                'pictInd': 0,
                                'words': 1
                            };

                            //It will select the biggest compound that matches with our strings
                            results.forEach(function(tentative) {
                                ctx.strings.forEach(function(str) {
                                    var tentativeValue = tentative.word;
                                    var tentativeLength = tentativeValue.split(' ').length;
                                    if (str.indexOf(tentativeValue)==0 ) {
                                        if (tentativeLength > finalWord.words) {
                                            var isInfinitive = infinitives && infinitives.indexOf(tentativeValue)!=-1;
                                            finalWord.value = isInfinitive?word:tentativeValue;
                                            finalWord.pictos = tentative.pictos;
                                            finalWord.words = tentativeLength;
                                        } else if (tentativeLength == finalWord.words) {
                                            finalWord.pictos = tentative.pictos.concat(finalWord.pictos);
                                        }
                                    }
                                })
                            });

                            finalResult.push(finalWord);
                            ctx.strings = [];
                        }

                        defer.resolve();

                    }, function() {
                        finalResult.push({
                            'id': getId(),
                            'value': word,
                            'pictos': [emptyPicto],
                            'autofocus': false,
                            'pictInd': 0,
                            'words': 1
                        });
                        defer.resolve();
                    });

                function getVerbs(inf) {
                    infinitives = inf;
                    return araworddb.getVerbsStartingWith(sanitized, inf)
                }

                function getWords() {
                    return araworddb.getWordsStartingWith(sanitized);
                }
            });

            $q.all(promises)
                .then(function() {
                    deferred.resolve({
                        'result': finalResult,
                        'context': ctx
                    });
                }, function(s) {
                    console.log('REJECT',JSON.stringify(s));
                });

            return deferred.promise;


            function sanitize(word) {
                return word.replace(/[.,:;]/g,'').toLowerCase().trim();
            }

            function initializeContext(ctx, pos) {
                var min = pos-radius>=0?pos-radius:0;
                var max = pos+radius<text.length?pos+radius:text.length-1;
                if (noPrevious) min = pos;
                for (var i=min; i<max+1; i++) {
                    if (text[i].value && (i==pos || (
                        text[i].words == 1
                        && text[i].value.length>0
                        && !text[i].unbind))
                    ) { // Compound word is made only by simple words
                        text[i].value.split(' ').forEach(function(simpleWord) { // But changed word could be compound
                            if (simpleWord) ctx.values.push(simpleWord);
                        });
                        if (text[i].words>1) {
                            for(var j=0; j<text[i].words; j++) {
                                ctx.ids.push(getId());
                            }
                        } else {
                            ctx.ids.push(text[i].id);
                        }
                    } else if (i<pos) { // We do not break previous compound words
                        ctx.values = []; min = i+1;
                        ctx.ids = [];
                    } else if (i>pos) { // We do not consider later compound words
                        var aux = i;
                        i = max+1; max = aux-1;
                    }
                }
                ctx.min = min; ctx.max = max;
            }

            function generateStrings(ctx, infinitives, position) {
                var values = ctx.values.slice(position).map(sanitize);
                var text = values.join(" ").trim();
                if (infinitives.length>0) {
                    infinitives.forEach(function(inf) {
                        ctx.strings.push(text.replace(values[0],inf));
                    })
                } else {
                    ctx.strings.push(text);
                }
            }

        }


        /**
         * @param w = The word to be deleted.
         * @param text = The whole text.
         */
        function deleteWord(w, text) {
            var pos = text.indexOf(w);
            if (pos > -1 && text.length>1 ) {
                text.splice(pos, 1);
            } else if (pos==0) {
                text[pos]['pictos'][0] = emptyPicto;
                text[pos]['pictInd'] = 0;
            }
            setCaret(text, pos<=0?text.length-1:pos-1);
        }

        /**
         *
         * @param text
         * @param newCaretPosition
         */
        function setCaret(text, newCaretPosition) {
            // Can be a deleted word because of a compound
            if (!angular.isUndefined(text[caretPosition])) {
                text[caretPosition].autofocus = false;
            }
            text[newCaretPosition].autofocus = true;
            caretPosition = newCaretPosition;
        }

        /**
         * Inserts an empty word next to the given word.
         * @param word = The previous word
         * @param text = The whole text
         */
        function addEmptyWord(word, text) {

            var pos = text.indexOf(word)+1;

            text.splice(pos,0,{
                'id': getId(),
                'value': '',
                'pictos': [emptyPicto],
                'pictInd': 0,
                'words': 1
            });

            setCaret(text, pos);
        }

        function getId() {
            // Math.random should be unique because of its seeding algorithm.
            // Convert it to base 36 (numbers + letters), and grab the first 9 characters
            // after the decimal.
            return '_' + Math.random().toString(36).substr(2, 9);
        }

    }
})();
