/**
 * Created by diego on 17/02/16.
 */
(function(){

    'use strict';

    angular
        .module('app')
        .controller('textController', textController);

    textController.$inject = ['textAnalyzer'];

    function textController(textAnalyzer) {

        var vm = this;
        vm.myText = [{
            'value': 'AraWord',
            'pictos': ['img/logo.png'],
            'words': 1,
            'autofocus': true
        }];
        vm.change = change;

        //////////////


        /**
         * Executed when text changes.
         * @param w = word that has changed.
         */
        function change(w, event) {
            if (w.value.length==0 && event.keyCode == 8) {
                textAnalyzer.deleteWord(w,vm.myText);
            } else {
                textAnalyzer.processEvent(w, vm.myText, event);
            }
        };
    }
})();