/**
 * Created by diego on 23/02/16.
 */

(function(){
    'use strict';

    angular
        .module('app')
        .factory('textAnalyzer', textAnalyzer);

    textAnalyzer.$inject = ['dbService','$q','verbsDB'];

    function textAnalyzer(dbService, $q, verbsDB){

        var radius = 3;
        var caretPosition = 0;
        var emptyPicto = {'picto':'','type':'3','base64':'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='};

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            setCaret: setCaret,
            delteWord: deleteWord,
            addEmptyWord: addEmptyWord
        };

        if(!verbsDB.ready()) {
            verbsDB.startService();
        }

        return service;

        //////////////////////////////

        function processEvent(w, text) {

            var wordPosition = text.indexOf(w);
            var textContext = [];

            textContext = getTextContext(wordPosition, radius);
            var wordsInContext = textContext.words;
            var wordsValuesInContext = wordsInContext.map(function(word) {
                if (!angular.isUndefined(word)) return word.value.toLowerCase();
            });

            var promises = [];
            var results = [];

            wordsInContext.forEach(function(simpleWord) {
                var inf = undefined;
                promises.push(
                    $q(function(resolve) {
                        var promise = verbsDB.getInfinitive(simpleWord.value)
                            .then(function(infinitive){
                                inf = infinitive;
                                return dbService.getCompoundsStartingWith(infinitive);
                            }, function() {
                                return dbService.getCompoundsStartingWith(simpleWord.value);
                            });

                        promise
                            .then(function(compounds) {
                                if (!angular.isUndefined(inf)) {
                                    wordsValuesInContext.splice(simpleWord.position,1,inf);
                                }
                                var text = wordsValuesInContext.slice(simpleWord.position, wordsValuesInContext.length).join(' ');
                                var match = {
                                    'value': simpleWord.value,
                                    'pictos': [emptyPicto],
                                    'autofocus': false,
                                    'pictInd': 0,
                                    'words': 1
                                };
                                for(var i=0; i<compounds.length; i++) {
                                    var comp = compounds[i];
                                    var len = comp.word.length;
                                    if (text.indexOf(comp.word)==0 &&
                                        (text.charAt(len)==' ' ||
                                        (text.length <= len))) {
                                        var newLength = comp.word.split(' ').length;
                                        if (match == null || newLength >= match.words) {
                                            match = {
                                                //Allows Upper Case in text, com.word is lower case
                                                'value': newLength==1?simpleWord.value:comp.word,
                                                'pictos': comp.pictos.concat(emptyPicto),
                                                'autofocus': false,
                                                'pictInd': 0,
                                                'words': newLength
                                            };
                                        }
                                    }
                                }
                                results[simpleWord.position] = match;
                                resolve();
                            }, function () {
                                results[simpleWord.position] = {
                                    'value': simpleWord.value,
                                    'pictos': [emptyPicto],
                                    'autofocus': false,
                                    'pictInd': 0,
                                    'words': 1
                                };
                                resolve();
                            });
                        })
                    );
                });

            $q.all(promises).then(function() {
                for(var i=0; i<results.length; i++) {
                    var pos = textContext.minIndex;
                    if (pos<text.length && !equals(results[i],text[pos])) {
                        if (results[i].words>1) {
                            text.splice(textContext.minIndex,results[i].words,results[i]);
                            i = i + results[i].words - 1;
                        } else {
                            text[pos].value = results[i].value;
                            text[pos].pictos = results[i].pictos;
                            text[pos].autofocus = false;
                            text[pos].words = 1;
                        }
                    } else if (pos>=text.length) {
                        text.push(results[i]);
                        i = i + results[i].words - 1;
                    }
                    textContext.minIndex++;
                }
                setCaret(text,textContext.minIndex-1);
            });

            function getTextContext(pos, rad) {
                var minIndex = 0;
                var maxIndex = text.length-1;

                if (pos-rad>0) { minIndex = pos-rad; }
                if (pos+rad<maxIndex) { maxIndex = pos+rad; }

                var words = [];
                var j = 0;

                for(var i=minIndex; i<maxIndex+1; i++) {
                    if (i==pos || text[i].words == 1) { // Compound word is made by simple words
                        text[i].value.split(' ').forEach(function(simpleWord) { // But changed word could be compound
                            words.push({
                                'value': simpleWord,
                                'position': j
                            });
                            j++;
                        });
                    } else if (i<pos && text[i].words > 1) { // We do not break previous compound words
                        words = []; j = 0; minIndex = i+1;
                    } else if (i>pos && text[i].words > 1) { // We do not consider later compound words
                        var aux = i;
                        i = maxIndex+1; maxIndex = aux-1;
                    }
                }

                return {
                    'minIndex': minIndex,
                    'maxIndex': maxIndex,
                    'words': words
                };
            }

            /**
             * Compare two pictos
             * @param pic1
             * @param pic2
             * @returns {boolean}
             */
            function equals(pic1, pic2) {
                if (pic1.value != pic2.value) return false;
                if (pic1.pictos.length != pic2.pictos.length) return false;
                else {
                    for (var i=0; i<pic1.pictos.length; i++) {
                        if (pic1.pictos[i].name != pic2.pictos[i].name) return false;
                    }
                    return true;
                }
            }
        }


        /**
         *
         * @param w
         * @param text
         */
        function deleteWord(w, text) {
            var pos = text.indexOf(w);
            if (pos > -1 && text.length>1 ) {
                text.splice(pos, 1);
            }
            setCaret(text, pos==0?pos:pos-1);
        }

        /**
         *
         * @param text
         */
        function setCaret(text, newCaretPosition) {
            // Can be a deleted word because of a compound
            if (!angular.isUndefined(text[caretPosition])) {
                text[caretPosition].autofocus = false;
            }
            text[newCaretPosition].autofocus = true;
            caretPosition = newCaretPosition;
        }

        function addEmptyWord(word, text) {
            word.value = word.value.substring(0,word.value.length-1);
            var pos = text.indexOf(word)+1;
            text.splice(pos,0,{
                'value': '',
                'pictos': [emptyPicto],
                'pictInd': 0,
                'words': 1
            });
            setCaret(text, pos);
        }

    }
})();
