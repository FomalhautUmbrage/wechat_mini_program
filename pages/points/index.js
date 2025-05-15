// pages/points/index.js
import Toast from 'tdesign-miniprogram/toast/index';
import { getPlayerData } from '../../utils/storage-service';

Page({
  data: {
    playerData: [],
    filteredData: [],
    loading: true,
    sortType: 'points', // 排序类型: 'points', 'championships', 'wins', 'laoBa'
    timeRange: 'all', // 时间范围: 'all', 'month', 'threeMonths'
    noData: true
  },
  
  onLoad() {
    // 监听数据更新事件
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.on('points-data-updated', this.loadPlayerData);
    }
    
    // 初始加载数据
    this.loadPlayerData();
  },
  
  onUnload() {
    // 取消事件监听
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.off('points-data-updated');
    }
  },
  
  onShow() {
    // 更新tab bar选中项
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({
        value: 'points'
      });
    }
    
    // 每次显示页面时刷新数据
    this.loadPlayerData();
  },
  
  // 加载玩家数据
  loadPlayerData() {
    this.setData({ loading: true });
    
    // 从本地存储获取玩家数据
    const playerData = getPlayerData();
    
    if (playerData && playerData.length > 0) {
      this.setData({
        playerData,
        noData: false,
        loading: false
      });
      
      // 应用筛选并排序
      this.filterAndSortData();
    } else {
      this.setData({
        playerData: [],
        filteredData: [],
        noData: true,
        loading: false
      });
    }
  },
  
  // 筛选并排序数据
  filterAndSortData() {
    const { playerData, sortType, timeRange } = this.data;
    
    if (!playerData || playerData.length === 0) {
      this.setData({ filteredData: [] });
      return;
    }
    
    // 创建数据副本
    let filteredPlayers = [...playerData];
    
    // 应用时间筛选
    if (timeRange !== 'all') {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // 获取时间范围内的数据
      filteredPlayers = filteredPlayers.map(player => {
        const newPlayer = { ...player };
        let totalPoints = 0;
        let championshipsCount = 0;
        let winsCount = 0;
        let laoBaCount = 0;
        
        if (timeRange === 'month') {
          // 过去一个月的数据
          const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
          
          if (player.monthlyData && player.monthlyData[monthKey]) {
            const monthData = player.monthlyData[monthKey];
            totalPoints = monthData.points || 0;
            championshipsCount = monthData.championships || 0;
            winsCount = monthData.wins || 0;
            laoBaCount = monthData.laoBa || 0;
          }
        } else if (timeRange === 'threeMonths') {
          // 过去三个月的数据
          for (let i = 0; i < 3; i++) {
            let month = currentMonth - i;
            let year = currentYear;
            
            if (month <= 0) {
              month += 12;
              year -= 1;
            }
            
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            
            if (player.monthlyData && player.monthlyData[monthKey]) {
              const monthData = player.monthlyData[monthKey];
              totalPoints += monthData.points || 0;
              championshipsCount += monthData.championships || 0;
              winsCount += monthData.wins || 0;
              laoBaCount += monthData.laoBa || 0;
            }
          }
        }
        
        if (timeRange !== 'all') {
          newPlayer.points = totalPoints;
          newPlayer.championships = championshipsCount;
          newPlayer.wins = winsCount;
          newPlayer.laoBa = laoBaCount;
        }
        
        return newPlayer;
      });
    }
    
    // 根据排序类型排序
    filteredPlayers.sort((a, b) => b[sortType] - a[sortType]);
    
    // 更新数据
    this.setData({ filteredData: filteredPlayers });
  },
  
  // 更改排序类型
  changeSortType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ sortType: type }, () => {
      this.filterAndSortData();
    });
  },
  
  // 更改时间范围
  changeTimeRange(e) {
    const { range } = e.currentTarget.dataset;
    this.setData({ timeRange: range }, () => {
      this.filterAndSortData();
    });
  },
  
  // 获取排名样式
  getRankClass(index) {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  }
});