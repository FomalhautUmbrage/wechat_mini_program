import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    showUploadDialog: false, // 排行榜上传弹窗显示状态
    showHeroUploadDialog: false, // 英雄胜率上传弹窗显示状态
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({
        value: 'my'
      });
    }
    
    const Token = wx.getStorageSync('access_token');
    this.getPersonalInfo().then(personalInfo => {
      if (Token) {
        this.setData({
          isLoad: true,
          personalInfo
        });
      }
    });
  },

  async getPersonalInfo() {
    const info = await request('/api/genPersonalInfo').then((res) => res.data.data);
    return info;
  },

  onLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  onNavigateTo() {
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  /**
   * 显示上传排行榜Excel对话框
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
   * 显示上传英雄胜率Excel对话框
   */
  onUploadHeroData() {
    this.setData({
      showHeroUploadDialog: true
    });
  },
  
  /**
   * 关闭英雄胜率上传对话框
   */
  closeHeroUploadDialog() {
    this.setData({
      showHeroUploadDialog: false
    });
  },
  
  /**
   * 选择英雄胜率Excel文件并上传
   */
  selectHeroExcelFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path;
        const fileName = res.tempFiles[0].name;
        
        // 将文件保存到本地
        this.saveHeroExcelFile(tempFilePath, fileName);
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
        this.closeHeroUploadDialog();
      }
    });
  },
  
  /**
   * 保存英雄胜率Excel文件到本地存储
   */
  saveHeroExcelFile(tempFilePath, fileName) {
    // 保存文件到本地存储路径
    const fs = wx.getFileSystemManager();
    const targetPath = `${wx.env.USER_DATA_PATH}/hero_winrate.xlsx`;
    
    fs.copyFile({
      srcPath: tempFilePath,
      destPath: targetPath,
      success: () => {
        // 保存文件路径到本地存储
        wx.setStorageSync('heroExcelPath', targetPath);
        wx.setStorageSync('heroExcelName', fileName);
        
        Toast({
          context: this,
          message: '英雄胜率数据上传成功',
          theme: 'success',
        });
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
  }
});