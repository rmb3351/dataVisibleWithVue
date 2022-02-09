<template>
  <div class="com-container" @dblclick="backToMain">
    <div class="com-chart" ref="chart_map"></div>
  </div>
</template>

<script>
// 由于矢量地图的数据不在koa后台里，而$axios的baseURL就在koa后台，所以需要在这个页面单独导入axios来使用
import axios from "axios";
import { getProvinceMapInfo } from "@/utils/map_utils.js";
import { mapState } from "vuex";
export default {
  name: "Map",
  data() {
    return {
      mapChart: null,
      chartData: null,
      provincesData: {},
    };
  },
  computed: {
    ...mapState(["theme"]),
  },
  watch: {
    // 监听到theme变化时回调的函数
    theme() {
      // 销毁已有图表并重新初始化图表
      this.mapChart.dispose();
      this.initChart();
      this.updateChart();
    },
  },
  methods: {
    async initChart() {
      this.mapChart = this.$echarts.init(this.$refs.chart_map, this.theme);
      // 获取地图的json数据并且注册为china
      let res = await axios.get("http://localhost:8889/static/map/china.json");
      this.$echarts.registerMap("china", res.data);
      let initOption = {
        title: {
          text: "| 商家分布",
          left: 20,
          top: 20,
        },
        geo: {
          type: "map",
          map: "china",
          itemStyle: {
            areaColor: "#2E72BF",
            borderColor: "#333",
          },
        },
        legend: {
          left: "5%",
          bottom: "5%",
          orient: "vertical",
        },
      };
      this.mapChart.setOption(initOption);
      // this.getChartData();
      this.autoResize();
      window.addEventListener("resize", this.autoResize);
      this.mapChart.on("click", async (arg) => {
        // 传入通过点击获取的省份名字，返回省份拼音和省份数据json文件的路径
        let mapInfo = getProvinceMapInfo(arg.name);
        // 有数据时不再获取
        if (!this.provincesData[mapInfo.key]) {
          // 因为不是从后端而是从vue文件夹下获取数据，所以用引入的axios
          let res = await axios.get(mapInfo.path);
          // 把获取的省份数据保存在定义的对象中，这样点击相同的省份时不用重新发送请求获取数据
          this.provincesData[mapInfo.key] = res.data;
          this.$echarts.registerMap(mapInfo.key, res.data);
        }
        let provinceOption = {
          geo: {
            // 前面已经设置过type了，所以这里不用设置type
            map: mapInfo.key,
          },
        };
        this.mapChart.setOption(provinceOption);
      });
    },
    getChartData(chartData) {
      // const { data: chartData } = await this.$axios.get("map");
      this.chartData = chartData;
      this.updateChart();
    },
    updateChart() {
      // 存放series数据的数组，每个元素代表一种name里的所有用户
      const seriesArr = this.chartData.map((item) => {
        return {
          type: "effectScatter",
          rippleEffect: {
            scale: 5,
            // 让涟漪动画的涟漪显得不那么密集
            brushType: "stroke",
          },
          name: item.name,
          data: item.children,
          coordinateSystem: "geo",
        };
      });
      const legendArr = this.chartData.map((item) => item.name);
      let dataOption = {
        series: seriesArr,
        legend: {
          data: legendArr,
        },
      };
      this.mapChart.setOption(dataOption);
    },
    autoResize() {
      let fontSize = (this.$refs.chart_map.offsetWidth / 100) * 3.6;
      let adaptOption = {
        title: {
          textStyle: {
            fontSize: fontSize,
          },
        },
        legend: {
          itemWidth: fontSize / 2,
          itemHeight: fontSize / 2,
          itemGap: fontSize / 2,
          textStyle: {
            fontSize: fontSize / 2,
          },
        },
      };
      this.mapChart.setOption(adaptOption);
      this.mapChart.resize();
    },
    // 双击时回到主地图
    backToMain() {
      let mainOption = {
        geo: {
          map: "china",
        },
      };
      this.mapChart.setOption(mainOption);
    },
  },
  created() {
    // 组件创建完成后就注册获取数据的回调函数
    this.$socket.registerCallBack("mapData", this.getChartData);
  },
  mounted() {
    this.initChart();
    // 在这里发送请求，getChartData就不用发送请求了。但是也可能有问题，比如直接刷新时可能这里已经发送请求了，但是在main.js里实例对象还没连接成功，就会报错，所以在socket_service里做优化
    this.$socket.send({
      action: "getData",
      socketType: "mapData",
      chartName: "map",
      value: "",
    });
  },
  destroyed() {
    window.removeEventListener("resize", this.autoResize);
    // 销毁时移出回调函数
    this.$socket.removeCallBack("mapData");
  },
};
</script>

<style scoped></style>
