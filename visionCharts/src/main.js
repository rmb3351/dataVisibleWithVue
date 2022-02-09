import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import "./assets/css/normal.css";
import "./assets/font/iconfont.css";
import SocketService from "./utils/socket_service";
// 获取SocketService实例（由于Instance方法由get修饰，所以不用加()）并调用connect方法
SocketService.Instance.connect();
// 为了让组件可以使用socketservice，挂载到Vue原型上
Vue.prototype.$socket = SocketService.Instance;
//设置axios请求的基本路径
axios.defaults.baseURL = "http://localhost:8888/api/";
Vue.prototype.$axios = axios;

// 在vue原型对象里挂载$echarts属性，使用echarts全局对象
Vue.prototype.$echarts = window.echarts;
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
