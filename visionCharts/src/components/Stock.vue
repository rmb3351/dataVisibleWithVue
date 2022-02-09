<template>
  <div class="com-container">
    <div class="com-chart" ref="chart_stock"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "Stock",
  data() {
    return {
      stockChart: null,
      chartData: null,
      // 用来觉得显示哪五条数据
      currentPage: 1,
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
      this.stockChart.dispose();
      this.initChart();
      this.updateChart();
    },
  },
  methods: {
    initChart() {
      this.stockChart = this.$echarts.init(this.$refs.chart_stock, this.theme);
      let initOption = {
        title: {
          text: "| 库存与销量对比",
          left: 20,
          top: 20,
        },
      };
      this.stockChart.setOption(initOption);
      // this.getChartData();
      this.startInterval();
      this.autoResize();
      window.addEventListener("resize", this.autoResize);
      // 根据鼠标悬停和移出启停定时器
      this.stockChart.on("mouseover", () => {
        clearInterval(this.timerId);
      });
      this.stockChart.on("mouseout", () => {
        this.startInterval();
      });
    },
    getChartData(chartData) {
      // const { data: chartData } = await this.$axios.get("stock");
      this.chartData = chartData;
      this.updateChart();
    },
    updateChart() {
      const centerArr = [
        ["18%", "40%"],
        ["50%", "40%"],
        ["82%", "40%"],
        ["34%", "75%"],
        ["66%", "75%"],
      ];
      const colorArr = [
        ["#4FF778", "#0BA82C"],
        ["#E5DD45", "#E8B11C"],
        ["#E8821C", "#E55445"],
        ["#5052EE", "#AB6EE5"],
        ["#23E5E5", "#2E72BF"],
      ];
      // 根据当前页数觉得显示的数据
      let startIndex = (this.currentPage - 1) * 5;
      let endIndex = this.currentPage * 5;
      // 取出当前要展示的五个数据
      let currentData = this.chartData.slice(startIndex, endIndex);
      // 通过五个数据映射出series数组
      let seriesArr = currentData.map((item, index) => {
        return {
          center: centerArr[index],
          // 数据分别通过sales和stock保存到两个对象里，这样就能配合radius显示仪表盘的形式
          data: [
            {
              // 在数据对应的图形旁边显示的文字
              name: item.name + "\n\n" + item.sales,
              value: item.sales,
              itemStyle: {
                color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [
                  {
                    offset: 0,
                    color: colorArr[index][0],
                  },
                  {
                    offset: 1,
                    color: colorArr[index][1],
                  },
                ]),
              },
            },
            {
              value: item.stock,
              itemStyle: {
                color: "#333843",
              },
            },
          ],
          // 不配置鼠标悬停时的动画效果
          hoverAnimation: false,
          labelLine: {
            show: false,
          },
          label: {
            // 把data的name定位在中间
            position: "center",
            color: colorArr[index][0],
          },
        };
      });
      let dataOption = {
        series: seriesArr,
      };
      this.stockChart.setOption(dataOption);
    },
    autoResize() {
      let fontSize = (this.$refs.chart_stock.offsetWidth / 100) * 3.6;
      let innerRadius = fontSize * 2.8;
      let outerRadius = innerRadius * 1.125;
      let adaptOption = {
        title: {
          textStyle: {
            fontSize: fontSize,
          },
        },
        // 由于每次series里都有五个对象即五个饼图要展示，所以每个都要适配大小
        series: [
          {
            type: "pie",
            radius: [innerRadius, outerRadius],
            label: {
              fontSize: fontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [innerRadius, outerRadius],
            label: {
              fontSize: fontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [innerRadius, outerRadius],
            label: {
              fontSize: fontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [innerRadius, outerRadius],
            label: {
              fontSize: fontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [innerRadius, outerRadius],
            label: {
              fontSize: fontSize / 2,
            },
          },
        ],
      };
      this.stockChart.setOption(adaptOption);
      this.stockChart.resize();
    },
    startInterval() {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      // 五秒翻页
      this.timerId = setInterval(() => {
        this.currentPage++;
        if (this.currentPage > 2) {
          this.currentPage = 1;
        }
        this.updateChart();
      }, 5000);
      // 翻页后调用更新数据把新的数据渲染出来
    },
  },
  created() {
    // 组件创建完成后就注册获取数据的回调函数
    this.$socket.registerCallBack("stockData", this.getChartData);
  },
  mounted() {
    this.initChart();
    // 在这里发送请求，getChartData就不用发送请求了。但是也可能有问题，比如直接刷新时可能这里已经发送请求了，但是在main.js里实例对象还没连接成功，就会报错，所以在socket_service里做优化
    this.$socket.send({
      action: "getData",
      socketType: "stockData",
      chartName: "stock",
      value: "",
    });
  },
  destroyed() {
    clearInterval(this.timerId);
    window.removeEventListener("resize", this.autoResize);
    // 销毁时移出回调函数
    this.$socket.removeCallBack("stockData");
  },
};
</script>

<style scoped></style>
