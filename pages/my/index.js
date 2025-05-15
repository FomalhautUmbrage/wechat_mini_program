import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';
import Toast from 'tdesign-miniprogram/toast/index';
import { 
  getPlayerData, 
  savePlayerData, 
  clearAllData 
} from '../../utils/storage-service';
import { 
  extractPlayerDataFromExcel 
} from '../../utils/wudaohui-service';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    showUploadDialog: false, // 排行榜上传弹窗显示状态
    showHeroUploadDialog: false, // 英雄胜率上传弹窗显示状态
    showWudaohuiRecorder: false, // 武道会记录工具显示状态
    playerData: null, // 玩家数据
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

    // 获取玩家数据
    this.loadPlayerData();
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
        
        // 读取Excel中的特定行数据
        this.processExcelData(targetPath);
        
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
   * 处理Excel文件，提取第2099行数据
   */
  processExcelData(filePath) {
    const fs = wx.getFileSystemManager();
    
    fs.readFile({
      filePath,
      success: (res) => {
        try {
          // 提取第2099行的玩家数据
          const playerData = extractPlayerDataFromExcel(res.data, 2099);
          
          if (playerData && playerData.length > 0) {
            // 保存玩家数据到本地存储
            const savedSuccess = savePlayerData(playerData);
            
            if (savedSuccess) {
              this.setData({ playerData });
              
              Toast({
                context: this,
                message: '成功提取并保存玩家数据',
                theme: 'success',
              });
            } else {
              Toast({
                context: this,
                message: '保存玩家数据失败',
                theme: 'error',
              });
            }
          } else {
            Toast({
              context: this,
              message: '未找到有效的玩家数据',
              theme: 'error',
            });
          }
        } catch (error) {
          console.error('处理Excel数据失败:', error);
          Toast({
            context: this,
            message: '处理Excel数据失败',
            theme: 'error',
          });
        }
      },
      fail: (err) => {
        console.error('读取Excel文件失败:', err);
        Toast({
          context: this,
          message: '读取Excel文件失败',
          theme: 'error',
        });
      }
    });
  },
  
  /**
   * 加载玩家数据
   */
  loadPlayerData() {
    const playerData = getPlayerData();
    this.setData({ playerData });
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
  },

  /**
   * 打开武道会记录工具
   */
  openWudaohuiRecorder() {
    if (!this.data.playerData || this.data.playerData.length === 0) {
      Toast({
        context: this,
        message: '请先上传排行榜数据',
        theme: 'error',
      });
      return;
    }

    this.setData({
      showWudaohuiRecorder: true
    });
  },

  /**
   * 关闭武道会记录工具
   */
  closeWudaohuiRecorder() {
    this.setData({
      showWudaohuiRecorder: false
    });
  },

  /**
   * 处理武道会数据更新事件
   */
  onWudaohuiDataUpdated(e) {
    const { updatedPlayerData } = e.detail;
    this.setData({ playerData: updatedPlayerData });
    
    // 通知排行榜和积分页面刷新数据
    const app = getApp();
    if (app.eventBus) {
      app.eventBus.emit('rankings-data-updated');
      app.eventBus.emit('points-data-updated');
    }
  },

  /**
   * 清除所有武道会数据
   */
  clearWudaohuiData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有武道会相关数据吗？此操作无法撤销。',
      success: (res) => {
        if (res.confirm) {
          const cleared = clearAllData();
          
          if (cleared) {
            this.setData({ playerData: null });
            
            Toast({
              context: this,
              message: '数据已清除',
              theme: 'success',
            });
            
            // 通知排行榜和积分页面刷新数据
            const app = getApp();
            if (app.eventBus) {
              app.eventBus.emit('rankings-data-updated');
              app.eventBus.emit('points-data-updated');
            }
          } else {
            Toast({
              context: this,
              message: '清除数据失败',
              theme: 'error',
            });
          }
        }
      }
    });
  }
});