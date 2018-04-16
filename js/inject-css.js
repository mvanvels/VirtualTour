/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 4/12/2018
*/

/**
 * This is a helper class to assist in inject CSS on the fly. This adds the new rules to document head
 *
 * The method of injecting is different as there are some restrictions to .insertRule()
 * see restrictions: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule#Restrictions
 *
 * Specifically there are a lot of potential syntax errors, even if you want to add more than 1 rule at a time. Didn't seem intuitive.
 *
 */
export class InjectCSS {
  constructor() {
    this.sheet = InjectCSS.createSheet();
  }
  /**
   * Creates a new sheet, but returns the style tag instance instead. This is to use
   * TextNodes as opposed to sheet methods as noted above.
   * @return {HTMLElement} style element
   */
  static createSheet() {
    let style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    return style;
  }
  /**
   * Insert a new rule (as a TextNode) to the current style tag
   * @param  {String} rule Rule[s] to be added to the current style tag, can include more than one rule in same call
   */
  insertRule(rule) {
    //this uses default indexing (appends to end of style sheet, you can override with !important).
    //of course, just like anything else, insertRule poses potential issues with IE
    this.sheet.appendChild(document.createTextNode(rule));
  }
}
