class Observer {
  /**
   * 创建数据观察者实例
   * @param {Object} data
   */
  constructor(data, element) {
    if (!data || typeof data !== "object") {
      return;
    }
    if (element) {
      this.element = element;
    }
    return this.proxy(data);
  }

  /**
   * 代理方法
   * @param {*} data
   */
  proxy(data) {
    return new Proxy(data, {
      get: (target, key, receiver) => {
        return data[key];
      },
      set: (target, key, value) => {
        // update (diff & patch) DOM!
        this.element.invalidate();
        return Reflect.set(data, key, value);
      }
    });
  }
}

export default Observer;
