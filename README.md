# XFramework

面向"常青树"浏览器的前端框架。

## 用法

### 定义组件

```html
<template x-element="hello-world">
  <div class="text" onclick="alert('点击')">
    <h1>Hello World</h1>
    <h2>name: {{name}}</h2>
    <h3>version: {{version}}</h3>
    <p>{{message}}</p>
  </div>
</template>

<script>
  XF.component('hello-world', {
    data: {
      name: 'xframework',
      version: '0.0.1'
    },
    created: function () {
      console.log('created');

      this.data.message = '面向"常青树"浏览器的前端框架';

      // update (diff & patch) DOM!
      this.invalidate();
    },
    attached: function () {
      console.log('attached');
      this.root.style.backgroundColor = "#eee";
    },
    attrChanged: function () {
      console.log('attrChanged');
    },
    detached: function () {
      console.log('detached');
    }
  });
</script>

<style>
  :host {
    color: #383838;
  }
</style>
```

## TODO

- 事件支持
- 指令支持

## 参考

- [slim.js](https://github.com/slimjs/slim.js)
- [polymer](https://www.polymer-project.org/)
- [Claylump](https://github.com/ahomu/Claylump)