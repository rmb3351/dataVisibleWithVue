export default class SocketService {
  static instance = null;
  // 单个实例，获取instance的方法
  static get Instance() {
    if (!this.instance) {
      this.instance = new SocketService();
    }
    return this.instance;
  }
  ws = null;
  // 用来存储回调函数的数组
  callBacks = [];
  // 做两个优化：1是为了防止还没连接上就已经发送请求导致报错，在这里定义一个标志连接状态的变量，在onopen时才置为true，false时不发送请求
  // 2是在连接失败（onclose）或者发送请求失败（connected为false）时重试，但是重试时间根据发送和连接的次数不懂延长，减少服务器压力
  // 标志连接状态，控制请求的发送
  connected = false;
  // 记录重试次数，根据重试次数决定延时长度
  sendRetryTimes = 0;
  connectRetryTimes = 0;
  // 连接服务器调用的方法
  connect() {
    if (!window.WebSocket) {
      return console.log("您的浏览器不支持WebSocket");
    }
    this.ws = new WebSocket("ws://localhost:9998");
    this.ws.onopen = () => {
      this.connectRetryTimes = 0;
      this.connected = true;
    };
    this.ws.onclose = () => {
      this.connectRetryTimes++;
      this.connected = false;
      setTimeout(() => {
        this.connect();
      }, 500 * this.connectRetryTimes);
    };
    this.ws.onmessage = (msg) => {
      const resData = JSON.parse(msg.data);
      const socketType = resData.socketType;
      // 如果储存回调函数的数组里有对应的回调函数则进行调用并传入形参
      if (this.callBacks[socketType]) {
        const action = resData.action;
        if (action === "getData") {
          const chartData = JSON.parse(resData.data);
          this.callBacks[socketType].call(this, chartData);
        } else {
          this.callBacks[socketType].call(this, resData);
        }
      }
    };
  }
  // 按照socketType存储回调函数和移出存储的回调函数
  registerCallBack(socketType, callBack) {
    this.callBacks[socketType] = callBack;
  }
  removeCallBack(socketType) {
    this.callBacks[socketType] = null;
  }
  // 封装websocket的send方法
  send(data) {
    if (this.connected) {
      this.sendRetryTimes = 0;
      this.ws.send(JSON.stringify(data));
    } else {
      setTimeout(() => {
        this.sendRetryTimes++;
        this.send(data);
      }, 500 * this.sendRetryTimes);
    }
  }
}
