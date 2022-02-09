const theme = {
  chalk: {
    // 背景颜色
    backgroundColor: "#161522",
    // 标题文字颜色
    titleColor: "#FFFFFF",
    // 切换主题按钮的图片路径
    themeSrc: "switch_dark.png",
    // 头部的线条
    headerBorderSrc: "header_border_dark.png",
    sellerAxisPointerColor: "#2D3443",
  },
  vintage: {
    backgroundColor: "#dddddd",
    titleColor: "#000000",
    themeSrc: "switch_light.png",
    headerBorderSrc: "header_border_light.png",
    sellerAxisPointerColor: "#f1f2f6",
  },
};

// 调用方法时传入主题名就取想对应的主题对象
export function getThemeValue(themeName) {
  return theme[themeName];
}
