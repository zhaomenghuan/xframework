"use strict";

import Observer from "./observer";
import helper from "./helper";
import template from "./template";

let REGISTRY_CLAY_PROTOTYPES = {};

export default {
  /**
   * @static
   * @param {String} name
   * @param {Object} proto
   * @returns {ClayElement}
   */
  create: function(name, proto) {
    let defaults = {
      /**
       * @private
       * @property {Document} _doc
       */
      _doc: document._currentScript
        ? document._currentScript.ownerDocument
        : document.currentScript
          ? document.currentScript.ownerDocument
          : document,

      /**
       * @private
       * @method {Function} _created
       */
      _created: helper.isFunction(proto.created) ? proto.created : helper.noop,

      /**
       * @private
       * @method {Function} _attached
       */
      _attached: helper.isFunction(proto.attached)
        ? proto.attached
        : helper.noop,

      /**
       * @private
       * @method {Function} _detached
       */
      _detached: helper.isFunction(proto.detached)
        ? proto.detached
        : helper.noop,

      /**
       * @private
       * @method {Function} _attrChanged
       */
      _attrChanged: helper.isFunction(proto.attrChanged)
        ? proto.attrChanged
        : helper.noop,

      /**
       * @private
       * @property {String} _html
       */
      _html: "",

      /**
       * @property {Element} root
       */
      root: null,

      /**
       * @property {Template} template
       */
      template: null,

      /**
       * @property {Object} data
       */
      data: {}
    };

    // defaults
    helper.mix(proto, defaults);

    // dom ready required
    helper.ready(function() {
      var template = proto._doc.querySelector('template');
      proto._html = template ? template.innerHTML : "";
    });

    // extends element
    var extendsProto;
    if (proto.extends) {
      // FIXME cannot use `is="x-child"` in `<template>`
      if (
        helper.isCustomElementName(proto.extends) &&
        (extendsProto = getExtendee(proto.extends))
      ) {
        // extends custom element
        // FIXME create baseElements prototype by deeply clone
        helper.mix(proto.data, extendsProto.data);
        helper.mix(proto.use, extendsProto.use);
        helper.mix(proto, extendsProto);
        proto.__super__ = extendsProto;
        extendsProto = HTMLElement.prototype;
      } else {
        extendsProto = Object.create(
          proto._doc.createElement(proto.extends).constructor
        ).prototype;
      }
    } else {
      // new custom element
      extendsProto = HTMLElement.prototype;
    }

    // register prototype for extends
    REGISTRY_CLAY_PROTOTYPES[name] = helper.clone(proto);

    // mix claylump implementation
    helper.mix(proto, ElementImpl, true);

    return helper.mix(Object.create(extendsProto), proto);
  }
};

function getExtendee(name) {
  var proto = REGISTRY_CLAY_PROTOTYPES[name];
  if (!proto) {
    throw new Error("Could not extends `" + name + "`, because not registered");
  }
  return proto;
}

/**
 * @implements Element
 */
var ElementImpl = {
  /**
   * protect object reference in prototype.data
   *
   * @private
   */
  _cloneDataObjects: function() {
    var data = this.data,
      keys = Object.keys(data),
      i = 0,
      key;

    while ((key = keys[i++])) {
      if (typeof data[key] === "object") {
        // FIXME create own object|array by deeply clone
        data[key] = helper.clone(data[key]);
      }
    }

    // Observer data
    this.data = new Observer(data, this);
  },

  /**
   * shorthand of `template.invalidate()`
   */
  invalidate: function() {
    this.template.invalidate();
  },

  /**
   * children finder
   *
   * @param {String} selector
   * @returns {?Element|Array}
   */
  find: function(selector) {
    var found = helper.toArray(this.root.querySelectorAll(selector));

    if (found.length <= 1) {
      return found[0] || null;
    } else {
      return found;
    }
  },

  /**
   * closest parent helper
   *
   * @param {Element|Array} el
   * @param {String} selector
   * @returns {?Element|Array}
   */
  closestOf: function(el, selector) {
    if (helper.isArray(el)) {
      return el.map(e => this.closestOf(e, selector));
    }

    var current = /** @type {Element} */ el.parentNode;
    do {
      if (current === this.root) {
        return null;
      }
      if (helper.matchElement(current, selector)) {
        return current;
      }
    } while ((current = current.parentNode));

    return null;
  },

  /**
   * an instance of the element is created
   * execute several initialize processes
   */
  createdCallback() {
    // create virtual template & actual dom
    this.createShadowRoot();
    this.template = template.create(this._html, this.data);

    this.root = this.template.createElement(this._doc);
    if (!this.root) {
      this.root = this._doc.createElement("div");
    }

    // set root element
    let style = this._doc.querySelector("style");
    if (style != null) {
      this.shadowRoot.appendChild(style);
    }
    this.shadowRoot.appendChild(this.root);
    this.template.drawLoop(this.root);

    // clone objects
    this._cloneDataObjects();

    // original
    this._created.apply(this, arguments);
  },

  /**
   * an instance was inserted into the document
   * call original attached callback
   */
  attachedCallback: function() {
    // this.delegateModuleCallbacks("attachedCallback");

    // original
    this._attached.apply(this, arguments);
  },

  /**
   * an instance was removed from the document
   * call original detached callback
   */
  detachedCallback: function() {
    // this.delegateModuleCallbacks("detachedCallback");

    // original
    this._detached.apply(this, arguments);
  },

  /**
   * an attribute was added, removed, or updated
   * call original attr changed callback
   */
  attributeChangedCallback: function() {
    // original
    this._attrChanged.apply(this, arguments);
  },

  /**
   *
   * @param {String} callbackMethod
   */
  delegateModuleCallbacks: function(callbackMethod) {
    var aliases = Object.keys(this.use),
      alias,
      module,
      callback,
      i = 0;

    while ((alias = aliases[i++])) {
      module = this[alias];
      callback = module[callbackMethod];
      if (helper.isFunction(callback)) {
        callback.apply(module, [this]);
      }
    }
  },

  /**
   * call super element's methods
   *
   * @param {String} methodName
   * @param {...*} args
   */
  super: function(methodName, ...args) {
    if (!this.__super__) {
      throw new Error("This element does not have the `__super__`");
    }

    var superMethod = this.__super__[methodName];

    if (helper.isFunction(superMethod)) {
      return superMethod.apply(this, args);
    } else {
      throw new Error(
        "Does not exists method in super element specified: " + superMethod
      );
    }
  }
};
