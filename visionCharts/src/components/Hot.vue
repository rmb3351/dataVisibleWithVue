<template>
  <div class="com-container">
    <span class="iconfont arr-left" @click="toPrev" :style="cpnStyle"></span>
    <div class="com-chart" ref="chart_hot"></div>
    <span class="iconfont arr-right" @click="toNext" :style="cpnStyle"></span>
    <div class="cat-name" :style="cpnStyle">{{ catName }}</div>
  </div>
</template>

<script>
// 把mapState里的theme引入作为计算属性，方便监听theme变化
import { mapState } from "vuex";
import { getThemeValue } from "../utils/theme_utils";
export default {
  name: "Hot",
  data() {
    return {
      hotChart: null,
      chartData: null,
      currentIndex: 0,
      fontSize: 0,
    };
  },
  computed: {
    catName() {
      if (!this.chartData) {
        return "";
      } else {
        return this.chartData[this.currentIndex].name;
      }
    },
    // 控制组件的文字样式
    cpnStyle() {
      return {
        fontSize: this.fontSize + "px",
        color: getThemeValue(this.theme).titleColor,
      };
    },
    // 相当于把vuex的state的theme作为计算属性映射过来
    ...mapState(["theme"]),
  },
  watch: {
    // 监听到theme变化时回调的函数
    theme() {
      // 销毁已有图表并重新初始化图表
      this.hotChart.dispose();
      this.initChart();
      this.updateChart();
    },
  },
  methods: {
    initChart() {
      this.hotChart = this.$echarts.init(this.$refs.chart_hot, this.theme);
      let initOption = {
        title: {
          text: "| 热销商品占比",
          left: 20,
          top: 20,
        },
        legend: {
          top: "15%",
          icon: "circle",
        },
        tooltip: {
          show: true,
          // 接收回调函数返回的字符串作为显示内容
          formatter: (arg) => {
            let total = 0;
            // 这里的arg.data.children其实就是updateChart里的seriesItem
            let thirdCategory = arg.data.children;
            // 先计算总数，再计算每项占比，然后把数据拼接到模板字符串里
            thirdCategory.forEach((item) => {
              total += item.value;
            });
            let showStr = ``;
            thirdCategory.forEach((item) => {
              showStr += `${item.name}:${((item.value / total) * 100).toFixed(
                2
              )}%<br>`;
            });
            return showStr;
          },
        },
        series: [
          {
            type: "pie",
            label: {
              show: false,
            },
            // 鼠标悬停时高亮的样式
            emphasis: {
              label: {
                show: true,
              },
              labelLine: {
                show: false,
              },
            },
          },
        ],
      };
      this.hotChart.setOption(initOption);
      // this.getChartData();
      this.autoResize();
      window.addEventListener("resize", this.autoResize);
    },
    // 这个chartData是在websocket的connect方法里.call调用时传入的chartData
    getChartData(chartData) {
      // const { data: chartData } = await this.$axios.get("hotproduct");
      this.chartData = chartData;
      this.updateChart();
    },
    updateChart() {
      // 这个数组里放的是每个饼图里的数据，作为series里的一个对象的data
      let seriesItem = this.chartData[this.currentIndex].children.map(
        (item) => {
          return {
            name: item.name,
            value: item.value,
            // 获取children是为了在tooltip的formatter里arg能获取到
            children: item.children,
          };
        }
      );
      let dataOption = {
        series: [
          {
            data: seriesItem,
          },
        ],
      };
      this.hotChart.setOption(dataOption);
    },
    autoResize() {
      this.fontSize = (this.$refs.chart_hot.offsetWidth / 100) * 3.6;
      let adaptOption = {
        title: {
          textStyle: {
            fontSize: this.fontSize,
          },
        },
        legend: {
          itemWidth: this.fontSize,
          itemHeight: this.fontSize,
          itemGap: this.fontSize / 2,
          textStyle: {
            fontSize: this.fontSize / 2,
          },
        },
        series: [
          {
            radius: this.fontSize * 4.5,
            center: ["50%", "60%"],
          },
        ],
      };
      this.hotChart.setOption(adaptOption);
      this.hotChart.resize();
    },
    // 两个切换图表的方法
    toNext() {
      this.currentIndex++;
      if (this.currentIndex > this.chartData.length - 1) {
        this.currentIndex = 0;
      }
      this.updateChart();
    },
    toPrev() {
      this.currentIndex--;
      if (this.currentIndex < 0) {
        this.currentIndex = this.chartData.length - 1;
      }
      this.updateChart();
    },
  },
  created() {
    // 组件创建完成后就注册获取数据的回调函数
    this.$socket.registerCallBack("hotData", this.getChartData);
  },
  mounted() {
    this.initChart();
    // 在这里发送请求，getChartData就不用发送请求了。但是也可能有问题，比如直接刷新时可能这里已经发送请求了，但是在main.js里实例对象还没连接成功，就会报错，所以在socket_service里做优化
    this.$socket.send({
      action: "getData",
      socketType: "hotData",
      chartName: "hot",
      value: "",
    });
  },
  destroyed() {
    window.removeEventListener("resize", this.autoResize);
    // 销毁时移出回调函数
    this.$socket.removeCallBack("hotData");
  },
};
</script>

<style scoped>
.arr-left::before,
.arr-right::after {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}
.arr-left::before {
  content: "\e6ef";
  left: 10%;
  /* 由于放在chart初始化的元素之前的元素会被chart覆盖，不加z-index的话左边的箭头没有这个cursor效果 */
  z-index: 1;
}
.arr-right::after {
  content: "\e6ed";
  right: 10%;
}
.cat-name {
  position: absolute;
  left: 80%;
  bottom: 10%;
  color: white;
}
</style>
