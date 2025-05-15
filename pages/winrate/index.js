import Toast from 'tdesign-miniprogram/toast/index';
const XLSX = require('../../utils/xlsx.js');

// 添加全局缓存变量
const app = getApp();
if (!app.globalData.heroDataCache) {
  app.globalData.heroDataCache = {
    processedData: null,
    lastFileName: '',
    searchCache: {}
  };
}

Page({
  data: {
    hasData: false,
    loading: false,
    heroList: [],
    searchValue: '',
    filteredHeroList: [],
    excelFileName: '',
    // 保留动画控制属性，但优化使用方式
    listVisible: true,
    animationKey: Date.now(),
    lastSearch: '', // 跟踪上次搜索，避免重复过滤
    dataVersion: 0 // 数据版本号，用于判断是否需要刷新
  },

  onLoad() {
    // 初次加载检查缓存并载入数据
    this.checkExcelData(true);
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({
        value: 'winrate'
      });
    }
    
    // 检查数据是否需要刷新，但不重新渲染动画
    this.checkExcelData(false);
    
    // 仅当从其他页面返回且显式要求动画时才触发
    // 获取当前页面栈，判断是否从其他页面返回
    const pages = getCurrentPages();
    if (pages.length > 1 && this.data.hasData && app.globalData.heroDataCache.needAnimation) {
      this.forceRerenderList();
      app.globalData.heroDataCache.needAnimation = false; // 重置动画标记
    }
  },

  // 添加页面隐藏事件处理
  onHide() {
    // 在页面隐藏时保存搜索状态，避免回来时闪烁
    app.globalData.heroDataCache.lastSearchValue = this.data.searchValue;
  },

  // 优化：强制重新渲染列表的方法，仅在必要时使用
  forceRerenderList() {
    // 先隐藏列表
    this.setData({
      listVisible: false
    });
    
    // 用requestAnimationFrame替代setTimeout以提高性能
    wx.nextTick(() => {
      this.setData({
        listVisible: true,
        animationKey: Date.now()
      });
    });
  },

  // 根据排名返回对应的主题颜色
  getThemeByRank(index) {
    if (index < 3) return 'danger';
    if (index < 10) return 'warning';
    if (index < 20) return 'purple';
    return 'primary';
  },

  // 优化：检查Excel数据的逻辑，增加缓存判断
  checkExcelData(forceReload = false) {
    const path = wx.getStorageSync('heroExcelPath');
    const name = wx.getStorageSync('heroExcelName');
    const cache = app.globalData.heroDataCache;
    
    if (!path) {
      this.setData({ hasData: false });
      return;
    }
    
    this.setData({ excelFileName: name || 'information.xlsx' });
    
    // 检查缓存是否有效，避免重复加载
    if (cache.processedData && cache.lastFileName === name && !forceReload) {
      // 使用缓存数据
      this.setData({
        heroList: cache.processedData,
        hasData: true
      });
      
      // 如果有搜索值，使用缓存的搜索结果或重新过滤
      if (this.data.searchValue) {
        this.filterHeroes();
      } else if (cache.lastSearchValue) {
        this.setData({
          searchValue: cache.lastSearchValue
        }, () => {
          this.filterHeroes();
        });
      } else {
        this.setData({
          filteredHeroList: cache.processedData
        });
      }
      return;
    }
    
    // 如果没有缓存或需要强制刷新，加载文件
    this.loadExcelFile(path, name);
  },

  // 优化：Excel文件加载和处理逻辑
  loadExcelFile(filePath, fileName) {
    this.setData({ loading: true });
    
    // 检查缓存中是否已有相同文件的处理结果
    const cache = app.globalData.heroDataCache;
    if (cache.processedData && cache.lastFileName === fileName && !this.data.forceReload) {
      // 使用缓存数据
      this.setData({
        heroList: cache.processedData,
        filteredHeroList: cache.processedData,
        hasData: true,
        loading: false
      });
      return;
    }
    
    wx.getFileSystemManager().readFile({
      filePath,
      success: res => {
        try {
          // 处理Excel文件
          const data = new Uint8Array(res.data);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          let jsonData = XLSX.utils.sheet_to_json(sheet);
          
          // 优化：确定列映射关系，减少每行重复判断
          // 先分析第一行确定列结构
          const columnMap = this.determineColumnMapping(jsonData[0] || {});
          
          // 使用确定的列映射处理数据
          const heroes = this.processHeroData(jsonData, columnMap);
          
          // 缓存处理结果
          cache.processedData = heroes;
          cache.lastFileName = fileName;
          cache.searchCache = {}; // 清空搜索缓存
          
          if (heroes.length > 0) {
            this.setData({
              heroList: heroes,
              filteredHeroList: heroes,
              hasData: true,
              loading: false
            });
            
            Toast({ context: this, message: '已加载英雄数据', theme: 'success' });
          } else {
            this.setData({ 
              loading: false,
              hasData: false
            });
            Toast({ context: this, message: '未找到有效的英雄数据', theme: 'error' });
          }
        } catch (e) {
          console.error('Parse error:', e);
          Toast({ context: this, message: '解析文件失败，请检查格式', theme: 'error' });
          this.setData({ loading: false });
        }
      },
      fail: err => {
        console.error('Read file error:', err);
        Toast({ context: this, message: '读取文件失败', theme: 'error' });
        this.setData({ loading: false });
      }
    });
  },
  
  // 新增：确定Excel列映射关系的函数
  determineColumnMapping(firstRow) {
    const map = {
      heroName: null,
      wins: null,
      losses: null,
      draws: null
    };
    
    // 检查常见列名
    const keys = Object.keys(firstRow);
    
    // 英雄名称列
    if (firstRow['D'] !== undefined) map.heroName = 'D';
    else if (firstRow['英雄名称'] !== undefined) map.heroName = '英雄名称';
    else if (firstRow['英雄'] !== undefined) map.heroName = '英雄';
    else if (keys.length > 3) map.heroName = keys[3];
    
    // 胜场列
    if (firstRow['I'] !== undefined) map.wins = 'I';
    else if (firstRow['胜场'] !== undefined) map.wins = '胜场';
    else if (firstRow['胜利'] !== undefined) map.wins = '胜利';
    else if (keys.length > 8) map.wins = keys[8];
    
    // 败场列
    if (firstRow['J'] !== undefined) map.losses = 'J';
    else if (firstRow['失败'] !== undefined) map.losses = '失败';
    else if (keys.length > 9) map.losses = keys[9];
    
    // 平局列
    if (firstRow['K'] !== undefined) map.draws = 'K';
    else if (firstRow['平局'] !== undefined) map.draws = '平局';
    else if (keys.length > 10) map.draws = keys[10];
    
    return map;
  },
  
  // 新增：使用列映射处理英雄数据的函数
  processHeroData(jsonData, columnMap) {
    const heroes = [];
    
    jsonData.forEach(row => {
      // 使用确定的列映射获取数据
      let heroName = columnMap.heroName ? row[columnMap.heroName] : '';
      let wins = columnMap.wins ? Number(row[columnMap.wins]) || 0 : 0;
      let losses = columnMap.losses ? Number(row[columnMap.losses]) || 0 : 0;
      let draws = columnMap.draws ? Number(row[columnMap.draws]) || 0 : 0;
      
      // 只添加有效条目
      if (heroName) {
        const totalGames = wins + losses + draws;
        const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(2) : '0.00';
        
        heroes.push({
          name: heroName,
          wins: wins,
          losses: losses,
          draws: draws,
          totalGames: totalGames,
          winRate: winRate
        });
      }
    });
    
    // 按胜率排序（从高到低）
    return heroes.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  },

  // 优化：搜索处理，增加缓存
  onSearch(e) {
    const searchValue = e.detail.value || '';
    this.setData({ searchValue }, () => {
      this.filterHeroes();
    });
  },

  // 优化：过滤英雄列表，增加缓存
  filterHeroes() {
    const { heroList, searchValue } = this.data;
    const cache = app.globalData.heroDataCache;
    
    // 空搜索直接返回完整列表
    if (!searchValue) {
      this.setData({ filteredHeroList: heroList });
      return;
    }
    
    // 检查搜索缓存
    if (cache.searchCache[searchValue]) {
      this.setData({ filteredHeroList: cache.searchCache[searchValue] });
      return;
    }
    
    // 执行搜索过滤
    const filtered = heroList.filter(hero => 
      hero.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    // 缓存搜索结果
    cache.searchCache[searchValue] = filtered;
    
    this.setData({ filteredHeroList: filtered });
  }
});