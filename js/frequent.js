/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 4/11/2018
*/

/**
 * Excogitation:
 *
 *  This is a copy/paste library I have been using for years which includes many frequently used javascript specific functions/inquiries/validation methods
 *
 *  This is not perfect, however most methods are specifically targeted to be cross-browser compatible.
 *  However, that doesn't mean they are version/legacy browser supported. For example : Object.Keys() is only supported IE 9 +
 *  Testing should always be done to target project specific devices
 *
 *
 * This is set up as a module based solution. Import what you need, example:
 *
 *  import { FMath } from './frequent.js';
 *
 *  or, import the entire frequent library:
 *
 * import { Frequent } from './frequent.js'; and then reference classes accordingly
 */
const Frequent = {};

(function() {
  // TODO: Add objects to subcategories commonly used functions for:
  // Arrays
  // Color

   /**
   * Subcategories Regex related commonly used functions/validations
   * @return {Object} Regex Object
   */
    Frequent.Regex = {};
    //REGEX REGION START
    (function() {
      /**
       * Regex data type enum
       * @type {Object} frozen object acts as enum
       */
      Frequent.Regex.REGEX_TYPE = Object.freeze({
        ALPHABETIC    : Symbol("ALPHABETIC"),   //Accepts only letters [a-zA-Z], allows spaces between words
        ALPHANUMERIC  : Symbol("ALPHANUMERIC"), //Accepts letters and numbers [a-zA-Z0-9], allows spaces between words
        STRING        : Symbol("STRING"),       //Accepts any non-whitespace character, including symbols, allows spaces between words
        BOOLEAN       : Symbol("BOOLEAN"),      //Accepts most common boolean types (Y|YES|N|NO|T|TRUE|F|FALSE|0|1)
        INTEGER       : Symbol("INTEGER"),      //Accepts whole numbers only [0-9]
        DECIMAL       : Symbol("DECIMAL"),      //Accepts numbers with decimals, leading zeros are optional
        NUMBER        : Symbol("NUMBER")        //Accepts any kind of number [0-9] including decimals.
      });
      /**
       * Validates if a string matches a specific instaceof REGEX_TYPE data type.
       *
       * This is case insenstitive, however, the global match attribute is set to off
       * @param  {String} strng     String to validate
       * @param  {REGEX_TYPE} regexType Validate only this data type (instanceof REGEX_TYPE)
       * @return {Boolean}           true/false if matched
       */
      Frequent.Regex.isRegexMatch = function(strng, regexType) {
        if (!Frequent.keys(Frequent.Regex.REGEX_TYPE).find(key => Frequent.Regex.REGEX_TYPE[key] === regexType)) {
          throw "The regex type to validate can not be left blank and must be a valid type";
        }
        let result = false, pattern;

        if (regexType == Frequent.Regex.REGEX_TYPE.ALPHABETIC)        pattern = /^( *[a-zA-Z])*$/; //only letters, allows for spaces between words
        if (regexType == Frequent.Regex.REGEX_TYPE.ALPHANUMERIC)      pattern = /^( *[a-zA-Z0-9])*$/; //only letters and numbers, allows for spaces between words
        if (regexType == Frequent.Regex.REGEX_TYPE.BOOLEAN)           pattern = /^Y$|^YES$|^N$|^NO$|^F$|^FALSE$|^T$|^TRUE$|^0$|^1$/; //common boolean matches
        if (regexType == Frequent.Regex.REGEX_TYPE.DECIMAL)           pattern = /^-?\d*\.\d+$/; //decimal format, leading zeroes optional
        if (regexType == Frequent.Regex.REGEX_TYPE.INTEGER)           pattern = /^-?\d+$/; //one or more digits
        if (regexType == Frequent.Regex.REGEX_TYPE.NUMBER)            pattern = /^-?\d*\.\d+$|^-?\d+$/; //one or more digits, allows for decimals & whole
        if (regexType == Frequent.Regex.REGEX_TYPE.STRING)            pattern = /^( *\S+)*$/; //any non-whitespace character, allows for spaces between words

        let regx = new RegExp(pattern, 'i');
        // console.log("testing", regexType, "with pattern", pattern, "result:",regx[Symbol.match](strng));

        if (strng.match(regx)) result = true;
        return result;
      }
      /**
       * Validates if a string contains a matched pattern
       *
       * Both Regex Literal and constructor patterns.
       *
       * Regex literals (/pattern/) are interpreted literally,
       * constructor "pattern" can interpret variables
       *
       * @param  {String} strng       String to validate
       * @param  {String|RegExp} pattern     See notes above
       * @param  {String} [attrs="i"] A list of RegExp parameters to set
       * @return {Boolean}             true/false based on match
       */
      Frequent.Regex.containsMatch = function(strng, pattern, attrs = "i") {
        if (!(pattern instanceof RegExp) && typeof pattern !== "string" ||
            (typeof pattern === "string" && pattern.startsWith("/"))) {
          throw "Regex pattern must be a RegExp literal pattern or constructor string pattern without leading and trailing forward slashes";
        }
        let result = false;

        let regx = new RegExp(pattern, attrs);

        if (strng.match(regx)) result = true;
        return result;
      }
    })();
    //REGEX REGION END

    Frequent.Date = {};
    //DATE REGION START
    (function() {
      /**
       * Returns the current timestamp (high-res if available).
       * @method now
       * @return {number} the current timestamp (high-res if available)
       */
      Frequent.Date.now = function() {
          var performance = window.performance || {};

          performance.now = (function() {
              return performance.now    ||
              performance.webkitNow     ||
              performance.msNow         ||
              performance.oNow          ||
              performance.mozNow        ||
              function() { return +(new Date()); };
          })();

          return performance.now();
      };

    })();
    //DATE REGION END

    Frequent.Math = {};
    //MATH REGION START
    (function() {
      Frequent.Math._seed = 0;
      /**
       * Returns the given value clamped between a minimum and maximum value.
       * @method clamp
       * @param {number} value
       * @param {number} min
       * @param {number} max
       * @return {number} The value clamped between min and max inclusive
       */
      Frequent.Math.clamp = function(value, min, max) {
          if (value < min)
              return min;
          if (value > max)
              return max;
          return value;
      };
      /**
       * Returns a random value between a minimum and a maximum value inclusive.
       * The function uses a seeded random generator.
       * @method random
       * @param {number} min
       * @param {number} max
       * @return {number} A random number between min and max inclusive
       */
      Frequent.Math.random = function(min, max) {
          min = (typeof min !== "undefined") ? min : 0;
          max = (typeof max !== "undefined") ? max : 1;
          return min + _seededRandom() * (max - min);
      };

      var _seededRandom = function() {
          // https://gist.github.com/ngryman/3830489
          Frequent.Math._seed = (Frequent.Math._seed * 9301 + 49297) % 233280;
          return Frequent.Math._seed / 233280;
      };
    })();
    //MATH REGION END

    Frequent._nextId = 0;
    /**
     * Extends the object in the first argument using the object in the second argument.
     * @method extend
     * @param {} obj
     * @param {boolean} deep
     * @return {} obj extended
     */
    Frequent.extend = function(obj, deep) {
        var argsStart,
            args,
            deepClone;

        if (typeof deep === 'boolean') {
            argsStart = 2;
            deepClone = deep;
        } else {
            argsStart = 1;
            deepClone = true;
        }

        for (var i = argsStart; i < arguments.length; i++) {
            var source = arguments[i];

            if (source) {
                for (var prop in source) {
                    if (deepClone && source[prop] && source[prop].constructor === Object) {
                        if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            Frequent.extend(obj[prop], deepClone, source[prop]);
                        } else {
                            obj[prop] = source[prop];
                        }
                    } else {
                        obj[prop] = source[prop];
                    }
                }
            }
        }

        return obj;
    };
    /**
     * Creates a new clone of the object, if deep is true references will also be cloned.
     * @method clone
     * @param {} obj
     * @param {bool} deep
     * @return {} obj cloned
     */
    Frequent.clone = function(obj, deep) {
        return Frequent.extend({}, deep, obj);
    };
    /**
     * Returns the list of keys for the given object.
     * @method keys
     * @param {} obj
     * @return {string[]} keys
     */
    Frequent.keys = function(obj) {
        if (Object.keys)
            return Object.keys(obj);

        // avoid hasOwnProperty for performance
        var keys = [];
        for (var key in obj)
            keys.push(key);
        return keys;
    };
    /**
     * Returns the list of values for the given object.
     * @method values
     * @param {} obj
     * @return {array} Array of the objects property values
     */
    Frequent.values = function(obj) {
        var values = [];

        if (Object.keys) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                values.push(obj[keys[i]]);
            }
            return values;
        }

        // avoid hasOwnProperty for performance
        for (var key in obj)
            values.push(obj[key]);
        return values;
    };
    /**
     * Gets a value from `base` relative to the `path` string.
     * @method get
     * @param {} obj The base object
     * @param {string} path The path relative to `base`, e.g. 'Foo.Bar.baz'
     * @param {number} [begin] Path slice begin
     * @param {number} [end] Path slice end
     * @return {} The object at the given path
     */
    Frequent.get = function(obj, path, begin, end) {
        path = path.split('.').slice(begin, end);

        for (var i = 0; i < path.length; i += 1) {
            obj = obj[path[i]];
        }

        return obj;
    };
    /**
     * Sets a value on `base` relative to the given `path` string.
     * @method set
     * @param {} obj The base object
     * @param {string} path The path relative to `base`, e.g. 'Foo.Bar.baz'
     * @param {} val The value to set
     * @param {number} [begin] Path slice begin
     * @param {number} [end] Path slice end
     * @return {} Pass through `val` for chaining
     */
    Frequent.set = function(obj, path, val, begin, end) {
        var parts = path.split('.').slice(begin, end);
        Frequent.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
        return val;
    };
    /**
     * Returns a hex colour string made by lightening or darkening color by percent.
     * @method shadeColor
     * @param {string} color
     * @param {number} percent
     * @return {string} A hex colour
     */
    Frequent.shadeColor = function(color, percent) {
        // http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color
        var colorInteger = parseInt(color.slice(1),16),
            amount = Math.round(2.55 * percent),
            R = (colorInteger >> 16) + amount,
            B = (colorInteger >> 8 & 0x00FF) + amount,
            G = (colorInteger & 0x0000FF) + amount;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R :255) * 0x10000
                + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100
                + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    };
    /**
     * Shuffles the given array in-place.
     * The function uses a seeded random generator.
     * @method shuffle
     * @param {array} array
     * @return {array} array shuffled randomly
     */
    Frequent.shuffle = function(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Frequent.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };
    /**
     * Randomly chooses a value from a list with equal probability.
     * The function uses a seeded random generator.
     * @method choose
     * @param {array} choices
     * @return {object} A random choice object from the array
     */
    Frequent.choose = function(choices) {
        return choices[Math.floor(Frequent.random() * choices.length)];
    };
    /**
     * Returns true if the object is a HTMLElement, otherwise false.
     * @method isElement
     * @param {object} obj
     * @return {boolean} True if the object is a HTMLElement, otherwise false
     */
    Frequent.isElement = function(obj) {
        // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
        try {
            return obj instanceof HTMLElement;
        }
        catch(e){
            return (typeof obj==="object") &&
              (obj.nodeType===1) && (typeof obj.style === "object") &&
              (typeof obj.ownerDocument ==="object");
        }
    };
    /**
     * Returns true if the object is an array.
     * @method isArray
     * @param {object} obj
     * @return {boolean} True if the object is an array, otherwise false
     */
    Frequent.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    /**
     * Returns true if the object is a function.
     * @method isFunction
     * @param {object} obj
     * @return {boolean} True if the object is a function, otherwise false
     */
    Frequent.isFunction = function(obj) {
        return typeof obj === "function";
    };
    /**
     * Returns true if the object is a plain object.
     * @method isPlainObject
     * @param {object} obj
     * @return {boolean} True if the object is a plain object, otherwise false
     */
    Frequent.isPlainObject = function(obj) {
        return typeof obj === 'object' && obj.constructor === Object;
    };
    /**
     * Returns true if the object is a string.
     * @method isString
     * @param {object} obj
     * @return {boolean} True if the object is a string, otherwise false
     */
    Frequent.isString = function(obj) {
        return toString.call(obj) === '[object String]';
    };
    /**
     * Returns the sign of the given value.
     * @method sign
     * @param {number} value
     * @return {number} -1 if negative, +1 if 0 or positive
     */
    Frequent.sign = function(value) {
        return value < 0 ? -1 : 1;
    };
    /**
     * Converts a CSS hex colour string into an integer.
     * @method colorToNumber
     * @param {string} colorString
     * @return {number} An integer representing the CSS hex string
     */
    Frequent.colorToNumber = function(colorString) {
        colorString = colorString.replace('#','');

        if (colorString.length == 3) {
            colorString = colorString.charAt(0) + colorString.charAt(0)
                        + colorString.charAt(1) + colorString.charAt(1)
                        + colorString.charAt(2) + colorString.charAt(2);
        }

        return parseInt(colorString, 16);
    };
    /**
     * Returns the next unique sequential ID.
     * @method nextId
     * @return {Number} Unique sequential ID
     */
    Frequent.nextId = function() {
        return Frequent._nextId++;
    };
    /**
     * A cross browser compatible indexOf implementation.
     * @method indexOf
     * @param {array} haystack
     * @param {object} needle
     * @return {number} The position of needle in haystack, otherwise -1.
     */
    Frequent.indexOf = function(haystack, needle) {
        if (haystack.indexOf)
            return haystack.indexOf(needle);

        for (var i = 0; i < haystack.length; i++) {
            if (haystack[i] === needle)
                return i;
        }

        return -1;
    };
    /**
     * A cross browser compatible array map implementation.
     * @method map
     * @param {array} list
     * @param {function} func
     * @return {array} Values from list transformed by func.
     */
    Frequent.map = function(list, func) {
        if (list.map) {
            return list.map(func);
        }

        var mapped = [];

        for (var i = 0; i < list.length; i += 1) {
            mapped.push(func(list[i]));
        }

        return mapped;
    };
})();

//exports
const FDate     = Frequent.Date;
const FMath     = Frequent.Math;
const FRegex    = Frequent.Regex;

export { Frequent,
         FDate,
         FMath,
         FRegex } ;
