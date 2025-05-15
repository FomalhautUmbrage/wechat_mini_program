// pages/rankings/index.js
import { getPlayerData } from '../../utils/storage-service';
import { getRankingList } from '../../utils/wudaohui-service';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    visible: false,
    timeFilterVisible: false,
    hasData: false,
    rankingType: '胜场排行',
    currentRankingField: 'wins',
    rankingOptions: [
      { value: 'wins', label: '胜场排行' },
      { value: 'championships', label: '冠军排行' },
      { value: 'laoBa', label: '老八排行' }
    ],
    timeRange: '全部',
    currentTimeRange: 'all',
    timeOptions: [
      { value: 'all', label: '全部' },
      { value: 'month', label: '过去一个月' },
      { value: 'week', label: '过去一周' },
      { value: 'day', label: '过去一天' }
    ],
    rankings: [],
    podiumVisible: true,
    animationKey: Date.now(),
    listVisible: true,
    listAnimationKey: Date.now(),
    loading: false,
    playerData: []
  },

  onLoad() {
    // 监听数据更新事件
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.on('rankings-data-updated', this.loadData);
    }
    
    // 初始加载数据
    this.loadData();
  },

  onUnload() {
    // 取消事件监听
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.off('rankings-data-updated');
    }
  },

  onShow() {
    // 更新tab bar选中项
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({
        value: 'rankings'
      });
    }
    
    // 每次返回此页面时，刷新数据并重新播放动画
    if (this.data.playerData && this.data.playerData.length > 0) {
      // 先处理数据
      this.updateRankingData();
      
      // 然后强制重新渲染以触发动画
      this.forceRerenderPodium();
      this.forceRerenderList();
    }
  },

  // 加载玩家数据
  loadData() {
    this.setData({ loading: true });
    
    // 从本地存储获取玩家数据
    const playerData = getPlayerData();
    
    if (playerData && playerData.length > 0) {
      this.setData({
        playerData,
        hasData: true,
        loading: false
      });
      
      // 更新排行榜数据
      this.updateRankingData();
    } else {
      this.setData({
        playerData: [],
        rankings: [],
        hasData: false,
        loading: false
      });
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

  // 更新排行榜数据
  updateRankingData() {
    const { playerData, currentRankingField, currentTimeRange } = this.data;
    
    if (!playerData || playerData.length === 0) {
      this.setData({ rankings: [] });
      return;
    }
    
    // 获取排行榜数据
    const rankings = getRankingList(playerData, currentRankingField, currentTimeRange);
    
    // 格式化数据以适应页面展示
    const formattedRankings = rankings.map(item => ({
      name: item.name,
      avatar: item.avatar || 'cloud://cloud1-3gwil7q954ab85d2.636c-cloud1-3gwil7q954ab85d2-1358898580/static/avatar.png',
      value: item.score
    }));
    
    this.setData({ rankings: formattedRankings });
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
    this.updateRankingData();

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
    this.updateRankingData();

    // 等待数据更新完成后再重新渲染组件
    setTimeout(() => {
      this.forceRerenderPodium();
      this.forceRerenderList();
    }, 100);
  }
});