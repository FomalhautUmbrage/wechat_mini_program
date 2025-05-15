// app.js
import config from './config';
import Mock from './mock/index';
import createBus from './utils/eventBus';
import { connectSocket, fetchUnreadNum } from './mock/chat';

if (config.isMock) {
  Mock();
}

App({
  onLaunch() {
    // === 云开发初始化 ===
    if (wx.cloud) {
      wx.cloud.init({
        // 请替换为你自己的环境 ID
        env: 'cloud1-3gwil7q954ab85d2.636c-cloud1-3gwil7q954ab85d2-1358898580',
        traceUser: true,
      });
    } else {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
    }

    // 微信小程序更新管理
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      // console.log(res.hasUpdate)
    });
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    // 初始化未读数与 WebSocket
    this.getUnreadNum();
    this.connect();
  },

  globalData: {
    userInfo: null,
    unreadNum: 0,
    socket: null,
    heroDataCache: {
      processedData: null,
      lastFileName: '',
      searchCache: {},
      lastSearchValue: '',
      needAnimation: false,
    },
    rankingsDataCache: {
      processedData: null,
      lastFileName: '',
      currentType: '',
      currentTimeRange: 'all',
    },
  },

  // 全局事件总线
  eventBus: createBus(),

  // 初始化 WebSocket
  connect() {
    const socket = connectSocket();
    socket.onMessage((data) => {
      data = JSON.parse(data);
      if (data.type === 'message' && !data.data.message.read) {
        this.setUnreadNum(this.globalData.unreadNum + 1);
      }
    });
    this.globalData.socket = socket;
  },

  // 获取未读消息数量
  getUnreadNum() {
    fetchUnreadNum().then(({ data }) => {
      this.globalData.unreadNum = data;
      this.eventBus.emit('unread-num-change', data);
    });
  },

  // 设置未读数并广播
  setUnreadNum(unreadNum) {
    this.globalData.unreadNum = unreadNum;
    this.eventBus.emit('unread-num-change', unreadNum);
  },

  // 清除英雄数据缓存
  clearHeroDataCache() {
    this.globalData.heroDataCache = {
      processedData: null,
      lastFileName: '',
      searchCache: {},
      lastSearchValue: '',
      needAnimation: false,
    };
  },

  // 清除排行榜数据缓存
  clearRankingsDataCache() {
    this.globalData.rankingsDataCache = {
      processedData: null,
      lastFileName: '',
      currentType: '',
      currentTimeRange: 'all',
    };
  },
});
