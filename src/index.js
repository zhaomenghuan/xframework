import Observer from "./core/observer";
import Element from "./core/element";
import TemplateCompiler from "./core/template-compiler";

let REGISTRY_CLAY_ELEMENTS = {};
class XFramework {
  constructor(options = {}) {
    this.$options = options;
    this.data = new Observer(options.data);
  }
}

// 全局配置
XFramework.config = {
  debug: true
}

// 运行时
XFramework.runtime = {
  compiler: TemplateCompiler
};

// 注册组件
XFramework.component = function(name, proto) {
  // already registered
  if (REGISTRY_CLAY_ELEMENTS[name]) {
    return;
  }

  let options = {
    prototype: Element.create(name, proto)
  };

  if (proto.extends && !helper.isCustomElementName(proto.extends)) {
    options.extends = proto.extends;
  }

  REGISTRY_CLAY_ELEMENTS[name] = window.document.registerElement(
    name,
    options
  );
};

if (window != undefined) {
  window.XF = XFramework;
}

export default XFramework;
