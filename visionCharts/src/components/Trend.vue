<template>
  <div class="com-container">
    <div class="title" :style="adaptedFont">
      <span class="current-title">{{ currentTitle }}</span
      ><span
        class="iconfont title-icon"
        @click="isChiocesShow = !isChiocesShow"
        :style="adaptedFont"
      ></span>
      <div class="select" v-show="isChiocesShow">
        <!-- 返回数组的key刚好可以作为唯一性标识,还可以作为更换图表时的type参数 -->
        <div
          class="select-item"
          v-for="item in selectableTitles"
          :key="item.key"
          @click="chooseAnotherType(item.key)"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="com-chart" ref="chart_line"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { getThemeValue } from "../utils/theme_utils";
export default {
  name: "Trend",
  data() {
    return {
      trendChart: null,
      chartData: null,
      isChiocesShow: false,
      chosenType: "map",
      fontSize: 0,
      // currentPage: 1,
      // totalPage: 1,
      // timerId: 0,
    };
  },
  computed: {
    // 获取可选标题的数组
    selectableTitles() {
      if (this.chartData === null) {
        return [];
      } else {
        // 把和当前type相同的给过滤掉(返回true时将item添加进返回的数组，否则不添加)
        return this.chartData.type.filter(
          (item) => item.key !== this.chosenType
        );
      }
    },
    currentTitle() {
      if (this.chartData === null) {
        return "";
      } else {
        return this.chartData[this.chosenType].title;
      }
    },
    // 用计算属性添加样式，注意连字符连接的键跟vue组件命名方式相同，字母大写
    adaptedFont() {
      return {
        fontSize: this.fontSize + "px",
        color: getThemeValue(this.theme).titleColor,
      };
    },
    ...mapState(["theme"]),
  },
  watch: {
    // 监听到theme变化时回调的函数
    theme() {
      // 销毁已有图表并重新初始化图表
      this.trendChart.dispose();
      this.initChart();
      this.updateChart();
    },
  },
  methods: {
    initChart() {
      this.trendChart = this.$echarts.init(this.$refs.chart_line, this.theme);
      let initOption = {
        grid: {
          left: "3%",
          top: "35%",
          right: "4%",
          bottom: "1%",
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          left: 20,
          top: "15%",
          icon: "circle",
        },
        // 折线图必须要设置x轴和y轴的配置，就算是单纯的type:value/catrgory也不能漏掉，否则报错
        xAxis: {
          data: "category",
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
        },
      };
      this.trendChart.setOption(initOption);
      // this.getChartData();
      this.autoResize();
      window.addEventListener("resize", this.autoResize);
    },
    getChartData(chartData) {
      // const { data: chartData } = await this.$axios.get("trend");
      this.chartData = chartData;
      this.updateChart();
    },
    updateChart() {
      // 月份数组，放在类目轴的data里
      const timeArr = this.chartData.common.month;
      // 地区销量数组,根据选择的类型获取相应数据
      const valueArr = this.chartData[this.chosenType].data;
      // offset为0和1的时候的颜色数组
      const colorArr0 = [
        "rgba(11,168,44,0.5)",
        "rgba(44,110,255,0.5)",
        "rgba(22,242,217,0.5)",
        "rgba(254,33,30,0.5)",
        "rgba(250,105,0,0.5)",
      ];
      const colorArr1 = [
        "rgba(11,168,44,0)",
        "rgba(44,110,255,0)",
        "rgba(22,242,217,0)",
        "rgba(254,33,30,0)",
        "rgba(250,105,0,0)",
      ];
      //通过解构把series里的name和data获取,因为这里放的是对象数组，所以要把series里每个对象的要用的属性全部解构并放在这里，即使是确定的属性也无法分离
      const seriesArr = valueArr.map((item, index) => {
        return {
          name: item.name,
          data: item.data,
          type: "line",
          stack: this.chosenType,
          areaStyle: {
            color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colorArr0[index] },
              { offset: 1, color: colorArr1[index] },
            ]),
          },
        };
      });
      // 图例的data必须和series的name一一对应,否则图例不生效,注意这里省略return的时候一定要省略{}，不然会获取五个undefined，估计是作用域问题
      const legendArr = valueArr.map((item) => item.name);
      let dataOption = {
        xAxis: {
          data: timeArr,
        },
        legend: {
          data: legendArr,
        },
        series: [...seriesArr],
      };
      this.trendChart.setOption(dataOption);
    },
    autoResize() {
      this.fontSize = (this.$refs.chart_line.offsetWidth / 100) * 3.6;
      let adaptOption = {
        legend: {
          itemWidth: this.fontSize,
          itemHeight: this.fontSize,
          itemGap: this.fontSize,
          textStyle: {
            fontSize: this.fontSize / 2,
          },
        },
      };
      this.trendChart.setOption(adaptOption);
      this.trendChart.resize();
    },
    // 把获取的图表改成选中的图表
    chooseAnotherType(type) {
      this.chosenType = type;
      this.updateChart();
      this.isChiocesShow = !this.isChiocesShow;
    },
  },
  created() {
    // 组件创建完成后就注册获取数据的回调函数
    this.$socket.registerCallBack("trendData", this.getChartData);
  },
  mounted() {
    this.initChart();
    // 在这里发送请求，getChartData就不用发送请求了。但是也可能有问题，比如直接刷新时可能这里已经发送请求了，但是在main.js里实例对象还没连接成功，就会报错，所以在socket_service里做优化
    this.$socket.send({
      action: "getData",
      socketType: "trendData",
      chartName: "trend",
      value: "",
    });
  },
  destroyed() {
    window.removeEventListener("resize", this.autoResize);
    // 销毁时移出回调函数
    this.$socket.removeCallBack("trendData");
  },
};
</script>

// less类型的文件
<style lang="less" scoped>
.title {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  color: white;
  .title-icon::after {
    content: "\e6eb";
    margin-left: 10px;
    cursor: pointer;
  }
}
</style>
