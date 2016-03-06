/**
 * Created by diego on 17/02/16.
 */
(function(){

    'use strict';

    angular
        .module('app')
        .controller('textController', textController);

    textController.$inject = ['textAnalyzer','configService','$cordovaFile','dbService'];

    function textController(textAnalyzer, configService, $cordovaFile, dbService) {

        var vm = this;
        vm.myText = [{
            'value': 'AraWord',
            'pictos': [{'picto':'25748.png', 'type':4}],
            'words': 1,
            'autofocus': true
        }];
        vm.change = change;

        configService.restoreConfig();

        vm.pictoStyle = configService.pictoStyle;
        vm.wordStyle = configService.wordStyle;
        vm.getDivStyle = configService.getDivStyle;
        vm.wordPosition = wordPosition;

        vm.readPicto = readPicto;

        if(! dbService.ready()) {
            dbService.startService();
        }

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
        }

        function wordPosition() {
            return configService.wordPosition;
        }

        function readPicto(picto) {

            document.addEventListener('deviceready', readPictHandler, false);

            function readPictHandler() {

                console.log('Reading picto.');

                var dirUrl = cordova.file.dataDirectory;
                var dirName = 'pictos';

                picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

                $cordovaFile.readAsDataURL(dirUrl+dirName+'/pictos_12', picto['picto'])
                    .then(function(success){
                        picto['base64'] = success;
                    },function(err){
                        console.log(JSON.stringify(err));
                        picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                    });
            }

        }
    }
})();