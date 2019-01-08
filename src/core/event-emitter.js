"use strict";

class EventEmitter {
  constructor() {
    this.events = {};
    this.nextGuid = -1;
  }

  on(type, listener) {
    const events = this.events;
    if (!events.hasOwnProperty(type)) {
      events[type] = {};
    }

    let guid = "uuid_" + ++this.nextGuid;
    events[type][guid] = listener;
    return this;
  }

  once(type, listener) {
    function callback() {
      this.off(type, callback);
      Reflect.apply(listener, this, arguments);
    }
    this.on(type, callback);
    return this;
  }

  off(type, listener) {
    const events = this.events;
    if (!events.hasOwnProperty(type)) {
      return false;
    }

    const handlers = events[type];
    for (let [key, value] of Object.entries(handlers)) {
      if (handlers.hasOwnProperty(key) && listener === value) {
        delete handlers[key];
        return true;
      }
    }
    return false;
  }

  emit(type, ...args) {
    const events = this.events;
    const handlers = events[type];
    for (let listener of Object.values(handlers)) {
      Reflect.apply(listener, this, args);
    }
  }
}

export default EventEmitter;