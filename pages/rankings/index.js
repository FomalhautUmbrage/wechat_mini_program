// pages/rankings/index.js
import Toast from 'tdesign-miniprogram/toast/index';
// import * as XLSX from 'xlsx'; // 如果添加了这个库，取消注释这一行

Page({
  data: {
    visible: false,
    hasData: false,
    rankingType: '胜场排行',
    rankingOptions: [
      { value: 'victories', label: '胜场排行' },
      { value: 'championships', label: '冠军排行' },
      { value: 'points', label: '积分排行' },
      { value: 'matches', label: '比赛场次' },
    ],
    rankings: [],
    loading: false,
    animationClass: 'animate-in',
    playerData: [], // 存储从Excel读取的完整数据
    excelFileName: '' // 当前加载的Excel文件名
  },

  onLoad() {
    // 获取全局事件总线
    const app = getApp();
    if (app.eventBus) {
      // 监听数据更新事件
      app.eventBus.on('rankings-data-updated', this.checkExcelData);
    }
    
    // 检查是否有已上传的Excel数据
    this.checkExcelData();
  },
  
  onUnload() {
    // 取消事件监听
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.off('rankings-data-updated');
    }
  },
  
  /**
   * 检查是否有已上传的Excel数据
   */
  checkExcelData() {
    const excelPath = wx.getStorageSync('rankingsExcelPath');
    const excelName = wx.getStorageSync('rankingsExcelName');
    
    if (excelPath) {
      this.setData({ 
        excelFileName: excelName || '排行榜数据.xlsx'
      });
      this.loadExcelFile(excelPath);
    } else {
      // 没有Excel数据，显示空状态
      this.setData({ hasData: false });
    }
  },
  
  /**
   * 加载Excel文件并解析
   */
  loadExcelFile(filePath) {
    this.setData({ loading: true });
    
    // 注意：为了简化代码，这里演示了解析过程
    // 在实际应用中，应该使用XLSX库解析Excel文件
    
    /* XLSX库代码示例（如果已安装XLSX库，取消注释此代码）:
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      success: (res) => {
        try {
          const data = new Uint8Array(res.data);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const playerData = XLSX.utils.sheet_to_json(worksheet);
          
          this.setData({
            playerData: playerData,
            hasData: true,
            loading: false
          });
          
          // 处理排名数据
          this.processRankingData('victories');
        } catch (e) {
          console.error('解析Excel文件失败', e);
          Toast({
            context: this,
            message: '解析文件失败，请检查文件格式',
            theme: 'error',
          });
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        console.error('读取文件失败', err);
        Toast({
          context: this,
          message: '读取文件失败',
          theme: 'error',
        });
        this.setData({ loading: false });
      }
    });
    */
    
    // 由于我们没有真实解析Excel，这里模拟一下加载过程
    setTimeout(() => {
      this.loadDemoData();
      Toast({
        context: this,
        message: '已加载排行榜数据',
        theme: 'success',
      });
    }, 1000);
  },
  
  /**
   * 加载示例数据（开发测试用）
   */
  loadDemoData() {
    this.setData({ loading: true });
    
    // 使用硬编码的示例数据
    const playerData = [
      {
        "name": "张三",
        "avatar": "/static/chat/avatar.png",
        "victories": 45,
        "championships": 6,
        "points": 156,
        "matches": 78
      },
      {
        "name": "李四",
        "avatar": "/static/chat/avatar.png",
        "victories": 38,
        "championships": 8,
        "points": 138,
        "matches": 76
      },
      {
        "name": "王五",
        "avatar": "/static/chat/avatar.png",
        "victories": 36,
        "championships": 5,
        "points": 142,
        "matches": 74
      },
      {
        "name": "赵六",
        "avatar": "/static/chat/avatar.png",
        "victories": 32,
        "championships": 3,
        "points": 124,
        "matches": 72
      },
      {
        "name": "钱七",
        "avatar": "/static/chat/avatar.png",
        "victories": 29,
        "championships": 2,
        "points": 112,
        "matches": 68
      },
      {
        "name": "孙八",
        "avatar": "/static/chat/avatar.png",
        "victories": 27,
        "championships": 4,
        "points": 102,
        "matches": 62
      },
      {
        "name": "周九",
        "avatar": "/static/chat/avatar.png",
        "victories": 25,
        "championships": 1,
        "points": 96,
        "matches": 65
      },
      {
        "name": "吴十",
        "avatar": "/static/chat/avatar.png",
        "victories": 23,
        "championships": 1,
        "points": 87,
        "matches": 57
      }
    ];
    
    this.setData({
      playerData: playerData,
      hasData: true,
      loading: false
    });
    
    // 处理排名数据
    this.processRankingData('victories');
  },

  /**
   * 处理排名数据
   * @param {string} type - 排名类型
   */
  processRankingData(type) {
    const { playerData } = this.data;
    
    // 根据指定的类型对数据进行排序
    const sortedData = [...playerData].sort((a, b) => b[type] - a[type]);
    
    // 将排序后的数据转换为排名数据
    const rankings = sortedData.map(player => ({
      name: player.name,
      avatar: player.avatar,
      value: player[type] // 只取需要的值
    }));
    
    // 先移除动画类，然后再添加回来
    this.setData({
      animationClass: ''
    });
    
    // 使用setTimeout确保类被正确移除和添加
    setTimeout(() => {
      this.setData({
        rankings: rankings,
        animationClass: 'animate-in'
      });
    }, 50);
  },

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown() {
    this.setData({
      visible: !this.data.visible,
    });
  },

  /**
   * Handle popup visibility change
   */
  onVisibleChange(e) {
    this.setData({
      visible: e.detail.visible,
    });
  },

  /**
   * Handle dropdown option change
   */
  handleOptionChange(e) {
    const { value, label } = e.currentTarget.dataset;
    
    this.setData({
      rankingType: label,
      visible: false,
    });
    
    // 根据选择的类型处理排名数据
    this.processRankingData(value);
  }
});