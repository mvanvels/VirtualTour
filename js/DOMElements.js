/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 4/11/2018
*/

/**
 * Excogitation:
 *
 *  Helper Class for creating DOM Elements on the fly. document.createElement() is  the perferred method,
 *  although, we manipulate the HTMLElement here by adding a custom function to the object, which is not recommended,
 *  testing should be done, but modern browsers will suffice. Of course, faulty browsers probably only applies to IE per usual
 *
 *  This is maintained as a PURE JS solution
 */
export class DOMElements {
  /**
   * Create an HTMLELement here.
   *
   * Since validating against instanceof HTMLELement is not cross-browser compatible, switch case is used to ensure correctness.
   *
   * @param  {String} tagName    tagName as String of HTMLElement to add
   * @param  {Object} [attrs={}] Object of user-defined selectors/attributes to include in the assignment. { id = "", classNames = [], text = "" }
   */
  createDOMElement(tagName, attrs = {}) {
    let elem;

    switch (tagName.toUpperCase()) {
      case "BUTTON":
      case "DIV":
      case "P":
      case "SPAN":
          elem = document.createElement(tagName.toUpperCase());
        break;
      case "TEXT":
          elem = document.createTextNode(attrs.text);
          return elem;
      default:
        throw "DOM Element not found";
    }

    //add user defined selectors/attributes here
    this.addAttrs(elem,attrs);

    //extending the HTMLElement here to allow for easier child appending
    //but more importantly, shorthand syntax
    elem.appendDOMElement = function(tagName,attrs = {}) {
      elem.appendChild(this.createDOMElement(tagName, attrs));
    }.bind(this);

    return elem;
  }

  /**
   * Adds specific selectors, properties and attributes to the HTMLElement
   * @param {HTMLELement} elem
   * @param {Object} [attrs={}] allowed properties: id, classNames, text
   */
  addAttrs(elem, attrs = {}) {
    if (attrs.id) elem.id = attrs.id;
    if (attrs.classNames) {
      for (let className of attrs.classNames) {
        elem.classList.add(className);
      }
    }
    if (attrs.text) {
      let text = this.createDOMElement("text", {text: attrs.text});
      elem.append(text);
    }
    if (attrs.style) {
      elem.setAttribute("style",attrs.style);
    }
  }
}
