
function itemArrayToString(itemArray)
{
    var itemToString = "";

    for (var i = 0; i < itemArray.length; i++) {
        itemToString += i + " : [ " + itemArray[i].fr + " ; " + itemArray[i].ro + "]\n";
    }

    return itemToString;
}

function displayutf8(str)
{
    console.log("utf8 : ");
    for (var i = 0; i < str.length; i++) {
        console.log(" " + str.charCodeAt(i) + " ");
    }
}

function TestItem(jsonTreeItem) {
    //function TestItem(valueRo, valueFr) {

    this.selected = false;

    this.chance = 1;

    // todo prévoir les ()
    this.fr = jsonTreeItem.fr.split(',');
    this.ro = jsonTreeItem.ro.split(',');    

    this.select = function()
    {
        this.selected = true;
    };

    this.unSelect = function()
    {
        this.selected = false;
    };

    this.isSelected = function()
    {
        return this.selected;
    };

    this.getQuestion = function(frToRo)
    {
        if (frToRo)
        {
            return this.fr;
        }
        else
        {
            return this.ro;
        }
    };

    this.getAnswer = function(frToRo)
    {

        return this.getQuestion(!frToRo);

    };

    this.compareWithSolution = function(frToRo, valueRoToCompare)
    {
        for (var i = 0; i < this.getAnswer(frToRo).length; i++) {

            var rocomp = this.getAnswer(frToRo)[i].toLowerCase().replace(/[?!.-]/g, " ").trim().replace(/[ ]+/g, " ");
            //displayutf8(rocomp);

            var roanswercomp = valueRoToCompare.toLowerCase().replace(/[?!.-]/g, " ").trim().replace(/[ ]+/g, " ");
            //displayutf8(rocomp);
            if (rocomp == roanswercomp)
            {
                return true;
            }
        }
        return false;
    };

    this.addChance = function()
    {
        this.chance += 1;
    };

    this.substractChance = function()
    {
        var newChance = this.chance - 2;

        if (newChance < 1)
        {
            this.chance = 1;
        }
        else
        {
            this.chance = newChance;
        }
    };
    
    this.resetChance = function()
    {
        this.chance = 1;
    };

}

// le test
function Quizz(buttonOkId, buttonSwitch, quizzJsTreeId, jsonResult, textPreviousQuestionId, textPreviousAnswerId, textQuestionId, inputAnswerId, textPreviousQuestionRightAnswerId, labelReponseCorrecteId, textScore) {

    // *** les objets ***    

    var myQuizz = this;
    this.buttonSwitch = buttonSwitch;

    // html elements
    this.textPreviousQuestion = document.getElementById(textPreviousQuestionId);
    this.textPreviousAnswer = document.getElementById(textPreviousAnswerId);
    this.textPreviousQuestionRightAnswer = document.getElementById(textPreviousQuestionRightAnswerId);
    this.labelReponseCorrecte = document.getElementById(labelReponseCorrecteId);
    //this.imageResult=document.getElementById(imageResultId);	
    this.textQuestion = document.getElementById(textQuestionId);
    this.inputAnswer = document.getElementById(inputAnswerId);
    this.textScore = textScore;
    this.buttonOk = $("#" + buttonOkId);

    // *** autres attributs ***

    this.frToRo = true;
    this.quizzSessionItemArray = [];
    this.currentTestItemId = 0;


    this.manageButtonSwitched = function()
    {
        myQuizz.frToRo = myQuizz.buttonSwitch.getFrToRo();

        // on met a jour l'arbre
        myQuizz.quizzJsTree.setLang(myQuizz.buttonSwitch.getFrToRo());

        // on relance le test
        myQuizz.performQuizz();

        console.log("yeah baby !!");

    };

    this.buttonSwitch.bindMeToClickEvent(this.manageButtonSwitched);

    //update la liste des items a demander si des feuilles de l'arbre sont cochée/décochées
    // todo : p-e finalement laisser la liste des items dans l'arbre pour avoir tout au même endroit...
    // todo : trouver un moyen de garder la proba en la mixant avec les nouveaux éléments...
    this.manageTreeChange = function() {

        var checkedItemIdList = myQuizz.quizzJsTree.getCheckedItemIdList();

        // on les met tous a unselect
        for (var id in myQuizz.testItemMap) {
            myQuizz.testItemMap[id].unSelect();            
            myQuizz.testItemMap[id].resetChance();
        }

        // on selectionne ceux cochés dans l'arbre
        for (var i = 0; i < checkedItemIdList.length; i++) {
            myQuizz.testItemMap[checkedItemIdList[i]].select();

        }

        // on relance le test        
        myQuizz.performQuizz();


    };

    this.quizzJsTree = new QuizzJsTree(quizzJsTreeId, jsonResult, this.manageTreeChange);
    this.testItemMap = this.quizzJsTree.getTestItemMap();

    //on initialise l'arbre
    this.quizzJsTree.setLang(this.buttonSwitch.getFrToRo());


    this.getRandomTestItem = function(excludedId)
    {

        var numberOfTestItems = 0;
        var totalChance = 0;

        // utilisé pour éviter de refaire un boucle dans le cas ou c'est le seul item éligible
        var lastOkId = 0;

        for (var id in this.testItemMap) {

            if (id != excludedId && this.testItemMap[id].isSelected())
            {
                totalChance += this.testItemMap[id].chance;
                lastOkId = id;
                numberOfTestItems++;
            }
            //this.quizzSessionItemArray.push(itemArray[Math.floor(Math.random()*itemArray.length)]);


        }

        // cas ou la lite de tstItems est vide => on rend 0
        if (numberOfTestItems == 0)
        {

            // on exclu plus l'item de la question précédente dans le cas ou c'est le seul choix possible
            if (this.testItemMap[excludedId] != null)
            {
                if (this.testItemMap[excludedId].isSelected())
                {
                    return excludedId;
                }
            }

            // si excludedId est dans la map => on le retourne sinon => 0
            return 0;
        }
        // cas ou on a qu'un seul item dans la liste => on retourne le seul item disponible
        else if (numberOfTestItems == 1)
        {
            // on retourne le seul item possible (mais on vérifie quand même qu'il est bien là...)
            if (this.testItemMap[lastOkId] != null)
            {
                if (this.testItemMap[lastOkId].isSelected())
                {
                    return lastOkId;
                }
            }

            return 0;
        }
        // cas ou on a plus de 1 item dans la liste => on applique le comportement normal
        else
        {

            console.log("chance totale : " + totalChance);

            var randomChance = Math.floor(Math.random() * (totalChance)) + 1;//Math.ceil(Math.random()*(totalChance));


            var sumChance = 0;

            /*
             for (var id in this.testItemMap) {
             if (id != excludedId && this.testItemMap[id].isSelected())
             {
             console.log(this.testItemMap[id].ro + " : " + this.testItemMap[id].chance);
             }
             }
             */

            for (var id in this.testItemMap) {


                if (id != excludedId && this.testItemMap[id].isSelected())
                {
                    sumChance += this.testItemMap[id].chance;



                    if (sumChance >= randomChance)
                    {
                        //console.log("somme : " + sumChance + " >= tirage : " + randomChance + " => id : " + id);
                        return id;
                    }

                    //console.log("somme : " + sumChance + " < tirage : " + randomChance + " (id : " + id + ")");
                }

            }
        }
    }

    /*
     for (var i = 0; i < quizzSessionSize; i++) {
     this.quizzSessionItemArray.push(itemArray[Math.floor(Math.random()*itemArray.length)]);
     }		
     */

    this.evaluateAnswer = function()
    {

        if (this.currentTestItemId != 0)
        {
            var currentTestItem = this.testItemMap[this.currentTestItemId];
            this.textPreviousQuestion.innerHTML = currentTestItem.getQuestion(this.frToRo)[0];//this.quizzSessionItemArray[this.index].fr[0];
            this.textPreviousAnswer.innerHTML = this.inputAnswer.value;


            if (currentTestItem.compareWithSolution(this.frToRo, this.inputAnswer.value))
            {
                this.textPreviousAnswer.className = "rightAnswer";
                this.textPreviousQuestionRightAnswer.innerHTML = "";
                this.labelReponseCorrecte.innerHTML = "";
                //this.imageResult.src = "tick.png";
                this.textScore.countWrightAnswer();
                currentTestItem.substractChance();
            }
            else
            {
                this.textPreviousAnswer.className = "wrongAnswer";
                this.textPreviousQuestionRightAnswer.innerHTML = currentTestItem.getAnswer(this.frToRo)[0];
                this.labelReponseCorrecte.innerHTML = "Réponse correcte :";
                //this.imageResult.src = "cross.png";
                this.textScore.countWrongAnswer();
                currentTestItem.addChance();
            }
        }

    };

    this.askNextQuestion = function()
    {

        var nextTestItemId = this.getRandomTestItem(this.currentTestItemId);
        if (nextTestItemId != 0)
        {
            var nextTestItem = this.testItemMap[nextTestItemId];

            this.textQuestion.innerHTML = nextTestItem.getQuestion(this.frToRo)[0];
            this.inputAnswer.value = "";

            this.currentTestItemId = nextTestItemId;
        }

    };

    this.performQuizz = function()
    {
        this.textScore.reset();
        this.askNextQuestion();

    };

    this.toString = function()
    {

        var itemToString = "";

        for (var i = 0; i < this.quizzSessionItemArray.length; i++) {
            itemToString += i + " : [ " + this.quizzSessionItemArray[i].fr + " ; " + this.quizzSessionItemArray[i].ro + "]\n";
        }

        alert(itemToString);
    };

    this.managePressEnter = function(e) {
        console.log("managePressEnter");

        if (e.keyCode == 13)
        {
            myQuizz.evaluateAndAskNextQuestion();
        }
    };

    this.evaluateAndAskNextQuestion = function()
    {
        myQuizz.evaluateAnswer();
        myQuizz.askNextQuestion();
    };

    //abonnement aux évènements
    this.inputAnswer.addEventListener('keydown', this.managePressEnter, false);

    this.buttonOk.click(this.evaluateAndAskNextQuestion);

    // on met a jour notre liste de checked (plus nécessaire si on rapatrie la liste des items dans l'arbre)

    //this.quizzJsTree.triggerChecked();

    //this.manageTreeChange();    

    this.quizzJsTree.bindMeToCheckEvent(this.manageTreeChange);
}

/*
//représente un ensemble d'input de touches
function Config() {

    var myConfig = this;

    this.quizzSessionItemArray = [];

    this.addKeyConfig = function(newKeyConfig) {
        this.quizzSessionItemArray.push(newKeyConfig);


        newKeyConfig.inputKey.addEventListener('keyup', this.onKeyUp, false);
        newKeyConfig.inputKey.addEventListener('focus', this.onGetFocus, false);
        newKeyConfig.inputKey.addEventListener('blur', this.onBlur, false);

    };


    this.findKeyConfig = function(elementTarget)
    {

        for (var i = 0; i < this.quizzSessionItemArray.length; i++) {


            if (this.quizzSessionItemArray[i].isSameElement(elementTarget))
            {
                return this.quizzSessionItemArray[i];
            }

        }

    };

    this.getReplacementChar = function(enteredChar) {

        var replacedChar = enteredChar;

        for (var i = 0; i < this.quizzSessionItemArray.length && replacedChar == enteredChar; i++) {

            replacedChar = this.quizzSessionItemArray[i].getReplacementChar(enteredChar);//replaceConfChar(stringValueresult);		

        }

        return replacedChar;
    };


    this.onKeyUp = function(e) {

        var keyConfigTarget = myConfig.findKeyConfig(e.target);

        console.log("onKeyUp");

        // n'a pas l'air de fonctionner pour éviter les touches shift, ctrl, etc
        if ((String.fromCharCode(e.keyCode)).length == 1)
        {

            console.log("caractère rentré" + String.fromCharCode(e.keyCode));

            keyConfigTarget.inputKey.blur();

        }
    };

    // quand on prend le focus, on efface l'intérieur de l'input
    this.onGetFocus = function(e) {

        var keyConfigTarget = myConfig.findKeyConfig(e.target);

        console.log("onGetFocus");
        keyConfigTarget.inputKey.value = "";

    };

    // si on perds le focus sans que rien ne soit rentré, on restore la précédente valeur
    this.onBlur = function(e) {

        var keyConfigTarget = myConfig.findKeyConfig(e.target);

        console.log("onBlur");

        if (keyConfigTarget.inputKey.value.length != 1)//|| myConfig.isKeyAlreadyUsed(keyConfigTarget.inputKey.value, keyConfigTarget))
        {
            //cas ou la valeur rentrée est incorrecte -> restoration de l'ancienne valeur
            keyConfigTarget.inputKey.value = keyConfigTarget.keyValue;
        }
        else
        {
            //cas ou la valeur rentrée est correcte

            if (!myConfig.swapKeyIfAlreadyUsed(keyConfigTarget.inputKey.value, keyConfigTarget))
            {
                keyConfigTarget.keyValue = keyConfigTarget.inputKey.value;
            }

            console.log("new key : " + myConfig.findKeyConfig(e.target).keyValue);
        }

    };

    this.swapKeyIfAlreadyUsed = function(keyValue, keyConfigTarget) {

        for (var i = 0; i < this.quizzSessionItemArray.length; i++) {


            if (keyConfigTarget != this.quizzSessionItemArray[i])
            {

                if (this.quizzSessionItemArray[i].isSamekeyValue(keyValue))//keyValue == this.quizzSessionItemArray[i].keyValue)
                {
                    console.log("déja utilisé !");

                    var keyConfigTemp = keyConfigTarget.getKeyValue();

                    keyConfigTarget.setKeyValue(this.quizzSessionItemArray[i].getKeyValue());

                    this.quizzSessionItemArray[i].setKeyValue(keyConfigTemp);

                    return true;
                }

            }

        }

    };

}
*/

//représente un ensemble d'input de touches
function ConfigGenerique(containerId) {

    this.containerId = containerId;

    var myConfig = this;

    this.quizzSessionItemArray = [];

    this.addKeyConfig = function(defaultValue, targetChar) {

        var newKeyConfig = new KeyConfigGenerique(defaultValue, targetChar);

        this.quizzSessionItemArray.push(newKeyConfig);

        newKeyConfig.bindToKeyUp(this.onKeyUp);
        newKeyConfig.bindToFocus(this.onGetFocus);
        newKeyConfig.bindToBlur(this.onBlur);
        
        newKeyConfig.addInElement(this.containerId);

        //newKeyConfig.inputKey.addEventListener('keyup', this.onKeyUp, false);
        //newKeyConfig.inputKey.addEventListener('focus', this.onGetFocus, false);
        //newKeyConfig.inputKey.addEventListener('blur', this.onBlur, false);

    };


    this.findKeyConfig = function(elementTarget)
    {

        for (var i = 0; i < this.quizzSessionItemArray.length; i++) {


            if (this.quizzSessionItemArray[i].isSameElement(elementTarget))
            {
                return this.quizzSessionItemArray[i];
            }

        }

    };

    this.getReplacementChar = function(enteredChar) {

        var replacedChar = enteredChar;

        for (var i = 0; i < this.quizzSessionItemArray.length && replacedChar == enteredChar; i++) {

            replacedChar = this.quizzSessionItemArray[i].getReplacementChar(enteredChar);//replaceConfChar(stringValueresult);		

        }

        return replacedChar;
    };


    this.onKeyUp = function(e) {

        var keyConfigTarget = myConfig.findKeyConfig(e.target);

        console.log("onKeyUp");

        // n'a pas l'air de fonctionner pour éviter les touches shift, ctrl, etc
        if ((String.fromCharCode(e.keyCode)).length == 1)
        {

            console.log("caractère rentré" + String.fromCharCode(e.keyCode));

            keyConfigTarget.blur();

        }
    };

    // quand on prend le focus, on efface l'intérieur de l'input
    this.onGetFocus = function(e) {

        var keyConfigTarget = myConfig.findKeyConfig(e.target);

        console.log("onGetFocus");

        keyConfigTarget.setInputElementValue("");


        //keyConfigTarget.inputKey.value = "";

    };

    // si on perds le focus sans que rien ne soit rentré, on restore la précédente valeur
    this.onBlur = function(e) {

        var keyConfigTarget = myConfig.findKeyConfig(e.target);

        console.log("onBlur");

        if (keyConfigTarget.isInputElementValueNotOneCharacterLength() )//|| myConfig.isKeyAlreadyUsed(keyConfigTarget.inputKey.value, keyConfigTarget))
        {
            //cas ou la valeur rentrée est incorrecte -> restoration de l'ancienne valeur
            
            keyConfigTarget.restoreValueInElement();
            //keyConfigTarget.inputKey.value = keyConfigTarget.keyValue;
        }
        else
        {
            //cas ou la valeur rentrée est correcte

            if (!myConfig.swapKeyIfAlreadyUsed(keyConfigTarget))
            {
                keyConfigTarget.setKeyValue(keyConfigTarget.getInputElementValue());
                //keyConfigTarget.keyValue = ;
            }

            console.log("new key : " + myConfig.findKeyConfig(e.target).keyValue);
        }

    };

    this.swapKeyIfAlreadyUsed = function(keyConfigTarget) {
        
        var keyValue = keyConfigTarget.getInputElementValue();

        for (var i = 0; i < this.quizzSessionItemArray.length; i++) {


            if (keyConfigTarget != this.quizzSessionItemArray[i])
            {

                if (this.quizzSessionItemArray[i].isSamekeyValue(keyValue))//keyValue == this.quizzSessionItemArray[i].keyValue)
                {
                    console.log("déja utilisé !");

                    var keyConfigTemp = keyConfigTarget.getKeyValue();

                    keyConfigTarget.setKeyValue(this.quizzSessionItemArray[i].getKeyValue());

                    this.quizzSessionItemArray[i].setKeyValue(keyConfigTemp);

                    return true;
                }

            }

        }

    };

}

/*
 
 <span>
 ă
 <input class="inputkey" id="inputKeyACorne" type="text" size="1" />
 </span>
 
 
 $(document.createElement('div'))
 <input class="inputkey" id="inputKeyACorne" type="text"
 
 pour insérer au début:
 $('span').prepend('balise span » ')
 
 pour setter un attribut :
 $('div.header_gauche img').attr('title','le Site du Zér0');
 
 $('img').attr({
 title : 'Mes photos de vacances',
 alt : 'Ceci est une image',
 src : 'vacances.jpg'
 });
 
 */




// représente un input de touche
function KeyConfigGenerique(defaultValue, targetChar)
{

    //on crée l'input et on set ses attributs
    this.$inputKeyElement = jQuery(document.createElement('input')).attr({
        type: "text",
        class: "inputkey"
    });

    //on set la value par défaut
    this.$inputKeyElement.val(defaultValue);

    //on crée le span et on lui ajoute l'input
    this.$spanElement = jQuery(document.createElement('span')).attr({
        class: "keyConfig"
    });
    //on ajoute le caractère
    this.$spanElement.prepend(targetChar).append(this.$inputKeyElement);
    //on ajoute l'input
    this.$spanElement.append(this.$inputKeyElement);

    this.addInElement = function(containerId)
    {
        jQuery("#" + containerId).append(this.$spanElement);
    };

    var myKeyConfig = this;

    this.targetChar = targetChar;

    //this.inputKey = document.getElementById(inputKeyId);

    this.keyValue = defaultValue;

    //this.inputKey.value = defaultValue;

    //compare l'objet en param a l'objet courant
    this.isSameElement = function(elementToCompare)
    {
        //console.log("element : "+ myKeyConfig.inputKey);
        //console.log("comparaison : "+ (elementToCompare == myKeyConfig.inputKey));

        return (elementToCompare === myKeyConfig.$inputKeyElement[0]);

    };

    this.getReplacementChar = function(enteredChar) {

        if (enteredChar === this.keyValue)
        {
            return this.targetChar;
        }
        else
        {
            return enteredChar;
        }

    };

    this.isSamekeyValue = function(keyValueToCompare)
    {
        return (this.keyValue === keyValueToCompare);
    };

    this.setKeyValue = function(keyValueToSet)
    {
        this.keyValue = keyValueToSet;
        //this.$inputKeyElement.attr("value", keyValueToSet);
        this.$inputKeyElement.val(keyValueToSet);
        //this.inputKey.value = keyValueToSet;
    };

    this.getKeyValue = function()
    {
        return this.keyValue;
    };

    this.bindToKeyUp = function(functionToBind)
    {
        this.$inputKeyElement.keyup(functionToBind);
    };

    this.bindToFocus = function(functionToBind)
    {
        this.$inputKeyElement.focus(functionToBind);
    };

    this.bindToBlur = function(functionToBind)
    {
        this.$inputKeyElement.blur(functionToBind);
    };

    this.blur = function()
    {
        this.$inputKeyElement.blur();
    };

    this.getInputElementValue = function()
    {
        //return this.$inputKeyElement.attr("value");
        return this.$inputKeyElement.val();
    };

    this.setInputElementValue = function(valueToSet)
    {
        this.$inputKeyElement.val(valueToSet);
    };
    
    this.isInputElementValueNotOneCharacterLength = function()
    {
        return this.getInputElementValue().length !== 1;
    };
    
    this.restoreValueInElement = function()
    {
        this.setInputElementValue(this.keyValue);
        //this.$inputKeyElement.attr("value",this.keyValue);
    };
    
}


/*
// représente un input de touche
function KeyConfig(defaultValue, inputKeyId, targetChar)
{

    var myKeyConfig = this;

    this.targetChar = targetChar;

    this.inputKey = document.getElementById(inputKeyId);

    this.keyValue = defaultValue;

    this.inputKey.value = defaultValue;

    this.isSameElement = function(elementToCompare)
    {
        //console.log("element : "+ myKeyConfig.inputKey);
        //console.log("comparaison : "+ (elementToCompare == myKeyConfig.inputKey));

        return (elementToCompare == myKeyConfig.inputKey);

    };

    this.getReplacementChar = function(enteredChar) {

        if (enteredChar == this.keyValue)
        {
            return this.targetChar;
        }
        else
        {
            return enteredChar;
        }

    };

    this.isSamekeyValue = function(keyValueToCompare)
    {
        return (this.keyValue == keyValueToCompare);
    };

    this.setKeyValue = function(keyValueToSet)
    {
        this.keyValue = keyValueToSet;
        this.inputKey.value = keyValueToSet;
    };

    this.getKeyValue = function()
    {
        return this.keyValue;
    };

}
*/

//représente l'input de réponse
function InputAnswer(inputAnswerId, configInstance)
{
    var myInputAnswer = this;

    this.inputAnswerElement = document.getElementById(inputAnswerId);
    this.keyConfig = configInstance;

    /*
     this.onKeyUp = function (e) {
     
     console.log("valeur :"+e.target.value);
     
     
     var newValue = myInputAnswer.keyConfig.replaceConfChars(e.target.value);
     
     if(newValue != e.target.value)
     {
     e.target.value = newValue;
     }
     
     }
     */


    this.onKeyDown = function(e) {
//todo : traquer les keycode dans les inputs de config de touche
        var enteredChar = String.fromCharCode(e.which);


        var newChar = myInputAnswer.keyConfig.getReplacementChar(enteredChar);
        //replaceConfChars(e.target.value);


        if (newChar != enteredChar)
        {
            e.preventDefault();

            //*****************
            // non supporté par ie -> http://alexking.org/blog/2003/06/02/inserting-at-the-cursor-using-javascript
            var startPos = myInputAnswer.inputAnswerElement.selectionStart;
            var endPos = myInputAnswer.inputAnswerElement.selectionEnd;
            myInputAnswer.inputAnswerElement.value = myInputAnswer.inputAnswerElement.value.substring(0, startPos) + newChar + myInputAnswer.inputAnswerElement.value.substring(endPos, myInputAnswer.inputAnswerElement.value.length);

            //******************

            myInputAnswer.inputAnswerElement.selectionStart = startPos + 1;
            myInputAnswer.inputAnswerElement.selectionEnd = endPos + 1;
        }

    };


    //this.inputAnswerElement.addEventListener('keyup', this.onKeyUp, false);
    this.inputAnswerElement.addEventListener('keypress', this.onKeyDown, false);


}


//représente le bouton de choix fr->ro / ro->fr
function ButtonSwitch(buttonSwitchId, imageButtonId)
{
    /*
     $("#"+buttonSwitchId);
     $('p').each(function(){
     
     $(this).html('Hello World !'); // $(this) représente le paragraphe courant
     
     });
     $('img').attr('title', 'Nouvelle photo');
     
     $("#uneDiv").click(function(){
     // Le code a exécuter !
     });
     
     */
//$('p > .lien');

    var myButtonSwitch = this;

    this.buttonSwitch = $("#" + buttonSwitchId);//document.getElementById(buttonSwitchId);
    //this.imageButton=document.getElementById(imageButtonId);
    this.buttonSpan = $("#" + buttonSwitchId + " span ");

    this.frToRo = true;

    //myButtonSwitch.imageButton.src = "frtoro.png";
    //myButtonSwitch.buttonSwitch.innerHTML = "fr > ro";
    //this.buttonSpan.attr("innerHTML", "fr > ro");
    this.buttonSpan.html("fr > ro");

    this.listOfBindedFunctionToClickEvent = [];

    // abonne des fonctions a l'evt de check/uncheck
    this.bindMeToClickEvent = function(functionToBind)
    {
        this.listOfBindedFunctionToClickEvent.push(functionToBind);
        //this.myJSTree.bind('change_state.jstree', functionToBind);
    };


    this.getFrToRo = function()
    {
        return this.frToRo;
    };

    this.onClick = function()
    {
        console.log("onClick");
        if (myButtonSwitch.frToRo)
        {
            myButtonSwitch.frToRo = false;
            //myButtonSwitch.buttonSwitch.innerHTML = "ro > fr";
            //myButtonSwitch.buttonSpan.attr("innerHTML", "ro > fr");
            myButtonSwitch.buttonSpan.html("ro > fr");
            //myButtonSwitch.imageButton.src = "rotofr.png";
        }
        else
        {
            myButtonSwitch.frToRo = true;
            //myButtonSwitch.buttonSwitch.innerHTML = "fr > ro";
            //myButtonSwitch.buttonSpan.attr("innerHTML", "fr > ro");
            myButtonSwitch.buttonSpan.html("fr > ro");
            //myButtonSwitch.imageButton.src = "frtoro.png";
        }

        for (var j = 0; j < myButtonSwitch.listOfBindedFunctionToClickEvent.length; j++) {

            myButtonSwitch.listOfBindedFunctionToClickEvent[j]();

        }


    };

    //this.onClick();

    this.buttonSwitch.click(this.onClick);

    //this.buttonSwitch.addEventListener('click', this.onClick, false);

}


/*
 //représente le bouton de choix fr->ro / ro->fr
 function ButtonSwitch(buttonSwitchId, imageButtonId)
 {
 
 $("#"+buttonSwitchId);
 $('p').each(function(){
 
 $(this).html('Hello World !'); // $(this) représente le paragraphe courant
 
 });
 $('img').attr('title', 'Nouvelle photo');
 //$('p > .lien');
 
 var myButtonSwitch = this;
 
 this.buttonSwitch=document.getElementById(buttonSwitchId);
 this.imageButton=document.getElementById(imageButtonId);
 
 this.frToRo=true;
 
 //myButtonSwitch.imageButton.src = "frtoro.png";
 myButtonSwitch.buttonSwitch.innerHTML = "fr > ro";
 this.listOfBindedFunctionToClickEvent = [];
 
 // abonne des fonctions a l'evt de check/uncheck
 this.bindMeToClickEvent = function(functionToBind)
 {
 this.listOfBindedFunctionToClickEvent.push(functionToBind);
 //this.myJSTree.bind('change_state.jstree', functionToBind);
 }   
 
 
 this.getFrToRo = function()
 {
 return this.frToRo;
 }
 
 this.onClick = function()
 {
 console.log("onClick");
 if(myButtonSwitch.frToRo)
 {
 myButtonSwitch.frToRo = false;
 myButtonSwitch.buttonSwitch.innerHTML = "ro > fr";
 //myButtonSwitch.imageButton.src = "rotofr.png";
 }
 else
 {
 myButtonSwitch.frToRo = true;
 myButtonSwitch.buttonSwitch.innerHTML = "fr > ro";
 //myButtonSwitch.imageButton.src = "frtoro.png";
 }
 
 for (var j = 0; j < myButtonSwitch.listOfBindedFunctionToClickEvent.length; j++) {    
 
 myButtonSwitch.listOfBindedFunctionToClickEvent[j]();
 
 }
 
 
 }
 
 //this.onClick();
 
 this.buttonSwitch.addEventListener('click', this.onClick, false);
 
 }
 
 */

// représente le score
function TextScore(textScoreId)
{

    this.testScore = document.getElementById(textScoreId);

    this.wrightAnsers = 0;
    this.questions = 0;

    this.countWrightAnswer = function()
    {
        this.wrightAnsers += 1;
        this.questions += 1;
        this.displayScore();
    };

    this.countWrongAnswer = function()
    {
        this.questions += 1;
        this.displayScore();
    };

    this.reset = function()
    {
        this.wrightAnsers = 0;
        this.questions = 0;
        this.displayScore();
    };

    this.displayScore = function()
    {
        var ratio;
        if (this.questions == 0)
        {
            ratio = 0;
        }
        else
        {
            ratio = Math.round((this.wrightAnsers / this.questions) * 100);
        }

        if (ratio <= 25) {
            this.testScore.className = "badScore";
        }
        else if (25 < ratio && ratio <= 50) {
            this.testScore.className = "averageBadScore";
        }
        else if (50 < ratio && ratio <= 75) {
            this.testScore.className = "averageGoodScore";
        }
        else if (75 < ratio) {
            this.testScore.className = "goodScore";
        }

        this.testScore.innerHTML = this.wrightAnsers + "/" + this.questions + " (" + ratio + "%)";
    };
}

var textScore = new TextScore("textScore");

var buttonSwitch = new ButtonSwitch("buttonSwitch", "imageButtonSwitch");



var configGenerique = new ConfigGenerique("inputKeys");

configGenerique.addKeyConfig("&", "ă");
configGenerique.addKeyConfig("_", "î");
configGenerique.addKeyConfig("(", "ț");
configGenerique.addKeyConfig("<", "ș");
configGenerique.addKeyConfig("é", "â");

var myInputAnswer = new InputAnswer("inputAnswer", configGenerique);


function TreeItem(metaData, open)
{

//"data" : [ { "title" : "EN title", language : "en" }, { "title" : "BG заглавие", language : "bg" } ]

    if (metaData.test_item_id == null)
    {
        // node case
        this.data = [{"title": metaData.name_fr, language: "fr"}, {"title": metaData.name_ro, language: "ro"}];
        //metaData.name;

        //seulement pour les noeuds (pas les feuilles)
        this.children = [];
        if (open)
        {
            this.state = "open";
        }
    }
    else
    {
        //leaf case
        this.data = [{"title": metaData.ro, language: "ro"}, {"title": metaData.fr, language: "fr"}];
        //metaData.ro;
        //this.children = null;
    }

    //noeuds sélectionnés par défaut
    if (metaData.default_selected == 1)
    {
        this.attr = {class: "jstree-checked"};
    }
    //"attr": { "id": "node id", "class":"jstree-checked" }

    this.metadata = metaData;


    this.addSon = function(son)
    {
        this.children.push(son);
    };

    //this.state = "open"; // "closed" or "open"

    //this.language = "ro";

}


// l'objet recouvrant le jsTree
function QuizzJsTree(jsTreeId, jsonResult, loadedCallBack)
{
    //todo tester de mettre directement la méthode dans la construction de l'arbre
    var myQuizzJsTree = this;

    this.jsonResult = jsonResult;

    //this.buildTree = function(jsTreeId,jsonResult)
    //{

    this.myJSTree;

    // la liste des id des éléments checkés
    this.checkedItemIdList = [];

    this.getCheckedItemIdList = function()
    {
        //uncheck_node
        var checkedItemList = jQuery("#" + jsTreeId).jstree("get_checked", null, true);

        this.checkedItemIdList = [];

        for (var i = 0; i < checkedItemList.length; i++) {

            var idCheckedTestItem = jQuery(checkedItemList[i]).data("test_item_id");

            if (idCheckedTestItem != null)
            {
                //console.log(" idCheckedTestItem : " + idCheckedTestItem);
                this.checkedItemIdList.push(idCheckedTestItem);
            }


            //console.log(" idTestItem : "+idTestItem);

        }

        return this.checkedItemIdList;
    };

    this.getTreeContent = function(jsonResult)
    {

        var tree = [];

        var testItemMap = {};

        for (var i = 0; i < jsonResult.length; i++) {

            // on crée l'arbre
            if (jsonResult[i].parent_id == null)
            {

                root = new TreeItem(jsonResult[i], true);

                this.addSonsNodes(root, jsonResult, 1);

                tree.push(root);

            }

            //on crée la collection pour le test
            if (jsonResult[i].test_item_id != null)
            {
                testItemMap[jsonResult[i].test_item_id] = new TestItem(jsonResult[i]);
            }

        }
        return tree;

    };

    this.addSonsNodes = function(parentNode, nodesArray, deepness)
    {

        //if(parentNode.metadata != null)// to remove (test)
        //{
        //console.log("parentNode name : " + parentNode.data);
        for (var i = 0; i < nodesArray.length; i++) {


            if (nodesArray[i].parent_id != null && nodesArray[i].parent_id == parentNode.metadata.id)
            {
                var open = false
                //3 : valeur arbitraire
                if (deepness < 3)
                {
                    open = true;
                }


                var node = new TreeItem(nodesArray[i], open);

                this.addSonsNodes(node, nodesArray);

                //console.log("ajout : " + node.data + " -> " + parentNode.data);

                parentNode.addSon(node);
            }

        }
        //}

    };

    this.getTestItemMap = function()
    {
        var testItemMap = {};

        for (var i = 0; i < this.jsonResult.length; i++) {


            //on crée la collection pour le test
            if (this.jsonResult[i].test_item_id != null)
            {
                testItemMap[this.jsonResult[i].test_item_id] = new TestItem(this.jsonResult[i]);
            }

        }

        return testItemMap;
    };


    this.listOfBindedFunctionToCheckEvent = [];

    // abonne des fonctions a l'evt de check/uncheck
    this.bindMeToCheckEvent = function(functionToBind)
    {
        this.listOfBindedFunctionToCheckEvent.push(functionToBind);
        //this.myJSTree.bind('change_state.jstree', functionToBind);
    };


    this.manageTreeLoadedEvent = function(event, data)
    {
        loadedCallBack();
    };

    jQuery("#" + jsTreeId).bind("loaded.jstree", this.manageTreeLoadedEvent);

    var tree = this.getTreeContent(jsonResult);

    // pour les langues, c'est la première de la liste par défaut qui est appliquée
    this.myJSTree = jQuery("#" + jsTreeId).jstree({
        "json_data": {
            "data": tree
        },
        "themes": {
            "theme": "default",
            "dots": false,
            "icons": false

        },
        "languages": ["fr", "ro"],
        "plugins": ["languages", "themes", "json_data", "checkbox"]
    });


    //$("#demo1").jstree("set_lang", this.value);
    //this.myJSTree.jstree("set_lang", "ro");


    this.setLang = function(fr)
    {
        if (fr)
        {
            this.myJSTree.jstree("set_lang", "fr");
        }
        else
        {
            this.myJSTree.jstree("set_lang", "ro");
        }
    };

    this.manageCheckEvent = function(e, data) {
        /*
         //uncheck_node
         var checkedItemList = jQuery("#"+jsTreeId).jstree( "get_checked", null,true);
         
         checkedItemIdList = [];
         
         for (var i = 0; i < checkedItemList.length; i++) {
         
         var idCheckedTestItem = jQuery(checkedItemList[i]).data("test_item_id");
         
         if(idCheckedTestItem != null)
         {
         console.log(" idCheckedTestItem : "+idCheckedTestItem);
         checkedItemIdList.push(idCheckedTestItem);
         }
         
         
         //console.log(" idTestItem : "+idTestItem);
         
         }
         */


        for (var j = 0; j < myQuizzJsTree.listOfBindedFunctionToCheckEvent.length; j++) {

            myQuizzJsTree.listOfBindedFunctionToCheckEvent[j]();

        }


    };



    this.myJSTree.bind('change_state.jstree', this.manageCheckEvent);


    //}

}



function sendGetListRequest()
{
    
$.ajax({
    url: 'getLists.php',
    type: 'GET',
    dataType: 'json',
    success: function(jsonResult, statut) {

        //var quizzJsTree = new QuizzJsTree("voctree",jsonResult);

        var myQuizz = new Quizz("buttonOk", buttonSwitch, "voctree", jsonResult, "textPreviousQuestion", "textPreviousAnswer", "textQuestion", "inputAnswer", "textPreviousQuestionRightAnswer", "labelReponseCorrecte", textScore);


        myQuizz.performQuizz();



        //quizzJsTree.buildTree("voctree",jsonResult);

        //createTreeView(jsonResult);

        /*
         var resultString = "";
         
         for (var i = 0; i < jsonResult.length; i++) {
         resultString+= jsonResult[i].name+" ; "+jsonResult[i].ro+" ; "+jsonResult[i].fr + "]\n";
         }*/

        //alert("success : "+jsonResult);
        //console.log("success : "+resultString);//+"  "+jsonResult["2"]);

        //$(jsonResult).appendTo("#commentaires"); // On passe jsonResult à jQuery() qui va nous créer l'arbre DOM !
    },
    error: function(resultat, statut, erreur) {
        console.log("getLists query error : " + resultat + " " + statut + " " + erreur);
        // en cas d'erreur on fait un refresh de la page
        location.reload();
        
        //sendGetListRequest();
    },
    complete: function(resultat, statut) {
        console.log("getLists query complete : " + resultat + " " + statut);
    }
});

}

//lancé dès que l'arbre dom est fini de charger
jQuery(function()
{
 sendGetListRequest(); 
 }
         );
        
        







