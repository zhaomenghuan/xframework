import * as htmlParser from "htmlparser";
import helper from "./helper";

const REX_INTERPOLATE_SYMBOL = /{{[^{}]+}}/g;
const REX_REPEAT_SYMBOL = /{{(\w+)\sin\s([\w\.]+)}}/;
const STR_REPEAT_ATTRIBUTE = "x-repeat";
const STR_IF_ATTRIBUTE = "x-if";
const STR_UNLESS_ATTRIBUTE = "x-unless";
const STR_EVAL_FUNCTION_SYMBOL = "__EVAL_FUNCTION__";

export default {
  /**
   * @static
   * @returns {TemplateCompiler}
   */
  create: function() {
    return new TemplateCompiler();
  }
};

/**
 * @class TemplateCompiler
 */
class TemplateCompiler {
  /**
   * @constructor
   */
  constructor() {}

  /**
   * @typedef {Object} DomStructure
   * @property {?String} data
   * @property {Object.<string, string>} attribs
   * @property {String} style
   * @property {TplEvaluators} evaluators
   * @property {Array.<DomStructure>} children
   */

  /**
   * @typedef {Object} TplEvaluators
   * @property {Object.<string, function>} attrs
   * @property {?Function} style
   * @property {?Function} data
   * @property {?Function} repeat
   */

  /**
   * @param {String} html
   * @returns {DomStructure}
   */
  compileFromHtml(html) {
    var parsed = this.parseHtml(html);
    this.preCompile = false;
    return this.compileDomStructure(parsed);
  }

  /**
   * @param {String} html
   * @returns {String}
   */
  serializeFromHtml(html) {
    var parsed = this.parseHtml(html);
    this.preCompile = true;
    return JSON.stringify(this.compileDomStructure(parsed));
  }

  parseHtml(html) {
    let handler = new htmlParser.DefaultHandler(
      (err, dom) => {
        if (err) {
          console.error(err);
        }
      },
      {
        enforceEmptyTags: true,
        ignoreWhitespace: true,
        verbose: false
      }
    );
    let parser = new htmlParser.Parser(handler);

    // parse html
    parser.parseComplete(html);
    if (handler.dom.length > 1) {
      throw Error("Template must have exactly one root element. was: " + html);
    }

    return handler.dom[0];
  }

  /**
   * @destructive
   * @param {Object} domStructure
   */
  compileDomStructure(domStructure = {}) {
    var data = domStructure.data,
      attrs = domStructure.attribs || {},
      children = domStructure.children || [],
      evals = (domStructure.evaluators = {
        attrs: {},
        style: null,
        data: null,
        if: null,
        unless: null,
        repeat: null
      }),
      keys,
      key,
      i = 0;

    // styles evaluator
    if (attrs.style) {
      domStructure.style = attrs.style;
      evals.style = this.compileValue(domStructure.style);
      delete attrs.style; // delete from orig attrib object
    }

    // attributes evaluator
    keys = Object.keys(attrs);
    while ((key = keys[i++])) {
      // repeat
      if (key === STR_REPEAT_ATTRIBUTE) {
        evals.repeat = this.compileRepeatExpression(
          attrs[STR_REPEAT_ATTRIBUTE]
        );
        delete attrs[STR_REPEAT_ATTRIBUTE]; // delete from orig attrib object
      }
      // if
      else if (key === STR_IF_ATTRIBUTE) {
        evals.if = this.compileIfExpression(attrs[STR_IF_ATTRIBUTE]);
        delete attrs[STR_IF_ATTRIBUTE]; // delete from orig attrib object
      }
      // unless
      else if (key === STR_UNLESS_ATTRIBUTE) {
        evals.unless = this.compileUnlessExpression(
          attrs[STR_UNLESS_ATTRIBUTE]
        );
        delete attrs[STR_UNLESS_ATTRIBUTE]; // delete from orig attrib object
      }
      // interpolate
      else {
        evals.attrs[key] = this.compileValue(attrs[key]);
      }
    }

    // data (text) evaluator
    evals.data = this.compileValue(data);

    // recursive
    children.forEach(child => this.compileDomStructure(child));

    return domStructure;
  }

  /**
   * @param {String} str
   * @returns {?Function}
   */
  compileValue(str) {
    str = str || "";
    var matches = str.match(REX_INTERPOLATE_SYMBOL),
      funcBody;

    if (matches === null) {
      return null;
    }

    if (str === matches[0]) {
      // return primitive value (for hook)
      funcBody = "return data." + str.slice(2, -2) + ";";
    } else {
      // return processed string
      funcBody = [
        "var s=[];",
        "s.push('",
        str
          .replace(/[\r\n\t]/g, " ")
          .split("'")
          .join("\\'")
          .replace(/{{([^{}]+)}}/g, "',(data.$1 != null ? data.$1 : ''),'")
          .split(/\s{2,}/)
          .join(" "),
        "');",
        "return s.join('');"
      ].join("");
    }

    var funcObj = {
      [STR_EVAL_FUNCTION_SYMBOL]: true,
      args: ["data", funcBody]
    };
    return this.preCompile ? funcObj : helper.invoke(Function, funcObj.args);
  }

  /**
   * @param {String} repeatExpr
   * @returns {Function|Object}
   */
  compileRepeatExpression(repeatExpr) {
    var matches = (repeatExpr || "").match(REX_REPEAT_SYMBOL);

    if (matches === null) {
      throw new Error("Unexpected syntax for repeat: " + repeatExpr);
    }

    var [, childScopeName, parentTargetPath] = matches;

    var funcObj = {
      [STR_EVAL_FUNCTION_SYMBOL]: true,
      args: [
        "data",
        [
          "return data." + parentTargetPath + ".map(function(item) {",
          "  var ks, k, i = 0, r = {};",
          "  ks = Object.keys(data);",
          "  while ((k = ks[i++])) {",
          "    r[k] = data[k];",
          "  }",
          "  r." + childScopeName + " = item;",
          "  return r;",
          "});"
        ].join("")
      ]
    };
    return this.preCompile ? funcObj : helper.invoke(Function, funcObj.args);
  }

  /**
   * @param {String} ifExpr
   * @returns {Function|Object}
   */
  compileIfExpression(ifExpr) {
    ifExpr = ifExpr || "";
    var matches = ifExpr.match(REX_INTERPOLATE_SYMBOL);

    if (matches === null) {
      return null;
    }

    var funcObj = {
      [STR_EVAL_FUNCTION_SYMBOL]: true,
      // return primitive value
      args: ["data", "return data." + ifExpr.slice(2, -2) + ";"]
    };

    return this.preCompile ? funcObj : helper.invoke(Function, funcObj.args);
  }

  /**
   * @param {String} unlessExpr
   * @returns {Function|Object}
   */
  compileUnlessExpression(unlessExpr) {
    unlessExpr = unlessExpr || "";
    var matches = unlessExpr.match(REX_INTERPOLATE_SYMBOL);

    if (matches === null) {
      return null;
    }

    var funcObj = {
      [STR_EVAL_FUNCTION_SYMBOL]: true,
      // return primitive value
      args: ["data", "return data." + unlessExpr.slice(2, -2) + ";"]
    };

    return this.preCompile ? funcObj : helper.invoke(Function, funcObj.args);
  }
}
