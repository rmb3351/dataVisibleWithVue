<template>
  <div class="com-container">
    <div class="com-chart" ref="chart_bar"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "Sales",
  data() {
    return {
      salesChart: null,
      chartData: null,
      currentPage: 1,
      totalPage: 1,
      timerId: 0,
    };
  },
  computed: {
    ...mapState(["theme"]),
  },
  watch: {
    // 监听到theme变化时回调的函数
    theme() {
      // 销毁已有图表并重新初始化图表
      this.salesChart.dispose();
      this.initChart();
      this.updateChart();
    },
  },
  methods: {
    initChart() {
      this.salesChart = this.$echarts.init(this.$refs.chart_bar, this.theme);
      // 配置分离，这里是初始化配置，还有数据配置和适配性配置
      let initOption = {
        title: {
          text: "| 商家销量统计",
          left: 20,
          top: 10,
        },
        tooltip: {
          trigger: "axis",
          // 坐标轴被鼠标悬停的时候的样式
          axisPointer: {
            type: "line",
            // 样式不覆盖原来的bar
            z: 0,
            lineStyle: {
              color: "#2D3443",
            },
          },
        },
        grid: {
          left: "20%",
          right: "6%",
          bottom: "3%",
          left: "3%",
          // 坐标标签也跟随
          containLabel: true,
        },
        xAxis: {
          type: "value",
        },
        yAxis: {
          type: "category",
        },
        series: [
          {
            type: "bar",
            // 显示柱子相应的数值
            label: {
              show: true,
              position: "right",
              textStyle: { color: "white" },
            },
            itemStyle: {
              // 调用线性渐变方法，前四个参数是初始和结束位置的X和Y（从0到1），最后参数是对象数组，对象里面放offset（也是从0到1）和color属性，类似于css的animation
              color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: "#5052EE",
                },
                { offset: 1, color: "#AB6EE5" },
              ]),
            },
          },
        ],
      };
      this.salesChart.setOption(initOption);
      // 监听图表是否有鼠标悬停
      this.salesChart.on("mouseover", () => {
        clearInterval(this.timerId);
      });
      this.salesChart.on("mouseout", () => {
        this.autoPaging();
      });
      // this.getChartData();
      // 先设置初始大小，然后根据每次窗口大小变化，修改图表的自适应配置
      this.autoResize();
      window.addEventListener("resize", this.autoResize);
    },
    getChartData(chartData) {
      // 因为axios里已经配置了baseURL，所以这里只需要相对路径,这里直接结构出data的数据，由于解构里不能放this，所以先解构再赋值
      // const { data: chartData } = await this.$axios.get("sales");

      // 对数据进行从小到大排序，如果从大到小就B-A
      this.chartData = chartData.sort((a, b) => {
        return a.value - b.value;
      });
      // console.log(this.chartData);
      this.totalPage =
        this.chartData.length % 5 === 0
          ? this.chartData.length / 5
          : this.chartData.length / 5 + 1;
      this.updateChart();
      this.autoPaging();
    },
    // 更新图表功能
    updateChart() {
      // 根据当前页数选定截取数据的位置
      let startFrom = (this.currentPage - 1) * 5;
      let endAt = this.currentPage * 5;
      // 数据配置
      let dataOption = {
        yAxis: {
          // 映射，把chartData里每一条的.name属性映射成一个数组,并截取当前页数的数据
          data: this.chartData.map((item) => item.name).slice(startFrom, endAt),
        },
        series: [
          {
            data: this.chartData
              .map((item) => item.value)
              .slice(startFrom, endAt),
          },
        ],
      };
      this.salesChart.setOption(dataOption);
    },
    // 自动翻页功能
    autoPaging() {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      this.timerId = setInterval(() => {
        this.currentPage++;
        // 自动翻页，超页数判断，根据页数更新图表
        this.currentPage =
          this.currentPage % this.totalPage !== 0
            ? this.currentPage % this.totalPage
            : this.totalPage;
        this.updateChart();
      }, 3000);
    },
    // 根据窗口大小改变调用的重置大小的方法
    autoResize() {
      let size = (this.$refs.chart_bar.offsetWidth / 100) * 3.6;
      let adaptOption = {
        title: {
          textStyle: {
            fontSize: size,
          },
        },
        tooltip: {
          axisPointer: {
            lineStyle: {
              width: size,
            },
          },
        },
        series: [
          {
            barWidth: size,
            itemStyle: {
              barBorderRadius: [0, size / 2, size / 2, 0],
            },
          },
        ],
      };
      this.salesChart.setOption(adaptOption);
      // 设置新的自适应配置后还要调用自带的resize方法才会生效
      this.salesChart.resize();
    },
  },
  created() {
    // 组件创建完成后就注册获取数据的回调函数
    this.$socket.registerCallBack("salesData", this.getChartData);
  },
  mounted() {
    this.initChart();
    // 在这里发送请求，getChartData就不用发送请求了。但是也可能有问题，比如直接刷新时可能这里已经发送请求了，但是在main.js里实例对象还没连接成功，就会报错，所以在socket_service里做优化
    this.$socket.send({
      action: "getData",
      socketType: "salesData",
      chartName: "sales",
      value: "",
    });
  },
  destroyed() {
    // 防止内存泄漏
    clearInterval(this.timerId);
    window.removeEventListener("resize", this.autoResize);
    // 销毁时移出回调函数
    this.$socket.removeCallBack("salesData");
  },
};
</script>

<style scoped></style>
