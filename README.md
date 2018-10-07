# XFramework

面向"常青树"浏览器的前端组件化开发框架。

Proxy + WebComponnets + Virtual DOM，更快更彻底的组件化开发。

## 开始

npm 安装：

```
npm install xframeworkjs --save
```

## 组件

### 定义组件

hello-world.html：

```html
<template>
  <div class="text" onclick="alert('点击')">
    <h2>name: {{framework.name}}</h2>
    <h3>version: {{framework.version}}</h3>
    <p>{{message}}</p>
  </div>
</template>

<script>
  XF.component('hello-world', {
    data: {
      framework: {
        name: 'xframework',
        version: '0.0.1'
      },
      message: ''
    },
    created: function () {
      console.log('created');
      this.data.framework.version = '0.0.2';
      this.data.message = '面向"常青树"浏览器的前端框架';
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

### 使用组件

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XFramework-Compile</title>
  <script src="./xframework.js"></script>
  <link rel="import" href="hello-world.html">
</head>

<body>
  <hello-world></hello-world>
</body>

</html>
```

## 路由

### 定义路由

```html
<router-view>
  <!-- matches an exact path -->
  <route-view path="/home" import="/pages/home-page.html"></route-view>
  <route-view path="/component" import="/pages/component-page.html"></route-view>
  <route-view path="/params/:pid" import="/pages/params-page.html"></route-view>
</router-view>
```

### 路由导航

```html
<a href="#/home">首页</a>
```

### 监听路由

```js
document.querySelector("router-view")
  .addEventListener("routeChangeSuccess", function(e) {
    console.log(e.detail);
  });
```

## 参考

- [polymer](https://www.polymer-project.org/)
- [slim.js](https://github.com/slimjs/slim.js)
- [Claylump](https://github.com/ahomu/Claylump)
- [app-router](https://github.com/erikringsmuth/app-router)
