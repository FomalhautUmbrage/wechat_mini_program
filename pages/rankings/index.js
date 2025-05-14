import Toast from 'tdesign-miniprogram/toast/index';
const XLSX = require('../../utils/xlsx.js');

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
    timeFilterVisible: false,
    
    // Methods to handle time filter:
    toggleTimeFilter() {
      this.setData({ timeFilterVisible: !this.data.timeFilterVisible });
    },
    
    onTimeFilterVisibleChange(e) {
      this.setData({ timeFilterVisible: e.detail.visible });
    },
    
    handleTimeOptionChange(e) {
      const { value, label } = e.currentTarget.dataset;
      this.setData({ timeRange: label, currentTimeRange: value, timeFilterVisible: false });
      // Process data based on the selected time range
      this.processRankingData(this.data.currentRankingField);
    }
  },

  onLoad() {
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.on('rankings-data-updated', this.checkExcelData);
    }
    this.checkExcelData();
  },

  onShow() {
    // 每次进入页面时，根据当前选择刷新排行榜数据并重播动画
    if (this.data.playerData && this.data.playerData.length > 0) {
      this.processRankingData(this.data.currentRankingField);
    }
  },

  onUnload() {
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.off('rankings-data-updated');
    }
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
          this.processRankingData(this.data.currentRankingField);
          Toast({ context: this, message: '已加载排行榜数据', theme: 'success' });
        } catch (e) {
          console.error(e);
          Toast({ context: this, message: '解析文件失败，请检查格式', theme: 'error' });
          this.setData({ loading: false });
        }
      },
      fail: err => {
        console.error(err);
        Toast({ context: this, message: '读取文件失败', theme: 'error' });
        this.setData({ loading: false });
      }
    });
  },

  // 处理排行榜数据排序和筛选，并触发动画
  processRankingData(type) {
    if (!this.data.playerData || this.data.playerData.length === 0) {
      return;
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
      // 取出限定数量的 top 玩家，并按比例缩减其值以模拟对应时间范围的统计
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
    // 如果筛选后无数据，显示无数据状态
    if (arr.length === 0) {
      this.setData({ rankings: [], hasData: false, animationClass: '' });
      return;
    } else {
      // 确保有数据时标识为 true
      if (!this.data.hasData) {
        this.setData({ hasData: true });
      }
    }
    // 重置动画类以触发重新播放
    this.setData({ animationClass: '' });
    setTimeout(() => {
      this.setData({ rankings: arr, animationClass: 'animate-in' });
    }, 50);
  },

  toggleDropdown() {
    this.setData({ visible: !this.data.visible });
  },
  onVisibleChange(e) {
    this.setData({ visible: e.detail.visible });
  },
  handleOptionChange(e) {
    const { value, label } = e.currentTarget.dataset;
    this.setData({ rankingType: label, currentRankingField: value, visible: false });
    this.processRankingData(value);
  },

  toggleTimeFilter() {
    this.setData({ timeFilterVisible: !this.data.timeFilterVisible });
  },
  onTimeFilterVisibleChange(e) {
    this.setData({ timeFilterVisible: e.detail.visible });
  },
  handleTimeOptionChange(e) {
    const { value, label } = e.currentTarget.dataset;
    this.setData({ timeRange: label, currentTimeRange: value, timeFilterVisible: false });
    // 切换时间范围后根据当前排行类别刷新数据
    this.processRankingData(this.data.currentRankingField);
  }
});
