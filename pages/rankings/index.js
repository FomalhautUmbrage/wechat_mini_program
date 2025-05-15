// pages/rankings/index.js - 修复模块加载错误
// 标准导入方式修改
const app = getApp();
const XLSX = wx.getFeatureValue ? undefined : require('../../utils/xlsx.js');
Page({
data: {
visible: false,
timeFilterVisible: false,
hasData: false,
rankingType: '胜场排行',
currentRankingField: 'victories',
rankingOptions: [
{ value: 'victories', label: '胜场排行' },
{ value: 'championships', label: '冠军排行' },
{ value: 'lastPlace', label: '老八排行' },
],
timeRange: '全部',
currentTimeRange: 'all',
timeOptions: [
{ value: 'day', label: '过去一天' },
{ value: 'week', label: '过去一周' },
{ value: 'month', label: '过去一个月' },
{ value: 'all', label: '全部' },
],
rankings: [],
// 控制动画的状态
podiumVisible: true,
animationKey: Date.now(),
listVisible: true,
listAnimationKey: Date.now(),
loading: false,
playerData: [],
excelFileName: ''
},
onLoad() {
if (app.eventBus) {
app.eventBus.on('rankings-data-updated', this.checkExcelData);
}
this.checkExcelData();
},
onShow() {
// 更新标签栏选中项
if (typeof this.getTabBar === 'function') {
this.getTabBar().setData({
value: 'rankings'
});
}
// 每次返回此页面时，刷新数据并重新播放动画
if (this.data.playerData && this.data.playerData.length > 0) {
  // 先处理数据
  this.updateRankingData(this.data.currentRankingField);
  
  // 然后强制重新渲染以触发动画
  this.forceRerenderPodium();
  this.forceRerenderList();
}
},
onUnload() {
if (app.eventBus) {
app.eventBus.off('rankings-data-updated');
}
},
// 更彻底的重新渲染方法：先隐藏组件，再显示它
forceRerenderPodium() {
// 先隐藏排行榜组件
this.setData({
podiumVisible: false
});
// 短暂延迟后再显示，强制完全重新渲染DOM
setTimeout(() => {
  this.setData({
    podiumVisible: true,
    animationKey: Date.now() // 更新key触发完全重新渲染
  });
}, 50);
},
// 强制重新渲染列表的方法
forceRerenderList() {
// 先隐藏列表组件
this.setData({
listVisible: false
});
// 延长延迟时间以确保数据已完全更新
setTimeout(() => {
  this.setData({
    listVisible: true,
    listAnimationKey: Date.now() // 更新key触发完全重新渲染
  });
}, 150);
},
checkExcelData() {
const path = wx.getStorageSync('rankingsExcelPath');
const name = wx.getStorageSync('rankingsExcelName');
if (path) {
this.setData({ excelFileName: name || '排行榜数据.xlsx' });
this.loadExcelFile(path);
} else {
this.setData({ hasData: false });
}
},
loadExcelFile(filePath) {
this.setData({ loading: true });
// 确保XLSX对象存在
if (!XLSX) {
  console.error('XLSX library not loaded');
  this.setData({ loading: false });
  return;
}

wx.getFileSystemManager().readFile({
  filePath,
  success: res => {
    try {
      const data = new Uint8Array(res.data);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let list = XLSX.utils.sheet_to_json(sheet);
      list = list.map(r => ({
        name: r['昵称'] || '',
        avatar: r['头像'] || '',
        victories: Number(r['胜场数'] || 0),
        championships: Number(r['冠军数'] || 0),
        lastPlace: Number(r['老八数'] || 0),
      }));
      this.setData({
        playerData: list,
        hasData: true,
        loading: false
      });
      // 初次加载数据后，按照默认类别刷新排行榜
      this.updateRankingData(this.data.currentRankingField);
      wx.showToast({
        title: '已加载排行榜数据',
        icon: 'success'
      });
    } catch (e) {
      console.error(e);
      wx.showToast({
        title: '解析文件失败',
        icon: 'error'
      });
      this.setData({ loading: false });
    }
  },
  fail: err => {
    console.error(err);
    wx.showToast({
      title: '读取文件失败',
      icon: 'error'
    });
    this.setData({ loading: false });
  }
});
},
// 简化的数据处理方法，只负责更新数据，不处理动画
updateRankingData(type) {
if (!this.data.playerData || this.data.playerData.length === 0) {
return;
}
// 保存当前排名字段以确保一致性
this.setData({ currentRankingField: type });

// 根据当前类型设置排名类型标签
const selectedOption = this.data.rankingOptions.find(option => option.value === type);
if (selectedOption) {
  this.setData({ rankingType: selectedOption.label });
}

const timeframe = this.data.currentTimeRange || 'all';
// 基于原始数据进行排序和筛选
let list = [...this.data.playerData];
if (timeframe !== 'all') {
  // 先按照所选排行类别排序
  list.sort((a, b) => b[type] - a[type]);
  let filtered = [];
  let count = list.length;
  let factor = 1;
  if (timeframe === 'day') {
    count = Math.min(3, list.length);
    factor = 0.2;
  } else if (timeframe === 'week') {
    count = Math.min(10, list.length);
    factor = 0.4;
  } else if (timeframe === 'month') {
    count = Math.min(20, list.length);
    factor = 0.7;
  }
  filtered = list.slice(0, count).map(player => {
    const scaledValue = Math.round(player[type] * factor);
    return {
      ...player,
      [type]: Math.max(scaledValue, player[type] > 0 ? 1 : 0)
    };
  });
  list = filtered;
}

// 按当前类别对处理后的列表排序
list.sort((a, b) => b[type] - a[type]);
const arr = list.map(p => ({ name: p.name, avatar: p.avatar, value: p[type] }));

if (arr.length === 0) {
  this.setData({ rankings: [], hasData: false });
  return;
} else {
  if (!this.data.hasData) {
    this.setData({ hasData: true });
  }
}

// 只更新数据
this.setData({
  rankings: arr,
  // 确保列表总是可见的（即使在动画重播过程中）
  listVisible: true
});
},
toggleDropdown() {
this.setData({ visible: !this.data.visible });
},
onVisibleChange(e) {
this.setData({ visible: e.detail.visible });
},
handleOptionChange(e) {
const { value, label } = e.currentTarget.dataset;
this.setData({
rankingType: label,
currentRankingField: value,
visible: false
});
// 先更新数据
this.updateRankingData(value);

// 等待数据更新完成后再重新渲染组件
setTimeout(() => {
  this.forceRerenderPodium();
  this.forceRerenderList();
}, 100);
},
toggleTimeFilter() {
this.setData({ timeFilterVisible: !this.data.timeFilterVisible });
},
onTimeFilterVisibleChange(e) {
this.setData({ timeFilterVisible: e.detail.visible });
},
handleTimeOptionChange(e) {
const { value, label } = e.currentTarget.dataset;
this.setData({
timeRange: label,
currentTimeRange: value,
timeFilterVisible: false
});
// 先更新数据
this.updateRankingData(this.data.currentRankingField);

// 等待数据更新完成后再重新渲染组件
setTimeout(() => {
  this.forceRerenderPodium();
  this.forceRerenderList();
}, 100);
}
});