/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 4/11/2018
*/
import { DOMElements } from './DOMElements.js';
import { InjectCSS } from './inject-css.js';
import { FRegex } from './frequent.js';

/**
 * This class handles displaying a simple modal.
 *
 * This modal relies on imported scripts, however, the CSS is included for easier usage globally
 *
 * This modal is removed from the DOM everytime it's hidden, but the same object
 * is reused for performance. It is removed from DOM since we share a plain Dialog
 * with Input dialog. This limits potential input errors.
 *
 * This modal uses promises for callbacks to ensure synchronous behavior, however
 * you can use async/await promise functionality to ensure script blocking synchronous behavior.
 *
 * Demonstration of using SimpleModal:
 *
 *   //import file into script
 *   import { SimpleModal } from './simple-modal.js';
 *
 *   //instantiate class
 *   let modal = new SimpleModal(); //this only needs to be instantiated once after the
 *   DOM has finished loading. Then you can repeatedly open a modal using modal.display()
 *
 *   //display the modal
 *   modal.display("some message here");
 *
 *   //display the modal with callback
 *   modal.display("are you sure you want to exit?").then( e => console.log(e) );
 *
 *   //the promised resolve will return a MODAL_RESULT id, you can validate against
 *   //that or the numbers themselve. ex:
 *
 *   modal.display("are you sure you want to exit?")
 *    .then( e => {
 *      //example 1
 *      if (e === modal.MODAL_RESULT.OK) {
 *        //ok button was clicked
 *      }
 *      //example 2
 *      if (e === 1) {
 *        //ok button was clicked
 *      }
 *    });
 *
 *   //display the modal with additional button[s]
 *   modal.addButton("NO");
 *   modal.addButton("REMIND ME LATER");
 *   modal.display("Do you agree to the terms and conditions?")
 *    .then( e => { }); // e will return the MODAL_RESULT or the number of button clicked, in order you added them
 *
 *  //the default button ("OK") will always be returned as 1, regarldess if you change the title or not
 *
 *  //display the modal with changing default button title
 *  modal.defaultButtonTitle = "SHOW";
 *  modal.display("You have an element with that name already. Would you like to navigate to it?").then(e => {} );
 *
 * @extends DOMElements
 */
export class SimpleModal extends DOMElements {
  constructor() {
    super();
    this.buttons = [];
    this.defaultButtonTitle = "OK";
    this._maxLength = undefined;
    //button action enum
    this.MODAL_RESULT = Object.freeze({
      CANCEL  : -1, //the background or otherwise was clicked
      EXIT    : 0, //the close button was clicked
      OK      : 1 //the ok button was clicked
    });

    this.INPUT_TYPE = FRegex.REGEX_TYPE;
  }

  /**
   * Sets the text of the default OK button
   * @param  {String} title text to be displayed on button1
   */
  set defaultButtonTitle(title) {
    this._defaultBtnTitle = title;
  }
  /**
   * Sets the max length allowed for input text
   * @param {Number} len number to validate length of text
   */
  set maxLength(len) {
    if (typeof len !== 'number') throw Error("Paramter expecting number");
    this._maxLength = parseInt(len);
  }
  /**
   * Generates the necessary HTML to add the modal to the DOM.
   *
   * Elements are generated using .createElement() method as this is preferred when
   * references to objects must be maintianed, as well as their events.
   * Even though InnerHTML is faster, InnerHTML will override those,
   * or at minimum, cause confusion.
   *
   * This method relies on the super class to add the elements to the DOM
   */
  addModalToDOM() {
    if (!SimpleModal.isActiveModal()) {
      let modalDiv = super.createDOMElement("DIV",{id : "sm-modal-01", classNames : ["sm-modal"]});
      let modalContentDiv = super.createDOMElement("DIV",{classNames:["sm-modal-content"]});
      let modalFooterDiv = super.createDOMElement("DIV", {classNames: ["sm-modal-footer"]});

      modalFooterDiv.appendDOMElement("BUTTON", {text: this._defaultBtnTitle});
      modalContentDiv.appendDOMElement("SPAN", {classNames : ["sm-close-button"], text: "\u00D7"});
      modalContentDiv.appendDOMElement("DIV", {classNames: ["sm-modal-body"]});
      modalContentDiv.appendChild(modalFooterDiv);

      modalDiv.appendChild(modalContentDiv);

      document.body.appendChild(modalDiv);       
    }     

    //now that they are added to the DOM we can reference them
    this.modal = document.getElementById("sm-modal-01");
    this.modalContent = document.querySelector(".sm-modal-content");
    this.modalBody = document.querySelector(".sm-modal-body");
    this.modalFooter = document.querySelector(".sm-modal-footer");
    this.closeButton = document.querySelector("#sm-modal-01 .sm-close-button");

    // this may not be necessary, but ensures there is no text retained from a
    // previous modal dialog, should the promise fail.
    while (this.modalBody.firstChild) {
      this.modalBody.removeChild(this.modalBody.firstChild);
    }
    // adds all the buttons users wanted to add
    for (let btn in this.buttons) {
      this.modalFooter.appendChild(this.buttons[btn]);
    }
  }
  /**
   * Adds a dialog button to the footer of the modal
   * Can be up to 3 more, arbitrary, simply to keep the look consistent
   * @param {String} title text of button
   */
  addButton(title) {
    if (this.buttons.length >= 2) {
      //this count includes the default OK button (max = 3)
      throw "Too many buttons for Simple Modal";
      return;
    }
    let btn = super.createDOMElement("BUTTON", {text: title});
    this.buttons.push(btn);
  }
  /**
   * Displays the modal. Should be called last after all other configurations/buttons
   * are mutated
   *
   * @param  {String} msg String of message to display to user. This is wrapped in a paragraph HTMLElement, and the text is created by a TextNode, so HTML syntax is not permitted
   * @return {Promise}    resolve (index of button clicked, 0 for close-button clicked, -1 for otherwise)
   */
  display(msg) {
    clearTimeout(this.timeout);

    return new Promise((resolve, reject) => {
      this.addModalToDOM();
      this.modalContent.style.width = "24rem";
      let p = super.createDOMElement("P", {text: msg});
      this.modalBody.appendChild(p);

      this.modal.dataset.alertType = "alert";
      this.modal.classList.add("sm-show-modal");

      this.modal.onclick = (event) => {
        if (event.target === this.modal)
          this.hideModal(() => { resolve(-1); });
        if (event.target === this.closeButton)
          this.hideModal(() => { resolve(0); });
        if (event.target.tagName === "BUTTON" &&
          event.target.parentElement.classList.contains("sm-modal-footer"))
            this.hideModal(()=> {
              resolve([...event.target.parentElement.children].indexOf(event.target) + 1);
            });
      }
    });
  }
  /**
   * Displays a spinning loading circle, defined by CSS
   *
   * Only way to close this HUD is with hideModal()
   * No events will be registerd
   */
  displayLoadingHUD() {
    clearTimeout(this.timeout);
    this.addModalToDOM();
    this.modal.dataset.alertType = "loading";
    this.modalContent.style.width = "8rem";


    let loadingDiv = super.createDOMElement("DIV", {classNames : ['sm-loading-container']});
    loadingDiv.appendDOMElement("DIV", {classNames : ['sm-loading-circle']})

    this.modalBody.appendChild(loadingDiv);
    this.modal.classList.add("sm-show-modal");
  }
  /**
   * Display an input box within the SimpleModal theme
   *
   * This method requires a inputType that is ripped from my Frequent.js library
   * @param  {String}  msg                Message to be displayed (should included data requirements when necessary)
   * @param  {}  [inputType=INPUT_TYPE.STRING]  instance of this.INPUT_TYPE
   * @param  {Boolean} [isRequired=false] specifies if the input field is required (can not be left blank)
   * @return {String}                     Returns a string of the input value typed. This does not type cast based on INPUT_TYPE data type. It is always returned as string.
   */
  inputDialog(msg, inputType = this.INPUT_TYPE.STRING, isRequired = false) {
    clearTimeout(this.timeout);

    return new Promise(resolve => {
      this.addModalToDOM();
      this.modalContent.style.width = "24rem";
      //add input specific dom elements
      let msgDiv = super.createDOMElement("DIV");
      msgDiv.appendDOMElement("P", {text: msg, style: "font-size:0.85rem;color: grey"});
      msgDiv.appendDOMElement("P", {id: "sm-modal-err-desc", style: "font-size:0.7rem;color: red"});

      let input = document.createElement("INPUT");
      input.id = "sm-input";
      input.type = "text";
      input.style.width = "100%";

      //append them to modal content
      msgDiv.appendChild(input);
      this.modalBody.appendChild(msgDiv);

      this.modal.dataset.alertType = "input"; //changes the alert type data attr (this is just for css styling)

      this.modal.classList.add("sm-show-modal");
      document.querySelector(".sm-modal-body input").focus();
      
      window.onkeydown = (event) => {
        //handles when user presses enter and modal is active
        if (!event.altKey && !event.ctrlKey && event.key === "Enter") {
          let input = document.getElementById("sm-input").value.trim();

          if (SimpleModal.isValidInput(input, inputType, isRequired, this._maxLength)) {
            this.hideModal(()=> { resolve({ MODAL_RESULT : 1, "input" : input}); });
          }
        }
      }

      this.modal.onclick = (event) => {
        if (event.target === this.modal) {
          this.hideModal(() => { resolve({MODAL_RESULT : -1, "input" : undefined}); }); //modal background clicked
        }
        if (event.target === this.closeButton) {
          this.hideModal(() => { resolve({MODAL_RESULT : 0, "input" : undefined}); }); //modal exit button clicked
        }
        if (event.target.tagName === "BUTTON" &&
        event.target.parentElement.classList.contains("sm-modal-footer")) {
          if ([...event.target.parentElement.children].indexOf(event.target) + 1 === 1) {
            //verify the first button was clicked (this will always be the "OK" default button, but the text may not say OK as it can be changed by user)
            let input = document.getElementById("sm-input").value.trim();

            if (SimpleModal.isValidInput(input, inputType, isRequired, this._maxLength)) {
              this.hideModal(()=> { resolve({ MODAL_RESULT : 1, "input" : input}); });
            }
          } else {
            this.hideModal(()=> { resolve({ MODAL_RESULT : [...event.target.parentElement.children].indexOf(event.target) + 1, "input" : undefined} );});
          }
        }
      }
    });

  }
  /**
   * Performs animation to hide modal from view
   * @param  {Optional|Function} callback SetTimeout to allow for animation to complete, callbacks when done
   */
  hideModal(callback) {
    this.modal.classList.remove("sm-show-modal");
    this.buttons = [];
    this._defaultBtnTitle = "OK";

    this.timeout = setTimeout(()=> {
      SimpleModal.unloadModal();
      if (typeof callback === "function") callback();
    },250);
  }
  /**
   * Unloads the Modal from the DOM. This is called after it's hidden from view.
   * static to force anonymity
   */
  static unloadModal() {
    //need to remove eventlisteners if targeting IE 7/8/9 to prevent potential memory leaks if removing from DOM, otherwise need event listeners.
    let modal = document.getElementById("sm-modal-01");
    modal.parentNode.removeChild(modal);
  }
  /**
   * Validates input dialog value
   * @param  {INPUT_TYPE}  inputType  Type of input expected
   * @param  {Boolean} isRequired Specifies if input is required to proceed
   * @return {Boolean}             true/false
   */
  static isValidInput(input, inputType, isRequired, maxLength) {
    let modalContent = document.querySelector(".sm-modal-content");
    let isValid = true, errMsg = "Field can not be left blank";
    let errDesc =  document.getElementById("sm-modal-err-desc");

    errDesc.innerHTML = "";
    //check if it matches the desired data type
    if (!FRegex.isRegexMatch(input, inputType)) {
      isValid = false;
      errMsg = "Input does not match requirements expecting";
    }
    //check if input is empty if the field is required
    if (isRequired && !input || isRequired && input.length === 0) isValid = false;
    //check if length is honored
    if (maxLength !== undefined && input.length > maxLength) {      
      isValid = false;
      errMsg = `Field can not exceed ${maxLength} characters`;
    }

    if (!isValid) {
      errDesc.innerHTML = errMsg;
      modalContent.classList.add("shake");
      document.getElementById("sm-input").focus();
      setTimeout(() =>{modalContent.classList.remove("shake")}, 820);
    }

    return isValid;
  }
  /**
   * Identifies if a SimpleModal is already active on document
   */
  static isActiveModal() {
    if (document.getElementById("sm-modal-01")) {
      return true;
    } else {
      return false
    }
  }
}

/* Add the modal CSS styles to the page head */
(function() {
  let inject = new InjectCSS();
  inject.insertRule(`
    .sm-modal {
      position: fixed;
      font-family: Helvetica;
      font-size: 0.92rem;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transform: scale(1.1);
      transition: visibility 0s linear 0.25s, opacity 0.25s 0s, transform 0.25s;
    }
    .sm-modal-content {
      position: absolute;
      top:35%;
      left: calc(50% - 12rem);
      background-color: white;
      width: 24rem;
      border-radius: 0.25rem;
    }
    .sm-modal-body {
      max-height: 300px;
    	overflow:hidden;
    	overflow-y: auto;
      padding: 15px 19px 5px;
    }
    .sm-modal-body input {
      outline: none;
    	border:none;
    	border-bottom: 2px solid grey;
    	transition: 300ms;
    	padding-bottom: 5px;
    	width: 250px;
    	font-size: 1.1rem;
    }
    .sm-modal-body input:focus {
      border-bottom-color: orange;
    }
    .sm-modal-footer {
      display: flex;
      flex-flow: row-reverse wrap;
      justify-content: flex-start;
      width: 85%;
      margin: 0 auto;
      padding: 8px 0px;
      border-top: 1px solid lightgray;
    }
    [data-alert-type="input"] .sm-modal-footer {
      border: none;
    }
    [data-alert-type="loading"] .sm-modal-footer {
      display: none;
    }
    [data-alert-type="loading"] .sm-close-button {
      display : none;
    }
    .sm-loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
      height: 110px;
    }
    .sm-loading-circle {
      box-sizing: border-box;

      width: 80px;
      height: 80px;
      border-radius: 100%;
      border: 10px solid rgba(0, 0, 0, 0.2);
      border-top-color: orange;
      -webkit-animation: spin 1s infinite ease-in-out;
              animation: spin 1s infinite ease-in-out;
    }
    .sm-close-button {
      position: absolute;
      right: 10px;
      font-weight:bolder;
      align-self: flex-end;
      cursor: pointer;
      font-size: 1.6rem;
      color: rgba(190,190,190);
    }
    .sm-close-button:hover {
      color: black;
    }
    .sm-show-modal {
      opacity: 1;
      visibility: visible;
      transform: scale(1.0);
      transition: visibility 0s linear 0s, opacity 0.25s 0s, transform 0.25s;
    }
    .sm-modal button {
      cursor: pointer;
      padding: 6px 15px;
      background-color: lightgrey;
      border: none;
      transition: 400ms;
      outline: none;
    }
    .sm-modal button:hover {
      background-color: black;
      color: orange;
    }
    .sm-modal::-webkit-scrollbar {
      width: 0.35em;
    }
    .sm-modal::-webkit-scrollbar-track {
      box-shadow: inset 0 0 6px rgba(0,0,0,0.5);
    }
    .sm-modal::-webkit-scrollbar-thumb {
      background-color: orange;
      outline: 1px solid slategrey;
    }
    .shake {
      animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0);  }
      20%, 80% { transform: translate3d(2px, 0, 0);   }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0);  }
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `);
})();
