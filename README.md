# XFramework

面向"常青树"浏览器的前端框架。

## 用法

### 定义组件

```html
<template x-element="hello-world">
  <div>
    <h1>Hello World</h1>
    <h2>{{name}}</h2>
  </div>
</template>

<script>
  XF.component('hello-world', {
    data: {
      name: 'xframework'
    },
    createdCallback: function () {
      console.log('created');
      this.data.name = 'xframework 1.0';
      // update (diff & patch) DOM!
      this.invalidate();
    },
  });
</script>
```

## TODO

- 事件支持
- 指令支持

## 参考

- [slim.js](https://github.com/slimjs/slim.js)
- [polymer](https://www.polymer-project.org/)
- [Claylump](https://github.com/ahomu/Claylump)