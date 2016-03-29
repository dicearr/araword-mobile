/**
 * Created by diego on 17/02/16.
 *
 * Main controller. Manages the whole text analysis and almost all
 * functionalities.
 */
(function(){

    'use strict';

    angular
        .module('AraWord')
        .controller('textController', textController);

    // Using $scope is not recomended, but I need $scope.$apply() in nextPicto()
    textController.$inject = ['textAnalyzer','configService',
        '$cordovaFile','araworddb','$scope',
        '$ionicPopup', 'IonicClosePopupService',
        '$cordovaSocialSharing','accessService'];

    function textController(textAnalyzer, configService,
                            $cordovaFile, araworddb,
                            $scope, $ionicPopup, IonicClosePopupService,
                            $cordovaSocialSharing, accessService) {

        var vm = this;
        vm.myText = [{
            'value': 'AraWord',
            'pictos': [{'picto':'25748.png', 'type':4}],
            'pictInd': 0,
            'words': 1,
            'autofocus': true
        }];
        vm.onChange = onChange;  // Main logic
        vm.deleteIfEmpty = deleteIfEmpty; // Deletes empty words
        // Manages double/single click by using timeout
        vm.singleClickAction = singleClickAction;

        /* Text to speech functions */
        vm.readText = readText;  // Whole text
        vm.readPicto = readPicto; // One word

        configService.restoreConfig();

        vm.pictoStyle = configService.pictoStyle;
        vm.wordStyle = configService.wordStyle;
        vm.getDivStyle = configService.getDivStyle;
        vm.wordPosition = wordPosition;
        vm.showOptions = showOptions;
        vm.typeColors = configService.typeColors;

        accessService.restoreConfig();

        vm.shareText = shareText;
        vm.access = accessService;

        if(! araworddb.ready()) {
            araworddb.startService();
        }

        //////////////

        function shareText() {

            var message = document.getElementById('text');

            html2canvas(message, {
                background: 'white',
                onrendered: function(canvas) {
                    var image = canvas.toDataURL("image/jpeg");

                    $cordovaSocialSharing
                        .share(null, null, image, null) // Share via native share sheet
                        .then(function(result) {
                            console.log(JSON.stringify(result));
                        }, function(err) {
                            console.log(JSON.stringify(err));
                        });
                }
            })
        }

        /**
         * @param word = word in which change has happened
         */
        function onChange(word) {
            // Common case, separator at the end of the text
            if (word.value.charAt(word.value.length-1)==' ') {
                textAnalyzer.addEmptyWord(word,vm.myText);
            }
            else if (word.value.length==0) {
                textAnalyzer.deleteWord(word,vm.myText);
            }
            else {
                textAnalyzer.processEvent(word, vm.myText);
            }
        }

        /**
         * @returns {wordPosition} If true text is over the image, otherwise under.
         */
        function wordPosition() {
            return configService.wordPosition;
        }

        /**
         * Reads the image from the file system.
         * @param picto = The picto we've to read.
         */
        function readPicto(picto) {

            // Digest cycles are faster than read fs so we return empty picto to avoid multiple reads
            if (!picto['base64'])
                picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

            document.addEventListener('deviceready', readPictHandler, false);

            function readPictHandler() {

                var dirUrl = cordova.file.dataDirectory;
                var dirName = 'pictos';

                $cordovaFile.readAsDataURL(dirUrl+dirName+'/pictos_12', picto['picto'])
                    .then(function(success){
                        picto['base64'] = success;
                    },function(){
                        picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                    });
            }

        }

        /**
         * $scope.$apply() used to troubleshoot singleActionClick()
         * @param word = The word whose picto must change.
         */
        function nextPicto(word) {
            word.pictInd = (word.pictInd+1)%word.pictos.length;
            $scope.$apply();
        }

        /**
         * If the word is empty, it will be deleted
         * @param word = The word that must be checked.
         */
        function deleteIfEmpty(word) {
            if (word.value.length==0) textAnalyzer.delteWord(word, vm.myText);
        }

        /**
         * Reads a word
         * @param word = The word to be read.
         */
        function readWord(word) {
            TTS.speak({
                text: word.value,
                locale: 'es-ES',
                rate: 0.75
            }, function() {
                TTS.speak('');
            }, function() {
                TTS.speak('');
            })
        }

        // Used in singleClickAction to manage double clicks
        var waitingForSecondClick = false;
        var executingDoubleClick = false;

        /**
         * Manages single/double click changin the image or reading the text
         * depending on the event.
         * @param word = The word which has been clicked.
         * @returns {*} void
         */
        function singleClickAction(word) {
            var myWord = word;

            executingDoubleClick = false;
            if (waitingForSecondClick) {
                executingDoubleClick = true;
                waitingForSecondClick = false;
                return doubleClickAction(myWord);
            }
            waitingForSecondClick = true;

            setTimeout(function() {
                waitingForSecondClick = false;
                return singleClickOnlyAction(myWord, executingDoubleClick);
            }, 270); // delay
        }

        /**
         * SingleClick callback
         * @param word = the word which has been clicked
         * @param executingDoubleClick = true if doble click occurs during the timeout
         */
        function singleClickOnlyAction(word, executingDoubleClick) {
            if (executingDoubleClick) return;
            nextPicto(word)
        }

        /**
         * DoubleClick callback
         * @param word  = the word which has been double clicked
         */
        function doubleClickAction(word) {
            readWord(word);
        }

        /**
         * Concatenates the full text and reads it.
         */
        function readText() {
            var text = '';
            for(var i=0; i<vm.myText.length; i++){
                text += vm.myText[i].value;
            }

            TTS.speak({
                text: text,
                locale: 'es-ES',
                rate: 0.75
            }, function() {
                TTS.speak('');
            }, function() {
                TTS.speak('');
            })
        }

        function showOptions(word) {
           var myPopup =  $ionicPopup.show({
                templateUrl: 'templates/popups/pictos.html',
                title: 'Options',
                scope: $scope
            });
            $scope.myPopup = myPopup;
            IonicClosePopupService.register(myPopup);
        }

        vm.test = test;
        $scope.test = test;
        function test() {
            console.log('test');
            if (!angular.isUndefined($scope.myPopup)) {
                $scope.myPopup.close();
            }
        }

    }
})();