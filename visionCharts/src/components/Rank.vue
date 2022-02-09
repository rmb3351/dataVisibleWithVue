<template>
  <div class="com-container">
    <div class="com-chart" ref="chart_rank"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "Rank",
  data() {
    return {
      rankChart: null,
      chartData: null,
      startValue: 0,
      endValue: 9,
      timerId: null,
    };
  },
  computed: {
    ...mapState(["theme"]),
  },
  watch: {
    // 监听到theme变化时回调的函数
    theme() {
      // 销毁已有图表并重新初始化图表
      this.rankChart.dispose();
      this.initChart();
      this.updateChart();
    },
  },
  methods: {
    initChart() {
      this.rankChart = this.$echarts.init(this.$refs.chart_rank, this.theme);
      let initOption = {
        title: {
          text: "| 地区销售排行",
          left: 20,
          top: 20,
        },
        xAxis: {
          type: "category",
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            type: "bar",
          },
        ],
        grid: {
          containLabel: true,
          top: "40%",
          left: "5%",
          right: "5%",
          bottom: "5%",
        },
        tooltip: {
          show: true,
        },
      };
      this.rankChart.setOption(initOption);
      // this.getChartData();
      this.autoResize();
      window.addEventListener("resize", this.autoResize);

      this.rankChart.on("mouseover", () => {
        clearInterval(this.timerId);
      });
      this.rankChart.on("mouseout", () => {
        this.startInterval();
      });
    },
    getChartData(chartData) {
      // const { data: chartData } = await this.$axios.get("rank");
      this.chartData = chartData;
      this.chartData.sort((a, b) => {
        return b.value - a.value;
      });
      this.updateChart();
      // 启动控制显示数据区间的定时器并且监听鼠标的悬停和移出
      this.startInterval();
    },
    updateChart() {
      // 省份名数组以及省份值数组
      const provinceArr = this.chartData.map((item) => item.name);
      const valueArr = this.chartData.map((item) => item.value);
      // 颜色数组，在做渐变时取其中某个元素数组的两个值分别作为起始值和结束值
      const colorArr = [
        ["#0BA82C", "#4FF778"],
        ["#2E72BF", "#23E5E5"],
        ["#5052EE", "#AB6EE5"],
      ];
      // 用来存放上面元素数组的数组
      let currentColorArr = [];
      let dataOption = {
        xAxis: {
          data: provinceArr,
        },
        series: [
          {
            data: valueArr,
            itemStyle: {
              color: (arg) => {
                if (arg.value > 300) {
                  currentColorArr = colorArr[0];
                } else if (arg.value > 200) {
                  currentColorArr = colorArr[1];
                } else {
                  currentColorArr = colorArr[2];
                }
                return new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: currentColorArr[0],
                  },
                  {
                    offset: 1,
                    color: currentColorArr[1],
                  },
                ]);
              },
            },
          },
        ],
        // 显示的数据区间
        dataZoom: {
          show: false,
          startValue: this.startValue,
          endValue: this.endValue,
        },
      };
      this.rankChart.setOption(dataOption);
    },
    autoResize() {
      let fontSize = (this.$refs.chart_rank.offsetWidth / 100) * 3.6;
      let adaptOption = {
        title: {
          textStyle: {
            fontSize: fontSize,
          },
        },
        series: [
          {
            barWidth: fontSize,
            itemStyle: {
              // 数组的四个元素分别代表左上右上右下左下四个角落，如果没设置够四个则会按照斜对角默认相同
              barBorderRadius: [fontSize / 2, fontSize / 2, 0, 0],
            },
          },
        ],
      };
      this.rankChart.setOption(adaptOption);
      this.rankChart.resize();
    },
    // 用于让数据区间移动的计时器
    startInterval() {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      this.timerId = setInterval(() => {
        this.startValue++;
        this.endValue++;
        if (this.endValue > this.chartData.length - 1) {
          // 越界后回到初始位置
          this.startValue = 0;
          this.endValue = 9;
        }
        // 区间下标改变后调用updateChart方法就可以直接更新界面
        this.updateChart();
      }, 2000);
    },
  },
  created() {
    // 组件创建完成后就注册获取数据的回调函数
    this.$socket.registerCallBack("rankData", this.getChartData);
  },
  mounted() {
    this.initChart();
    // 在这里发送请求，getChartData就不用发送请求了。但是也可能有问题，比如直接刷新时可能这里已经发送请求了，但是在main.js里实例对象还没连接成功，就会报错，所以在socket_service里做优化
    this.$socket.send({
      action: "getData",
      socketType: "rankData",
      chartName: "rank",
      value: "",
    });
  },
  destroyed() {
    window.removeEventListener("resize", this.autoResize);
    // 销毁时移出回调函数
    this.$socket.removeCallBack("rankData");
    clearInterval(this.timerId);
  },
};
</script>

<style scoped></style>
