(function() {

  'use strict';

  var ENTER_KEY = 13;
  var newTitleDom = document.getElementById('new-title');
  var newDefDom = document.getElementById('new-def');
  var syncDom = document.getElementById('sync-wrapper');

  var db = new PouchDB('duly-noted');
  var remoteCouch = 'https://99e9c054-9eea-484d-92eb-f55313bd8b5a-bluemix.cloudant.com/duly-noted/';

db.changes({
  since: 'now',
  live: true
}).on('change', showFlashcards);

  // We have to create a new flashcard document and enter it in the database
  function addFlashcard(text, definition) {
    var flashcard = {
      _id: new Date().toISOString(),
      title: text,
      define: definition,
      completed: false
    };
    db.put(flashcard).then(function(result){
      console.log('everything is okay');
      console.log(result);
    }).catch(function(err){
      console.log('everything is terrible');
      console.log(err);
    });
  }

  // Show the current list of flashcards by reading them from the database
  function showFlashcards() {
    db.allDocs({include_docs: true, descending: true}).then(function(doc){
      redrawFlashcardsUI(doc.rows);
    }).catch(function(err){
      console.log(err);
    });
  }

  function checkboxChanged(flashcard, event) {
    flashcard.completed = event.target.checked;
    db.put(flashcard);
  }

  // User pressed the delete button for a flashcard, delete it
  function deleteButtonPressed(flashcard) {
    db.remove(flashcard);
  }

  // The input box when editing a flashcard has blurred, we should save
  // the new title or delete the flashcard if the title is empty
  function flashcardBlurred(flashcard, event) {
    var trimmedText = event.target.value.trim();
     if (!trimmedText) {
       db.remove(flashcard);
     } else {
       flashcard.title = trimmedText;
       db.put(flaschard);
     }
  }

  // Initialise a sync with the remote server
  function sync() {
    syncDom.setAttribute('data-sync-state', 'syncing');
    var opts = {live: true};
    db.replicate.to(remoteCouch, opts, syncError);
    db.replicate.from(remoteCouch, opts, syncError);
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

  // User has double clicked a flashcard, display an input so they can edit the title
  function flashcardDblClicked(flashcard) {
    var div = document.getElementById('li_' + flashcard._id);
    var inputEditFlashcard = document.getElementById('input_' + flashcard._id);
    div.className = 'editing';
    inputEditFlashcard.focus();
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function flashcardKeyPressed(flashcard, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditFlashcard = document.getElementById('input_' + flashcard._id);
      inputEditFlashcard.blur();
    }
  }

  // Given an object representing a flashcard, this will create a list item
  // to display it.
  function createFlashcardListItem(flashcard) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, flashcard));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(flashcard.title));
    label.addEventListener('dblclick', flashcardDblClicked.bind(this, flashcard));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, flashcard));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditFlashcard = document.createElement('input');
    inputEditFlashcard.id = 'input_' + flashcard._id;
    inputEditFlashcard.className = 'edit';
    inputEditFlashcard.value = flashcard.title;
    inputEditFlashcard.addEventListener('keypress', flashcardKeyPressed.bind(this, flashcard));
    inputEditFlashcard.addEventListener('blur', flashcardBlurred.bind(this, flashcard));

    var li = document.createElement('li');
    li.id = 'li_' + flashcard._id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditFlashcard);

    if (flashcard.completed) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }

  function redrawFlashcardsUI(flashcards) {
    var ul = document.getElementById('flashcard-list');
    ul.innerHTML = '';
    flashcards.forEach(function(flashcard) {
      ul.appendChild(createFlashcardListItem(flashcard.doc));
    });
  }

  function newFlashcardKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      addFlashcard(newTitleDom.value, newDefDom.value);
      newTitleDom.value = '';
      newDefDom.value = '';
    }
  }

  function addEventListeners() {
    newTitleDom.addEventListener('keypress', newFlashcardKeyPressHandler, false);
    newDefDom.addEventListener('keypress', newFlashcardKeyPressHandler, false);
  }

  addEventListeners();
  showFlashcards();

  if (remoteCouch) {
    sync();
  }

})();
