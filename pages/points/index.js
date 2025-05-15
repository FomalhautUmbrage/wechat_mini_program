// pages/points/index.js
Page({
    data: {
      points: 0
    },
    
    onLoad() {
      // Initialize with some random points
      this.setData({
        points: Math.floor(Math.random() * 1000)
      });
    },
    
    onShow() {
      // Update tab bar selected item
      if (typeof this.getTabBar === 'function') {
        this.getTabBar().setData({
          value: 'points'
        });
      }
    }
  });