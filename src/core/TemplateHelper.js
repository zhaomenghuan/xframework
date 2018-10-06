export default {
  register: function(name, func) {
    this[name] = func;
  }
};