import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    // 由于theme是home和components里所有vue组件都需要用的数据，所以在vuex里使用和修改
    theme: "chalk",
  },
  mutations: {
    changeTheme(state) {
      state.theme = state.theme === "chalk" ? "vintage" : "chalk";
    },
  },
  actions: {},
  modules: {},
});
