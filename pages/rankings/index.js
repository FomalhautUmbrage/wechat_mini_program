// pages/rankings/index.js
import request from '~/api/request';

Page({
  data: {
    visible: false,
    rankingType: '胜场排行',
    rankingOptions: [
      { value: 'victories', label: '胜场排行' },
      { value: 'championships', label: '冠军排行' },
      { value: 'points', label: '积分排行' },
      { value: 'matches', label: '比赛场次' },
    ],
    rankings: [],
    loading: true
  },

  onLoad() {
    // Load initial data
    this.fetchRankingData('victories');
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
    
    this.fetchRankingData(value);
  },

  /**
   * Fetch ranking data based on type
   * @param {string} type - The type of ranking to fetch
   */
  fetchRankingData(type) {
    this.setData({ loading: true });
    
    // This would typically be an API call to your backend
    // For now, we'll use mock data
    const mockData = {
      victories: [
        { name: '张三', value: 45, avatar: '/static/chat/avatar.png' },
        { name: '李四', value: 38, avatar: '/static/chat/avatar.png' },
        { name: '王五', value: 36, avatar: '/static/chat/avatar.png' },
        { name: '赵六', value: 32, avatar: '/static/chat/avatar.png' },
        { name: '钱七', value: 29, avatar: '/static/chat/avatar.png' },
        { name: '孙八', value: 27, avatar: '/static/chat/avatar.png' },
        { name: '周九', value: 25, avatar: '/static/chat/avatar.png' },
        { name: '吴十', value: 23, avatar: '/static/chat/avatar.png' },
      ],
      championships: [
        { name: '李四', value: 8, avatar: '/static/chat/avatar.png' },
        { name: '张三', value: 6, avatar: '/static/chat/avatar.png' },
        { name: '王五', value: 5, avatar: '/static/chat/avatar.png' },
        { name: '孙八', value: 4, avatar: '/static/chat/avatar.png' },
        { name: '赵六', value: 3, avatar: '/static/chat/avatar.png' },
        { name: '钱七', value: 2, avatar: '/static/chat/avatar.png' },
        { name: '周九', value: 1, avatar: '/static/chat/avatar.png' },
        { name: '吴十', value: 1, avatar: '/static/chat/avatar.png' },
      ],
      points: [
        { name: '张三', value: 156, avatar: '/static/chat/avatar.png' },
        { name: '王五', value: 142, avatar: '/static/chat/avatar.png' },
        { name: '李四', value: 138, avatar: '/static/chat/avatar.png' },
        { name: '赵六', value: 124, avatar: '/static/chat/avatar.png' },
        { name: '钱七', value: 112, avatar: '/static/chat/avatar.png' },
        { name: '孙八', value: 102, avatar: '/static/chat/avatar.png' },
        { name: '周九', value: 96, avatar: '/static/chat/avatar.png' },
        { name: '吴十', value: 87, avatar: '/static/chat/avatar.png' },
      ],
      matches: [
        { name: '张三', value: 78, avatar: '/static/chat/avatar.png' },
        { name: '李四', value: 76, avatar: '/static/chat/avatar.png' },
        { name: '王五', value: 74, avatar: '/static/chat/avatar.png' },
        { name: '赵六', value: 72, avatar: '/static/chat/avatar.png' },
        { name: '钱七', value: 68, avatar: '/static/chat/avatar.png' },
        { name: '周九', value: 65, avatar: '/static/chat/avatar.png' },
        { name: '孙八', value: 62, avatar: '/static/chat/avatar.png' },
        { name: '吴十', value: 57, avatar: '/static/chat/avatar.png' },
      ]
    };

    // In a real app, you would replace this with an API call:
    // request(`/api/rankings/${type}`).then(res => {
    //   this.setData({
    //     rankings: res.data,
    //     loading: false
    //   });
    // }).catch(err => {
    //   console.error('Failed to fetch rankings:', err);
    //   this.setData({ loading: false });
    // });

    // For now, simulate an API call with setTimeout
    setTimeout(() => {
      this.setData({
        rankings: mockData[type] || [],
        loading: false
      });
    }, 500);
  }
});