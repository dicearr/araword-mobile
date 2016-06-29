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
        var emptyPicto = {'picto':'','type':'3','base64':'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='};
        var text = [];
        var errors = [];

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            setCaret: setCaret,
            addEmptyWord: addEmptyWord,
            text: text,
            errors: errors,
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
            var wordPosition = text.indexOf(w);
            var textContext = [];
            textContext = getTextContext(wordPosition, radius);
            // Words in context ar objects like { 'value': 'AraWord', 'position': 0 }
            var wordsInContext = textContext.words;
            // We have to parse it and obtain 'values'
            var wordsValuesInContext = wordsInContext.map(function(word) {
                if (!angular.isUndefined(word)) return word.value.toLowerCase();
            });

            var promises = [];
            var results = [];

            // Each word in context is the beginning of a simple/compound word so
            // we search the greatest word in the database that starts with our word.
            // For each result we store the word and the position in an array then we will select
            // only the words that we need.
            wordsInContext.forEach(function(simpleWord) {
                var inf = undefined;
                promises.push(
                    $q(function(resolve) {
                        // If it's a verb we have to use the infinitive instead of the given form
                        var promise = verbsdb.getInfinitive(simpleWord.value.replace(/[.,]/g,''))
                            .then(function(infinitive){
                                inf = infinitive;
                                return araworddb.getVerbsStartingWith(simpleWord.value, inf);
                            }, function() {
                                return araworddb.getWordsStartingWith(simpleWord.value);
                            });

                        promise
                            .then(function(compounds) {
                                // We concatenate all the words in a simple String so as to can compare database
                                // results and know if our text contains any compound word.
                                var nextWordsValues = wordsValuesInContext.slice(simpleWord.position, wordsValuesInContext.length);
                                var text = nextWordsValues.join(' ').replace(/[.,]/g,'');
                                var match = {
                                    'value': simpleWord.value,
                                    'pictos': [emptyPicto],
                                    'autofocus': false,
                                    'pictInd': 0,
                                    'words': 1
                                };
                                // We loop over the results so as to find the longest word that
                                // matches with our word
                                for(var i=0; i<compounds.length; i++) {
                                    var comp = compounds[i];
                                    var len = comp.word.length;
                                    var inftext = text.replace(nextWordsValues[0],inf);

                                    // If it's a verb compound can start with it's infinitive form
                                    var isVerbAndInfMatches = (!angular.isUndefined(inf)
                                        && inftext.indexOf(comp.word)==0);
                                    if ((text.indexOf(comp.word)==0 || isVerbAndInfMatches )
                                            && ((!angular.isUndefined(inf) && (inftext.charAt(len)==' ' || inftext.charAt(len)==''))
                                                || text.charAt(len)==' ' || (text.length <= len))) {
                                        var newLength = comp.word.split(' ').length;
                                        // If matches and it's longest we replace match with the new compound word
                                        if (match == null || newLength >= match.words ) {
                                            if (isVerbAndInfMatches && newLength>1) {
                                                comp.word = comp.word.replace(inf,simpleWord.value);
                                            }
                                            if (newLength>match.words) {
                                                match.pictos = [emptyPicto];
                                            }
                                            match = {
                                                //Allows Upper Case in text, com.word is lower case
                                                'value': newLength==1?simpleWord.value:comp.word,
                                                'pictos': comp.pictos.concat(match.pictos),
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
                                // If word it's not in our database we use empty pictograph
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

            // Resutls looks like
            // [ {'value': 'de color', 'words': 2, 'pictos': [*]}, {'value': 'color', 'words': 1, 'pictos': [*]} ]
            $q.all(promises).then(function() {
                var pushed = false;
                for(var i=0; i<results.length; i++) {
                    var pos = textContext.minIndex;
                    // If we've to change the word
                    if (pos<text.length && !equals(results[i],text[pos])) {
                        // If word it's compound we remove all the simple words
                        // that are included in the compound word
                        // and we push the new compund word
                        if (results[i].words>1) {
                            text.splice(textContext.minIndex,results[i].words,results[i]);
                            i = i + results[i].words - 1;
                        }
                        // If not we simply modify simple word values
                        else {
                            text[pos].value = results[i].value;
                            text[pos].pictos = results[i].pictos;
                            text[pos].autofocus = false;
                            text[pos].words = 1;
                            text[pos].divStyle = null;
                        }
                    }
                    // If due to a compound word we have reduced the text size
                    // we cannot access old text[pos] items so we simply push new
                    // words at the end.
                    else if (pos>=text.length) {
                        pushed=true;
                        text.push(results[i]);
                        i = i + results[i].words - 1;
                    }
                    textContext.minIndex++;
                }
                if (pushed) {
                    setCaret(text, text.length-1);
                }
                deferred.resolve();
            }, deferred.reject );

            /**
             * Returns the range of words from the text that must be re-analyzed.
             * @param pos = Position in which change has happened.
             * @param rad = Radius of analysis.
             * @returns {{minIndex: number, maxIndex: number, words: Array}}
             */
            function getTextContext(pos, rad) {
                var minIndex = 0;
                var maxIndex = text.length-1;

                if (pos-rad>0) {
                    if (noPrevious) {
                        minIndex = pos;
                    } else {
                        minIndex = pos-rad;
                    }
                }
                if (pos+rad<maxIndex) { maxIndex = pos+rad; }

                var words = [];
                var j = 0;

                for(var i=minIndex; i<maxIndex+1; i++) {
                    if (i==pos || (text[i].words == 1 && text[i].value.length>0)) { // Compound word is made only by simple words
                        text[i].value.split(' ').forEach(function(simpleWord) { // But changed word could be compound
                            words.push({
                                'value': simpleWord,
                                'position': j
                            });
                            j++;
                        });
                    } else if (i<pos) { // We do not break previous compound words
                        words = []; j = 0; minIndex = i+1;
                    } else if (i>pos) { // We do not consider later compound words
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
             * Compares two pictographs.
             * @param pic1 = first pictograph.
             * @param pic2 = second pictograph.
             * @returns {boolean} True if pic1 is equal to pic2, otherwise false.
             */
            function equals(pic1, pic2) {
                if (pic1.value != pic2.value) return false;
                if (pic1.pictos.length != pic2.pictos.length) return false;
                else {
                    for (var i=0; i<pic1.pictos.length; i++) {
                        if (pic1.pictos[i].picto != pic2.pictos[i].picto) return false;
                    }
                    return true;
                }
            }

            return deferred.promise;
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
                'value': '',
                'pictos': [emptyPicto],
                'pictInd': 0,
                'words': 1
            });
            setCaret(text, pos);
        }

    }
})();
