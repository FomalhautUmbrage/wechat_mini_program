import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    service: [],
    personalInfo: {},
    gridList: [
      {
        name: '全部发布',
        icon: 'root-list',
        type: 'all',
        url: '',
      },
      {
        name: '审核中',
        icon: 'search',
        type: 'progress',
        url: '',
      },
      {
        name: '已发布',
        icon: 'upload',
        type: 'published',
        url: '',
      },
      {
        name: '草稿箱',
        icon: 'file-copy',
        type: 'draft',
        url: '',
      },
    ],

    settingList: [
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
    
    showUploadDialog: false, // Excel上传弹窗显示状态
  },

  onLoad() {
    this.getServiceList();
  },

  async onShow() {
    const Token = wx.getStorageSync('access_token');
    const personalInfo = await this.getPersonalInfo();

    if (Token) {
      this.setData({
        isLoad: true,
        personalInfo
      });
    }
  },

  getServiceList() {
    request('/api/getServiceList').then((res) => {
      const { service } = res.data.data;
      this.setData({ service });
    });
  },

  async getPersonalInfo() {
    const info = await request('/api/genPersonalInfo').then((res) => res.data.data);
    return info;
  },

  onLogin(e) {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  onNavigateTo() {
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  onEleClick(e) {
    const { name, url } = e.currentTarget.dataset.data;
    if (url) return;
    this.onShowToast('#t-toast', name);
  },
  
  /**
   * 显示上传Excel对话框
   */
  onUploadExcel() {
    this.setData({
      showUploadDialog: true
    });
  },
  
  /**
   * 关闭上传对话框
   */
  closeUploadDialog() {
    this.setData({
      showUploadDialog: false
    });
  },
  
  /**
   * 选择Excel文件并上传
   */
  selectExcelFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path;
        const fileName = res.tempFiles[0].name;
        
        // 将文件保存到本地
        this.saveExcelFile(tempFilePath, fileName);
      },
      fail: (err) => {
        console.error('选择文件失败', err);
        Toast({
          context: this,
          message: '选择文件失败',
          theme: 'error',
        });
      },
      complete: () => {
        this.closeUploadDialog();
      }
    });
  },
  
  /**
   * 保存Excel文件到本地存储
   */
  saveExcelFile(tempFilePath, fileName) {
    const app = getApp();
    // 保存文件到本地存储路径
    const fs = wx.getFileSystemManager();
    const targetPath = `${wx.env.USER_DATA_PATH}/rankings_data.xlsx`;
    
    fs.copyFile({
      srcPath: tempFilePath,
      destPath: targetPath,
      success: () => {
        // 保存文件路径到本地存储，以便排行榜页面使用
        wx.setStorageSync('rankingsExcelPath', targetPath);
        wx.setStorageSync('rankingsExcelName', fileName);
        
        Toast({
          context: this,
          message: '排行榜数据上传成功',
          theme: 'success',
        });
        
        // 通知排行榜页面刷新数据
        if (app.eventBus) {
          app.eventBus.emit('rankings-data-updated');
        }
      },
      fail: (err) => {
        console.error('保存文件失败', err);
        Toast({
          context: this,
          message: '数据保存失败',
          theme: 'error',
        });
      }
    });
  },
  
  /**
   * 查看排行榜
   */
  onViewRankings() {
    // 跳转到排行榜页面
    wx.switchTab({
      url: '/pages/rankings/index'
    });
  }
});