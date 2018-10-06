class Observer {
  /**
   * 创建数据观察者实例
   * @param {Object} data 
   */
  constructor(data) {
    if (!data || typeof data !== "object") {
      return;
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
        return Reflect.set(data, key, value);
      }
    });
  }
}

export default Observer;
