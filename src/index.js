import Observer from "./core/Observer";
import element from "./core/Element";
import templateCompiler from "./core/TemplateCompiler";
import Router from "./modules/router/index";

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
  compiler: templateCompiler
};

// 注册组件
XFramework.component = function(name, proto) {
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

// 路由组件
XFramework.router = Router;

if (window != undefined) {
  window.XF = XFramework;
}

export default XFramework;
