// pages/rankings/index.js
import Toast from 'tdesign-miniprogram/toast/index';
// 将 import 改为 require，从 utils 中加载 UMD 版：
const XLSX = require('../../utils/xlsx.js');

Page({
  data: {
    visible: false,
    hasData: false,
    rankingType: '胜场排行',
    rankingOptions: [
      { value: 'victories', label: '胜场排行' },
      { value: 'championships', label: '冠军排行' },
      { value: 'lastPlace', label: '老八排行' },
    ],
    rankings: [],
    loading: false,
    animationClass: 'animate-in',
    playerData: [],
    excelFileName: ''
  },

  onLoad() {
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.on('rankings-data-updated', this.checkExcelData);
    }
    this.checkExcelData();
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
          this.processRankingData('victories');
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

  processRankingData(type) {
    const sorted = [...this.data.playerData].sort((a,b)=>b[type]-a[type]);
    const arr = sorted.map(p=>({ name: p.name, avatar: p.avatar, value: p[type] }));
    this.setData({ animationClass: '' });
    setTimeout(()=>{
      this.setData({ rankings: arr, animationClass: 'animate-in' });
    },50);
  },

  toggleDropdown() {
    this.setData({ visible: !this.data.visible });
  },

  onVisibleChange(e) {
    this.setData({ visible: e.detail.visible });
  },

  handleOptionChange(e) {
    const { value, label } = e.currentTarget.dataset;
    this.setData({ rankingType: label, visible: false });
    this.processRankingData(value);
  }
});