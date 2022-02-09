import Vue from "vue";
import VueRouter from "vue-router";
// import SalesPage from "../views/SalesPage";
// import TrendPage from "../views/TrendPage";
// import MapPage from "../views/MapPage";
// import RankPage from "../views/RankPage";
// import HotPage from "../views/HotPage";
// import StockPage from "../views/StockPage";
import Home from "../views/Home";

Vue.use(VueRouter);

const routes = [
  // 配置销量页面的路由
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    component: Home,
  },
  // {
  //   path: "/salespage",
  //   component: SalesPage,
  // },
  // {
  //   path: "/trendpage",
  //   component: TrendPage,
  // },
  // {
  //   path: "/mappage",
  //   component: MapPage,
  // },
  // {
  //   path: "/rankpage",
  //   component: RankPage,
  // },
  // {
  //   path: "/hotpage",
  //   component: HotPage,
  // },
  // {
  //   path: "/stockpage",
  //   component: StockPage,
  // },
];

const router = new VueRouter({
  routes,
});

export default router;
