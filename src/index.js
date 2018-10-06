import Observer from "./core/Observer";
import element from "./core/Element";
import templateCompiler from "./core/TemplateCompiler";

let REGISTRY_CLAY_ELEMENTS = {};

class XFramework {
  constructor(options = {}) {
    this.$options = options;
    this.data = new Observer(options.data);
  }
}

if (window) {
  window.XF = XFramework;

  window.XF.runtime = {
    compiler: templateCompiler
  };

  // 注册元素
  window.XF.component = function(name, proto) {
    // already registered
    if (REGISTRY_CLAY_ELEMENTS[name]) {
      return;
    }

    let options = {
      prototype: element.create(name, proto)
    };

    if (proto.extends && !helper.isCustomElementName(proto.extends)) {
      options.extends = proto.extends;
    }

    REGISTRY_CLAY_ELEMENTS[name] = window.document.registerElement(
      name,
      options
    );
  };
}

export default XFramework;
